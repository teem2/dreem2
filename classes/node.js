/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

define(function(require, exports, module){
	module.exports = Node

	var Attribute = require ('$CORE/attribute')
	var types = require('$CORE/types')

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
			if(DreemClass.singleton) obj = DreemClass

			if(!(obj instanceof DreemClass)) obj = Object.create(DreemClass.prototype)
			// process arguments
			var i = 0
			if(arguments.length >= 1){	
				var arg0 = arguments[0]
				if(arg0 && !arg0.__is_node__){ // copy the props on here
					obj.processArg0(arguments[0])
					i = 1
				}
			}
			// add our children
			for(;i<arguments.length;i++){
				var arg = arguments[i]
				if(arg === undefined) continue
    			if(!obj.child) obj.child = []
    			if(Array.isArray(arg)){
    				for(var j = 0; j<arg.length; i++){
    					var item = arg[j]
    					if(typeof item == 'object' && item){
	    					var name = item.name
	    					if(name !== undefined && !(name in obj)) obj[name] = item
	    				}
    					obj.child.push(item)
    				}
    			}
    			else{
    				if(typeof arg == 'object' && arg){
						var name = arg.name
						if(name !== undefined && !(name in obj)) obj[name] = arg
					}
					obj.child.push(arg)
	    		}
			}
			// expand into tree structure
			if(obj.onConstruct) obj.onConstruct()
			return obj
		}

		var proto = DreemClass.prototype = Object.create(this.prototype)
		
		// populate
		DreemClass.extend = extend
		DreemClass.class = class_name
		Object.defineProperty(proto, 'class', {enumerable:false, value:class_name})
		Object.defineProperty(proto, 'constructor', {enumerable:false, value:DreemClass})
	
		if(class_body) class_body.call(proto, DreemClass)

		return DreemClass
	}

	Node.singleton = function(class_name, class_body){
		function Singleton(args){
			if(args) Singleton.processArg0(args) 
			if(Singleton.onConstructor) Singleton.onConstructor()
			return Singleton
		}
		Singleton.class = class_name || 'Singleton'
		for(var key in Node.prototype){
			Singleton[key] = Node.prototype[key]
		}
		return Singleton
	}

	Node.class = 'Node'

	function body(){
		Object.defineProperty(this, 'class', {enumerable:false, configurable:true, value:'Node'})

		this.__is_node__ = true
		this.types = types

		this.processArg0 = function(arg0){
			for(var key in arg0){
				var prop = arg0[key]
				if(key.indexOf('attr_') == 0 && typeof prop == 'object' && prop._kind_ == 'attribute'){
					key = key.slice(5)
					this.attribute(key, prop.type, prop.value)
				}
				else if(key.indexOf('set_') == 0){
					key = key.slice(4)
					if(!this.isAttribute(key)){
						//console.log('Please define attribute type before making a setter '+key)
						this.attribute(key, 'number')
					}
					this['on_'+key].setter = prop
				}
				else if(key.indexOf('get_') == 0){
					key = key.slice(4)
					if(!this.isAttribute(key)){
						//console.log('Please define attribute type before making a getter '+key)
						this.attribute(key, 'number')
					}
					this['on_'+key].getter = prop
				}
				else if(key.indexOf('handle_') == 0){
					key = key.slice(7)
					if(!this.isAttribute(key)){
						//console.log('Please define attribute before making a handler '+key)
						this.attribute(key, 'event')
					}
					this['on_' + key].addListener(prop)
				}
				else if(this.__lookupSetter__(key)){
					if(this.isAttribute(key)){
						var prop = arg0[key]
						if(typeof prop == 'function'){
							this['on_' + key].addListener(prop)
						}
						else{
							this['on_' + key].value = arg0[key]
						}
					}
				}
				else this[key] = arg0[key]
			}
		}
		/** 
		  * @method render
		  * render this node
		  */
		this.render = function(){
			return this
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
						// lets copy over this thing

					}
					else{
						// other
						this[key] = obj[key]
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
		
		this.isAttribute = function(key){
			if(this['attr_' + key]) return true
			else return false
		}

		/** 
		  * @method attribute
		  * create an attribute
		  * @param {String} key 
		  * @param {String} type 
		  */
		this.attribute = function(key, type, init_value){
			var typeobj = types[type]
			if(!typeobj) throw new Error('unknown type in attribute '+type)
			var attr = new Attribute(typeobj)

			attr.owner = this
			attr.name = key
			attr.value = init_value
			// lets create an attribute
			var attr_key = 'attr_' + key
			Object.defineProperty(this, attr_key, {writable:true, value:attr})
			// maybe this is not needed
			Object.defineProperty(this, 'on_' + key, {
				configurable:true,
				enumerable:false,
				get:function(){
					var attr = this[attr_key]
					// make an instance copy if needed
					if(attr.owner != this){
						attr = Object.create(attr)
						Object.defineProperty(this, attr_key, {writable:true, value:attr})
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
						attr = Object.create(attr)
						Object.defineProperty(this, attr_key, {writable:true, value:attr})
						attr.owner = this
					}
					if(typeof value == 'function'){
						attr.addListener(value)
						return
					}
		
					if(this._onAttributeSet) this._onAttributeSet(key, value)
					if(this.onAttributeSet) this.onAttributeSet(key, value)
		
					attr.set(value)
				}
			})
		}
	}
})