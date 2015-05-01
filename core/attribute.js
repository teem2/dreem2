/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

define(function(require, exports, module){
	module.exports = Attribute

	function Attribute(type){
		this.type = type
	}
	body.call(Attribute.prototype)

	function body(){

		this.addListener = function(){
			var callbacks = Array.prototype.slice.apply(arguments)
			for(var i = 0; i < callbacks.length; i++){
				var callback = callbacks[i]
				if(!this.hasOwnProperty('listeners')) this.listeners = []
				if(this.listeners.indexOf(callback) == -1){
					this.listeners.push(callback)
				}
				if(this.onAddListener) this.onAddListener(callback)
			}
			// return a subscription function you can call to unregister
			return function(){
				this.removeListener.apply(this, callbacks)
			}.bind(this)
		}

		this.once = function(callback){
			this.addListener(function(value, old, attr, cb){
				callback(value, old)
				attr.removeListener(cb)
			}.bind(this))
		}

		this.removeListener = function(){
			for(var i = 0;i < arguments.length; i++){
				var callback = arguments[i]
				if(!this.hasOwnProperty('listeners')) return
				var id = this.listeners.indexOf(callback)
				if(id !== -1) this.listeners.splice(id, 1)
			}
		}

		this.clear = 
		this.removeAllListeners = function(){
			this.listeners = undefined
		}

		this.emit =
		this.set = function(value){
			if(this.setter){
				var ret = this.setter.call(this, value, this)
				if(ret !== undefined) value = ret
			} 

			var old = this.value
			this.value = value

			if(!this.listeners) return

			var proto = this, list
			var stack = []
			while(proto){
				if(proto.hasOwnProperty('listeners') && (list = proto.listeners)){
					stack.push(list)
				}
				proto = Object.getPrototypeOf(proto)
			}

			for(var j = 0; j < stack.length; j++){
				var list = stack[j]
				for(var i = 0; i < list.length; i++){
					var cb = list[i]
					if(cb) cb.call(this.owner, value, old, this, cb)
				}
			}
		}
	}
})