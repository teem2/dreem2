/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

define(function(require, exports, module){

	var Node = require('$CLASSES/node')
	var teem = require('$CLASSES/teem')
	var RpcProxy = require('$CORE/rpcproxy')
	var RpcMulti = require('$CORE/rpcmulti')
	var RpcPromise = require('$CORE/rpcpromise')

	return Node.extend('screens', function(){
		this.attribute('init', 'event')

		this.init = function(){
			// lets put our multi children on ourselves
			for(var i = 0; i < this.child.length; i++){
				var child = this.child[i]
				var rpcdef = RpcProxy.createRpcDef(child, Node)
				this[child.name] = RpcMulti.createFromDef(rpcdef)
			}
		}

		this.hideProperty('rpcDef')
	})
})