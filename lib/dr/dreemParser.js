/*
 The MIT License (MIT)

 Copyright ( c ) 2014-2015 Teem2 LLC

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

Dreem file parser and dependency resolver.
*/
define(function(require, exports, module) {
  var dreemParser = exports;

  var dreemMaker = require('./dreemMaker'),
    dr = require('$LIB/dr/all.js'),
    acorn = require('$LIB/acorn'),
    coffee = require('$LIB/coffee-script');

  /**
   * @class parser.Error
   * Unified Error class that holds enough information to 
   * find the right file at the right line
   */
  dreemParser.Error = (function() {
    /**
     * @constructor
     * @param {String} message Message
     * @param {String} path Path of file
     * @param {Int} line Line of error
     * @param {Int} col Column of error
     */
    function Error(message, path, line, col) {
      this.message = message;
      this.path = path;
      this.line = line;
      this.col = col;
      
      dr.sprite.console.error('error', message, path, line, col);
    }
    
    Error.prototype.toString = function() {
      return 'dreemParser Error: ' + this.path + (this.line !== undefined ? ":" + this.line + (this.col ? ":" + this.col : "") : "") + "- " + this.message;
    }
    
    return Error;
  })()

  /**
   * @class parser.Compiler
   * Client and server usable dreem compiler
   * Parses and loads all dependencies starting from a particular
   * Source XML, and delivers them all compiled and bundled up 
   * Ready to be interpreted and turned into classes/instances
   * With this compiler you dont need to handle dependency loading yourself
   * It has an overloadable 'onRead'  that acts as the file loader interface
   * And this method specialized for browser or server elsewhere
   */
  dreemParser.Compiler = (function() {
    /** 
     * @constructor
     */
    function Compiler() {
      this.filehash = {}; // all the dreem files by file-key
      this.origin_id = 0; // file id counter for json-map-back
    }
    
    /* Supported languages, these are lazily loaded */
    Compiler.prototype.languages = {
      js:{
        compile:function(string, args) {
          // this returns a compiled function or an error
          try { // we parse it just for errors
            acorn.parse('function __parsetest__('+args.join(',')+'){'+string+'}');
          } catch(e) {
            return new dreemParser.Error(e.message, undefined, e.loc && e.loc.line - 1, e.loc && e.loc.column);
          }
          return string;
        }
      },
      coffee:{
        compile:function(string, args) {
          // compile coffeescript
          // compile the code
          try {
            var out = coffee.compile(string);
          } catch(e) { // we have an exception. throw it back
            return new dreemParser.Error(e.message, undefined, e.location && e.location.first_line, e.location && e.location.first_column);
          }
          // lets return the blob without the function headers
          return out.split('\n').slice(1,-2).join('\n');
        }
      }
    };
    
    /**
     * @event onRead
     * called when the compiler needs to read a file
     * @param {String} name Name of the file to read
     * @param {Function} callback Callback to call with (error, result)
     */
    Compiler.prototype.onRead = function(name, callback) {
      throw new Error('Abstract function');
    };
    
    /**
     * @method originError
     * Used to decode an origin, they are '0_3' like strings which mean
     * fileid_charoffset 
     * These origins are written into the XML JSON so its possible to resolve
     * a particular tag to a particular file/line when needed
     * @param {String} message Message for the error
     * @param {String} origin Origin string ('2_5') to decode
     */
    Compiler.prototype.originError = function(message, origin, module) {
      return new dreemParser.Error(message, module, origin);
    }
    
    /* Used internally, loads or caches a file */
    Compiler.prototype.cache = function(name, callback) {
      if (this.filehash[name]) return callback(null, this.filehash[name]);
      this.onRead(name, function(err, data, fullpath) {
        if (err) return callback(err);
        var file = this.filehash[name] = {
          name: name,
          id: this.origin_id++,
          path: fullpath,
          data: data // typeof data === 'string'?data:data.toString()
        };
        
        return callback(null, file);
      }.bind(this));
    };
    
    /* Concats all the childnodes of a jsonxml node*/
    Compiler.prototype.concatCode = function(node) {
      var out = '';
      var children = node.child;
      if (children) {
        for (var i = 0; i < children.length; i++) {
          if (children[i].tag == '$text') out += children[i].value;
        }
      }
      return out;
    };
    
    /*
     Main loader function, used internally 
     The loader just loads all dependencies and assembles all classes, and 
     gathers all compileable methods and their language types
     It does not compile any coffeescript / JS
    */
    Compiler.prototype.loader = function(node, callback) {
      var deps = {}; // dependency hash, stores the from-tags for error reporting
      var loading = 0; // number of in flight dependencies
      var errors = []; // the error array
      var output = {node:node, js:{}, classes:{}, methods:[]};
      var method_id = 0;
      
      var loadJS = function(file, from_node) {
        // loads javascript
        if (file in output.js) return;
          
        if (!deps[file]) {
          deps[file] = [from_node];
        } else {
          deps[file].push(from_node);
        }
      }.bind(this);
      
      var loadClass = function(name, from_node) {
        if (name in dreemMaker.builtin) return;
        if (name in output.classes) return;
        
        output.classes[name] = 2; // mark tag as loading but not defined yet
        
        if (!deps[name]) {
          deps[name] = [from_node];
          // we should make the load order deterministic by force serializing 
          // the dependency order
          
          // lets find the dre file on our require tree
          if (!(name in this.classmap)) throw new Error('Cannot find class ' + name);
          var mod = require(this.classmap[name]);
          var jsobj = mod.dre;
          
          walk(jsobj, null, 'js', name);
        } else {
          deps[name].push(from_node);
        }
      }.bind(this);
      
      var walk = function(node, parent, language, module_name) {
        var attr = node.attr,
          tagName = node.tag;
        
        // screen and attribute nodes also have types so we don't want to look
        // at them for a compiler language
        if ((tagName !== 'screen' && tagName !== 'attribute') && attr && attr.type) {
          language = attr.type;
          delete attr.type;
        }
        
        switch (tagName) {
          case 'replicator':
            if (attr && attr.classname) loadClass(attr.classname, node);
            break;
          case 'class':
          case 'mixin':
            var nameattr = attr && attr.name;
            if (!nameattr) {
              errors.push(this.originError('Class has no name ', node.pos, module_name));
              return;
            }
            
            // create a new tag
            output.classes[nameattr] = node;
            
            // check extends and view
            if (attr && attr.extends) {
              attr.extends.split(/,\s*/).forEach(function(cls) {
                loadClass(cls, node);
              });
            }
            if (attr && attr.with) {
              attr.with.split(/,\s*/).forEach(function(cls) {
                if (cls) loadClass(cls, node);
              });
            }
            
            // Remove from parent since classes will get looked up in the
            // output.classes map
            break;
          case 'method':
          case 'handler':
          case 'setter':
            // give the method a unique but human readable name
            var name = node.tag + '_' + (attr && attr.name) + '_' + node._ + '_' + language;
            if (parent && (parent.tag == 'class' || parent.tag == 'mixin')) name = (parent.attr && parent.attr.name) + '_' + name;
            
            node.method_id = output.methods.length;
            output.methods.push({
              language:language,
              name:name,
              args:attr && attr.args ? attr.args.split(/,\s*/) : [],
              source:this.concatCode(node),
              module:module_name,
              origin:node.pos
            });
            
            // clear child
            node.child = undefined;
            break;
          default:
            if (node.tag.charAt(0) != '$') {
              if (attr && attr.with) {
                attr.with.split(/,\s*/).forEach(function(cls) {
                  if (cls) loadClass(cls, node);
                });
              }
              
              loadClass(node.tag, node);
            }
            break;
        }
        
        // Look for scriptincludes on every tag
        if (attr && attr.scriptincludes) { // load the script includes
          attr.scriptincludes.split(/,\s*/).forEach(function(js) {
            loadJS(js, node);
          });
        }
        
        if (node.child) {
          for (var i = 0; i < node.child.length; i++) {
            walk(node.child[i], node, language);
          }
        }
      }.bind(this);
      
      // Walk JSON
      this.error_lut = {composition:node};
      
      walk(node, null, 'js', 'composition');
      
      // the impossible case of no dependencies
      errors.length ? callback(errors) : callback(null, output);
    }
    
    /**
     * @method execute
     * Execute the compiler starting from a 'rootname' .dre file
     * The result in the callback is a 'package' that contains 
     * all dreem classes 
     * package: {
     *     js:{}, A key value list of js files
     *     methods:'' A string containing all methods compiled
     *     root:{} The root in JSONXML
     *     classes:{} A key value list of all classes as JSONXML 
     * }
     * @param {String} rootname Root dre file
     * @param {Callback} callback When compiler completes callback(error, result)
     */
    Compiler.prototype.execute = function(rootdre, classmap, callback) {
      this.classmap = classmap;
      
      // load the root
      this.loader(rootdre, function(err, output) {
        if (err) return callback(err);
        
        // Compile all methods / getters/setters/handlers using the language it has
        var errors = [],
          methods = output.methods,
          code = '';
        for (var i = 0; i < methods.length; i++) {
          var method = methods[i],
            lang = this.languages[method.language],
            compiled = lang.compile(method.source, method.args);
          
          if (compiled instanceof dreemParser.Error) { // the compiler returned an error
            var err = this.originError(compiled.message, method.origin, method.module);
            err.line += compiled.line; // adjust for origin
            errors.push(err);
          } else {
            // lets build a nice function out of it
            code += 'methods['+i+'] = function '+method.name+'('+ method.args.join(', ') + '){\n' + compiled + '\n}\n';
          }
        }
        
        if (errors.length) return callback(errors);
        
        // lets package up the output
        var pkg = {
          js: output.js, // key value list of js files
          methods: code, // the methods codeblock 
          root: rootdre,   // the dreem root file passed into execute
          classes: output.classes // the key/value set of dreem classes as JSON-XML
        };
        
        return callback(null, pkg);
      }.bind(this));
    }
    return Compiler;
  })()
})