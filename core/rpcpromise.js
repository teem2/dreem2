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
	module.exports = RpcPromise

	function RpcPromise(sendbus){
		// ok lets initialize from rpcObject by forwarding to all individual rpc objects.
		// how?...
		this.sendbus = sendbus
		this.promises = {}
		this.uid_free = []
		this.uid = 0
	}

	body.call(RpcPromise.prototype)
	function body(){

		this.sendAndCreatePromise = function(msg){
			var uid 

			if(this.uid_free.length) uid = this.uid_free.pop()
			else uid = this.uid++

			if(this.uid > 100){
				// TODO make a promise timeout cleanup
				console.log('Warning, we have an RPC promise leak')
				for(var i = 0;i<100;i++){
					console.log(this.promises[i].msg)
				}
			}

			var resolve, reject
			var prom = new Promise(function(_resolve, _reject){resolve = _resolve, reject = _reject})
			prom.resolve = resolve
			prom.reject = reject
			prom.msg = msg

			this.promises[uid] = prom
			msg.uid = uid

			if(this.sendbus.readyState == 3){
				prom.resolve(null)
				return prom
			}

			this.sendbus.send(msg)

			return prom
		}

		this.resolveResult = function(msg){
			var promise = this.promises[msg.uid]
			if(!promise) return console.log('Error resolving RPC promise id ' + msg.uid)
			this.uid_free.push(msg.uid)
			this.promises[msg.uid] = undefined
			if(msg.error){
				promise.reject(msg.value)
			}
			else{
				promise.resolve(msg.value)
			}
		}
	}
})