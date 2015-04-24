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

	teem.destroy = function(){
		for(var key in teem){
			prop = teem[key]
			if(typeof prop == 'object' && prop !== teem && prop.destroy && typeof prop.destroy == 'function'){
				prop.destroy()
			}
		}
	}

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
		// lets rip off the array index
		var def = rpcdef[component]
		if(!def){
			console.log('Illegal RPC '+kind+' on ' + component)
			return false
		}
		var prop = def[prop]
		if(!prop || prop.kind !== kind){
			console.log('Illegal RPC '+kind+' on '+component+'.'+prop)
			return false
		}
		return true
	}

	if(define.env == 'nodejs'){
		console.log('Teem server module started')
		// our teem bus is the local server bus
		define.onMain = function(moddescs, bus){
			
			var rpcpromise = new RpcPromise(bus)

			teem.bus = bus
			
			teem.session = Math.random()*10000000

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

			bus.onConnect = function(socket){
				socket.send({type:'sessionCheck', session:teem.session})
			}

			bus.onMessage = function(msg, socket){
				// we will get messages from the clients
				if(msg.type == 'connectBrowser'){
					socket.send({type:'connectBrowserOK', rpcdef: rpcdef})
					// ok we have to send it all historic joins.
					socket.rpcpromise = new RpcPromise(socket)

					if(teem.screens) teem.screens.screenJoin(socket)
				}
				else if(msg.type == 'rpcAttribute'){
					// validate rpc call against our rpc def to filter out bad calls
					if(!verifyRpc(rpcdef, msg.id, msg.attribute, 'attribute')) return
					// set the value
					teem[msg.id][msg.attribute] = msg.value
				}
				else if(msg.type == 'rpcCall'){
					var idx = msg.id.split('[')
					var id = idx[0]

					if(!verifyRpc(rpcdef, id, msg.method, 'method')) return

					// its a object.sub[0] call
					if(id.indexOf('.') != -1){
						var part = id.split('.')
						var obj = teem[part[0]][part[1]]
						if(idx[1]) obj = obj[idx[1].slice(0,-1)]
					}
					else var obj = teem[id]

					// ok lets call the function
					var ret = obj[msg.method].apply(obj, msg.args)
					if(ret && ret.then){ // make the promise resolve to a socket send
						ret.then(function(result){
							socket.send({type:'rpcReturn', uid:msg.uid, value:result})
						}).catch(function(error){
							teem.bus.send({type:'rpcReturn', uid:msg.uid, value:error, error:1})
						})
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
					socket.rpcpromise.resolveResult(msg)
				}
			}

			return function destroy(){
				// destroy teem modules
			}
		}
	}
	else if(define.env == 'browser'){
		console.log('Teem browser module started')
		// web environment
		var BusClient = require('../core/busclient')

		teem.bus = new BusClient(location.pathname)
		var rpcpromise = new RpcPromise(teem.bus)

		// lets put teem on window just as  adebuggint tool
		window.teem = teem

		define.onMain = function(main){

			teem.bus.onMessage = function(msg){
				if(msg.type == 'sessionCheck'){
					if(teem.session != msg.session){
						teem.bus.send({type:'connectBrowser'})
					}
				}
				else if(msg.type == 'connectBrowserOK'){
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

					teem.root = main()

					console.log(teem.root)

					teem.root.on_init.emit()
				}
				else if(msg.type == 'rpcJoin'){
					var parts = msg.component.split('.')
					var multi = teem[parts[0]][parts[1]]
					multi._addNewProxy(msg.index, msg.component, rpcpromise)
				}
				else if(msg.type == 'rpcAttribute'){
					// validate rpc call against our rpc def to filter out bad calls
					if(!teem.root[msg.attribute]){
						return console.log('Rpc call received on nonexisting method ' + msg.method)
					}
					// set the value
					teem.root[msg.attribute] = msg.value
				}
				else if(msg.type == 'rpcCall'){
					// lets call our method on root.
					if(!teem.root[msg.method]){
						return console.log('Rpc call received on nonexisting method ' + msg.method)
					}
					var ret = teem.root[msg.method].apply(teem.root, msg.args)
					if(ret && ret.then){ // make the promise resolve to a socket send
						ret.then(function(result){
							teem.bus.send({type:'rpcReturn', uid:msg.uid, value:result})
						}).catch(function(error){
							teem.bus.send({type:'rpcReturn', uid:msg.uid, value:error, error:1})
						})
					}
					else{
						if(!RpcProxy.isJsonSafe(ret)){
							console.log('RPC Return value of '+msg.id+' '+msg.method + ' is not json safe')		
							ret = null
						}
						teem.bus.send({type:'rpcReturn', uid:msg.uid, value:ret})
					}
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