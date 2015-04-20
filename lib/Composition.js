/*
 The MIT License (MIT) (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

/**
 * @class Composition {}
 * Holder of the dreem <composition> for the server
 * Manages all iOT objects and the BusServer for each Composition
 */

define(function(require, exports, module){
	module.exports = Composition

	var ExternalApps = require('./ExternalApps')
	var BusServer = require('./BusServer')

	/**
	  * @constructor
	  * @param {Object} args Process arguments
	  * @param {String} file_root File server root
	  * @param {String} name Name of the composition .dre
	  */		 
	function Composition(args, file_root, name){
	 	this.args = args
		this.name = name
		this.file_root = file_root

		this.busserver = new BusServer()

		this.busserver.onMessage = function(msg){
			if(msg.type == 'color'){
				console.color(msg.value)
			}
			if(msg.type == 'log'){
				console.log(msg.value)
			}
			if(msg.type == 'error'){ // lets process some errors
				msg.errors.forEach(function(err){
					if(err.path) err.path = file_root + err.path
				}.bind(this))
				this.showErrors(msg.errors, 'Client')
			}
		}.bind(this)

		this.watcher = new FileWatcher()
		this.watcher.onChange = function(){
			// lets reload this app
			this.onChange()
		}.bind(this)
	}

	var self = Composition.prototype

	/**
      * @method showErrors
      * Shows error array and responds with notifications/opening editors
      * @param {Array} errors
      * @param {String} prefix Output prefix
      */
	self.showErrors = function(errors, prefix){
		var w = 0
		errors.forEach(function(err){
			console.color("~br~"+prefix+" Error ~y~" + err.path + "~bg~" + (err.line!==undefined?":"+ err.line + (err.col?":" + err.col:""):"")+"~~ "+err.message+"\n")
			if(!err.path) w++
		})
		if(!errors[w]) return
		if(this.args['-notify']){
			Spawner.notify('Exception',errors[w].message)
		}
		if(this.args['-edit']){
			if(fs.existsSync(errors[w].path))
				ExternalApps.editor(errors[w].path, errors[w].line, errors[w].col - 1)
		}
	}

	/**
	  * @event onChange
	  * Called when any of the dependent files change for this composition
	  */
	self.onChange = function(){
	}


	/**
	  * @method reload
	  * Reloads the composition and gives callback with either errors or resulting package
	  * @param {Function} callback(error, package)
	  */
    self.reload = function(callback){
		
		var compiler = new dr.Compiler()

		compiler.onRead = function(name, callback){
			if(name.indexOf('.') === -1) name += ".dre"
			var full_path = path.join(this.file_root, name) 

			fs.readFile(full_path, function(err, data){
				if(err) return callback(err)

				this.watcher.watch(full_path)

				return callback(null, data, full_path)
			}.bind(this))
		}.bind(this)

		if(this.name === null) return callback(null,null)

		compiler.execute(this.name, function(err, pkg){
			if(err){
				if(!Array.isArray(err)) err = [err]
				this.showErrors(err, 'Server')
				callback(err)
			}
			else callback(null, pkg)
		}.bind(this))
	}

    /**
      * @method request
      * Handle server request for this Composition
      * @param {Request} req
	  * @param {Response} res
      */
	self.request = function(req, res){
		var app = req.url.split('/')[1] || 'default'
		// ok so, we need to serve the right view.
		res.write('HI')
		res.end()
	}
})