/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/
/**
 * @class Composition {}
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
    dreem_compiler = require('./dreemcompiler');

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
      // lets reload this app
      this.__reload();
      
      // Tell the client to refresh itself.
      teemserver.broadcast({
        type:'filechange',
        file:file
      });
    }.bind(this);
    
    this.components = {};
    
    // lets compile and run the dreem composition
    define.onRequire = function(filename) {
      // lets output to the main watcher
      process.stderr.write('\x0F!' + filename + '\n', function() {});
      this.watcher.watch(filename);
    }.bind(this);
    
    this.__reload();
  }

  body.call(CompositionServer.prototype)

  function body() {
    /**
      * @method request
      * Handle server request for this Composition
      * @param {Request} req
      * @param {Response} res
      */
    this.request = function(req, res) {
      var url = req.url;
      
      // Extract Query
      var query = {}, queryIndex = url.indexOf('?');
      if (queryIndex !== -1) {
        query = url.substring(queryIndex + 1);
        url = url.substring(0, queryIndex);
        
        if (query) {
          var parts = query.split('&'), pair;
          query = {};
          for (var i = 0, len = parts.length; len > i; i++) {
            pair = parts[i].split('=');
            query[pair[0]] = pair[1] == null ? null : pair[1]; // Clobber instead of support for multivalue query params
          }
        }
      }
      
      // Extract screen name
      var screenName = query.screen || 'default';
      
      // ok lets serve our Composition device 
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
        var screen = this.screens[screenName];
        if (screen) {
          var name = this.name;
          if (screenName === 'dali') {
            var stream = fs.createReadStream(define.expandVariables('$BUILD/compositions.' + name + '.dre.screens.dali.dali.js'));
            res.writeHead(200, {"Content-Type":"text/html"});
            stream.pipe(res);
          } else {
            res.writeHead(200, {
              "Cache-control":"max-age=0",
              "Content-Type":"text/html"
            });
            res.write(this.__loadHTML(
              screen.attr && screen.attr.title || name, 
              '$BUILD/compositions.' + name + '.dre.screens.' + screenName + '.js',
              query.test === null || query.test === 'true'
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
    this.__makeLocalDeps = function(deps, compname, indent, errors) {
      var out = '';
      for (var key in deps) {
        var incpath = this.__lookupDep(key, compname, errors);
        this.classmap[key] = incpath;
        if (incpath) {
          out += indent + 'var ' + dreem_compiler.classnameToJS(key) + ' = require("' + incpath + '")\n';
        }
      }
      return out;
    };
    
    /** @private */
    this.__lookupDep = function(classname, compname, errors) {
      if (classname in this.local_classes) {
        // lets scan the -project subdirectories
        return '$BUILD/compositions.' + compname + '.dre.' + classname + '.js';
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
        var path = paths[i] + '/' + dreem_compiler.classnameToPath(classname),
          drefile = path + '.dre',
          jsfile =  path + '.js',
          ignore_watch = false;
        
        if (fs.existsSync(define.expandVariables(drefile))) {
          if (!this.compile_once[drefile]) {
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
              jsfile = "$BUILD/" + paths[i].replace(/\//g,'.').replace(/\$/g,'').toLowerCase() + '.' + dreem_compiler.classnameToBuild(classname) + ".js";
              this.compile_once[drefile] = jsfile;
              this.__compileAndWriteDreToJS(root, jsfile, null, local_err);
              ignore_watch = true;
            }
            
            if (local_err.length) this.__showErrors(local_err, drefile, dre.source);
          } else {
            jsfile = this.compile_once[drefile];
          }
        }
        
        if (fs.existsSync(define.expandVariables(jsfile))) {
          if (!ignore_watch) this.watcher.watch(jsfile);
          return jsfile;
        }
      }
      
      console.color("~br~Error~~ finding class " + classname + '\n');
    };
    
    /** Compiles and writes dre .js class
        @private */
    this.__compileAndWriteDreToJS = function(jsxml, filename, compname, errors) {
      var js = dreem_compiler.compileClass(jsxml, errors);
      if (js) {
        // write out our composition classes
        var out = 'define(function(require, exports, module){\n';
        out += this.__makeLocalDeps(js.deps, compname, '\t', errors);
        out += '\tmodule.exports = ' + js.body + '\n\tmodule.exports.dre = ' + JSON.stringify(jsxml) + '})';
        this.__writeFileIfChanged(filename, out, errors);
        return js.name;
      }
    };
    
    /** @private */
    this.__compileLocalClass = function(cls, errors) {
      var classname = cls.attr && cls.attr.name || 'unknown';
      this.__compileAndWriteDreToJS(cls, '$BUILD/compositions.' + this.name + '.dre.' + classname + '.js' , this.name, errors);
      this.local_classes[classname] = 1;
    };
    
    /** @private */
    this.__handleInclude = function(errors, filePathStack) {
      var src, i = 0, len = filePathStack.length,
        resolvedPath = '';
      
      for (; len > i; i++) {
        src = filePathStack[i];
        if (src.indexOf('/') === 0) {
          resolvedPath = define.expandVariables('$ROOT/' + src);
        } else {
          resolvedPath = (resolvedPath ? path.dirname(resolvedPath) + '/' : '') + define.expandVariables(src);
        }
      }
      
      var dre = this.__parseDreSync(resolvedPath, errors);
      return dre ? dre.child : [];
    };
    
    /** Reloads the composition.
        @private */
    this.__reload = function() {
      var errors = [],
        compositionName = this.name,
        filepath = '$COMPOSITIONS/' + compositionName + '.dre';
      
      console.color("~bg~Reloading~~ composition: " + compositionName + "\n");
      
      // Destroy all objects maintained by the composition
      if (this.myteem && this.myteem.destroy) this.myteem.destroy();
      this.myteem = undefined;
      this.local_classes = {};
      this.compile_once = {};
      this.components = {};
      this.screens = {};
      this.modules = [];
      this.classmap = {};
      
      // Clear the module cache
      require.clearCache();
      define.onMain = undefined;
      
      define.SPRITE = '$LIB/dr/sprite_browser';
      
      // scan our EXTLIB for compositions first
      if (define.EXTLIB) {
        var extpath = define.expandVariables(define.EXTLIB);
        if (fs.existsSync(extpath)) {
          var dir = fs.readdirSync(extpath);
          for (var i = 0; i < dir.length; i++) {
            var mypath = '$EXTLIB/' + dir[i] + '/compositions/' + compositionName + '.dre';
            if (fs.existsSync(define.expandVariables(mypath))) {
              filepath = mypath;
              break;
            }
          }
        }
      }
      
      var dre = this.__parseDreSync(filepath, errors);
      if (errors.length) return this.__showErrors(errors, filepath, dre && dre.source);
      
      // lets walk the XML and spawn up our composition objects.
      var root;
      for (var i = 0; i < dre.child.length; i++) {
        if (dre.child[i].tag == 'composition') root = dre.child[i];
      }
      
      if (!root || root.tag != 'composition') {
        return this.__showErrors(new DreemError('Root tag is not composition', root.pos), filepath, dre.source);
      }
      
      for (var i = 0, children = root.child, len = children.length; i < len; i++) {
        var child = children[i];
        
        // ok lets spawn up our tags into our local object pool.
        var tag = child.tag;
        if (tag.charAt(0) == '$') continue;
        if (tag == 'classes') { // generate local classes
          // lets compile our local classes
          for (var j = 0, classes = child.child, clen = classes.length; j < clen; j++) {
            var cls = classes[j];
            this.__compileLocalClass(classes[j]);
          }
          continue;
        }
        
        // lets compile the JS
        var js = dreem_compiler.compileInstance(
          child, errors, '\t\t', this.__compileLocalClass.bind(this), this.__handleInclude.bind(this), filepath
        );
        
        // ok now the instances..
        var out = 'define(function(require, exports, module){\n';
        out += this.__makeLocalDeps(js.deps, compositionName, '\t', errors);
        out += '\n\tmodule.exports = function(){\n\t\treturn ' + js.body + '\n\t}\n';
        out += '\tmodule.exports.dre = '+ JSON.stringify(child) +'\n})';
        
        var component;
        if (js.tag === 'screens') {
          component = "$BUILD/compositions." + compositionName + '.dre.screens.js';
        } else {
          var collide = '';
          while (this.components[js.name + collide]) {
            if (collide === '') {
              collide = 1;
            } else {
              collide++;
            }
          }
          js.name += collide;
          this.components[js.name] = 1;
          component = "$BUILD/compositions." + compositionName +  '.dre.' + js.tag + '.' + js.name + '.js';
        }
        
        this.__writeFileIfChanged(component, out, errors);
        
        this.modules.push({
          jsxml:child,
          name: js.name,// the base name of the component
          path: component
        });
        
        // if we compile a screen, we need to compile the children in screen separate
        if (js.tag == 'screens') {
          for (var j = 0, schilds = child.child, slen = schilds.length; j < slen; j++) {
            var schild = schilds[j];
            
            if (schild.tag !== 'screen') continue;
            var sjs = dreem_compiler.compileInstance(
              schild, errors, '\t\t', this.__compileLocalClass.bind(this), this.__handleInclude.bind(this), filepath
            );
            
            // ok now the instances..
            var out = 'define(function(require, exports, module){\n';
            out += this.__makeLocalDeps(sjs.deps, compositionName, '\t', errors);
            out += '\n\tmodule.exports = function(){\n\t\treturn ' + sjs.body + '\n\t}\n';
            out += '\n\tmodule.exports.dre = '+ JSON.stringify(schild) +'\n';
            out += '\tmodule.exports.classmap = '+ JSON.stringify(this.classmap) +'\n';
            out += '})';
            var component = "$BUILD/compositions." + compositionName + '.dre.screens.' + sjs.name + '.js';
            this.__writeFileIfChanged(component, out, errors);
            
            if (schild.attr && schild.attr.type == 'dali') {
              define.SPRITE = '$LIB/dr/sprite_dali';
              this.__packageDali(component, component.slice(0,-3)+".dali.js");
              define.SPRITE = '$LIB/dr/sprite_browser';
            }
            
            this.screens[sjs.name] = schild;
          }
        }
        
        if (errors.length) return this.__showErrors(errors, filepath, dre.source);
      }
      
      // require our teem tag
      try {
        this.myteem = require('$CLASSES/teem.js');
      } catch(e) {
        console.error(e.stack+'\x0E');
      }
      // send a reload on the busserver
      if (define.onMain) define.onMain(this.modules, this.busserver);
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
          var sub;
          if (req.charAt(0) == '$') {
            sub = req;
          } else {
            sub = define.joinPath(root, req);
          }
          
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
    this.__loadHTML = function(title, boot, isTest) {
      return '<html lang="en">\n'+
        ' <head>\n'+
        '  <title>' + title + '</title>\n'+
        '  <!-- TODO: remove --><script type"text/javascript" src="/lib/json-path+json-ptr-0.1.3.min.js"></script>\n'+
        '  <!-- TODO: remove --><script type"text/javascript" src="/lib/json.async.js"></script>\n'+
        (isTest ?
        '  <script type"text/javascript" src="/lib/chai.js"></script>\n'+
        '  <script type"text/javascript" src="/lib/smoke_helper.js"></script>\n'
        : '' ) +
        '  <script type"text/javascript">\n'+
        '    window.define = {\n'+
        '      MAIN:"' + boot + '"\n'+
        '    }\n'+
        '  </script>\n'+
        '  <script type="text/javascript" src="/define.js"></script>\n'+
        '  <style type="text/css">\n'+
        '    html,body {\n'+
        '      height:100%;\n'+
        '      margin:0px;\n'+
        '      padding:0px;\n'+
        '      border:0px none;\n'+
        '    }\n'+
        '    body {\n'+
        '      font-family:Arial, Helvetica, sans-serif;\n'+
        '      font-size:14px;\n'+
        '    }\n'+
        '  </style>'+
        ' </head>\n'+
        ' <body>\n'+
        ' </body>\n'+
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
  }
})