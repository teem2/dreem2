/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

define(function(require, exports, module){

	var Node = require('./node')
	var teem = require('./teem')
	var RpcProxy = require('../core/rpcproxy')
	var RpcMulti = require('../core/rpcmulti')
	var RpcPromise = require('../core/rpcpromise')

	return Node.extend('screens', function(){
		this.attribute('init', 'event')

		this.rpcDef = function(name, rpcdefs, rpcpromise){
			this.name = name
			this.rpcdefs = {}
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
			// ok so how do we do this
			var multi = this[screen_name]
			var index = multi.length++
			// send it the joins for the previous ones to the new one
			for(var i = 0; i<index; i++){
				socket.send({
					index:i,
					type:'rpcJoin',
					rpcid:this.name + '.' + screen_name
				})
			}
			multi._addNewProxy(index, this.name + '.' + screen_name, socket.rpcpromise)

			teem.bus.broadcast({
				index:index,
				type:'rpcJoin',
				rpcid:this.name + '.' + screen_name
			})
		}
	})
})