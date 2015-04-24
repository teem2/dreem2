/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

/**
 * @class RunMonitor
 * RunMonitor class executes ourselves as a subprocess, receives the dependency file names
 * from the child process and manages restart/killing when files change
 */

define(function(require, exports, module){
	var Node = require('../classes/node')

	// json safety check
	var RpcProxy = module.exports = Node.extend('RpcProxy', function(){
	})

	RpcProxy.defineProp = function(obj, key, value){
		var store = '__' + key
		Object.defineProperty(obj, key, {
			get:function(){
				return this[store]
			},
			set:function(v){
				// maybe error here?
				throw new Error('Please dont set key ' + key + ' on an rpc object, its readonly')
			}
		})
	}

	RpcProxy.defineMethod = function(obj, key){
		obj[key] = function(){
			var args = []
			var msg = {type:'rpcCall', id:this._rpcid, method:key, args:args }

			for(var i = 0; i < arguments.length; i++){
				var arg = arguments[i]
				
				if(typeof arg == 'function' || typeof arg == 'object' && !RpcProxy.isJsonSafe(arg)){
					throw new Error('RPC call ' + key + ' can only support JSON safe objects')
				}

				args.push(arg)
			}
			if(!this._rpcpromise) return new Promise(function(resolve, reject){resolve(undefined)})
			return this._rpcpromise.sendAndCreatePromise(msg)
		}
	}

	RpcProxy.isJsonSafe = function(obj, stack){
		if(!obj) return true
		if(typeof obj == 'function') return false
		if(typeof obj !== 'object') return true
		if(!stack) stack = []
		stack.push(obj)
		if(Object.getPrototypeOf(obj) !== Object.prototype) return false
		for(var key in obj){
			var prop = obj[key]
			if(typeof prop == 'object'){
				if(stack.indexOf(prop)!= -1) return false // circular
				if(!RpcProxy.isJsonSafe(prop, stack)) return false
			}
			else if(typeof prop == 'function') return false
			// probably json safe then
		}
		stack.pop()
		return true
	}

	RpcProxy.createFromDef = function(def, rpcid, rpcpromise){
		var obj = new RpcProxy()

		obj._rpcpromise = rpcpromise
		obj._rpcid = rpcid

		// lets interpret the def
		for(var key in def){
			var prop = def[key]
			if(typeof prop == 'object'){
				if(prop.kind == 'attribute'){
					// lets make an attribute
					obj.attribute(key, prop.type)
				}
				else if(prop.kind == 'method'){
					// its a method, lets make an rpc interface for it
					RpcProxy.defineMethod(obj, key)
				}			
			}
			else{ // we are a plain value
				RpcProxy.defineProp(obj, key, prop)
			}
		}

		return obj
	}

	RpcProxy.createRpcDef = function(object, ignore){
		var def = {}
		for(var key in object){
			if(ignore && key in ignore) continue
			if(object.__lookupGetter__(key)){ // we iz attribute
				var attr = object['on_' + key]
				if(attr){
					def[key] = {kind:'attribute', type: attr.type.name}
				}
			}
			else{
				var prop = object[key]
				if(typeof prop == 'function'){
					def[key] = {kind:'method'}
				}
				else if(typeof prop == 'object'){
					if(RpcProxy.isJsonSafe(prop)) def[key] = prop
				}
				else{
					def[key] = prop
				}
			}
		}
		return def
	}
})