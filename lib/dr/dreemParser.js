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
    sprite = require('$SPRITE/sprite.js'),
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
      sprite.console.error('error', message, path, line, col);
    }
    
    Error.prototype.toString = function() {
      return 'dreemParser Error: ' + this.path + (this.line !== undefined ? ":" + this.line + (this.col ? ":" + this.col : "") : "") + "- " + this.message;
    }
    
    return Error;
  })();

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
    function Compiler() {};
    var proto = Compiler.prototype;
    
    /**
     * @method originError
     * Used to decode an origin, they are '0_3' like strings which mean
     * fileid_charoffset 
     * These origins are written into the XML JSON so its possible to resolve
     * a particular tag to a particular file/line when needed
     * @param {String} message Message for the error
     * @param {String} origin Origin string ('2_5') to decode
     */
    proto.originError = function(message, origin, module) {
      return new dreemParser.Error(message, module, origin);
    };
    
    proto.compileError = function(e) {
      var path, line;
      if (e.loc) {
        path = e.loc.line - 1;
        line = e.loc.column;
      } else if (e.location) {
        path = e.location.first_line;
        line = e.location.first_column;
      }
      return new dreemParser.Error(e.message, undefined, path, line);
    };
    
    /** These are the supported languages for methods, handlers and setters.
        the compile function takes a string of code and the args to the
        function defined by that code. The args are not included in the
        returned string since those get prepended in the Compiler.execute
        method. */
    proto.languages = {
      js:{
        compile:function(codeStr, argsStr) {
          try { // we parse it just for errors
            acorn.parse('function __parsetest__(' + argsStr + '){' + codeStr + '}');
          } catch(e) {
            return proto.compileError(e);
          }
          return codeStr;
        }
      },
      coffee:{
        compile:function(codeStr, argsStr) {
          var out;
          try {
            out = coffee.compile(codeStr);
          } catch(e) { // we have an exception. throw it back
            return proto.compileError(e);
          }
          // The slice call removes the opening: (function() {
          // and trailing: \n}).call(this);
          // Since all we want is the function body.
          return out.split('\n').slice(1, -2).join('\n');
        }
      }
    };
    
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
    proto.execute = function(rootdre, classmap, callback) {
      this.classmap = classmap;
      
      // load the root
      this.loader(rootdre, function(err, output) {
        if (err) {
          return callback(err);
        } else {
          // Compile all methods, getters, setters, handlers using the language
          // indicated for each.
          var errors = [], code = '',
            methods = output.methods, i = 0, len = methods.length, 
            method, compiled, argsStr;
          for (; i < len; i++) {
            method = methods[i];
            argsStr = method.args.join(',');
            compiled = this.languages[method.language].compile(method.source, argsStr);
            
            if (compiled instanceof dreemParser.Error) {
              // the compiler returned an error
              var err = this.originError(compiled.message, method.origin, method.module);
              err.line += compiled.line; // adjust for origin
              errors.push(err);
            } else {
              // lets build a nice function out of it
              code += 'methods[' + i + '] = function ' + method.name + '(' + argsStr + '){\n' + compiled + '\n}\n';
            }
          }
          
          if (errors.length) {
            return callback(errors);
          } else {
            return callback(null, {
              js:output.js, // key value list of js files
              methods:code, // the methods codeblock 
              root:rootdre, // the dreem root file passed into execute
              classes:output.classes // the key/value set of dreem classes as JSON-XML
            });
          }
        }
      }.bind(this));
    };
    
    /**
     * @event onRead
     * called when the compiler needs to read a file
     * @param {String} name Name of the file to read
     * @param {Function} callback Callback to call with (error, result)
     */
    proto.onRead = function(name, callback) {
      throw new Error('Abstract function');
    };
    
    /* Concats all the childnodes of a jsonxml node */
    proto.__concatCode = function(node) {
      var out = '', children = node.child;
      if (children) {
        var i = 0, len = children.length, child;
        for (; i < len; i++) {
          child = children[i];
          if (child.tag === '$text' || child.tag === '$cdata') out += child.value;
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
    proto.loader = function(node, callback) {
      var deps = {}, // dependency hash, stores the from-tags for error reporting
        loading = 0, // number of in flight dependencies
        errors = [], // the error array
        output = {node:node, js:{}, classes:{}, methods:[]},
        method_id = 0,
        
        // loads javascript
        loadJS = function(file, from_node) {
          if (file in output.js) return;
          
          if (deps[file]) {
            deps[file].push(from_node);
          } else {
            deps[file] = [from_node];
          }
        }.bind(this),
        
        loadClass = function(name, from_node) {
          if (name in dreemMaker.builtin) return;
          if (name in output.classes) return;
          
          // mark tag as loading but not defined yet
          output.classes[name] = 2;
          
          if (deps[name]) {
            deps[name].push(from_node);
          } else {
            deps[name] = [from_node];
            // we should make the load order deterministic by force serializing 
            // the dependency order
            
            // lets find the dre file on our require tree
            if (!(name in this.classmap)) throw new Error('Cannot find class ' + name);
            var mod = require(this.classmap[name]);
            
            walk(mod.dre, null, 'js', name);
          }
        }.bind(this),
        
        walk = function(node, parent, language, module_name) {
          var attr = node.attr,
            tagName = node.tag;
          
          // screen and attribute nodes also have types so we don't want to look
          // at them for a compiler language
          if ((tagName !== 'screen' && tagName !== 'attribute') && attr && attr.type) {
            language = attr.type;
            delete attr.type;
          }
          
          switch (tagName) {
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
              if (attr) {
                if (attr.extends) {
                  attr.extends.split(dr.SEPARATOR_REGEX).forEach(function(cls) {if (cls) loadClass(cls, node);});
                }
                if (attr.with) {
                  attr.with.split(dr.SEPARATOR_REGEX).forEach(function(cls) {if (cls) loadClass(cls, node);});
                }
                if (attr.requires) {
                  attr.requires.split(dr.SEPARATOR_REGEX).forEach(function(cls) {if (cls) loadClass(cls, node);});
                }
              }
              break;
            case 'method':
            case 'handler':
            case 'setter':
              // give the method a unique but human readable name
              var name = tagName + '_' + (attr && attr.name) + '_' + node._ + '_' + language;
              if (parent && (parent.tag == 'class' || parent.tag == 'mixin')) name = (parent.attr && parent.attr.name) + '_' + name;
              
              node.method_id = output.methods.length;
              output.methods.push({
                language:language,
                name:name,
                args:attr && attr.args ? attr.args.split(dr.SEPARATOR_REGEX) : [],
                source:this.__concatCode(node),
                module:module_name,
                origin:node.pos
              });
              
              // clear child
              node.child = undefined;
              break;
            case 'replicator':
              if (attr && attr.classname) loadClass(attr.classname, node);
              // Fall through to default
            default:
              if (tagName.charAt(0) != '$') {
                if (attr && attr.with) {
                  attr.with.split(dr.SEPARATOR_REGEX).forEach(function(cls) {if (cls) loadClass(cls, node);});
                }
                loadClass(tagName, node);
              }
              break;
          }
          
          // Look for scriptincludes on every tag
          if (attr && attr.scriptincludes) { // load the script includes
            attr.scriptincludes.split(dr.SEPARATOR_REGEX).forEach(function(js) {loadJS(js, node);});
          }
          
          if (node.child) {
            for (var i = 0; i < node.child.length; i++) {
              walk(node.child[i], node, language);
            }
          }
        }.bind(this);
      
      // Walk JSON
      walk(node, null, 'js', 'composition');
      
      // the impossible case of no dependencies
      errors.length ? callback(errors) : callback(null, output);
    };
    
    return Compiler;
  })()
})