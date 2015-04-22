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
	var dreem_compiler = require('./dreemcompiler')

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
				this.showErrors(msg.errors)
			}
		}.bind(this)

		this.watcher = new FileWatcher()
		this.watcher.onChange = function(){
			// lets reload this app
			this.reload()
		}.bind(this)

		this.objects = {}
		// lets compile and run the dreem composition
		define.onRequire = function(file){
			this.watcher.watch(file)
		}.bind(this)

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
		this.showErrors = function(errors, filepath, source){
			var w = 0
			if(!Array.isArray(errors)) errors = [errors]
			errors.forEach(function(err){
				err.expand(filepath, source)
				console.color("~br~ Error ~y~" + err.path + "~bg~" + (err.line!==undefined?":"+ err.line + (err.col?":" + err.col:""):"")+"~~ "+err.message+"\n")
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
	    	for(var key in this.objects){
	    		obj = this.objects[key]
	    		if(obj.destroy) obj.destroy()
	    	}
	    	this.objects = {}
	    }

	    this.parseDreSync = function(full_path, errors){
	    	// read our composition file
	    	try{
				var data = fs.readFileSync(full_path)
			} 
			catch(e){
				errors.push(new DreemError(e.toString()))
				return
			}
			// watch it
			this.watcher.watch(full_path)
			
			// and then showErrors
			var htmlParser = new HTMLParser()
			var source = data.toString()
			var jsobj = htmlParser.parse(source)

			// forward the parser errors 
			if(htmlParser.errors.length){
				var err = htmlParser.errors.map(function(e){
					errors.push(new DreemError(e.message, e.where))
				})
			}

			jsobj.source = source

			return jsobj
	    }

	    this.makeLocalDeps = function(deps, compfile, indent, errors){
	    	var out = ''
	    	for(var key in deps){
				var incpath
				if(compfile && key in this.local_classes) incpath = './' + compfile + '.dre.' + key + '.js'
				else{
					// lets check if the file has a .dre file, ifso lets compile it sync.
					var base = this.file_root + '/classes/' 
					var drefile = base + key + '.dre'
					var jsfile =  base + key + '.js'

					if(fs.existsSync(drefile) && !this.compile_once[drefile]){
						this.compile_once[drefile] = 1
						// lets parse and compile this dre file
						var local_err = []
						var jsxml = this.parseDreSync(drefile, local_err)
						if(jsxml && jsxml.child[0]){ // lets output this class
							this.compileAndWriteDre(jsxml.child[0], base, null, local_err)
						}
						if(local_err.length){
							this.showErrors(local_err, drefile, jsxml.source)
						}
					}
					incpath = '../classes/' + key 
				}
				out += indent + 'var ' + key + ' = require("' + incpath + '")\n'
			}
			return out
	    }

	    /* Internal, compiles and writes dre .js class */
	    this.compileAndWriteDre = function(jsxml, base, filename, errors){

	    	var js = dreem_compiler.compileClass(jsxml, errors)
	    	if(!js) return
			// write out our composition classes
			var out = 'define(function(require, exports, module){\n' 
			out += this.makeLocalDeps(js.deps, filename, '\t', errors)
			out += '\treturn ' + js.body + '\n})'
			try{
				fs.writeFileSync(base + js.name + '.js', out)
			}
			catch(e){
				errors.push(new DreemError(e.toString()))
			}
			return js.name
	    }

		/* Internal, reloads the composition */
	    this.reload = function(){
			this.destroy()
			this.local_classes = {}
			this.compile_once = {}
			this.devices = {}

			// lets clear our module cache
			require.clearCache()

			var filepath = path.join(this.file_root, this.name) + '.dre'
			var errors = []

			var dre = this.parseDreSync(filepath, errors)
			if(errors.length) return this.showErrors(errors, filepath, dre && dre.source)

			// lets walk the XML and spawn up our composition objects.
			var root = dre.child[0]
			if(root.tag != 'composition') return this.showErrors(new DreemError('Root tag is not composition', root.pos), filepath, dre.source)

			for(var i = 0, children = root.child, len = children.length; i<len; i++){
				var child = children[i]
				// ok lets spawn up our tags into our local object pool.
				var tag = child.tag
				if(tag == 'classes'){ // generate local classes
					// lets compile our local classes
					for(var j = 0, classes = child.child, clen = classes.length; j<clen; j++){
						var cls = classes[j]
						var name = this.compileAndWriteDre(classes[j], filepath + '.', this.name,  errors)
						this.local_classes[name] = 1
					}
					continue
				}
				// lets compile the JS
				var js = dreem_compiler.compileInstance(child, errors, '\t\t')
				
				// ok now the instances..
				var out = 'define(function(require, exports, module){\n' 
				out += this.makeLocalDeps(js.deps, this.name, '\t', errors)
				out += '\treturn function(){\n\t\treturn ' + js.body + '\n\t}\n})'

				var component = filepath + '.' + js.tag + '.' + js.id + '.js'
				fs.writeFileSync(component, out)

				if(js.tag == 'device'){
					this.devices[js.id] = component
				}
				else{ // load it up in the server env
					var render = require(component)
					if(render){
						var obj = this.objects[js.id] = render()
					}
				}

				if(errors.length) return this.showErrors(errors, filepath, dre.source)
			}
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