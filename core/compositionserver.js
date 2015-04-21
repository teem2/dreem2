/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

/**
 * @class Composition {}
 * Holder of the dreem <composition> for the server
 * Manages all iOT objects and the BusServer for each Composition
 */

define(function(require, exports, module){
	module.exports = CompositionServer

	var path = require('path')
	var fs = require('fs')

	var ExternalApps = require('./externalapps')
	var BusServer = require('./busserver')
	var FileWatcher = require('./filewatcher')
	var HTMLParser = require('./htmlparser')
	var DreemError = require('./dreemerror')

	/**
	  * @constructor
	  * @param {Object} args Process arguments
	  * @param {String} file_root File server root
	  * @param {String} name Name of the composition .dre
	  */
	function CompositionServer(args, file_root, name){
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
			this.reload()
		}.bind(this)

		// lets compile and run the dreem composition
		this.reload()
	}
	body.call(CompositionServer.prototype)

	function body(){

		/**
	      * @method showErrors
	      * Shows error array and responds with notifications/opening editors
	      * @param {Array} errors
	      * @param {String} prefix Output prefix
	      */
		this.showErrors = function(errors, prefix){
			var w = 0
			if(!Array.isArray(errors)) errors = [errors]
			errors.forEach(function(err){
				console.color("~br~"+prefix+" Error ~y~" + err.path + "~bg~" + (err.line!==undefined?":"+ err.line + (err.col?":" + err.col:""):"")+"~~ "+err.message+"\n")
				if(!err.path) w++
			})
			if(!errors[w]) return
			if(this.args['-notify']){
				ExternalApps.notify('Exception',errors[w].message)
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
		this.onChange = function(){
		}

		/**
		  * @method destroy
		  * Destroys all objects maintained by the composition
		  * @param {Function} callback(error, package)
		  */
	    this.destroy = function(){
	    }

	    this.parseComposition = function(name, callback){
	    	// read our composition file
			var full_path = path.join(this.file_root, name) + '.dre'
			fs.readFile(full_path, function(err, data){

				if(err){
					console.log('Error reading '+err)
					return
				}

				// lets run the HTML Parser
				this.watcher.watch(full_path)
				
				// and then showErrors
				var htmlParser = new HTMLParser()
				var source = data.toString()
				var jsobj = htmlParser.parse(source)

				var errors

				// forward the parser errors 
				if(htmlParser.errors.length){
					errors = []
					var err = htmlParser.errors.map(function(e){
						// lets make some errors.
						var where = htmlParser.offsetToLineCol(source, e.where)
						errors.push(new DreemError(e.message, full_path, where.line+1, where.col+1))
					})
				}

				if(errors) return callback(errors)

				// success, return the parsed XML
				return callback(null, jsobj, full_path, source)
			}.bind(this))
	    }

	    this.showError = function(message, path, source, offset){
	    	 var where = HTMLParser.offsetToLineCol(source, offset)
	    	 return this.showErrors(new DreemError(message, path, where.line+1, where.col + 1))
	    }

		/* Internal, reloads the composition */
	    this.reload = function(){
			this.destroy()

			this.parseComposition(this.name, function(errors, jsobj, path, source){
				if(errors) return this.showErrors(errors, 'Server')
				
				// lets walk the XML and spawn up our composition objects.
				var root = jsobj.child[0]
				if(root.tag != 'composition') return this.showError('Root tag is not Composition', path, source, root._)

				for(var i = 0, children = root.child, len = children.length; i<len; i++){
					var child = children[i]

					console.log(child.tag)

				}

			}.bind(this))
		}

	    /**
	      * @method request
	      * Handle server request for this Composition
	      * @param {Request} req
		  * @param {Response} res
	      */
		this.request = function(req, res){
			var app = req.url.split('/')[1] || 'default'

			// ok lets serve our Composition device 

			res.end()
		}
	}
})