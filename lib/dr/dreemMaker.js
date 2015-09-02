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

Instantiates dr classes from a package JSON object.
*/
define(function(require, exports, module) {
  var maker = exports,
    dr = require('$LIB/dr/dr.js')
    JS = require('$LIB/jsclass.js'),
    sprite = require('$SPRITE/sprite.js'),
    acorn = require('$LIB/acorn'),
    coffee = require('$LIB/coffee-script'),
    htmlparser = require('$CORE/htmlparser.js');

  require('$LIB/dr/globals/GlobalError.js');
  require('$LIB/dr/globals/GlobalRequestor.js');
  require('$LIB/dr/globals/GlobalKeys.js');
  require('$LIB/dr/globals/GlobalMouse.js');
  require('$LIB/dr/globals/GlobalIdle.js');
  require('$LIB/dr/globals/GlobalDragManager.js');
  require('$LIB/dr/Eventable.js');
  require('$LIB/dr/view/SizeToViewport.js');
  require('$LIB/dr/animation/Animator.js');
  require('$LIB/dr/animation/AnimGroup.js');

  require('$SPRITE/Text.js');
  require('$SPRITE/InputText.js');
  require('$SPRITE/Bitmap.js');
  require('$SPRITE/Webview.js');
  require('$SPRITE/VideoPlayer.js');

  /**
   * @class parser.Error {Internal}
   * Unified Error class that holds enough information to 
   * find the right file at the right line
   */
  maker.Error = function(message, line, col) {
    this.message = message;
    this.line = line;
    this.col = col;
    sprite.console.error('error', message, line, col);
  };

  /**
   * @class parser.Compiler {Internal}
   * Client and server usable dreem compiler
   * Parses and loads all dependencies starting from a particular
   * Source XML, and delivers them all compiled and bundled up 
   * Ready to be interpreted and turned into classes/instances
   * With this compiler you dont need to handle dependency loading yourself
   * It has an overloadable 'onRead'  that acts as the file loader interface
   * And this method specialized for browser or server elsewhere
   */
  maker.Compiler = (function() {
    /** 
     * @constructor
     */
    function Compiler() {};
    var proto = Compiler.prototype;
    
    proto.compileError = function(e) {
      var path, line;
      if (e.loc) {
        path = e.loc.line - 1;
        line = e.loc.column;
      } else if (e.location) {
        path = e.location.first_line;
        line = e.location.first_column;
      }
      return new maker.Error(e.message, path, line);
    };
    
    /** These are the supported languages for methods, handlers and setters.
        the compile function takes a string of code and the args to the
        function defined by that code. The args are not included in the
        returned string since those get prepended in the Compiler.execute
        method. */
    var languages = {
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
    
    /** Starts the client side parsing process.
        @param {Object} rootdre The json representation of a dre file.
        @param {Object} classmap A map of classpaths by classname.
        @param {dr.teem} teem A reference to the teem component.
        @param {dr.Node} parentInstance (Optional) The parent to attach new
          instances to.
        @param {Boolean} allowNestedScreens (Optional) Prevents warnings when
          trying to load one screen into another.
        @returns A Compiler object. */
    proto.execute = function(rootdre, classmap, teem, parentInstance, allowNestedScreens) {
      if (dr.ready) {
          console.log('Preventing reinstantiation of the UI since it was already made once. This is expected during reloads triggered by file changes.');
          return;
      }
      
      var errors = [],
        methods = [],
        classes = {};
      
      function loadClass(name) {
        if (name) {
          if (name in maker.builtin) return;
          if (name in classes) return;
          
          // mark tag as loading but not defined yet
          classes[name] = 2;
          
          // lets find the dre file on our require tree
          if (name in classmap) {
            var mod = require(classmap[name]);
            walk(mod.dre, null, 'js', name);
          } else {
            throw new Error('Cannot find class ' + name);
          }
        }
      };
      
      function concatCode(node) {
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
      
      function walk(node, parent, language) {
        var attr = node.attr || {},
          tagName = node.tag;
        
        // screen and attribute nodes also have types so we don't want to look
        // at them for a compiler language
        if ((tagName !== 'screen' && tagName !== 'attribute') && attr.type) {
          language = attr.type;
          delete attr.type;
        }
        
        switch (tagName) {
          case 'class':
          case 'mixin':
            var nameattr = attr.name;
            if (!nameattr) {
              errors.push(new maker.Error('Class has no name ', node.pos));
              return;
            }
            
            // create a new tag
            classes[nameattr] = node;
            
            if (attr.extends) attr.extends.split(define.SEPARATOR_REGEX).forEach(loadClass);
            if (attr.with) attr.with.split(define.SEPARATOR_REGEX).forEach(loadClass);
            if (attr.requires) attr.requires.split(define.SEPARATOR_REGEX).forEach(loadClass);
            break;
          case 'method':
          case 'handler':
          case 'setter':
            // give the method a unique but human readable name
            var funcName = tagName.toUpperCase() + '_' + (attr.name || attr.event) + '_' + node.pos + '_' + language;
            if (parent && parent.attr) {
                var pattr = parent.attr;
                if (parent.tag === 'class') {
                    funcName = 'CLASS_' + pattr.name + '_' + funcName;
                } else if (parent.tag === 'mixin') {
                    funcName = 'MIXIN_' + pattr.name + '_' + funcName;
                } else {
                    if (pattr.name) {
                        funcName = 'NAME_' + pattr.name + '_' + funcName;
                    } else if (pattr.id) {
                        funcName = 'ID_' + pattr.id + '_' + funcName;
                    }
                }
            }
            funcName = funcName.split(define.SEPARATOR_REGEX).join('_').split('-').join('_');
            
            node.method_id = methods.length;
            methods.push({
              name:funcName,
              origin:node.pos,
              language:language,
              argStr:attr.args || '',
              source:concatCode(node)
            });
            
            // clear child
            node.child = undefined;
            break;
          case 'replicator':
            loadClass(attr.classname);
            // Fall through to default
          default:
            if (!tagName.startsWith('$')) {
              if (attr.with) attr.with.split(define.SEPARATOR_REGEX).forEach(loadClass);
              if (attr.requires) attr.requires.split(define.SEPARATOR_REGEX).forEach(loadClass);
              loadClass(tagName);
            }
            break;
        }
        
        // Recursively walk children
        var children = node.child;
        if (children) {
          var i = 0, len = children.length;
          for (; i < len;) walk(children[i++], node, language);
        }
      };
      
      // Walk JSON
      walk(rootdre, null, 'js', 'composition');
      
      if (errors.length === 0) {
        // Compile all methods, getters, setters, handlers using the language
        // indicated for each.
        var code = '',
          i = 0, len = methods.length, 
          method, compiled, argsStr;
        for (; i < len; i++) {
          method = methods[i];
          argsStr = method.argStr;
          compiled = languages[method.language].compile(method.source, argsStr);
          
          if (compiled instanceof maker.Error) {
            // the compiler returned an error
            var error = new maker.Error(compiled.message, method.origin);
            error.line += compiled.line; // adjust for origin
            errors.push(error);
          } else {
            // Transform super to callSuper since .dre files use super.
            compiled = compiled.split('this["super"](').join('this.callSuper(').split('this.super(').join('this.callSuper(').split('this["super"] ').join('this.callSuper ');
            
            // lets build a nice function out of it
            code += 'methods[' + i + '] = function ' + method.name + '(' + argsStr + '){\n' + compiled + '\n}\n';
          }
        }
        
        if (errors.length === 0) {
          var pkg = {
            // the key/value set of dreem classes as JSON-XML
            classes:classes,
            
            // Prefill compiled classes with classes defined in core
            compiledClasses:{
              animator:dr.Animator,
              animgroup:dr.AnimGroup,
              eventable:dr.Eventable,
              layout:dr.Layout,
              node:dr.Node,
              view:dr.View,
              sizetoviewport:dr.SizeToViewport
            },
            
            // The code block split up into individual compiled functions
            compiledMethods:[]
          };
          
          // Compile pkg methods
          try {
            new Function('methods','dr', code)(pkg.compiledMethods, dr); // TAG:Global Scope
          } catch(e) {
            sprite.console.error('Exception evaluating methods ' + e.message);
            return;
          }
          
          // Make pkg available to dr since child processing is initiated from there.
          dr.maker = maker;
          dr.pkg = pkg;
          dr.teem = teem;
          dr.htmlparser = htmlparser;
          dr.classmap = classmap;
          
          dr.ready = false;
          
          // Start processing from the root downward
          // parentInstance and allowNestedScreens are both typically undefined
          // here. The only time they would be provided is when trying to
          // load one screen into a subview of another.
          maker.__walkDreemJSXML(rootdre, pkg, parentInstance, allowNestedScreens);
          
          dr.notifyReady();
        }
      }
    };
    
    return Compiler;
  })();

  /** Built in tags that dont resolve to class files or that resolve to 
      class files defined in the core. */
  maker.builtin = {
    // Specific Classes and Mixins from the core
    animator:true,
    animgroup:true,
    eventable:true,
    layout:true,
    node:true,
    view:true,
    sizetoviewport:true,
    
    // Class and Mixin Definition
    class:true,
    mixin:true,
    
    // Special child tags for a Mixin, Class or Class instance
    method:true,
    attribute:true,
    handler:true,
    setter:true
  };

  // Stack of instances used to determine classroot during instantiation
  maker.__classroots = [];

  // Entry point for instances creating their children. Called 
  // from dr.makeChildren
  maker.walkForInstance = function(targetObj, json, isClassroot, pkg) {
    if (isClassroot) this.__classroots.unshift(targetObj);
    for (var i = 0, len = json.length; len > i;) this.__walkDreemJSXML(json[i++], pkg, targetObj, false);
    if (isClassroot) this.__classroots.shift();
  };

  maker.__walkDreemJSXML = function(node, pkg, parentInstance, allowNestedScreens, parentIsScreen) {
    var tagName = node.tag;
    
    if (tagName.startsWith('$')) {
      if (tagName === '$comment') {
        // Ignore comments
      } else if (tagName === '$text') {
        parentInstance.setAttribute('$textcontent', (parentInstance.$textcontent || '') + node.value.trim());
      } else if (tagName === '$cdata') {
        parentInstance.setAttribute('$textcontent', (parentInstance.$textcontent || '') + node.value);
      } else {
        dr.global.error.logWarn("Unexpected tag:", tagName);
      }
      return;
    }
    
    // Lookup inline classes or mixins so that they will be available for use
    // even if a declared instance is not used.
    if (tagName === 'class' || tagName === 'mixin') {
      this.lookupClass(node.attr.name, pkg);
      return;
    }
    
    var isScreen = tagName === 'screen';
    if (isScreen && parentInstance && !allowNestedScreens) {
      dr.global.error.logWarn('No nesting of screen tags. Skipping instance.');
      return;
    }
    
    var klass = this.lookupClass(tagName, pkg);
    if (klass) {
      if (typeof klass !== 'function') {
        // More info on a rare bug that happens in the editor when trying to preview sometimes
        console.log('Class is not a function', tagName, klass, pkg);
      }
      var compiledMethods = pkg.compiledMethods,
        attrs = this.__normalizeAttrs(node.attr || {}),
        mixins = this.__extractMixins(attrs, pkg),
        instanceMixin = {},
        instanceChildrenJson,
        instanceHandlers = [],
        instanceAttrs, instanceAttrValues,
        children = node.child,
        i, len, childNode;
      
      // Ensure "requires" are loaded
      this.__lookupRequires(attrs, pkg);
      
      if (children) {
        for (i = 0, len = children.length; len > i;) {
          childNode = children[i++];
          switch (childNode.tag) {
            case 'setter':
              this.__processSetter(childNode, compiledMethods, instanceMixin);
              break;
            case 'method':
              this.__processMethod(childNode, compiledMethods, instanceMixin);
              break;
            case 'handler':
              this.__processHandler(childNode, compiledMethods, instanceMixin, instanceHandlers);
              break;
            case 'attribute':
              if (!instanceAttrs) {
                instanceAttrs = {};
                instanceAttrValues = {};
              }
              this.__processAttribute(childNode, instanceAttrs, instanceAttrValues);
              break;
            default:
              if (!instanceChildrenJson) instanceChildrenJson = [];
              instanceChildrenJson.push(childNode);
          }
        }
      }
      
      // Build default attributes
      var combinedAttrs = {};
      // Note: Mixin attrs are combined in the initialization method of Node/Eventable.
      if (instanceAttrValues) dr.extend(combinedAttrs, instanceAttrValues);
      dr.extend(combinedAttrs, attrs);
      
      if (!isScreen) this.__setupMakeChildrenMethod(instanceChildrenJson, instanceMixin, false);
      this.__setupRegisterHandlersMethod(instanceHandlers, instanceMixin);
      this.__buildSettersForAttributes(instanceAttrs, instanceMixin);
      this.__setupGetTypeForAttrNameMethod(instanceAttrs, instanceMixin);
      
      mixins = mixins ? mixins : [];
      mixins.push(instanceMixin);
      
      // Root Nodes need a mixin that indicates this
      var isDescendantOfNode = klass.isDescendantOf(dr.Node);
      if ((!parentInstance || parentIsScreen) && isDescendantOfNode) {
        if (klass.isDescendantOf(dr.View)) {
          mixins.push(dr.SizeToViewport);
        } else {
          mixins.push(dr.RootNode);
        }
      }
      
      combinedAttrs.classroot = this.__classroots[0] || null;
      
      // Create instance. Calls the initialize method on the instance.
      if (isDescendantOfNode) {
        // Create using the args for a Node.
        new klass(parentInstance, combinedAttrs, mixins);
      } else {
        // Create using the args for an Eventable.
        new klass(combinedAttrs, mixins);
      }
      
      if (isScreen && instanceChildrenJson) {
        for (i = 0, len = instanceChildrenJson.length; len > i;) {
          this.__walkDreemJSXML(instanceChildrenJson[i++], pkg, parentInstance, allowNestedScreens, isScreen);
        }
      }
    }
  };

  maker.lookupClass = function(tagName, pkg) {
    // First look for a compiled class
    var classTable = pkg.compiledClasses;
    if (tagName in classTable) return classTable[tagName];
    
    // Ignore built in tags
    if (tagName in this.builtin) {
      dr.global.error.logWarn('Built in tag encountered for class lookup:', tagName);
      return null;
    }
    
    // Try to build a class
    var klassjsxml = pkg.classes[tagName];
    if (!klassjsxml) throw new Error('Cannot find class definition ' + tagName);
    if (klassjsxml === 2) throw new Error('Class still loading ' + tagName);
    delete pkg.classes[tagName];
    
    var isMixin = klassjsxml.tag === 'mixin',
      klassAttrs = this.__normalizeAttrs(klassjsxml.attr || {}),
      mixins = this.__extractMixins(klassAttrs, pkg);
    
    // Ensure "requires" are loaded
    this.__lookupRequires(klassAttrs, pkg);
    
    // Determine base class
    var baseclass;
    if (!isMixin) {
      var extendsAttr = klassAttrs.extends;
      delete klassAttrs.extends;
      baseclass = extendsAttr ? this.lookupClass(extendsAttr, pkg) : classTable.view;
    }
    
    // Process Children
    var compiledMethods = pkg.compiledMethods,
      children = klassjsxml.child,
      klassBody = {},
      staticBody = klassBody.extend = {},
      klassChildrenJson,
      klassHandlers = [],
      klassDeclaredAttrs, klassDeclaredAttrValues, klassDeclaredAttrMeta,
      i, len, childNode;
    if (children) {
      for (i = 0, len = children.length; len > i;) {
        childNode = children[i++];
        switch (childNode.tag) {
          case 'setter':
            this.__processSetter(childNode, compiledMethods, klassBody);
            break;
          case 'method':
            this.__processMethod(childNode, compiledMethods, klassBody, staticBody);
            break;
          case 'handler':
            this.__processHandler(childNode, compiledMethods, klassBody, klassHandlers, staticBody);
            break;
          case 'attribute':
            if (!klassDeclaredAttrs) {
              klassDeclaredAttrs = {};
              klassDeclaredAttrValues = {};
              klassDeclaredAttrMeta = {};
            }
            if (childNode.attr.allocation !== 'class') klassDeclaredAttrMeta[childNode.attr.name] = childNode.attr;
            this.__processAttribute(childNode, klassDeclaredAttrs, klassDeclaredAttrValues, staticBody);
            break;
          default:
            if (!klassChildrenJson) klassChildrenJson = [];
            klassChildrenJson.push(childNode);
        }
      }
    }
    
    this.__setupMakeChildrenMethod(klassChildrenJson, klassBody, true);
    this.__setupRegisterHandlersMethod(klassHandlers, klassBody);
    this.__buildSettersForAttributes(klassDeclaredAttrs, klassBody);
    this.__setupGetTypeForAttrNameMethod(klassDeclaredAttrs, klassBody);
    
    // Instantiate the Class or Mixin
    if (mixins) klassBody.include = mixins;
    var Klass = dr[tagName] = isMixin ? new JS.Module(tagName, klassBody) : new JS.Class(tagName, baseclass, klassBody);
    
    // Create package object if necessary and also store the class reference
    var packages = tagName.split('-'), packageName, curPackage = dr;
    while (packages.length > 1) {
      packageName = packages.shift();
      if (curPackage[packageName] == null) curPackage[packageName] = {};
      curPackage = curPackage[packageName];
      if (packages.length === 1) curPackage[packages.shift()] = Klass;
    }
    
    // Build default class attributes used for inheritance
    var combinedAttrs = {};
    if (baseclass && baseclass.defaultAttrValues) dr.extend(combinedAttrs, baseclass.defaultAttrValues);
    this.doMixinExtension(combinedAttrs, mixins);
    combinedAttrs.$tagname = tagName;
    dr.extend(combinedAttrs, klassAttrs);
    if (klassDeclaredAttrValues) dr.extend(combinedAttrs, klassDeclaredAttrValues);
    delete combinedAttrs.name; // Instances only
    delete combinedAttrs.id; // Instances only
    Klass.defaultAttrValues = combinedAttrs;
    Klass.attributes = klassDeclaredAttrMeta;
    // Store and return class
    return classTable[tagName] = Klass;
  };

  maker.__normalizeAttrs = function(attrs) {
    var normalizedAttrs = {}, normName, name;
    for (name in attrs) {
        normName = name.toLowerCase();
        normalizedAttrs[normName] = attrs[name];
        if (normName !== name) {
            sprite.console.warn('Attribute named: ' + name + ' converted to: ' + normName);
        }
    }
    return normalizedAttrs;
  };

  maker.__extractMixins = function(attrs, pkg) {
    var mixins, mixinNames = attrs.with;
    delete attrs.with;
    if (mixinNames) {
      mixins = [];
      mixinNames.split(define.SEPARATOR_REGEX).forEach(
        function(mixinName) {
          if (mixinName) mixins.unshift(maker.lookupClass(mixinName, pkg));
        }
      );
    }
    return mixins;
  };

  maker.__lookupRequires = function(attrs, pkg) {
    var requiresNames = attrs.requires;
    if (requiresNames) {
      delete attrs.requires;
      requiresNames.split(define.SEPARATOR_REGEX).forEach(
        function(requireName) {
          if (requireName) maker.lookupClass(requireName, pkg);
        }
      );
    }
  };

  maker.__buildSettersForAttributes = function(attrs, targetObj) {
    if (attrs) {
      var setterName;
      for (var attrName in attrs) {
        setterName = dr.AccessorSupport.generateSetterName(attrName);
        if (!targetObj[setterName]) { // Don't clobber an explicit setter
          targetObj[setterName] = new Function(
            "value", "this.setActual('" + attrName + "', value, '" + attrs[attrName] + "');"
          );
        }
      }
    }
  };

  maker.doMixinExtension = function(attrs, mixins) {
    if (mixins) {
      len = mixins.length;
      if (len > 0) {
        var i = 0;
        for (; len > i;) {
          dr.extend(attrs, mixins[i++].defaultAttrValues);
        }
      }
    }
  };

  maker.__setupMakeChildrenMethod = function(childrenJson, targetObj, isClassroot) {
    if (childrenJson) {
      targetObj.__makeChildren = new Function('dr',
        'this.callSuper(); ' + 
        (isClassroot ? '' : 'this.__disallowPlacement = false; ') + 
        'dr.makeChildren(this, ' + JSON.stringify(childrenJson) + ', ' + isClassroot + ');'
      ); // TAG:Global Scope
    }
  };

  maker.__setupRegisterHandlersMethod = function(handlersList, targetObj) {
    if (handlersList.length > 0) {
      targetObj.__registerHandlers = new Function('dr',
        'this.callSuper(); dr.registerHandlers(this, ' + JSON.stringify(handlersList) + ');'
      ); // TAG:Global Scope
    }
  };

  maker.__setupGetTypeForAttrNameMethod = function(attrs, targetObj) {
    if (attrs) {
      targetObj.getTypeForAttrName = new Function('attrName',
        'var retval = ' + JSON.stringify(attrs) + '[attrName]; return retval ? retval : this.callSuper();'
      );
    }
  };

  maker.__processSetter = function(childNode, compiledMethods, targetObj) {
    var methodId = childNode.method_id;
    if (methodId) {
      var compiledMethod = compiledMethods[methodId];
      if (compiledMethod) {
        targetObj[dr.AccessorSupport.generateSetterName(childNode.attr.name)] = compiledMethod;
      } else {
        throw new Error('Cannot find method id' + methodId);
      }
    }
  };

  maker.__processMethod = function(childNode, compiledMethods, targetObj, altTargetObj) {
    var methodId = childNode.method_id;
    if (methodId) {
      var compiledMethod = compiledMethods[methodId],
        childAttrs = childNode.attr;
      if (compiledMethod) {
        if (altTargetObj && childAttrs.allocation && childAttrs.allocation === 'class') {
          altTargetObj[childAttrs.name] = compiledMethod;
        } else {
          targetObj[childAttrs.name] = compiledMethod;
        }
      } else {
        throw new Error('Cannot find method id' + methodId);
      }
    }
  };

  maker.__processHandler = function(childNode, compiledMethods, targetObj, handlerList, altTargetObj) {
    var childAttrs = childNode.attr;
    if (childAttrs) {
      var eventName = childAttrs.event,
        reference = childAttrs.reference;
      
      if (reference === '') dr.global.error.logWarn('Empty reference attribute in handler.');
      
      if (eventName) {
        if (childAttrs.method) {
          handlerList.push({name:childAttrs.method, event:eventName, reference:reference});
        } else {
          var methodId = childNode.method_id;
          if (methodId) {
            var compiledMethod = compiledMethods[methodId];
            if (compiledMethod) {
              var methodName = '__handler_' + methodId;
              targetObj[methodName] = compiledMethod;
              handlerList.push({name:methodName, event:eventName, reference:reference});
            } else {
              throw new Error('Cannot find method id' + methodId);
            }
          }
        }
        
        // Also process named handlers as methods
        if (childAttrs.name) {
            this.__processMethod(childNode, compiledMethods, targetObj, altTargetObj);
        }
      } else {
        dr.global.error.logWarn('Handler has no event attribute.');
      }
    } else {
      dr.global.error.logWarn('Handler has no attributes.');
    }
  };

  maker.__processAttribute = function(childNode, attrs, attrValues, altTargetObj) {
    var childAttrs = childNode.attr,
      name = childAttrs.name.toLowerCase();
    
    if (altTargetObj && childAttrs.allocation && childAttrs.allocation === 'class') {
      altTargetObj[name] = dr.AccessorSupport.coerce(name, childAttrs.value, childAttrs.type || 'string', null);
    } else {
      attrs[name] = childAttrs.type || 'string'; // Default type is string
      attrValues[name] = childAttrs.value;
    }
  };
})