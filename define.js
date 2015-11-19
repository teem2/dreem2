/* Copyright 2015 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/

(function(config_define) {
  // the main define function
  function define(factory) {
    if (arguments.length == 2) { // precompiled version
      define.factory[factory] = arguments[1];
    } else {
      // store for the script tag
      define.last_factory = factory;
      
      // continue calling
      if (define.define) define.define(factory);
    }
  };
  
  //// Constants/Config ////

  // A regex that matches comma or whitespace. Used in many places to
  // split up values.
  define.SEPARATOR_REGEX = new RegExp(/,\s*|\s+/);

  define.DREEM_EXTENSION = '.dre';

  // default config variables
  define.ROOT = '';
  define.CLASSES = "$ROOT/classes";
  define.CORE = "$ROOT/core";
  define.LIB = "$ROOT/lib";
  define.EXTLIB = "/_extlib_";
  define.BUILD = "$ROOT/build";
  define.SPRITE = "$ROOT/lib/dr/sprite_browser";

  // The path to the main module to load.
  define.MAIN = '';

  // copy configuration onto define
  if (typeof config_define == 'object') {
    for (var key in config_define) define[key] = config_define[key];
  }

  /* Extracts the "path" portion of a provided file path. For example:
     /build/compositions/foo.dre.screens.default.js will return
     /build/compositions */
  define.filePath = function(file) {
    if (file) {
      file = file.replace(/\.\//g, '');
      var m = file.match(/([\s\S]*)\/[^\/]*$/);
      return m ? m[1] : '';
    }
    return '';
  };

  /* Normalizes redundant / and \ characters from a path. */
  define.cleanPath = function(path) {
    // Handle a very common client side case, approx 25% of cleanPath calls.
    if (path === '/') return path;
    
    // First condense leading / character runs into a single /
    // Second, replace all \ with /
    // Third, replace all / character runs with / unless preceeded by a : character.
    // Forth, replace all instances of /./ with / since /./ is useless.
    return path.replace(/^\/+/,'/').replace(/\\/g,'/').replace(/([^:])\/+/g,'$1/').replace(/\/\.\//g, '/');
  };

  /* Creates a path from the provided base path and relative path. */
  define.joinPath = function(base, relative) {
    var firstRelativeChar = relative.charAt(0);
    if (firstRelativeChar === '.') {
      base = base.split(/\//);
      // First remove 1 base path part per instance of ../ in relative.
      // Second remove all instances of ./ from the relative path since they are meaningless.
      relative = relative.replace(/\.\.\//g, function(){base.pop(); return '';}).replace(/\.\//g, '');
      base = base.join('/');
    } else if (firstRelativeChar === '/' || relative.indexOf(':') !== -1) {
      // Relative path is already absolute or fully qualified
      return relative
    }
    
    return define.cleanPath(base + '/' + relative);
  };

  /* Determines if a URL looks fully qualified or not. */
  define.isFullyQualifiedURL = function(url) {
    if (url.indexOf('//') === 0) {
      // Looks like a protocol agnostic URL (Typically a CDN URL)
      return true;
    } else if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0) {
      // Fully qualified URL so return as is.
      return true;
    }
    return false;
  };

  /* Replaces $ variables in paths with the matching value from the define
     object. For example $foo will get expaned into the value stored in
     define.foo */
  define.expandVariables = function(str) {
    return define.cleanPath(
      str.replace(
        /\$([^\/$]*)/g,
        function(all, lut) {
          if (lut in define) {
            if (lut === 'PLUGIN') {
              //FIXME: there is probably a better way to do this but by this point
              // there's no information as to where the str came from, so we can't
              // tell which plugin is asking for it's library. So just iterate
              // through all the plugin directories and use the first match.
              // This will cause problems someday.
              if (!define.__FS) define.__FS = require('fs');
              var lib = /\$PLUGIN(.*)/.exec(str)[1];
              var paths = define[lut];
              for (var i = 0; i < paths.length; i++) {
                var path = paths[i];
                if (define.__FS.existsSync(path + '/' + lib)) return define.expandVariables(path);
              }
              throw new Error("Cannot find $PLUGIN lib " + lib + " used in require paths: " + paths);
            } else {
              // Keep expanding until no replacement patterns match
              return define.expandVariables(define[lut]);
            }
          } else {
            throw new Error("Cannot find $" + lut + " used in require");
          }
        }
      )
    );
  };

  // Resolve the MAIN module
  define.MAIN = define.expandVariables(define.MAIN);
  
  define.onMain = function() {
    // A non-empty implementation is set by teem.js
  };

  define.findRequires = function(str) {
    // bail out if we redefine require. coffee-script.js does this.
    if (str.match(/function\s+require[\s\(]/) || str.match(/var\s+require\s/)) return [];
    
    var req = [];
    str.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+\/\/[^\n]/g,'').replace(/require\s*\(\s*["']([^"']+)["']\s*\)/g, function(m, path) {
      req.push(path);
    });
    return req;
  };

  define.localRequire = function(base_path) {
    return function(dep_path) {
      var abs_path;
      if (define.isFullyQualifiedURL(dep_path)) {
        abs_path = dep_path;
      } else {
        abs_path = define.joinPath(base_path, define.expandVariables(dep_path));
        if (abs_path.lastIndexOf('.js') !== abs_path.length - 3) abs_path = abs_path + '.js';
      }
      
      // lets look it up
      var module = define.module[abs_path];
      if (module) return module.exports;
      
      // otherwise lets initialize the module
      var factory = define.factory[abs_path];
      module = {exports:{}, id:abs_path, filename:abs_path};
      define.module[abs_path] = module;
      
      if (factory === null) return null; // its not an AMD module, but accept that
      if (!factory) throw new Error("Cannot find factory for module:" + abs_path);
      // call the factory
      var ret = factory.call(module.exports, define.localRequire(define.filePath(abs_path)), module.exports, module);
      if (ret !== undefined) module.exports = ret;
      return module.exports;
    };
  };

  // storage structures
  define.module = {};
  define.factory = {};

  // the environment we are in
  if (typeof window !== 'undefined') {
    define.env = 'browser';
  } else if (typeof process !== 'undefined') {
    define.env = 'nodejs';
  } else {
    define.env = 'v8';
  }

  if (define.packaged) {
    define.localRequire = function(base_path) {
      return function(dep_path) {
        var abs_path = dep_path.charAt(0) === '$' ? dep_path : define.joinPath(base_path, dep_path);
        if (abs_path.lastIndexOf('.js') !== abs_path.length - 3) abs_path = abs_path + '.js';
        
        // lets look it up
        var module = define.module[abs_path];
        if (module) return module.exports;
          
        // otherwise lets initialize the module
        var factory = define.factory[abs_path];
        module = {exports:{}, id:abs_path, filename:abs_path};
        define.module[abs_path] = module;
        
        if (factory === null) return null; // its not an AMD module, but accept that
        if (!factory) throw new Error("Cannot find factory for module:" + abs_path);
        
        // call the factory
        var ret = factory.call(module.exports, define.localRequire(define.filePath(abs_path)), module.exports, module);
        if (ret !== undefined) module.exports = ret;
        return module.exports;
      };
    };
    
    define.require = define.localRequire('');
    return define;
  } else if (typeof window !== 'undefined') {
    // browser implementation
    (function() {
      // if define was already defined use it as a config store
      define.ROOT = '/';
      
      // storage structures
      define.script_tags = {};
      
      // the main dependency download queue counter
      var downloads = 0;
      
      var headElem = document.getElementsByTagName('head')[0];
      
      // Inserts a required file via a dom script element.
      function insertScriptTag(script_url, from_file) {
        var script = document.createElement('script');
        var base_path = define.filePath(script_url);
        
        script.type = 'text/javascript';
        script.src = script_url;
        script.async = false;
        define.script_tags[script_url] = script;
        
        downloads++;
        function onLoad() {
          // pull out the last factory
          var factory = define.factory[script_url] = define.last_factory || null;
          define.last_factory = undefined;
          
          // parse the function for other requires
          if (factory) {
            define.findRequires(factory.toString()).forEach(function(path) {
              var dep_path;
              if (define.isFullyQualifiedURL(path)) {
                dep_path = path;
              } else {
                // Make path absolute and process variables
                dep_path = define.joinPath(base_path, define.expandVariables(path));
                
                // automatic .js appending if not given
                if (dep_path.indexOf(".js") != dep_path.length -3) dep_path += '.js';
              }
              
              // load it
              if (!define.script_tags[dep_path]) insertScriptTag(dep_path, script_url);
            });
          }
          
          // All dependencies loaded so start the main module
          if (!--downloads) {
            var main = define.MAIN,
              mainFactory = define.factory[main];
            if (mainFactory) {
              var mainModule = define.module[main] = {exports:{}, id:main, filename:main};
              var ret = mainFactory(define.localRequire(define.filePath(main)), mainModule.exports, mainModule);
              if (ret !== undefined) mainModule.exports = ret;
              define.onMain(mainModule.exports);
            } else {
              throw new Error("Cannot find main: " + main);
            }
          }
        }
        script.onerror = function() {console.error("Error loading " + script.src + " from " + from_file);};
        script.onload = onLoad;
        script.onreadystatechange = function() {
          if (s.readyState == 'loaded' || s.readyState == 'complete') onLoad();
        };
        headElem.appendChild(script);
      };
      
      // Expose insertScriptTag function so it can be used for late loading
      // of dependencies if necessary.
      define.insertScriptTag = insertScriptTag;
      
      // make it available globally. Overwrites existing config_define
      window.define = define;
      
      // boot up using the MAIN property
      if (define.MAIN) insertScriptTag(define.MAIN, window.location.href);
      
      // reload the composition unless specifically configured not to.
      define._reload = function(file) {
        if (location.search && location.search.indexOf('noreload') !== -1) return;
        
        // Only reload if one of the files we loaded changed
        if (define.script_tags[file] || file === '/define.js') location.href = location.href;
      };
      
      // Open a websocket to listen for refresh messages from the server.
      var backoff = 1;
      define.autoreloadConnect = function() {
        if (this.reload_socket) {
          this.reload_socket.onclose = undefined;
          this.reload_socket.onerror = undefined;
          this.reload_socket.onmessage = undefined;
          this.reload_socket.onopen = undefined;
          this.reload_socket.close();
          this.reload_socket = undefined;
        }
        this.reload_socket = new WebSocket('ws://' + location.host);
        this.reload_socket.onopen = function() {backoff = 1;};
        this.reload_socket.onerror = function() {};
        this.reload_socket.onclose = function() {
          if ((backoff *= 2) > 1000) backoff = 1000;
          setTimeout(function() {define.autoreloadConnect();}, backoff);
        };
        this.reload_socket.onmessage = function(event) {
          var msg = JSON.parse(event.data), type = msg.type;
          if (type === 'filechange') {
            define._reload(msg.file);
          } else if (type === 'close') {
            window.close();
          } else if (type === 'delay') {
            console.log('Got delay refresh from server!');
            setTimeout(define._reload, 1500);
          }
        };
      };
      define.autoreloadConnect();
    })();
  } else {
    // nodeJS implementation
    (function() {
      define.startMain = function() {
        // lets find our main and execute the factory
        var main_mod = define.expandVariables(define.MAIN).replace(/\\/g,'/');
        
        var factory = define.factory[main_mod];

        if (!factory) throw new Error("Cannot find main: " + main_mod, define.MAIN);
        
        // lets boot up
        var module = {exports:{}, id:main_mod, filename:main_mod};
        define.module[main_mod] = module;
        var ret = factory(define.localRequire(define.filePath(main_mod)), module.exports, module);
        if (ret !== undefined) module.exports = ret;
        console.log("onmain from define.js");
        if (define.onMain) define.onMain(module.exports);
      }
      
      module.exports = global.define = define;
      
      define.ROOT = define.filePath(module.filename.replace(/\\/g,'/'));
      
      var Module = require("module");
      var modules = [];
      var _compile = module.constructor.prototype._compile;
      
      // hook compile to keep track of module objects
      module.constructor.prototype._compile = function(content, filename) {
        modules.push(this);
        try {
          return _compile.call(this, content, filename);
        } finally {
          modules.pop();
        }
      };
      
      define.define = function(factory) {
        if (factory instanceof Array) throw new Error("injects-style not supported");
        
        var module = modules[modules.length - 1] || require.main;
        
        // store module and factory just like in the other envs
        define.module[module.filename.replace(/\\/g,'/')] = module;
        define.factory[module.filename.replace(/\\/g,'/')] = factory;
        
        function localRequire(name) {
          if (arguments.length != 1) throw new Error("Unsupported require style");
          
          name = define.expandVariables(name);

          var full_name = Module._resolveFilename(name, module);
          
          if (full_name instanceof Array) full_name = full_name[0];
          
          if (define.onRequire && (full_name.charAt(0) == '/' || full_name.indexOf(':') != -1)) {
            define.onRequire(full_name);
          }
          
          return require(full_name);
        }
        
        localRequire.clearCache = function(name) {
          Module._cache = {};
        };
        
        if (typeof factory !== "function") return module.exports = factory;
        
        var ret = factory.call(module.exports, localRequire, module.exports, module);
        if (ret !== undefined) module.exports = ret;
      };
      
      global.define.require = require;
      global.define.module = {};
      global.define.factory = {};
      
      // fetch a new require for the main module and return that
      define.define(function(require) {
        module.exports = require;
      });
    })()
  }
})(typeof define !== 'undefined' && define);

