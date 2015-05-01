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
			if(DreemClass.singleton) obj = DreemClass
			if(!(this instanceof DreemClass)){
				// use the JSONML mapping
				var array = [DreemClass]
				array.push.apply(array, arguments)
				return array
			}
			if(this.onConstruct){
				this.onConstruct()
			}
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

		Node.createFromJSONML = function(array, depth){
			// lets new the object
			var constructor = array[0]
			var obj = new constructor()

			// ok so we are processing our json ML.
			for(var i = 1; i < array.length; i++){
				var item = array[i]
				
				if(Array.isArray(item)){
					if(depth === undefined || depth > 0){
						// lets create a new one
						if(!obj.child){
							Object.defineProperty(obj, 'child', {value:[]})
						}
						obj.child.push(Node.createFromJSONML(item, depth === undefined?depth:depth - 1))
					}
				}
				else if(typeof item == 'object'){
					obj.initFromJSONMLObject(item)
				}
			}

			// lets call our constructor after we created all our children
			if(obj.onConstruct) obj.onConstruct(array)

			return obj
		}
		
		this.checkPropertyBind = function(key, value, attr){
			if(typeof value === 'string' && (value.charAt(0)=='$' || value.charAt(1)=='{')){
				if(!this._propbinds) Object.defineProperty(this, '_propbinds', {value:[]})
				this._propbinds.push(key)
				attr.binding = value.slice(2, -1)
				attr.value = null // initial value
			}
			else{
				attr.value = value
			}
		}

		this.initFromJSONMLObject = function(obj){
			if(obj instanceof Node){
				for(var key in obj){
					// what do we copy over?...
					if(!(key in Node.prototype)){
						// we copy over the attributes
						var attr = obj['attr_' + key]
						var setattr = this['on_' + key]
						if(attr && !setattr){
							var value = attr.binding !== undefined? attr.binding: attr.value
							this.attribute(key, attr.type.name)
							setattr = this['on_' + key]
							this.checkPropertyBind(key, value, setattr)
						}
						else if(setattr){
							var value = attr? (attr.binding !== undefined? attr.binding: attr.value): obj[key]
							this.checkPropertyBind(key, value, setattr)
						}
						if(attr && attr.listeners){
							if(!setattr.listeners) setattr.listeners = []
							setattr.listeners.push.apply(setattr.listeners, attr.listeners)
						}
					}
				}
				return
			}

			for(var key in obj){
				var prop = obj[key]
				if(key.indexOf('attr_') == 0){
					key = key.slice(5)
					this.attribute(key, prop.type)
					this.checkPropertyBind(key, prop.value, this['attr_'+key])
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
						var value = obj[key]
						if(typeof value == 'function'){
							this['on_' + key].addListener(value)
						}
						else{
							this.checkPropertyBind(key, value, this['on_' + key])
						}
					}
				}
				else this[key] = obj[key]
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
		
		this.hideProperty = function(){
			for(var i = 0; i<arguments.length; i++){
				var arg = arguments[i]
				if(Array.isArray(arg)){
					for(var j = 0; j<arg.length; j++){
						Object.defineProperty(this, arg[j],{enumerable:false, configurable:true, writeable:true})
					}
				}
				else{
					Object.defineProperty(this, arg,{enumerable:false, configurable:true, writeable:true})
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
				configurable:false,
				enumerable:true,
				get: function(){
					var attr = this[attr_key]
					if(this.onAttributeGet) this.onAttributeGet(key)
					if(attr.getter) return attr.getter.call(this, attr)
					return attr.value
				},
				set: function(value){
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