/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

define(function(require, exports, module){
	module.exports = Node

	var Attribute = require ('../core/attribute')
	var types = require('../core/types')

	/**
	  * @constructor
	  */
	function Node(){
		throw new Error("node is an abstract class, do not new it")
	}
	body.call(Node.prototype)

	Node.extend = function extend(class_name, class_body){
		function DreemClass(){
			var obj = this
			if(!(obj instanceof DreemClass)) obj = Object.create(DreemClass.prototype)
			// process arguments
			var i = 0
			if(arguments.length >= 1){	
				var arg0 = arguments[0]
				if(!arg0.__is_node__){ // copy the props on here
					for(var key in arg0){
						obj[key] = arg0[key]
					}
				}
				i = 1
			}
			// add our children
			for(;i<arguments.length;i++){
    			if(!obj.child) obj.child = []
    			obj.child.push(arguments[i])	
			}
			// expand into tree structure
			return obj
		}

		var proto = DreemClass.prototype = Object.create(this.prototype)
		proto.constructor = DreemClass
		
		// populate
		DreemClass.extend = extend
		DreemClass.class = class_name
		Object.defineProperty(proto, 'class', {enumerable:false, value:class_name})
	
		class_body.call(proto, DreemClass)

		return DreemClass
	}

	Node.class = 'Node'

	function body(){
		this.class = 'Node'
		this.__is_node__ = true
		this.types = types

		/** 
		  * @method fromXML
		  * Populates the node from XML
		  * @param {Object} xmlnode
		  */
		this.mixin = function(){
			for(var i = 0; i < arguments.length; i++){
				var obj = arguments[i]
				if(typeof obj == 'function') obj = obj.prototype
				for(var key in obj){
					// copy over getters and setters
					if(obj.__lookupGetter__(key) || obj.__lookupSetter__(key)){

					}
					else{
						// other
						proto[key] = obj[key]
					}
				}
			}	
		}

		/** 
		  * @method mixin
		  * Mixes in another class
		  * @param {Function} class(es) 
		  */
		this.mixin = function(){
			for(var i = 0; i < arguments.length; i++){
				var obj = arguments[i]
				if(typeof obj == 'function') obj = obj.prototype
				for(var key in obj){
					// copy over getters and setters
					if(obj.__lookupGetter__(key) || obj.__lookupSetter__(key)){

					}
					else{
						// other
						proto[key] = obj[key]
					}
				}
			}	
		}

		/** 
		  * @method overloads
		  * finds the property 'me' overloads
		  * @param {Function} me 
		  * @param {String} key 
		  */
		this.overloads = function(key, me){
			var proto = this
			var next
			while(proto){
				if(proto.hasOwnProperty(key)){
					var val = proto[key]
					if(next && val !== me) return val
					if(val === me) next = 1
				}
				proto = Object.getPrototypeOf(proto)
			}
		}

		/** 
		  * @method super
		  * calls super method
		  * @param {arguments} args 
		  * @param {extra} replacement args 
		  */
		this.super = function(args){
			if(arguments.length == 0 || !args) throw new Error('Please pass the arguments object as first argument into call to super')
			// fetch the function
			var me = args.callee || args
			var fnargs = args
			// someone passed in replacement arguments
			if( arguments.length > 1 ) fnargs = Array.prototype.slice.call( arguments, 1 )
			// look up function name
			var name = me.__supername__
			if( name !== undefined ){ // we can find our overload directly
				var fn = this.overloads(name, me)
				if(fn && typeof fn == 'function') return fn.apply(this, fnargs)
			} 
			else { // we have to find our overload in the entire keyspace
				for(var key in this) if(!this.__lookupGetter__(key)){
					fn = this.overloads(key, me)
					if(fn && typeof fn == 'function') {
						me.__supername__ = key // store it for next time
						return fn.apply( this, fnargs )
					}
				}
			}
		}
		
		/** 
		  * @method attribute
		  * create an attribute
		  * @param {String} key 
		  * @param {String} type 
		  */
		this.attribute = function(key, type, init_value){

			var attr = new Attribute(type)
			attr.owner = this
			attr.name = key
			attr.value = init_value
			// lets create an attribute
			var attr_key = 'attr_' + key
			// maybe this is not needed
			Object.defineProperty(this, 'on_' + key, {
				configurable:true,
				enumerable:false,
				get:function(){
					var attr = this[attr_key]					
					// make an instance copy if needed
					if(attr.owner != this){
						attr = this[attr_key] = Object.create(attr)
						attr.owner = this
					}
					return attr
				},
				set:function(value){
					throw new Error('Cant assign to on_' + key + ', assign to ' + key + ' instead')
				}
			})
			Object.defineProperty(this, key, {
				configurable:true,
				enumerable:true,
				get:function(){
					var attr = this[attr_key]
					if(this.onAttributeGet) this.onAttributeGet(key)
					if(attr.getter) return attr.getter.call(this, attr)
					return attr.value
				},
				set:function(value){
					var attr = this[attr_key]
					// make instance copy if needed
					if(attr.owner != this){
						attr = this[signalStore] = Object.create(attr)
						attr.owner = this
					}
					if(typeof value == 'function'){
						attr.addListener(value)
						return
					}
					if(attr.setter) value = attr.setter.call(this, value, attr)
					attr.set(value)
				}
			})
		}
	}
})