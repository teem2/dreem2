/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

/**
 * @class DaliGen
 * Class to create dali JS app (testing)
 */

define(function(require, exports, module){
	module.exports = DaliClient
	
	var http = require('http')
	var url = require('url')

	var NodeWebSocket = require('./nodewebsocket')

	// lets monitor all our dependencies and terminate if they change
	function DaliClient(args){
		this.args = args
		this.url = url.parse(
			args['-dali'] === true? 'http://127.0.0.1:8080/uitest/dali': args['-dali']
		)
		console.log("DaliClient connecting to " + this.url.toString())
		this.reconnect()
	}

	body.call(DaliClient.prototype)

	function body(){
		// connect to server
		this.reconnect = function(){
			// lets fetch the main thing
			http.get({
				host: this.url.hostname,
				port: this.url.port,
				path: this.url.path
			}, function(res){
				var data = ''
				res.on('data', function(buf){ data += buf })
				res.on('end', function(){
					console.log(data)
				})
			})
			// put up websocket.
			
		}
	}
})