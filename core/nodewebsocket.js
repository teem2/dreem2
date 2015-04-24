/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

/**
 * @class NodeWebSocket
 * Clean and simple websocket implementation for node
 */

define(function(require, exports, module){
	module.exports = NodeWebSocket
	var crypto = require('crypto')
	/** 
	  * @constructor 
	  * @param {Request} req The node request object to construct from
	  * @param {Socket} socket The socket object to connect to
	  */

	function NodeWebSocket(req, socket){
		var version = req.headers['sec-websocket-version']
		if(version != 13){
			console.log("Incompatible websocket version requested (need 13) " + version)
			return socket.destroy()
		}

		this.socket = socket
		
	 	// calc key
		var key = req.headers['sec-websocket-key']
		var sha1 = crypto.createHash('sha1');
		sha1.update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11");
		var ack = 'HTTP/1.1 101 Switching Protocols\r\n'+
			'Upgrade: websocket\r\n'+
			'Connection: Upgrade\r\n'+
			'Sec-WebSocket-Accept: ' + sha1.digest('base64') +'\r\n\r\n'

		this.socket.write(ack)

		this.max = 100000000 // maximum receive buffer size (10 megs)
		this.header = new Buffer(14) // header
		this.output = new Buffer(10000) // output
		this.state = this.opcode // start in the opcode state
		this.expected = 1 // the bytes expected for the next state
		this.written = 0 // how much we have written in the output buffers
		this.read = 0 // the bytes we've read
		this.input = 0 // the input buffer received from the socket
		this.maskoff = 0 // the offset in the mask
		this.maskcount = 0 // mask counter
		this.paylen = 0 // payload length
		this.readyState = 1
		// 10 second ping frames
		var pf = new Buffer(2)
		pf[0] = 9 | 128
		pf[1] = 0

		this.ping_interval = setInterval(function(){
			if(!this.socket) clearInterval(this.ping_interval)
			else this.socket.write(pf)
		}.bind(this), 10000)		

		// Main socket data loop, uses state function to parse
		this.socket.on('data', function(data){
			this.input = data
			this.read = 0
			while(this.state());
		}.bind(this))

		this.socket.on('close', function(){
			this.close()
		}.bind(this))
	}
	body.call(NodeWebSocket.prototype)

	function body(){
		/** 
		  * @event onMessage 
		  * @param {String} message The incoming message
		  */
		this.onMessage = function(message){
		}

		/** 
		  * @event onClose
		  */
		this.onClose = function(){
		}

		/** 
		  * @event onError
		  * @param {String} error The error
		  */
		this.onError = function(error){
		}

		this.error = function(t){
			console.log("Error on websocket " + t)
			this.onError(t)
			this.close()
		}

		/** 
		  * @method send
		  * Send message on socket
		  * @param {String|Buffer} data Data to send
		  */
		this.send = function(data){
			if(typeof data !== 'string' && !(data instanceof Buffer)) data = JSON.stringify(data)
			if(!this.socket) return
			var head
			var buf = new Buffer(data)
			if(buf.length < 126){
				head = new Buffer(2)
				head[1] = buf.length
			} 
			else if (buf.length<=65535){
				head = new Buffer(4)
				head[1] = 126
				head.writeUInt16BE(buf.length, 2)
			} 
			else {
				head = new Buffer(10)
				head[1] = 127
				head[2] = head[3] = head[4] = head[5] = 0
				head.writeUInt32BE(buf.length, 6)
			}
			head[0] = 128 | 1
			this.socket.write(head)
			this.socket.write(buf)
		}

		/** 
		  * @method close
		  * Close socket
		  */
		this.close = function(){
			if(this.socket){
				this.onClose()
				this.socket.destroy()
				clearInterval(this.ping_interval)
				this.readyState = 3
			}
			this.socket = undefined
		}

		/* Internal head state */
		this.head = function(){
			var se = this.expected
			while(this.expected > 0 && this.read < this.input.length && this.written < this.header.length){
				this.header[this.written++] = this.input[this.read++], this.expected--
			}
			if(this.written > this.header.length) return this.err("unexpected data in header"+ se + s.toString())
			return this.expected != 0
		}

		/* Internal data state */
		this.data = function(){
			while(this.expected > 0 && this.read < this.input.length){
				this.output[this.written++] = this.input[this.read++] ^ this.header[this.maskoff + (this.maskcount++&3)]
				this.expected--
			}
			if(this.expected) return false
			this.onMessage(this.output.toString('utf8', 0, this.written))
			this.expected = 1
			this.written = 0
			this.state = this.opcode
			return true
		}

		/* Internal mask state*/
		this.mask = function(){
			if(this.head()) return false
			if(!this.paylen){
				this.expected = 1
				this.written = 0
				this.state = this.opcode
				return true
			}
			this.maskoff = this.written - 4
			this.written = this.maskcount = 0
			this.expected = this.paylen
			if(this.paylen > this.max) return this.error("buffer size request too large " + l + " > " + max)
			if(this.paylen > this.output.length) this.output = new Buffer(this.paylen)
			this.state = this.data
			return true
		}

		/* Internal len8 state*/
		this.len8 = function(){
			if(this.head()) return false
			this.paylen = this.header.readUInt32BE(this.written - 4)
			this.expected = 4
			this.state = this.mask
			return true
		}

		/* Internal len2 state*/
		this.len2 = function(){
			if(this.head()) return 
			this.paylen = this.header.readUInt16BE(this.written - 2)
			this.expected = 4
			this.state = this.mask
			return true
		}

		/* Internal len1 state*/
		this.len1 = function(){
			if(this.head()) return false
			if(!(this.header[this.written  - 1] & 128)) return this.error("only masked data")
			var type = this.header[this.written - 1] & 127
			if(type < 126){
				this.paylen = type
				this.expected = 4
				this.state = this.mask
			}
			else if(type == 126){
				this.expected = 2
				this.state = this.len2
			}
			else if(type == 127){
				this.expected = 8
				this.state = this.len8
			}
			return true
		}

		/* Internal pong state*/
		this.pong = function(){
			if(this.head()) return false
			if(this.header[this.written - 1] & 128){
				this.expected = 4
				this.paylen = 0
				this.state = this.mask
				return true
			}
			this.expected = 1
			this.written = 0 
			this.state = this.opcode
			return true
		}

		this.opcode = function(){
			if(this.head()) return
			var frame = this.header[0] & 128
			var type = this.header[0] & 15
			if(type == 1){
				if(!frame) return this.error("only final frames supported")
				this.expected = 1
				this.state = this.len1
				return true
			}
			if(type == 8) return this.close()
			if(type == 10){
				this.expected = 1
				this.state = this.pong
				return true
			}
			return this.error("opcode not supported " + t)
		}
	}
})