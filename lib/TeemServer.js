/*
 The MIT License (MIT) (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

/**
 * @class TeemServer {}
 * Main NodeJS HTTP server with support for WebSockets, static file handling and 
 * Composition objects
 */

define(function(require, exports, module){
	module.exports = TeemServer

	var FileWatcher = require('./FileWatcher')
	var ExternalApps = require('./ExternalApps')
	var BusServer = require('./BusServer')
	var Composition = require('./Composition')
	var NodeWebSocket = require('./NodeWebSocket')	

	var mimeFromFile = require('./mimeFromFile')

	var http = require('http')
	var os = require('os')

	function TeemServer(args, file_root){
		this.compositions = {}
		this.file_root = file_root
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
				file:file.slice(this.file_root.length)
			})
		}.bind(this)

		this.busserver = new BusServer()

		process.on('SIGHUP', function(){
			if(this.args['-close']) this.broadcast({type:'close'})
			if(this.args['-delay']) this.broadcast({type:'delay'})
		}.bind(this))
	}

	var self = TeemServer.prototype

	/** 
	  * @method broadcast
	  * Send a message to all my connected websockets and those on the compositions
	  * @param {Object} msg JSON Serializable message to send
	  */
	self.broadcast = function(msg){
		this.busserver.broadcast(msg)
		for(var k in this.compositions){
			this.compositions[k].busserver.broadcast(msg)
		}
	}

	/** 
	  * @attribute {String} default_comp
	  * Default composition name 
	  */
	self.default_composition = null

	/** 
	  * @method bgetComposition
	  * Find composition object by url 
	  * @param {String} url 
	  * @return {Composition|undefined} 
	  */
	self.getComposition = function(url){
		if(url.indexOf('.')!== -1) return
		var path = url.split('/')
		var name = path[0] || this.default_composition
		if(!this.compositions[name]) this.compositions[name] = new Composition(this.args, this.file_root, name)
		return this.compositions[name]
	}

	/** 
	  * @method upgrade
	  * Handle protocol upgrade to WebSocket
	  * @param {Request} req 
	  * @param {Socket} sock
	  * @param {Object} head 
	  */
	self.upgrade = function(req, sock, head){
		// lets connect the sockets to the app
		var sock = new NodeWebSocket(req, sock, head)

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
	self.request = function(req, res){
		// lets delegate to
		var host = req.headers.host
		var url = req.url
		var composition = this.getComposition(url)

		// if we are a composition request, send it to composition
		if(composition) return composition.request(req, res)

		// otherwise handle as static file
		var file = path.join(this.file_root, req.url)
		fs.stat(file, function(err, stat){
			if(err || !stat.isFile()){
				res.writeHead(403)
				res.end()
				if(url =='/favicon.ico') return
				console.color('~br~Error~y~ '+file+'~~ File not found, returning 403\n')
				return
			}
			var header = {
				"Cache-control":"max-age=0",
				"Content-Type": mimeFromFile(file),
			}
			var stream = fs.createReadStream(file)
			res.writeHead(200, header)
			stream.pipe(res)

			this.watcher.watch(file)
		}.bind(this))
	}
})