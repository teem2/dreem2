/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

define(function(require, exports, module){
	// lets return our singleton teem object
	var Node = require('./node')
	var teem = Node.singleton('Teem')
	var RpcProxy = require('../core/rpcproxy')
	var RpcPromise = require('../core/rpcpromise')
	var RpcMulti = require('../core/rpcmulti')

	teem._modules = {}

	teem.toString = function(){
		// lets dump our RPC objects
		var out = 'Teem RPC object:\n'
		for(var key in this){
			if(key in Node.prototype) continue
			out += key +'\n'
		}
		return out
	}

	function verifyRpc(rpcdef, component, prop, kind){
		var def = rpcdef[component]
		if(!def){
			console.log('Illegal RPC call on ' + component)
			return 
		}
		var prop = def[prop]
		if(!prop || prop.kind !== kind)  return console.log('Illegal RPC '+kind+' on '+component+'.'+prop)
	}

	if(define.env == 'nodejs'){
		console.log('Teem server module')
		// our teem bus is the local server bus
		define.onMain = function(moddescs, bus){
			
			var rpcpromise = new RpcPromise(bus)

			teem.bus = bus

			// lets render all modules and store them on the teem tag
			var rpcdef = {}
			for(var i = 0; i<moddescs.length; i++){
				// lets instance all modules
				var moddesc = moddescs[i]
				try{
					// lets store the modules
					var render = require(moddesc.path)
					var mod = teem._modules[moddesc.name] = {
						name: moddesc.name,
						render: render,
						vdom: render()
					}
				}
				catch(e){
					console.error(e.stack + '\x0E')
					return
				}

				// ok so. we have a vdom
				var def = RpcProxy.createRpcDef(mod.vdom, Node.prototype)
				// this is the rpc def for the clients
				rpcdef[mod.name] = def

				// store the vdom object as our main object
				var obj = teem[mod.name] = mod.vdom

				// allow extension of the rpc def with multiples by the class itself
				if(obj.rpcDef) obj.rpcDef(mod.name, rpcdef, rpcpromise)

				if(obj.on_init) obj.on_init.emit()
			}
			// ok now what. well we need to build our RPC interface

			bus.onMessage = function(msg, socket){
				// we will get messages from the clients
				if(msg.type == 'connectBrowser'){
					socket.send({type:'connectBrowserOK', rpcdef: rpcdef})
					if(teem.screens) teem.screens.screenJoin(socket) 
				}
				else if(msg.type == 'rpcAttribute'){
					// validate rpc call against our rpc def to filter out bad calls
					if(!verifyRpc(rpcdef, msg.id, msg.attribute, 'attribute')) return
					// set the value
					teem[msg.id][msg.attribute] = msg.value
				}
				else if(msg.type == 'rpcCall'){
					if(!verifyRpc(rpcdef, msg.id, msg.method, 'method')) return
					// ok lets call the function
					var obj = teem[msg.id]
					var ret = obj[msg.method].call(obj, msg.args)
					if(ret && ret.then){ // its a promise itself so it might be a call to another client.

					}
					else{
						if(!RpcProxy.isJsonSafe(ret)){
							console.log('RPC Return value of '+msg.id+' '+msg.method + ' is not json safe')		
							ret = null
						}
						socket.send({type:'rpcReturn', uid:msg.uid, value:ret})
					}
				}
				else if(msg.type == 'rpcReturn'){
					// we got an rpc return
					rpcpromise.resolveResult(msg)
				}
			}

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
		var rpcpromise = new RpcPromise(teem.bus)

		// lets put teem on window just as  adebuggint tool
		window.teem = teem

		define.onMain = function(main){

			teem.bus.send({type:'connectBrowser'})

			teem.bus.onMessage = function(msg){
				if(msg.type == 'connectBrowserOK'){
					// lets set up our teem.bla base RPC layer (nonmultiples)
					for(var key in msg.rpcdef){
						var def = msg.rpcdef[key]

						if(key.indexOf('.') !== -1){ // its a sub object property
							var parts = key.split('.')
							teem[parts[0]][parts[1]] = RpcMulti.createFromDef(def, key, rpcpromise)
						}
						else{
							teem[key] = RpcProxy.createFromDef(def, key, rpcpromise)
						}
					}
					var proxy = new RpcProxy()

					teem.arduino.connect()

					main()
				}
				else if(msg.type == 'rpcJoin'){
					
				}
				else if(msg.type == 'rpcCall'){
					
				}
				else if (msg.type == 'rpcReturn'){
					rpcpromise.resolveResult(msg)
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