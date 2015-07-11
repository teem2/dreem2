/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/
/**
 * @class CompositionServer {Internal}
 * Holder of the dreem <composition> for the server
 * Manages all iOT objects and the BusServer for each Composition
 */
define(function(require, exports, module) {
  module.exports = CompositionServer;

  var path = require('path'),
    fs = require('fs'),

    ExternalApps = require('./externalapps'),
    BusServer = require('./busserver'),
    FileWatcher = require('./filewatcher'),
    HTMLParser = require('./htmlparser'),
    DreemError = require('./dreemerror'),
    dreemCompiler = require('./dreemcompiler');

  /**
    * @constructor
    * @param {Object} args Process arguments
    * @param {String} file_root File server root
    * @param {String} name Name of the composition .dre
    */
  function CompositionServer(args, name, teemserver) {
    this.teemserver = teemserver;
    this.args = args;
    this.name = name;
    
    this.busserver = new BusServer();
    this.watcher = new FileWatcher();
    this.watcher.onChange = function(file) {
      this.__reloadComposition();
      
      // Tell the client to refresh itself.
      teemserver.broadcast({type:'filechange', file:file});
    }.bind(this);
    
    // lets compile and run the dreem composition
    define.onRequire = function(filename) {
      // lets output to the main watcher
      process.stderr.write('\x0F!' + filename + '\n', function() {});
      this.watcher.watch(filename);
    }.bind(this);
    
    this.__reloadComposition();
  };

  body.call(CompositionServer.prototype);

  function body() {
    /**
      * @method request
      * Handle server request for this Composition
      * @param {Request} req
      * @param {Response} res
      */
    this.request = function(req, res) {
      // Extract Query and remove it from URL
      var url = req.url,
        query = {}, 
        queryIndex = url.indexOf('?');
      if (queryIndex !== -1) {
        var queryStr = url.substring(queryIndex + 1);
        url = url.substring(0, queryIndex);
        
        if (queryStr) {
          var parts = queryStr.split('&'), i = 0, len = parts.length, nvp;
          for (; len > i; i++) {
            nvp = parts[i].split('=');
            query[nvp[0]] = nvp[1] == null ? null : nvp[1]; // Clobber instead of support for multivalue query params
          }
        }
      }
      
      // Serve our Composition device
      if (req.method == 'POST') {
        // lets do an RPC call
        var buf = ''
        req.on('data', function(data) {buf += data.toString();});
        req.on('end', function() {
          try {
            this.myteem.postAPI(JSON.parse(buf), {
              send:function(msg) {
                res.writeHead(200, {"Content-Type":"text/json"});
                res.write(JSON.stringify(msg));
                res.end();
              }
            });
          } catch(e) {
            res.writeHead(500, {"Content-Type":"text/html"});
            res.write('FAIL');
            res.end();
          }
        }.bind(this));
      } else {
        var screenName = query.screen || 'default',
          screen = this.screens[screenName];
        if (screen) {
          var name = this.name;
          if (screenName === 'dali') {
            var stream = fs.createReadStream(define.expandVariables(this.__buildScreenPath('dali.dali')));
            res.writeHead(200, {"Content-Type":"text/html"});
            stream.pipe(res);
          } else {
            res.writeHead(200, {
              "Cache-control":"max-age=0",
              "Content-Type":"text/html"
            });
            res.write(this.__renderHTMLTemplate(
              screen.attr && screen.attr.title || name, 
              this.__buildScreenPath(screenName)
            ));
            res.end();
          }
        } else {
          res.writeHead(404, {"Content-Type":"text/html"});
          res.write('NOT FOUND');
          res.end();
        }
      }
    };
    
    /**
      * @event onChange
      * Called when any of the dependent files change for this composition
      */
    this.onChange = function() {};
    
    /** @private */
    this.__buildScreenPath = function(screenName) {
      return this.__buildPath(this.name, 'screens.' + screenName);
    };
    
    /** @private */
    this.__buildPath = function(compName, className) {
      return '$BUILD/' + compName + define.DREEM_EXTENSION + '.' + className + '.js';
    };
    
    /**
      * @method __showErrors
      * Shows error array and responds with notifications/opening editors
      * @param {Array} errors
      * @param {String} prefix Output prefix
      * @private
      */
    this.__showErrors = function(errors, filepath, source) {
      var w = 0;
      if (!Array.isArray(errors)) errors = [errors];
      errors.forEach(function(err) {
        err.expand(define.expandVariables(filepath), source);
        console.color("~br~ Error ~y~" + err.path + "~bg~" + (err.line!==undefined?":"+ err.line + (err.col?":" + err.col:""):"")+"~~ "+err.message+"\n");
        if (!err.path) w++;
      });
      if (errors[w]) {
        if (this.args['-notify']) {
          ExternalApps.notify('Exception',errors[w].message)
        }
        if (this.args['-edit']) {
          if (fs.existsSync(errors[w].path)) {
            ExternalApps.editor(errors[w].path, errors[w].line, errors[w].col - 1);
          }
        }
      }
    };
    
    /** @private */
    this.__parseDreSync = function(drefile, errors) {
      // read our composition file
      try {
        var data = fs.readFileSync(define.expandVariables(drefile));
      } catch(e) {
        errors.push(new DreemError("Error during readFileSync in __parseDreSync: " + e.toString()));
        return;
      }
      
      // watch it
      this.watcher.watch(drefile);
      
      // and then show errors
      var htmlParser = new HTMLParser(),
        source = data.toString(),
        jsobj = htmlParser.parse(source);
      
      // forward the parser errors 
      if (htmlParser.errors.length) {
        htmlParser.errors.map(function(e) {
          errors.push(new DreemError("HTML Parser Error: " + e.message, e.where));
        });
      }
      
      jsobj.source = source;
      return jsobj;
    };
    
    /** @private */
    this.__makeLocalDeps = function(deps, compname, indent) {
      var out = [];
      for (var key in deps) {
        var type = deps[key]

        if(typeof type === 'string'){
         out.push(indent + 'var '+key+' = require("' + type + '")\n');
        }
        else{
          var incpath = this.__lookupDep(type, key, compname, out);
          if (incpath) {
            this.classmap[key] = incpath;
            if (type === 2) {
              out.push(indent + 'if (define.env == "browser") require("' + incpath + '")\n');
            } else {
              out.push(indent + 'var ' + dreemCompiler.classnameToJS(key) + ' = require("' + incpath + '")\n');
            }
          }
        }
      }
      return out.join('');
    };
    
    /** @private */
    this.__lookupDep = function(type, classname, compname, out) {
      // Scriptincludes are type 2
      if (type === 2) {
        var expandedPath = define.expandVariables(classname);
        if (fs.existsSync(expandedPath)) {
          return classname;
        } else {
          out.push('console.warn("Warning: scriptincludes not found: " + define.expandVariables("' + classname + '"))\n');
          return;
        }
      } else {
        if (classname in this.local_classes) {
          // lets scan the -project subdirectories
          return this.__buildPath(compname, classname);
        }
        
        var extpath = define.expandVariables(define.EXTLIB),
          paths = [];
        if (fs.existsSync(extpath)) {
          try {
            var dir = fs.readdirSync(extpath);
            dir.forEach(function(value) {
              paths.push('$EXTLIB/' + value)
              paths.push('$EXTLIB/' + value + '/classes')
            });
          } catch(e) {}
        }
        
        paths.unshift('$CLASSES');
        
        for (var i = 0; i < paths.length; i++) {
          var thePath = paths[i] + '/' + classname.replace(/-/g,'/'), // Replace package separator char '-' with '/'
            drefile = thePath + define.DREEM_EXTENSION,
            jsfile =  thePath + '.js',
            ignore_watch = false;
          
          if (fs.existsSync(define.expandVariables(drefile))) {
            jsfile = this.compile_once[drefile];
            if (!jsfile) {
              // lets parse and compile this dre file
              var local_err = [];
              var dre = this.__parseDreSync(drefile, local_err);
              if (!dre.child) return '';
              
              var root;
              for (var j = 0; j < dre.child.length; j++) {
                var tag = dre.child[j].tag
                if (tag == 'class' || tag == 'mixin') root = dre.child[j];
              }
              
              // Output this class
              if (root) {
                jsfile = '$BUILD/' + thePath.replace(/\$/g,'').toLowerCase() + '.js';
                this.compile_once[drefile] = jsfile;
                this.__compileAndWriteDreToJS(root, jsfile, null, local_err, [drefile]);
                ignore_watch = true;
              }
              
              if (local_err.length) this.__showErrors(local_err, drefile, dre.source);
            }
          }
          
          if (fs.existsSync(define.expandVariables(jsfile))) {
            if (!ignore_watch) this.watcher.watch(jsfile);
            return jsfile;
          }
        }
      }
      
      console.color("~br~Error~~ finding class " + classname + '\n');
    };
    
    /** Compiles and writes dre .js class
        @private */
    this.__compileAndWriteDreToJS = function(jsxml, filename, compname, errors, filePathStack) {
      var js = dreemCompiler.compileClass(jsxml, errors, this.__handleInclude.bind(this), filePathStack);
      if (js) {
        // write out our composition classes
        var out = 'define(function(require, exports, module){\n';
        out += this.__makeLocalDeps(js.deps, compname, '\t');
        out += '\tmodule.exports = ' + js.body + '\n\tmodule.exports.dre = ' + JSON.stringify(jsxml) + '})';
        this.__writeFileIfChanged(filename, out, errors);
        return js.name;
      }
    };
    
    /** @private */
    this.__compileLocalClass = function(cls, errors, filePathStack) {
      var classname = cls.attr && cls.attr.name || 'unknown';
      this.__compileAndWriteDreToJS(cls, this.__buildPath(this.name, classname), this.name, errors, filePathStack);
      this.local_classes[classname] = 1;
    };
    
    /** @private */
    this.__handleInclude = function(errors, filePathStack) {
      var dre = this.__parseDreSync(dreemCompiler.resolveFilePathStack(filePathStack), errors);
      return dre ? dre.child : [];
    };
    
    /** @private */
    this.__getCompositionPath = function() {
      var compositionName = this.name,
        filepath = '$ROOT/' + compositionName + define.DREEM_EXTENSION;
      if (define.EXTLIB) {
        var extpath = define.expandVariables(define.EXTLIB);
        if (fs.existsSync(extpath)) {
          var dir = fs.readdirSync(extpath), mypath;
          for (var i = 0; i < dir.length; i++) {
            mypath = '$EXTLIB/' + dir[i] + '/' + compositionName + define.DREEM_EXTENSION;
            if (fs.existsSync(define.expandVariables(mypath))) return mypath;
          }
        }
      }
      return filepath;
    };
    
    /** @private */
    this.__reloadComposition = function() {
      var errors = [],
        compositionPath = this.__getCompositionPath();
      
      console.color("~bg~Reloading~~ composition: " + this.name + "\n");
      
      // Destroy all objects maintained by the composition
      if (this.myteem && this.myteem.destroy) {
        this.myteem.destroy();
        this.myteem = undefined;
      }
      this.local_classes = {};
      this.compile_once = {};
      this.components = {};
      this.screens = {};
      this.modules = [];
      this.classmap = {};
      require.clearCache();
      define.onMain = undefined;
      
      define.SPRITE = '$LIB/dr/sprite_browser';
      
      var dre = this.__parseDreSync(compositionPath, errors);
      
      // An error occured parsing the composition dre file so abort.
      if (errors.length) {
        this.__showErrors(errors, compositionPath, dre && dre.source);
        return;
      }
      
      // Find the composition node
      var compositionNode, i = 0, children = dre.child, len = children.length, child;
      for (; i < len; i++) {
        child = children[i];
        if (child.tag === 'composition') {
          compositionNode = child;
          break;
        }
      }
      
      // No composition node found so abort.
      if (!compositionNode) {
        this.__showErrors(new DreemError('Root tag is not composition', compositionNode.pos), compositionPath, dre.source);
        return;
      }
      
      // Process the composition
      i = 0;
      children = compositionNode.child;
      len = children.length;
      var tag;
      for (; i < len; i++) {
        child = children[i];
        tag = child.tag;
        if (tag.startsWith('$')) {
          // Ignore $pecial nodes
        } else if (tag === 'classes') {
          // generate local classes
          for (var j = 0, classes = child.child, clen = classes.length; j < clen; j++) {
              this.__compileLocalClass(classes[j], errors, [compositionPath]);
          }
        } else {
          this.__makeComponentJS(child, compositionPath, errors);
          
          // An error occured while making the parts of the composition such
          // as screens.
          if (errors.length) {
            this.__showErrors(errors, compositionPath, dre.source);
            return;
          }
        }
      }
      
      // Always require the teem tag
      try {
        this.myteem = require('$CLASSES/teem.js');
      } catch(e) {
        console.error(e.stack + '\x0E');
      }
      
      // send a reload on the busserver
      if (define.onMain) define.onMain(this.modules, this.busserver);
    };
    
    /** @private */
    this.__makeComponentJS = function(componentNode, compositionPath, errors) {
      // Compile the JS and save it in the build directory
      var componentJson = dreemCompiler.compileInstance(
          componentNode, errors, '\t\t', 
          this.__compileLocalClass.bind(this), 
          this.__handleInclude.bind(this), 
          [compositionPath]
        ),
        componentName = componentJson.name;
      
      // ok now the instances.
      var out = 'define(function(require, exports, module){\n';
      out += this.__makeLocalDeps(componentJson.deps, this.name, '\t');
      out += '\n\tmodule.exports = function(){\n\t\treturn ' + componentJson.body + '\n\t}\n';
      out += '\tmodule.exports.dre = '+ JSON.stringify(componentNode) +'\n})';
      
      var componentPath;
      if (componentJson.tag === 'screens') {
        componentPath = this.__buildPath(this.name, 'screens');
      } else {
        var collide = '';
        while (this.components[componentName + collide]) {
          collide = collide === '' ? 1 : collide++;
        }
        componentName += collide;
        this.components[componentName] = 1;
        componentPath = this.__buildPath(this.name, componentJson.tag + '.' + componentName);
      }
      
      this.__writeFileIfChanged(componentPath, out, errors);
      
      this.modules.push({
        jsxml:componentNode,
        name:componentName,
        path:componentPath
      });
      
      // If this is a "screens" component we also need to compile the 
      // individual screen children into their own js files.
      if (componentJson.tag === 'screens') {
        var i = 0, screenNodes = componentNode.child, len = screenNodes.length, screenNode;
        for (; i < len; i++) {
          screenNode = screenNodes[i];
          if (screenNode.tag === 'screen') {
            this.__makeScreenJS(screenNode, compositionPath, errors);
          }
        }
      }
    };
    
    /** @private */
    this.__makeScreenJS = function(screenNode, compositionPath, errors) {
      var screenJson = dreemCompiler.compileInstance(
        screenNode, errors, '\t\t', 
        this.__compileLocalClass.bind(this), 
        this.__handleInclude.bind(this), 
        [compositionPath]
      );
      
      var out = 'define(function(require, exports, module){\n';
      out += this.__makeLocalDeps(screenJson.deps, this.name, '\t');
      out += '\n\tmodule.exports = function(){\n\t\treturn ' + screenJson.body + '\n\t}\n';
      out += '\n\tmodule.exports.dre = '+ JSON.stringify(screenNode) + '\n';
      out += '\tmodule.exports.classmap = '+ JSON.stringify(this.classmap) + '\n';
      out += '})';
      var screenPath = this.__buildScreenPath(screenJson.name);
      this.__writeFileIfChanged(screenPath, out, errors);
      
      if (screenNode.attr && screenNode.attr.type == 'dali') {
        define.SPRITE = '$LIB/dr/sprite_dali';
        this.__packageDali(screenPath, screenPath.slice(0, -3) + ".dali.js");
        define.SPRITE = '$LIB/dr/sprite_browser';
      }
      
      this.screens[screenJson.name] = screenNode;
    };
    
    /** Packages and writes a dali application.
        @private */
    this.__packageDali = function(root, output) {
      // lets load define
      var definejs = fs.readFileSync(define.expandVariables('$ROOT/define.js')).toString();
      
      // lets recursively load all our dependencies.
      var files = {};
      var recur = function(file, parent) {
        if (files[file]) return;
        try {
          var filepath = define.expandVariables(file);
          var data = fs.readFileSync(filepath);
          if (file.indexOf('$BUILD') == -1) {
            this.watcher.watch(filepath);
          }
        } catch(e) {
          console.log('Dali build: Error opening file '+file+' from '+parent);
          return;
        }
        var string = files[file] = data.toString();
        var root = define.filePath(file);
        
        define.findRequires(string).forEach(function(req) {
          var sub = req.startsWith('$') ? req : define.joinPath(root, req);
          if (sub.lastIndexOf('.js') !== sub.length - 3) sub = sub + '.js';
          recur(sub, file);
        });
      }.bind(this);
      
      recur(root,'absolute root');
      
      // lets write out our dali.js
      var out = 'var define = {packaged:1}\ndefine = ' + definejs + '\n\n';
      for (var key in files) {
        var string = files[key];
        string = string.replace(/define\(\s*function\s*\(/, function() {
          return 'define("' + key + '", function(';
        });
        out += string + '\n\n';
      }
      out += 'define.env="v8";var req = define.require("' + root + '");if(define.onMain) define.onMain(req);';
      this.__writeFileIfChanged(output, out);
    };
    
    /** The html response template for browser composition requests.
        @private */
    this.__renderHTMLTemplate = function(title, boot) {
      return '<html lang="en">\n'+
        '  <head>\n'+
        '    <title>' + title + '</title>\n'+
        '    <script type="text/javascript">window.define = {MAIN:"' + boot + '"}</script>\n'+
        '    <script type="text/javascript" src="/define.js"></script>\n'+
        '    <style type="text/css">\n'+
        '      html,body {\n'+
        '        height:100%;\n'+
        '        margin:0px;\n'+
        '        padding:0px;\n'+
        '        border:0px none;\n'+
        '      }\n'+
        '      body {\n'+
        '        font-family:Arial, Helvetica, sans-serif;\n'+
        '        font-size:14px;\n'+
        '      }\n'+
        '    </style>'+
        '  </head>\n'+
        '  <body></body>\n'+
        '</html>\n';
    };
    
    /** Recursively makes directories for a path.
        @private */
    this.__mkdirParent = function(dirPath) {
      try {
        fs.mkdirSync(dirPath);
      } catch(e) {
        if (e.code === 'ENOENT') {
          this.__mkdirParent(path.dirname(dirPath));
          this.__mkdirParent(dirPath);
        }
      }
    };
    
    /** Writes a file to disk if the contents of the file will have changed.
        @private */
    this.__writeFileIfChanged = function(filePath, newData, errors) {
      var expandedPath = define.expandVariables(filePath),
        data;
      try {
        data = fs.readFileSync(expandedPath);
        if (data) data = data.toString();
      } catch(e) {}
      
      if (!data || newData.length !== data.length || newData !== data) {
        try {
          var dirPath = path.dirname(expandedPath);
          if (!fs.existsSync(dirPath)) this.__mkdirParent(dirPath);
          fs.writeFileSync(expandedPath, newData);
        } catch(e) {
          errors.push(new DreemError("Error in writeFilSync: " + e.toString()));
        }
      }
    };
  };
})