/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

define(function(require, exports, module){
	// lets return our singleton teem object
	console.log('here')
	var Node = require('./node')

	var teem = Node.singleton('Teem')
	
	if(define.env == 'nodejs'){
		console.log('Teem server module')
		// our teem bus is the local server bus
		define.onMain = function(modules, bus){
			// lets render all modules and store them on the teem tag
			for(var key in modules){
				teem[key] = modules[key]()
				// ok what does this object look like
			}

			bus.onMessage = function(msg, socket){
				// we will get messages from the clients
				if(msg.type == 'connectBrowser'){
					// lets send over our RPC interface
					var rpcs = []
					for(var mod in modules){
						var obj = teem[mod]
						if(obj === teem) continue
						var rpc = {}
						for(var key in obj){
							// create an RPC shim
							if(obj.__lookupGetter__(key)){
								if('on_'+key in obj){
									// forward a getter/setter
									rpc[key] = {type:'attribute'}
									// put a listener on it to monitor value changes on the server
								}
							}
							else{
								var prop = obj[key]
								if(key in Node.prototype) continue
								// check value or method
								if(typeof prop === 'function'){
									rpc[key] = {type:'method'}
								}
								else if(typeof prop !== 'object'){
									rpc[key] = prop
								}
							}
						}
						rpcs.push(rpc)
					}
					socket.send({type:'connectOK', rpcs:rpcs})
				}
			}

			if(teem.init) teem.init()

			return function destroy(){
				// destroy teem modules
			}
		}
	}
	else if(define.env == 'browser'){
		console.log('Teem browser module')
		// web environment
		var BusClient = require('../core/busclient')

		teem.bus = new BusClient(location.pathname)

		define.onMain = function(main){
			teem.bus.send({type:'connectBrowser'})
			teem.bus.onMessage = function(msg){
				if(msg.type == 'connectOK'){
					var rpcs = msg.rpcs
					var iface = {}
					for(var i = 0; i<rpcs.length; i++){
						var obj = rpcs[i]
						for(var key in obj){
							var prop = obj[key]
							if(typeof prop == 'object'){
								if(prop.type == 'method'){

								}
								else if(prop.type == 'attribute'){

								}
							}
							else{
								iface[key] = prop
							}
						}
					}
					main()
				}
			}
		}
	}
	else if(define.env == 'v8'){
		// dali environment
		define.onMain = function(main){
			// ok lets start up

		}
	}

	return teem
})