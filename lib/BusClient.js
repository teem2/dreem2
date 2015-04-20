/*
 The MIT License (MIT)

 Copyright ( c ) 2014-2015 Teem2 LLC

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

Dreem client/server communication bus.
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

	var self = BusClient.prototype

	/**
	 * @method disconnect
	 * Disconnect from the server
	 */
	self.disconnect = function(){
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
	self.reconnect = function(){
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
	self.send = function(msg){
		msg = JSON.stringify(msg)
		if(this.queue) this.queue.push(msg)
		else this.socket.send(msg)
	}

	/**
	 * @method color
	 * Causes a console.color on the server
	 * @param {String} data Data to send
	 */
	self.color = function(data){
		this.send({type:'color', value:data})
	}

	/**
	 * @method color
	 * Causes a console.log on the server
	 * @param {String} data Data to send
	 */
	self.log = function(data){
		this.send({type:'log', value:data})
	}

	/**
	 * @event onMessage
	 * Called when a message arrives from the server
	 * @param {Object} message The received message
	 */

	self.onMessage = function(message){}
})