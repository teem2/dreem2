/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

/**
 * @class BusClient
 * Auto (re)connecting always writable socket
 */

define(function(require, exports, module){

	module.exports = BusClient

	function BusClient(url){
		this.url = url
		this.backoff = 1
		this.reconnect()
	}
	body.call(BusClient.prototype)

	function body(){
		/**
		 * @method disconnect
		 * Disconnect from the server
		 */
		this.disconnect = function(){
			if(this.socket){
				this.socket.onclose = undefined
				this.socket.onerror = undefined
				this.socket.onmessage = undefined
				this.socket.onopen = undefined
				this.socket.close()
				this.socket = undefined
			}
		}

		/* Reconnect to server (used internally and automatically)*/
		this.reconnect = function(){
			this.disconnect()
			if(!this.queue) this.queue = []

			this.socket = new WebSocket('ws://'+location.host)

			this.socket.onopen = function(){
				this.backoff = 1
				for(var i = 0;i<this.queue.length;i++){
					this.socket.send(this.queue[i])
				}
				this.queue = undefined
			}.bind(this)

			this.socket.onerror = function(){
				//this.reconnect()
			}.bind(this)

			this.socket.onclose = function(){
				this.backoff *= 2
				if(this.backoff > 1000) this.backoff = 1000
				setTimeout(function(){
					this.reconnect()
				}.bind(this),this.backoff)
			}.bind(this)

			this.socket.onmessage = function(event){
				var msg = JSON.parse(event.data)
				this.onMessage(msg)
			}.bind(this)
		}

		/**
		 * @method send
		 * Send a message to the server
		 * @param {Object} msg JSON.stringifyable message to send
		 */
		this.send = function(msg){
			msg = JSON.stringify(msg)
			if(this.queue) this.queue.push(msg)
			else this.socket.send(msg)
		}

		/**
		 * @method color
		 * Causes a console.color on the server
		 * @param {String} data Data to send
		 */
		this.color = function(data){
			this.send({type:'color', value:data})
		}

		/**
		 * @method color
		 * Causes a console.log on the server
		 * @param {String} data Data to send
		 */
		this.log = function(data){
			this.send({type:'log', value:data})
		}

		/**
		 * @event onMessage
		 * Called when a message arrives from the server
		 * @param {Object} message The received message
		 */

		this.onMessage = function(message){}
	}
})