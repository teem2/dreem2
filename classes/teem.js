/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

define(function(require, exports, module){
	// lets return our singleton teem object
	var Node = require('$CLASSES/node')

	var teem = Node.singleton('Teem')

	var RpcProxy = require('$CORE/rpcproxy')
	var RpcPromise = require('$CORE/rpcpromise')
	var RpcMulti = require('$CORE/rpcmulti')
	var Renderer = require('$CORE/renderer')
	var WebRTC = require('$CORE/webrtc')

	teem.destroy = function(){
		for(var key in teem){
			prop = teem[key]
			if(typeof prop == 'object' && prop !== teem && prop.destroy && typeof prop.destroy == 'function'){
				prop.destroy()
			}
		}
		for(var i = 0;i<teem._intervals.length;i++){
			clearInterval(teem._intervals[i])
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

	teem._intervals = []

	teem.setInterval = function(cb, timeout){
		var id = setInterval(cb, timeout)
		teem._intervals.push(id)
		return id
	}

	teem.clearInterval = function(id){
		var i = teem._intervals.indexOf(id)
		if(i != -1) teem._intervals.splice(i,1)
		clearInterval(id)
	}

	if(define.env == 'nodejs'){
		console.log('Teem server module started')
		// our teem bus is the local server bus
		define.onMain = function(descs, bus){

			teem.bus = bus

			teem.session = '' + Math.random()*10000000

			// lets spawn up all modules!
			for(var i = 0; i<descs.length; i++){
				// lets instance all modules
				var desc = descs[i]
				try{
					// lets store the modules
					var render = require(desc.path)
					var jsonml = render()
					// lets call our constructor with our lisp arguments
					obj = teem[desc.name] = Node.createFromJSONML(jsonml)
					// bus bind our attributes
					if(obj.on_init) obj.on_init.emit()
					RpcProxy.bindSetAttribute(obj, desc.name, bus)
				}
				catch(e){
					console.error(e.stack + '\x0E')
					return
				}
			}
			
			// ok now what. well we need to build our RPC interface
			teem.postAPI = function(msg, response){
				if(msg.type == 'attribute'){
					var obj = RpcProxy.decodeRpcID(teem, msg.rpcid)
					if(obj) obj[msg.attribute] = msg.value
					response.send({type:'return',value:'OK'})
				}
				else if(msg.type == 'method'){
					var obj = RpcProxy.decodeRpcID(teem, msg.rpcid)
					if(obj) RpcProxy.handleCall(obj, msg, response)
				}
				else response.send({type:'error', value:'please set type to rpcAttribute or rpcCall'})
			}

			bus.broadcast({type:'sessionCheck', session:teem.session})

			bus.onConnect = function(socket){
				socket.send({type:'sessionCheck', session:teem.session})
			}

			bus.onMessage = function(msg, socket){

				// we will get messages from the clients
				if(msg.type == 'connectBrowser'){

					// lets process the entire teem object for RPC interfaces
					var rpcdefs = RpcProxy.createRpcDefs(teem, Node)
					// ok so lets op a webrtc components
					//console.log(rpcdefs)
					if(teem.screens){
						var screen_name = socket.url.split('/')[2] || 'default'
						// instance a screen rpc interface
						var rpcid = 'screens.' + screen_name
						var multi = teem.screens[screen_name]
						var index = multi.length++
						multi.createIndex(index, rpcid, socket.rpcpromise)
						socket.send({type:'connectBrowserOK', rpcdef: rpcdefs, index:index})
						socket.rpcpromise = new RpcPromise(socket)
						teem.bus.broadcast({
							index: index,
							type: 'join',
							rpcid: rpcid
						})
					}
				}
				else if(msg.type == 'attribute'){
					var obj = RpcProxy.decodeRpcID(teem, msg.rpcid)
					if(obj) obj[msg.attribute] = msg.value
				}
				else if(msg.type == 'method'){
					var obj = RpcProxy.decodeRpcID(teem, msg.rpcid)
					if(obj) RpcProxy.handleCall(obj, msg, socket)
				}
				else if(msg.type == 'return'){
					// we got an rpc return
					socket.rpcpromise.resolveResult(msg)
				}
				else if(msg.type == 'webrtcOffer'){ bus.broadcast(msg) }
				else if(msg.type == 'webrtcAnswer'){ bus.broadcast(msg) }
				else if(msg.type == 'webrtcOfferCandidate'){ bus.broadcast(msg) }
				else if(msg.type == 'webrtcAnswerCandidate'){ bus.broadcast(msg) }
			}

			return function destroy(){
				// destroy teem modules
			}
		}
	}
	else if(define.env == 'browser'){
		console.log('Teem browser module started')

		// web environment
		var BusClient = require('$CORE/busclient')

		teem.bus = new BusClient(location.pathname)
		var rpcpromise = new RpcPromise(teem.bus)
		var renderer = new Renderer()

		// lets put teem on window just as  adebuggint tool
		window.teem = teem

		define.onMain = function(main){
			teem.bus.onMessage = function(msg){
				if(msg.type == 'sessionCheck'){
					if(teem.session) location.href = location.href
					if(teem.session != msg.session){
						teem.bus.send({type:'connectBrowser'})
					}
				}
				else if(msg.type == 'webrtcOffer'){
					if(msg.index != teem.index){ // we got a webrtcOffer
						teem.webrtc_answer = WebRTC.acceptOffer(msg.offer)
						teem.webrtc_answer.onIceCandidate = function(candidate){
							//console.log('sending answer candidate')
							teem.bus.send({type:'webrtcAnswerCandidate', candidate:candidate, index: teem.index})
						}
						teem.webrtc_answer.onAnswer = function(answer){
							//console.log('sending answer')
							teem.bus.send({type:'webrtcAnswer', answer:answer, index: teem.index})
						}
						teem.webrtc_answer.onMessage = teem.webrtc_offer.onMessage
					}
				}
				else if(msg.type == 'webrtcAnswer'){
					if(teem.webrtc_offer && msg.index != teem.index){
						//console.log('accepting answer')
						teem.webrtc_offer.acceptAnswer(msg.answer)
					}
				}
				else if(msg.type == 'webrtcAnswerCandidate'){
					if(teem.webrtc_offer && msg.index != teem.index){
						//console.log('adding answer candidate')
						teem.webrtc_offer.addCandidate(msg.candidate)
					}
				}
				else if(msg.type == 'webrtcOfferCandidate'){
					if(teem.webrtc_answer && msg.index != teem.index){
						//console.log('adding offer candidate')
						teem.webrtc_answer.addCandidate(msg.candidate)
					}
				}
				else if(msg.type == 'connectBrowserOK'){
					RpcProxy.createFromDefs(msg.rpcdef, teem, rpcpromise)

					teem.webrtc_offer = WebRTC.createOffer()
					teem.index = msg.index

					teem.webrtc_offer.onIceCandidate = function(candidate){
						teem.bus.send({type:'webrtcCandidate', candidate:candidate, index: teem.index})
					}

					teem.webrtc_offer.onOffer = function(offer){
						teem.bus.send({type:'webrtcOffer', offer:offer, index: teem.index})
					}

					var root_jsonml = main()

					if(root_jsonml[1].legacy){
						// lets boot up the legacy
						/*
						var dreemParser = require('$LIB/dr/dreemParser.js')
						var dreemMaker = require('$LIB/dr/dreemMaker.js')
						var compiler = new dreemParser.Compiler()
						compiler.execute(main.dre, main.classmap, function(error, pkg){
							if(error){
								for(var i = 0;i < error.length; i++){
									console.log(error[i].toString())
								}
							}
							else dreemMaker.makeFromPackage(pkg)
						})*/
					}
					else{
						// ok so how do we render?
						var redrawing = 0
						var count = 0
						function redraw(){
							document.body.innerHTML = ''
							redrawing = false

							if(teem.drawroot){
								renderer.destroy(teem.drawroot)
							}
	
							var objroot = Node.createFromJSONML(root_jsonml)

							var drawroot = renderer.render(objroot, {}, {teem:teem}, function(count){
								if(!redrawing) window.requestAnimationFrame(redraw)
								redrawing = true
							}.bind(null, count++))

							renderer.spawn(drawroot, {dom_node:document.body})

							if(!teem.drawroot) var init = true

							teem.drawroot = drawroot
							teem.objroot = objroot
							if(init) teem.objroot.on_init.emit()
						}
						redraw()
					}
				}
				else if(msg.type == 'join'){
					var obj = RpcProxy.decodeRpcID(teem, msg.rpcid)
					if(!obj) console.log('Cannot find '+msg.rpcid+' on join')
					else obj.createIndex(msg.index, msg.rpcid, rpcpromise)
				}
				else if(msg.type == 'attribute'){
				//	console.log(msg);
					var obj = RpcProxy.decodeRpcID(teem, msg.rpcid)
					if(obj) obj[msg.attribute] = msg.value
				}
				else if(msg.type == 'method'){
					// lets call our method on root.
					if(!teem.root[msg.method]){
						return console.log('Rpc call received on nonexisting method ' + msg.method)
					}
					RpcProxy.handleCall(teem.root, msg, teem.bus)
				}
				else if (msg.type == 'return'){
					rpcpromise.resolveResult(msg)
				}
			}
		}
	}
	else if(define.env == 'v8'){
		// dali environment
		define.onMain = function(main){
			// ok lets start up
/*
			var dreemParser = require('$LIB/dr/dreemParser.js')
			var dreemMaker = require('$LIB/dr/dreemMaker.js')
			var compiler = new dreemParser.Compiler()
			compiler.execute(main.dre, main.classmap, function(error, pkg) {
				if(error){
					for(var i = 0;i<error.length;i++){
						console.log(error[i].toString())
					}
				}
				else dreemMaker.makeFromPackage(pkg)
			})
*/
		}
	}

	return teem
})