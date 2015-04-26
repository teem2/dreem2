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
	function CompositionServer(args, name, teemserver){
		this.teemserver = teemserver
	 	this.args = args
		this.name = name

		this.busserver = new BusServer()
		/*
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
		}.bind(this)*/

		this.watcher = new FileWatcher()
		this.watcher.onChange = function(){
			// lets reload this app
			this.reload()
		}.bind(this)

		this.components = {}
		// lets compile and run the dreem composition
		define.onRequire = function(filename){
			// lets output to the main watcher
			process.stderr.write('\x0F!'+filename+'\n', function(){})
			this.watcher.watch(filename)
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
				err.expand(define.expandVariables(filepath), source)
				console.color("~br~ Error ~y~" + err.path + "~bg~" + (err.line!==undefined?":"+ err.line + (err.col?":" + err.col:""):"")+"~~ "+err.message+"\n")
				if(!err.path) w++
			})
			if(!errors[w]) return
			if(this.args['-notify']){
				ExternalApps.notify('Exception',errors[w].message)
			}
			if(this.args['-edit']){
				if(fs.existsSync(errors[w].path)){
					ExternalApps.editor(errors[w].path, errors[w].line, errors[w].col - 1)
				}
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
	    	if(this.myteem && this.myteem.destroy) this.myteem.destroy()
	    	this.myteem = undefined
	    }

	    this.parseDreSync = function(drefile, errors){
	    	// read our composition file
	    	try{
				var data = fs.readFileSync(define.expandVariables(drefile))
			} 
			catch(e){
				errors.push(new DreemError(e.toString()))
				return
			}
			// watch it
			this.watcher.watch(drefile)
			
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

	    this.lookupDep = function(classname, compname, errors){
			if(classname in this.local_classes){
				// lets scan the -project subdirectories
				return '$BUILD/compositions.' + compname + '.dre.' + classname + '.js'
			}

			try{
				var dir = fs.readdirSync(define.expandVariables(define.EXTLIB))
				var paths = []
				dir.forEach(function(value){
					paths.push('$EXTLIB/' + value)
					paths.push('$EXTLIB/' + value + '/classes')
				})
			}
			catch(e){
				errors.push(new DreemError(e.message))
				var paths = []
			}
			paths.unshift('$CLASSES')

			for(var i = 0;i < paths.length; i++){
				var drefile = paths[i] + '/' + dreem_compiler.classnameToPath(classname) + '.dre'
				var jsfile =  paths[i] + '/' + dreem_compiler.classnameToPath(classname) + '.js'
				var ignore_watch = false
				if(fs.existsSync(define.expandVariables(drefile))){
					if(!this.compile_once[drefile]){
						// lets parse and compile this dre file
						var local_err = []
						var dre = this.parseDreSync(drefile, local_err)
						var root
						if(!dre.child){
							return ''
						}
						for(var j = 0; j < dre.child.length; j++){
							if(dre.child[j].tag == 'class') root = dre.child[j]
						}
						if(root && root.tag == 'class'){ // lets output this class
							jsfile = "$BUILD/" + paths[i].replace(/\//g,'.').replace(/\$/g,'').toLowerCase()+'.'+ dreem_compiler.classnameToBuild(classname) + ".js"
							this.compile_once[drefile] = jsfile;
							this.compileAndWriteDreToJS(root, jsfile, null, local_err)
							ignore_watch = true
						}
						if(local_err.length){
							this.showErrors(local_err, drefile, dre.source)
						}
					}
					else jsfile = this.compile_once[drefile];
				}
				
				if(fs.existsSync(define.expandVariables(jsfile)))
				{
					if(!ignore_watch) this.watcher.watch(jsfile)
					return jsfile
				}
			}
			
			console.color("~br~Error~~ finding class " + classname + '\n')
	    }

	    this.makeLocalDeps = function(deps, compname, indent, errors){
	    	var out = ''
	    	for(var key in deps){
				var incpath = this.lookupDep(key, compname, errors)
	    		this.classmap[key] = incpath
				if(incpath){
					out += indent + 'var ' + dreem_compiler.classnameToJS(key) + ' = require("' + incpath + '")\n'
				}
			}
			return out
	    }

	    /* Internal, compiles and writes dre .js class */
	    this.compileAndWriteDreToJS = function(jsxml, filename, compname, errors){

	    	var js = dreem_compiler.compileClass(jsxml, errors)
	    	if(!js) return
			// write out our composition classes
			var out = 'define(function(require, exports, module){\n' 
			out += this.makeLocalDeps(js.deps, compname, '\t', errors)
			out += '\tmodule.exports = ' + js.body + '\n\tmodule.exports.dre = ' + JSON.stringify(jsxml) + '})'
			try{
				fs.writeFileSync(define.expandVariables(filename), out)
			}
			catch(e){
				errors.push(new DreemError(e.toString()))
			}
			return js.name
	    }

	    /* Internal, packages and writes a dali application */
	    this.packageDali = function(root, output){
	    	// lets load define
	    	var definejs = fs.readFileSync(define.expandVariables('$ROOT/define.js')).toString()
			// lets recursively load all our dependencies.
			var files = {}
			function recur(file, parent){
				if(files[file]) return
				try{
					var data = fs.readFileSync(define.expandVariables(file))
				}
				catch(e){
					console.log('Error opening file '+file+' from '+parent)
					return
				}
				var string = files[file] = data.toString()
				var root = define.filePath(file)

				define.findRequires(string).forEach(function(req){
					if(req.charAt(0) == '$') var sub = req
					else var sub = define.joinPath(root, req)

					if(sub.lastIndexOf('.js') !== sub.length - 3) sub = sub + '.js'
					recur(sub, file)
				})
			}
			recur(root)
			// lets write out our dali.js
			var out = 'var define = {packaged:1}\ndefine = ' + definejs + '\n\n'
			for(var key in files){
				var string = files[key]
				string = string.replace(/define\(\s*function\s*\(/, function(){
					return 'define("' + key + '", function('
				})
				out += string + '\n\n'
			}
			out += 'define.env="v8";var req = define.require("' + root + '");if(define.onMain) define.onMain(req);'
			fs.writeFileSync(define.expandVariables(output), out)
		}

		this.compileLocalClass = function(cls, errors){
			var classname = cls.attr && cls.attr.name || 'unknown'
			this.compileAndWriteDreToJS(cls, '$BUILD/compositions.' + this.name + '.dre.' + classname + '.js' , this.name,  errors)
			this.local_classes[classname] = 1
		}

		/* Internal, reloads the composition */
		this.reload = function(){
			console.color("~bg~Reloading~~ composition\n")
			this.destroy()
			this.local_classes = {}
			this.compile_once = {}
			this.components = {}
			this.screens = {}
			this.modules = []
			this.classmap = {}
			// lets clear our module cache
			require.clearCache()
			define.onMain = undefined

			define.SPRITE = '$LIB/dr/sprite_browser'

			// scan our EXTLIB for compositions first
			var filepath = "$COMPOSITIONS/" + this.name + '.dre'

			if(define.EXTLIB){
				var extpath = define.expandVariables(define.EXTLIB)
				if(fs.existsSync(extpath)){
					var dir = fs.readdirSync(extpath)
					for(var i = 0; i<dir.length; i++){
						var mypath = '$EXTLIB/'+dir[i]+'/compositions/'+this.name+'.dre'
						if(fs.existsSync(define.expandVariables(mypath))){
							filepath = mypath
							break
						}
					}
				}
			}

			var errors = []

			var dre = this.parseDreSync(filepath, errors)
			if(errors.length) return this.showErrors(errors, filepath, dre && dre.source)

			// lets walk the XML and spawn up our composition objects.
			var root
			for(var i = 0;i<dre.child.length; i++){
				if(dre.child[i].tag == 'composition') root = dre.child[i]
			}
			
			if(!root || root.tag != 'composition') return this.showErrors(new DreemError('Root tag is not composition', root.pos), filepath, dre.source)

			for(var i = 0, children = root.child, len = children.length; i<len; i++){
				var child = children[i]
				// ok lets spawn up our tags into our local object pool.
				var tag = child.tag
				if(tag.charAt(0) == '$') continue
				if(tag == 'classes'){ // generate local classes
					// lets compile our local classes
					for(var j = 0, classes = child.child, clen = classes.length; j<clen; j++){
						var cls = classes[j]
						this.compileLocalClass(classes[j])
					}
					continue
				}
				
				// lets compile the JS
				var js = dreem_compiler.compileInstance(child, errors, '\t\t', this.compileLocalClass.bind(this))

				// ok now the instances..
				var out = 'define(function(require, exports, module){\n' 
				out += this.makeLocalDeps(js.deps, this.name, '\t', errors)
				out += '\tmodule.exports = function(){\n\t\treturn ' + js.body + '\n\t}\n'
				out += '\tmodule.exports.dre = '+ JSON.stringify(child) +'\n})'
				
				if(js.tag === 'screens'){
					var component = "$BUILD/compositions." + this.name + '.dre.screens.js' 
				}
				else{
					var collide = ''
					while(this.components[js.name + collide]){
						if(collide === '') collide = 1
						else collide++
					}
					js.name += collide
					this.components[js.name] = 1
					var component = "$BUILD/compositions." + this.name +  '.dre.' + js.tag + '.' + js.name + '.js'
				}

				fs.writeFileSync(define.expandVariables(component), out)
			
				this.modules.push({
					jsxml:child,
					name: js.name,// the base name of the component
					path: component
				})

				// if we compile a screen, we need to compile the children in screen separate
				if(js.tag == 'screens'){
					for(var j = 0, schilds = child.child, slen = schilds.length; j < slen; j++){
						var schild = schilds[j]

						if(schild.tag !== 'screen') continue
						var sjs = dreem_compiler.compileInstance(schild, errors, '\t\t', this.compileLocalClass.bind(this))

						// ok now the instances..
						var out = 'define(function(require, exports, module){\n' 
						out += this.makeLocalDeps(sjs.deps, this.name, '\t', errors)
						out += '\tmodule.exports = function(){\n\t\treturn ' + sjs.body + '\n\t}\n'
						out += '\tmodule.exports.dre = '+ JSON.stringify(schild) +'\n'
						out += '\tmodule.exports.classmap = '+ JSON.stringify(this.classmap) +'\n'
						out += '\n})'
						var component = "$BUILD/compositions." + this.name + '.dre.screens.' + sjs.name + '.js'
						fs.writeFileSync(define.expandVariables(component), out)

						if(schild.attr && schild.attr.type == 'dali'){
							define.SPRITE = '$LIB/dr/sprite_dali'
							this.packageDali(component, component.slice(0,-3)+".dali.js")
							define.SPRITE = '$LIB/dr/sprite_browser'
						}

						this.screens[sjs.name] = schild
					}
				}

				// ok how do we boot up the server
				/*
				// ok so, now we have written the components
				// lets instance our singleton teem tag
				var teem = require()

				if(js.tag == 'device'){
					if(child.attr && child.attr.type == 'dali'){
						// lets package up a dali application
						this.packageDali(component, component.slice(0, -3) + '.pack.js')
					}
					this.devices[js.id] = child
				}
				else{ // load it up in the server env
					var mod = require(component)
					if(mod) this.modules[js.id] = mod
				}*/

				if(errors.length) return this.showErrors(errors, filepath, dre.source)
			}

			// require our teem tag
			try{
				this.myteem = require('$CLASSES/teem.js')
			}
			catch(e){
				console.error(e.stack+'\x0E')
			}
			// send a reload on the busserver
			if(define.onMain) define.onMain(this.modules, this.busserver)
		}

		this.loadHTML = function(title, boot){
			return '<html lang="en">\n'+
				' <head>\n'+
				'  <title>' + title + '</title>\n'+
				'  <script type"text/javascript">\n'+
				'    window.define = {\n'+
				'      MAIN:"' + boot + '"\n'+
				'    }\n'+
				'  </script>\n'+
				'  <script type="text/javascript" src="define.js"></script>\n'+
				' </head>\n'+
				' <body>\n'+
				' </body>\n'+
				'</html>\n'
		}

		/**
		  * @method request
		  * Handle server request for this Composition
		  * @param {Request} req
		  * @param {Response} res
		  */
		this.request = function(req, res){
			var app = req.url.split('/')[2] || 'default'
			// ok lets serve our Composition device 

			if(req.method == 'POST'){
				// lets do an RPC call
				var buf = ''
				req.on('data', function(data){buf += data.toString()})
				req.on('end', function(){
					try{
						var json = JSON.parse(buf)
						this.myteem.postAPI(json,{send:function(msg){
							res.writeHead(200, {"Content-Type":"text/json"})
							res.write(JSON.stringify(msg))
							res.end()
						}})
					}
					catch(e){
						console.log('Error parsing RPC json or no teem object'+ buf,e)
						res.writeHead(500, {"Content-Type":"text/html"})
						res.write('FAIL')
						res.end()
						return						
					}
				}.bind(this))
				return
			}

			var screen = this.screens[app]
			if(!screen){
				res.writeHead(404)
				res.end()
				return
			}

			var html = this.loadHTML(screen.attr && screen.attr.title || this.name, '$BUILD/compositions.' + this.name + '.dre.screens.' + app + '.js')

			var header = {
				"Cache-control":"max-age=0",
				"Content-Type": "text/html"
			}

			res.writeHead(200, header)
			res.write(html)
			res.end()
		}
	}
})