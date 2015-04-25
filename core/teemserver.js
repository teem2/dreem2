/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

/**
 * @class TeemServer {}
 * Main NodeJS HTTP server with support for WebSockets, static file handling and 
 * Composition objects
 */

define(function(require, exports, module){
	module.exports = TeemServer

	var http = require('http')
	var os = require('os')
	var path = require('path')
	var fs = require('fs')

	var FileWatcher = require('./filewatcher')
	var ExternalApps = require('./externalapps')
	var BusServer = require('./busserver')
	var CompositionServer = require('./compositionserver')
	var NodeWebSocket = require('./nodewebsocket')
	var mimeFromFile = require('./mimefromfile')

	/**
	  * @constructor
	  */
	function TeemServer(args){
		this.compositions = {}

		this.args = args
		var port = this.args['-port'] || 8080
		var iface = this.args['-iface'] || '0.0.0.0'

		this.server = http.createServer(this.request.bind(this))
		this.server.listen(port, iface)
		this.server.on('upgrade', this.upgrade.bind(this))

		if(iface == '0.0.0.0'){
			var ifaces = os.networkInterfaces()
			var txt = ''
			Object.keys(ifaces).forEach( function(ifname){
				var alias = 0;
				ifaces[ifname].forEach( function(iface){
					if ('IPv4' !== iface.family ) return
					var addr = 'http://' + iface.address + ':' + port + '/'
					if(!this.address) this.address = addr
					txt += ' ~~on ~c~'+addr
				}.bind(this))
			}.bind(this))
			console.color('Server running' + txt+'~~ Ready to go!\n')
		}
		else {
			this.address = 'http://' + iface + ':' + port + '/' 
			console.color('Server running on ~c~' + this.address+"~~\n")
		}
		// use the browser spawner
		var browser = this.args['-browser']
		if(browser && (!this.args['-delay'] || this.args['-count'] ==0 )){
			ExternalApps.browser(this.address + (browser===true?'':browser), this.args['-devtools'])
		}

		this.watcher = new FileWatcher()
		this.watcher.onChange = function(file){
			if(!args['-nodreem'] && file.indexOf('dreem.js') !== -1){
				return this.broadcast({type:'delay'})
			}
			this.broadcast({
				type:'filechange',
				file: file
			})
		}.bind(this)

		this.busserver = new BusServer()

		process.on('SIGHUP', function(){
			if(this.args['-close']) this.broadcast({type:'close'})
			if(this.args['-delay']) this.broadcast({type:'delay'})
		}.bind(this))

		if(this.args['-web']) this.getComposition(this.args['-web'])
	}
	body.call(TeemServer.prototype)

	function body(){
		this.COMP_DIR = 'compositions'
		/** 
		  * @method broadcast
		  * Send a message to all my connected websockets and those on the compositions
		  * @param {Object} msg JSON Serializable message to send
		  */
		this.broadcast = function(msg){
			this.busserver.broadcast(msg)
			for(var k in this.compositions){
				this.compositions[k].busserver.broadcast(msg)
			}
		}

		/** 
		  * @attribute {String} default_comp
		  * Default composition name 
		  */
		this.default_composition = null

		/** 
		  * @method bgetComposition
		  * Find composition object by url 
		  * @param {String} url 
		  * @return {Composition|undefined} 
		  */
		this.getComposition = function(url){
			if(url.indexOf('.')!== -1) return
			var path = url.split('/')
			var name = path[1] || path[0] || this.default_composition
			if(!name) return
			if(!this.compositions[name]) this.compositions[name] = new CompositionServer(this.args, name, this)
			return this.compositions[name]
		}

		/** 
		  * @method upgrade
		  * Handle protocol upgrade to WebSocket
		  * @param {Request} req 
		  * @param {Socket} sock
		  * @param {Object} head 
		  */
		this.upgrade = function(req, sock, head){
			// lets connect the sockets to the app
			var sock = new NodeWebSocket(req, sock, head)
			sock.url = req.url
			var composition = this.getComposition(req.url)
			if(!composition) this.busserver.addWebSocket(sock)
			else composition.busserver.addWebSocket(sock)
		}

		/**
		  * @method request
		  * Handle main http server request
		  * @param {Request} req 
		  * @param {Response} res
		  */
		this.request = function(req, res){
			// lets delegate to
			var host = req.headers.host
			var url = req.url
			var composition = this.getComposition(url)

			// if we are a composition request, send it to composition
			if(composition) return composition.request(req, res)

			// otherwise handle as static file
			var url = req.url
			if(url.indexOf('_lib_') != -1){
				var file = url.replace(/\_lib\_/,define.expandVariables(define.LIB))
			}
			else{
				var file = path.join(define.expandVariables(define.ROOT), req.url)
			}

			fs.stat(file, function(err, stat){
				if(err || !stat.isFile()){
					if(url =='/favicon.ico'){
						res.writeHead(200)
						res.end()
						return
					}
					res.writeHead(404)
					res.end()
					console.color('~br~Error~y~ '+file+'~~ File not found, returning 403\n')
					return
				}

				var header = {
					"Cache-control":"max-age=0",
					"Content-Type": mimeFromFile(file),
					"ETag": stat.mtime.getTime()+'_'+stat.ctime.getTime()+'_'+stat.size
				}
	
				this.watcher.watch(file)
	
				if( req.headers['if-none-match'] == header.ETag){
					res.writeHead(304,header)
					res.end()
					return 
				}

				var stream = fs.createReadStream(file)
				res.writeHead(200, header)
				stream.pipe(res)
				// ok so we get a filechange right?
				
			}.bind(this))
		}
	}
})