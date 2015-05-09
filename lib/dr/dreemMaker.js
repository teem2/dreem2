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

Instantiates dr classes from package JSON.
*/
define(function(require, exports){
  var maker = exports
  var dreemParser = require('./dreemParser.js')

  // Pull in the dr core
  var dr = require('$LIB/dr/all.js')
  var JS = require('$LIB/jsclass.js')

  /** Built in tags that dont resolve to class files or that resolve to 
      class files defined in the core. */
  maker.builtin = {
    // Classes
    node:true,
    view:true,
    layout:true,
    button:true,
    animator:true,
    eventable:true,
    
    // Class Definition
    class:true,
    mixin:true,
    
    // Special child tags for a Class or Class instance
    method:true,
    attribute:true,
    handler:true,
    state:true,
    setter:true
  };

  maker.classroots = [];

  maker.makeFromPackage = function(pkg) {
    // Compile methods
    try {
      // Transform this["super"]( into this.callSuper( since .dre files
      // use super not callSuper.
      pkg.methods = pkg.methods.split('this["super"](').join('this.callSuper(').split('this.super(').join('this.callSuper(');
      
      new Function('methods','dr', pkg.methods)(pkg.compiledMethods = [], dr); // TAG:Global Scope
      delete pkg.methods;
    } catch(e) {
      console.error('Exception in evaluating methods ' + e.message);
      return;
    }
    
    // Prefill compiled classes with classes defined in core
    pkg.compiledClasses = {
      node:dr.Node,
      view:dr.View,
      layout:dr.Layout,
      button:dr.Button,
      animator:dr.Animator,
      eventable:dr.Eventable
    };
    
    // Make pkg available to dr since child processing is initiated from there.
    dr.maker = maker;
    dr.pkg = pkg;
    
    // Start processing from the root downward
    maker.walkDreemJSXML(pkg.root, null, pkg);
    
    dr.notifyReady();
  };

  maker.walkDreemJSXML = function(node, parentInstance, pkg) {
    var compiledMethods = pkg.compiledMethods,
      tagName = node.tag,
      children = node.child;
    
    var klass;
    if (tagName.startsWith('$')) {
      if (tagName === '$comment') {
        // Ignore comments
      } else if (tagName === '$text') {
        parentInstance.setAttribute('$textcontent', (parentInstance.$textcontent || '') + node.value.trim());
      } else if (tagName === '$cdata') {
        parentInstance.setAttribute('$textcontent', (parentInstance.$textcontent || '') + node.value);
      } else {
        console.log("Unexpected tag: ", tagName);
      }
      return;
    } else if(tagName == 'class' || tagName == 'mixin'){
      return
    } else {
      klass = maker.lookupClass(tagName, pkg);
      if(!klass) console.log('Cant find class '+ tagName)
    }
    
    // Instantiate
    var attrs = node.attr || {},
      mixins = [],
      instanceMixin = {},
      instanceChildrenJson,
      instanceHandlers,
      instanceAttrs, instanceAttrValues;
    
    // Normalize attrs
    var normalizedAttrs = {};
    for (var name in attrs) normalizedAttrs[name.toLowerCase()] = attrs[name];
    attrs = normalizedAttrs;
    
    // Get Mixins
    var mixinNames = attrs.with;
    delete attrs.with;
    if (mixinNames) {
      mixinNames.split(/,\s*/).forEach(
        function(mixinName) {
          mixins.push(maker.lookupClass(mixinName, pkg));
        }
      );
    }
    
    var i, len, childNode, childAttrs;
    if (children) {
      i = 0;
      len = children.length;
      for (; len > i;) {
        childNode = children[i++];
        childAttrs = childNode.attr;
        switch (childNode.tag) {
          case 'setter':
            var methodId = childNode.method_id;
            if (methodId != null) {
              var compiledMethod = compiledMethods[methodId];
              if (compiledMethod) {
                instanceMixin[dr.AccessorSupport.generateSetterName(childAttrs.name)] = compiledMethod;
              } else {
                throw new Error('Cannot find method id' + methodId);
              }
            }
            break;
          case 'method':
            var methodId = childNode.method_id;
            if (methodId != null) {
              var compiledMethod = compiledMethods[methodId];
              if (compiledMethod) {
                instanceMixin[childAttrs.name] = compiledMethod;
              } else {
                throw new Error('Cannot find method id' + methodId);
              }
            }
            break;
          case 'handler':
            if (!instanceHandlers) instanceHandlers = [];
            if (childAttrs.method) {
              instanceHandlers.push({name:childAttrs.method, event:childAttrs.event, reference:childAttrs.reference});
            } else {
              var methodId = childNode.method_id;
              if (methodId != null) {
                var compiledMethod = compiledMethods[methodId];
                if (compiledMethod) {
                  var methodName = '__handler_' + methodId;
                  instanceMixin[methodName] = compiledMethod;
                  instanceHandlers.push({name:methodName, event:childAttrs.event, reference:childAttrs.reference});
                } else {
                  throw new Error('Cannot find method id' + methodId);
                }
              }
            }
            break;
          case 'attribute':
            if (!instanceAttrs) {
              instanceAttrs = {};
              instanceAttrValues = {};
            }
            var name = childAttrs.name.toLowerCase();
            instanceAttrs[name] = childAttrs.type || 'string'; // Default type is string
            instanceAttrValues[name] = childAttrs.value;
            break;
          case 'state':
            console.log('DR STATE', childNode);
            // FIXME: add state to instance definition
            break;
          default:
            if (!instanceChildrenJson) instanceChildrenJson = [];
            instanceChildrenJson.push(childNode);
        }
      }
    }
    
    // Build default attributes
    var combinedAttrs = {};
    len = mixins.length;
    if (len > 0) {
      i = 0;
      for (; len > i;) {
        dr.extend(combinedAttrs, mixins[i++].defaultAttrValues);
      }
    }
    if (instanceAttrValues) dr.extend(combinedAttrs, instanceAttrValues);
    dr.extend(combinedAttrs, attrs);
    
    // Setup __makeChildren method if instanceChildrenJson exist
    if (tagName !== 'screen') {
        if (instanceChildrenJson) {
          instanceMixin.__makeChildren = new Function('dr','this.callSuper(); this.__allowPlacement = true; dr.makeChildren(this, ' + JSON.stringify(instanceChildrenJson) + ', false);'); // TAG:Global Scope
        }
    }
    
    // Setup __registerHandlers method if klassHandlers exist
    if (instanceHandlers && instanceHandlers.length > 0) {
      instanceMixin.__registerHandlers = new Function('dr','this.callSuper(); dr.registerHandlers(this, ' + JSON.stringify(instanceHandlers) + ');'); // TAG:Global Scope
    }
    
    // Build setters for attributes
    if (instanceAttrs) {
      var setterName;
      for (var attrName in instanceAttrs) {
        setterName = dr.AccessorSupport.generateSetterName(attrName);
        if (!instanceMixin[setterName]) { // Don't clobber an explicit setter
          instanceMixin[setterName] = new Function(
            "value", "this.setActual('" + attrName + "', value, '" + instanceAttrs[attrName] + "');"
          );
        }
      }
    }
    
    mixins.push(instanceMixin);
    if (!parentInstance) mixins.push(dr.SizeToViewport); // Root View case
    
    combinedAttrs.classroot = this.classroots[0] || null;
    new klass(parentInstance, combinedAttrs, mixins);
    
    if (tagName === 'screen') {
      if (instanceChildrenJson) {
        for (var i = 0, len = instanceChildrenJson.length; len > i;) {
          maker.walkDreemJSXML(instanceChildrenJson[i++], null, pkg);
        }
      }
    }
  };
  
  maker.lookupClass = function(tagName, pkg) {
    // First look for a compiled class
    var classTable = pkg.compiledClasses;
    if (tagName in classTable) return classTable[tagName];
    
    // Ignore built in tags
    if (tagName in maker.builtin) return null;
    
    // Try to build a class
    var klassjsxml = pkg.classes[tagName];
    if (!klassjsxml) throw new Error('Cannot find class ' + tagName);
    if (klassjsxml === 2) throw new Error('Class still loading ' + tagName);
    delete pkg.classes[tagName];
    
    var isMixin = klassjsxml.tag === 'mixin',
      klassAttrs = klassjsxml.attr || {};
    
    // Normalize klassAttrs
    var normalizedAttrs = {};
    for (var name in klassAttrs) normalizedAttrs[name.toLowerCase()] = klassAttrs[name];
    klassAttrs = normalizedAttrs;
    
    // Determine base class
    var baseclass, extendsAttr;
    if (!isMixin) {
      extendsAttr = klassAttrs.extends;
      delete klassAttrs.extends;
      if (extendsAttr) {
        baseclass = maker.lookupClass(extendsAttr, pkg);
      } else {
        baseclass = classTable.view;
      }
    }

    // Get Mixins
    var mixins, mixinNames = klassAttrs.with;
    delete klassAttrs.with;
    if (mixinNames) {
      mixins = [];
      mixinNames.split(/,\s*/).forEach(
        function(mixinName) {
          mixins.push(maker.lookupClass(mixinName, pkg));
        }
      );
    }
    
    // Process Children
    var compiledMethods = pkg.compiledMethods,
      children = klassjsxml.child,
      klassBody = {},
      klassChildrenJson,
      klassHandlers,
      klassDeclaredAttrs, klassDeclaredAttrValues,
      staticBody = klassBody.extend = {},
      i, len, childNode, childAttrs;
    if (children) {
      i = 0;
      len = children.length;
      for (; len > i;) {
        childNode = children[i++];
        childAttrs = childNode.attr;
        switch (childNode.tag) {
          case 'setter':
            var methodId = childNode.method_id;
            if (methodId != null) {
              var compiledMethod = compiledMethods[methodId];
              if (compiledMethod) {
                klassBody[dr.AccessorSupport.generateSetterName(childAttrs.name)] = compiledMethod;
              } else {
                throw new Error('Cannot find method id' + methodId);
              }
            }
            break;
          case 'method':
            var methodId = childNode.method_id;
            if (methodId != null) {
              var compiledMethod = compiledMethods[methodId];
              if (compiledMethod) {
                if (childAttrs.allocation && childAttrs.allocation === 'class') {
                  staticBody[childAttrs.name] = compiledMethod;
                } else {
                  klassBody[childAttrs.name] = compiledMethod;
                }
              } else {
                throw new Error('Cannot find method id' + methodId);
              }
            }
            break;
          case 'handler':
            if (!klassHandlers) klassHandlers = [];
            if (childAttrs.method) {
              klassHandlers.push({name:childAttrs.method, event:childAttrs.event, reference:childAttrs.reference});
            } else {
              var methodId = childNode.method_id;
              if (methodId != null) {
                var compiledMethod = compiledMethods[methodId];
                if (compiledMethod) {
                  var methodName = '__handler_' + methodId;
                  klassBody[methodName] = compiledMethod;
                  klassHandlers.push({name:methodName, event:childAttrs.event, reference:childAttrs.reference});
                } else {
                  throw new Error('Cannot find method id' + methodId);
                }
              }
            }
            break;
          case 'attribute':
            var name = childAttrs.name.toLowerCase();
            
            if (childAttrs.allocation && childAttrs.allocation === 'class') {
              staticBody[name] = dr.AccessorSupport.coerce(name, childAttrs.value, childAttrs.type || 'string', null);
            } else {
              if (!klassDeclaredAttrs) {
                klassDeclaredAttrs = {};
                klassDeclaredAttrValues = {};
              }
              klassDeclaredAttrs[name] = childAttrs.type || 'string'; // Default type is string
              klassDeclaredAttrValues[name] = childAttrs.value;
            }
            break;
          case 'state':
            console.log('DR STATE', childNode);
            // FIXME: add state to class definition
            break;
          default:
            if (!klassChildrenJson) klassChildrenJson = [];
            klassChildrenJson.push(childNode);
        }
      }
    }
    
    // Setup __makeChildren method if klassChildrenJson exist
    if (klassChildrenJson) {
      klassBody.__makeChildren = new Function('dr','this.callSuper(); dr.makeChildren(this, ' + JSON.stringify(klassChildrenJson) + ', true);'); // TAG:Global Scope
    }
    
    // Setup __registerHandlers method if klassHandlers exist
    if (klassHandlers && klassHandlers.length > 0) {
      klassBody.__registerHandlers = new Function('dr','this.callSuper(); dr.registerHandlers(this, ' + JSON.stringify(klassHandlers) + ');'); // TAG:Global Scope
    }
    
    // Build setters for attributes
    if (klassDeclaredAttrs) {
      var setterName;
      for (var attrName in klassDeclaredAttrs) {
        setterName = dr.AccessorSupport.generateSetterName(attrName);
        if (!klassBody[setterName]) { // Don't clobber an explicit setter
          klassBody[setterName] = new Function(
            "value", "this.setActual('" + attrName + "', value, '" + klassDeclaredAttrs[attrName] + "');"
          );
        }
      }
    }
    
    // Instantiate the Class or Mixin
    if (mixins) klassBody.include = mixins;
    var Klass = dr[tagName] = isMixin ? new JS.Module(tagName, klassBody) : new JS.Class(tagName, baseclass, klassBody);
    
    // Create package object if necessary an store the class reference there too.
    var packages = tagName.split('-'), packageName, curPackage = dr;
    while (packages.length > 1) {
      packageName = packages.shift();
      if (curPackage[packageName] == null) curPackage[packageName] = {};
      curPackage = curPackage[packageName];
      if (packages.length === 1) curPackage[packages.shift()] = Klass;
    }
    
    // Build default class attributes
    var defaultAttrValues = {};
    if (baseclass && baseclass.defaultAttrValues) dr.extend(defaultAttrValues, baseclass.defaultAttrValues);
    if (mixins) {
      len = mixins.length;
      if (len > 0) {
        i = 0;
        for (; len > i;) {
          dr.extend(defaultAttrValues, mixins[i++].defaultAttrValues);
        }
      }
    }
    defaultAttrValues.$tagname = tagName;
    dr.extend(defaultAttrValues, klassAttrs);
    if (klassDeclaredAttrValues) dr.extend(defaultAttrValues, klassDeclaredAttrValues);
    delete defaultAttrValues.name; // Instances only
    delete defaultAttrValues.id; // Instances only
    Klass.defaultAttrValues = defaultAttrValues;
    
    // Store and return class
    return classTable[tagName] = Klass;
  }
})