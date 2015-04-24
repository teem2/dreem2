/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

define(function(require, exports, module){

	var Node = require("./node")
	var teem = require('./teem')
	var RpcProxy = require('../core/rpcproxy')
	var RpcMulti = require('../core/rpcmulti')

	return Node.extend("screens", function(){
		this.attribute('init', 'event')

		this.rpcDef = function(name, rpcdefs, rpcpromise){
			this.name = name
			this.rpcdefs = {}
			this.rpcpromise = rpcpromise
			// ok we have an init. now what.
			// ok we have children.
			// what do we do with them.
			// we have to put them on our object as RPC multicall interfaces

			// lets pull out the rpcdef
			for(var i = 0; i < this.child.length; i++){
				var child = this.child[i]
				var rpcdef = RpcProxy.createRpcDef(child, Node.prototype)

				rpcdefs[name + '.' + child.name] = rpcdef
				this.rpcdefs[child.name] = rpcdef
				// lets spawn up our own multiset here
				this[child.name] = RpcMulti.createFromDef(rpcdef)
			}
		}

		// this method is used serverside to compute the rpc interface
		this.screenJoin = function(socket){
			var screen_name = socket.url.split('/')[2] || 'default'
			// so how are we going to send this out.
			teem.bus.broadcast({
				type:'rpcJoin',
				component:this.name + '.' + screen_name
			})
			
			// ok so how do we do this
			var myproxy = RpcProxy.createFromDef(this.rpcdefs[screen_name])

			// ok so the reverse
			this[screen_name]._array.push(myproxy)

			// ohboy we have a screen joining!
			// lets fire up an RpcProxy for it with the right name
			// and then we need to broadcast to all the clients that we have a new screen.bla object
			// somehow

		}
	})
})