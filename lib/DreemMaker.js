/*
 The MIT License (MIT) (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

define(function(require, exports, module){
	module.exports = DreemMaker

	var DomRunner = require('./DomRunner.js')
	var DreemParser = require('./DreemParser.js')
	var DreemError = require('./DreemError.js')

	function DreemMaker(){
	}

	var self = DreemMaker.prototype

	// Builtin modules, belongs here
	self.builtin = {
		/* Built in tags that dont resolve to class files */
		// Classes
		node:true,
		view:true,
		layout:true,
		
		// Class Definition
		class:true,
		
		// Special child tags for a Class or Class instance
		method:true,
		attribute:true,
		handler:true,
		state:true,
		setter:true
	}

	self.makeFromPackage = function(pkg) {
		// Compile methods
		var methods = [];
		try {
			new Function('methods', pkg.methods)(methods);
			pkg.compiledMethods = methods;
			pkg.methods = undefined // dont delete, set to undefined
		} catch(e) {
			domRunner.showErrors(new DreemError('Exception in evaluating methods ' + e.message));
			return;
		}
		var dr = {}
		pkg.compiledClasses = {
			node: dr.node || function(){},
			view: dr.view || function(){},
			layout: dr.layout || function(){}
		};
		
		dreemMaker.walkDreemJSXML(pkg.root.child[0], pkg);
	};

	self.walkDreemJSXML = function(node, pkg) {
		var tagName = node.tag,
			children = node.child;
		
		var klass;
		if (tagName.startsWith('$')) {
			if (tagName === '$comment') {
				// Ignore comments
				return;
			} else if (tagName === '$text') {
				console.log('Body Text: ', node.value);
				return;
			} else {
				console.log("Unexpected tag: ", tagName);
				return;
			}
		} else {
			klass = dreemMaker.lookupClass(tagName, pkg);
		}
		
		if (children) {
			// keep loops like this, it is NOT faster to do otherwise
			// it confuses people that the for loop has no loop iterator or
			for (var i = 0, len = children.length; i < len; i++){
				dreemMaker.walkDreemJSXML(children[i], pkg)
			}
		}
	};
	
	self.lookupClass = function(tagName, pkg) {
		var classTable = pkg.compiledClasses
		var compiledMethods = pkg.compiledMethods
		
		// First look for a compiled class
		if (tagName in classTable) return classTable[tagName]
		
		// Ignore built in tags
		if (tagName in dreemMaker.builtin) return null
		
		// Try to build a class
		var klassjsxml = pkg.classes[tagName]
		if (!klassjsxml) throw new DreemError('Cannot find class ' + tagName)
		delete pkg.classes[tagName]

		// Determine base class
		var baseclass = classTable.view
		if (klassjsxml.extends) { // we cant extend from more than one class
			baseclass = dreemMaker.lookupClass(klassjsxml.extends, pkg)
		}

		// Get Mixins
		var mixins = []
		var mixinNames = klassjsxml.with
		if (mixinNames) {
			mixinNames.split(/,\s*/).forEach(
				function(mixinName) {
					mixins.push(dreemMaker.lookupClass(mixinName, pkg))
				}
			)
		}
		
		// Instantiate the Class
		// FIXME: need dreem class constructor that is dom independent
		function Klass(){}
		var proto = Klass.prototype = Object.create(baseclass.prototype)

		// Mix in the mixins
		// FIXME: dreem will do this in the constructor
		for (var i = 0; i < mixins.length; i++) {
			var mixin = mixins[i].prototype
			var keys = Object.keys(mixin)
			for (var j = 0; j < keys.length; j++) {
				var key = keys[j]
				proto[key] = mixin[key] // make fancier
			}
		}

		// set the tagname
		proto.tagname = klassjsxml.attr.name
		classTable[tagName] = Klass;

		// Process Children
		var children = klassjsxml.child;

		if (!children) return Klass

		for (var i = 0, len = children.length; i < len; i++) { 
			var childNode = children[i];
			var childTagName = childNode.tag;
			switch (childTagName) {
				case 'setter':
				case 'method':
					// FIXME: add method to class definition
					var methodId = childNode.method_id;
					if (methodId) {
						var compiledMethod = compiledMethods[methodId];
						if (compiledMethod) {
							proto[childNode.attr.name] = compiledMethod;
						} else {
							throw new Error('Cannot find method id' + methodId);
						}
					}
					break;
				case 'handler':
					console.log('HANDLER', childNode.method_id, childNode);
					// FIXME: add handler to class definition
					break;
				case 'attribute':
					console.log('ATTRIBUTE', childNode);
					// FIXME: add attribute to class definition
					break;
				case 'state':
					console.log('STATE', childNode);
					// FIXME: add state to class definition
					break;
				case 'getter':
					// Not supported in dreem
					break;
				default:
					dreemMaker.walkDreemJSXML(childNode, pkg);
			}
		}
	
		// Store and return class
		return Klass
	}
})
