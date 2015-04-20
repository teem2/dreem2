/*
 The MIT License (MIT) (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

/**
 * @class BusServer {}
 * Holds a set of server side sockets for broadcast
 */
define(function(require, exports, module){
	module.exports = BusServer

	function BusServer(){
	}

	var self = BusServer.prototype

	/**
	  * @method addWebSocket
	  * adds a WebSocket to the BusServer
	  * @param {WebSocket} sock socket to add
	  */
	self.addWebSocket = function(sock){
		this.sockets.push(sock)

		sock.onEnd = function(){
			self.sockets.splice(self.sockets.indexOf(sock), 1)
			sock.onEnd = undefined
		}.bind(this)

		sock.onMessage = function(message){
			this.onMessage(JSON.parse(message), sock)
		}.bind(this)
	}

	/**
	 * @event onMessage
	 * Called when a new message appears on any of the sockets
	 * @param {Object} message
	 * @param {WebSocket} socket
	 */
	self.onMessage = function(message, socket){
	}

    /** 
      * @method broadcast
      * Send a message to all connected sockets
      * @param {Object} message
      */
	self.broadcast = function(message){
		message = JSON.stringify(message)
		for(var i = 0;i<this.sockets.length;i++){
			this.sockets[i].send(message)
		}
	}
})