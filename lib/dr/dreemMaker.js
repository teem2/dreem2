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
    dr = require('$LIB/dr/all.js'),
    JS = require('$LIB/jsclass.js'),
    sprite = require('$SPRITE/sprite.js');

  /** Built in tags that dont resolve to class files or that resolve to 
      class files defined in the core. */
  maker.builtin = {
    // Specific Classes and Mixins from the core
    animator:true,
    animgroup:true,
    button:true,
    draggable:true,
    eventable:true,
    layout:true,
    node:true,
    view:true,
    
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

  // Called from teem.js to start processing a composition
  maker.makeFromPackage = function(pkg) {
    // Compile pkg methods
    // Transform super to callSuper since .dre files use super.
    pkg.methods = pkg.methods.split('this["super"](').join('this.callSuper(').split('this.super(').join('this.callSuper(').split('this["super"] ').join('this.callSuper ');
    try {
      new Function('methods','dr', pkg.methods)(pkg.compiledMethods = [], dr); // TAG:Global Scope
      delete pkg.methods;
    } catch(e) {
      sprite.console.error('Exception evaluating methods ' + e.message);
      return;
    }
    
    // Prefill compiled classes with classes defined in core
    pkg.compiledClasses = {
      animator:dr.Animator,
      animgroup:dr.AnimGroup,
      button:dr.Button,
      draggable:dr.Draggable,
      eventable:dr.Eventable,
      layout:dr.Layout,
      node:dr.Node,
      view:dr.View
    };
    
    // Make pkg available to dr since child processing is initiated from there.
    dr.maker = this;
    dr.pkg = pkg;
    
    // Start processing from the root downward
    this.__walkDreemJSXML(pkg.root, null, pkg);
    
    dr.notifyReady();
  };

  // Entry point for instances creating their children. Called 
  // from dr.makeChildren
  maker.walkForInstance = function(targetObj, json, isClassroot, pkg) {
    if (isClassroot) this.__classroots.unshift(targetObj);
    for (var i = 0, len = json.length; len > i;) this.__walkDreemJSXML(json[i++], targetObj, pkg);
    if (isClassroot) this.__classroots.shift();
  };

  maker.__walkDreemJSXML = function(node, parentInstance, pkg) {
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
    if (isScreen && parentInstance) {
      dr.global.error.logWarn('No nesting of screen tags. Skipping instance.');
      return;
    }
    
    var klass = this.lookupClass(tagName, pkg);
    if (klass) {
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
      this.__doMixinExtension(combinedAttrs, mixins);
      if (instanceAttrValues) dr.extend(combinedAttrs, instanceAttrValues);
      dr.extend(combinedAttrs, attrs);
      
      if (!isScreen) this.__setupMakeChildrenMethod(instanceChildrenJson, instanceMixin, false);
      this.__setupRegisterHandlersMethod(instanceHandlers, instanceMixin);
      this.__buildSettersForAttributes(instanceAttrs, instanceMixin);
      this.__setupGetTypeForAttrNameMethod(instanceAttrs, instanceMixin);
      
      mixins = mixins ? mixins : [];
      mixins.push(instanceMixin);
      if (!parentInstance) mixins.push(dr.SizeToViewport); // Root View case
      
      combinedAttrs.classroot = this.__classroots[0] || null;
      new klass(parentInstance, combinedAttrs, mixins);
      
      if (isScreen && instanceChildrenJson) {
        for (i = 0, len = instanceChildrenJson.length; len > i;) {
          this.__walkDreemJSXML(instanceChildrenJson[i++], null, pkg);
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
      klassDeclaredAttrs, klassDeclaredAttrValues,
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
            this.__processHandler(childNode, compiledMethods, klassBody, klassHandlers);
            break;
          case 'attribute':
            if (!klassDeclaredAttrs) {
              klassDeclaredAttrs = {};
              klassDeclaredAttrValues = {};
            }
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
    this.__doMixinExtension(combinedAttrs, mixins);
    combinedAttrs.$tagname = tagName;
    dr.extend(combinedAttrs, klassAttrs);
    if (klassDeclaredAttrValues) dr.extend(combinedAttrs, klassDeclaredAttrValues);
    delete combinedAttrs.name; // Instances only
    delete combinedAttrs.id; // Instances only
    Klass.defaultAttrValues = combinedAttrs;
    
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
      mixinNames.split(dr.SEPARATOR_REGEX).forEach(
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
      requiresNames.split(dr.SEPARATOR_REGEX).forEach(
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

  maker.__doMixinExtension = function(attrs, mixins) {
    if (mixins) {
      len = mixins.length;
      if (len > 0) {
        i = 0;
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

  maker.__processHandler = function(childNode, compiledMethods, targetObj, handlerList) {
    var childAttrs = childNode.attr;
    if (childAttrs) {
      var eventName = childAttrs.event || childAttrs.name, // Fallback to name since it's an easy mistake to make
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
      } else {
        dr.global.error.logWarn('Handler has no name or event attribute.');
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