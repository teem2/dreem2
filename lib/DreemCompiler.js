/*
 The MIT License (MIT) (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/


/**
 * @class DreemCompiler
 * Client and server usable dreem compiler
 * Parses and loads all dependencies starting from a particular
 * Source XML, and delivers them all compiled and bundled up 
 * Ready to be interpreted and turned into classes/instances
 * With this compiler you dont need to handle dependency loading yourself
 * It has an overloadable 'onRead'  that acts as the file loader interface
 * And this method specialized for browser or server elsewhere
 */
define(function(require, exports, module){
	module.exports = DreemCompiler
	
	var HTMLParser = require('./HTMLParser')
	var DreemError = require('./DreemError.js')
	/** 
	 * @constructor
	 */
	function DreemCompiler(){
		this.filehash = {} // all the dreem files by file-key
		this.origin_id = 0 // file id counter for json-map-back
	}

	var self = DreemCompiler.prototype

	/* Supported languages, these are lazily loaded */
	self.languages = {
		js:{
			lib:define.expandVariables(define.LIB_DIR) + 'acorn.js',
			compile:function(string, lib, args){
				// this returns a compiled function or an error
				if(!this.module){
					//if(window.acorn) console.log('hii')
					if(typeof window !== 'undefined' && window.acorn) this.module = window.acorn
					else new Function('module','exports',lib.data)({},this.module = {})
				}
				try{ // we parse it just for errors
					this.module.parse('function __parsetest__('+args.join(',')+'){'+string+'}')
				}
				catch(e){
					return new DreemError(e.message, undefined, e.loc && e.loc.line - 1, e.loc && e.loc.column)
				}
				return string
			}
		},
		coffee:{
			lib:define.expandVariables(define.LIB_DIR) + 'coffee-script.js',
			compile:function(string, lib, args){
				// compile coffeescript
				if(!this.module){
					if(typeof window !== 'undefined' && window.CoffeeScript) this.module = {CoffeeScript:window.CoffeeScript}
					else new Function(lib.data).call(this.module = {})
				}
				// compile the code
				try{
					var out = this.module.CoffeeScript.compile(string)
				}
				catch(e){ // we have an exception. throw it back
					return new DreemError(e.message, undefined, e.location && e.location.first_line, e.location && e.location.first_column)
				}
				// lets return the blob without the function headers
				return out.split('\n').slice(1,-2).join('\n')
			}
		}
	}

	/**
	 * @event onRead
	 * called when the compiler needs to read a file
	 * @param {String} name Name of the file to read
	 * @param {Function} callback Callback to call with (error, result)
	 */
	self.onRead = function(name, callback){ throw new Error('Abstract function') }

	/**
	 * @method originError
	 * Used to decode an origin, they are '0_3' like strings which mean
	 * fileid_charoffset 
	 * These origins are written into the XML JSON so its possible to resolve
	 * a particular tag to a particular file/line when needed
	 * @param {String} message Message for the error
	 * @param {String} origin Origin string ('2_5') to decode
	 */
	self.originError = function(message, origin){
		var orig = origin.split('_')
		var id = orig[0], offset = parseInt(orig[1])
		var line = 1, col = 0
		var file
		var name 
		for(var k in this.filehash) if(this.filehash[k].id == id){
			file = this.filehash[k]
			name = k
			break
		}
		if(!file) return new Error('Cant find origin '+origin, 'unknown')
		var data = file.data
		var path = file.path
		for(var i = 0;i < data.length && i<offset; i++, col++){
			if(data.charCodeAt(i) == 10) line++, col = 1
		}
		return new DreemError(message, path, line, col)
	}

	/* Used internally, loads or caches a file*/
	self.cache = function(name, callback){
		if(this.filehash[name]) return callback(null, this.filehash[name])
		this.onRead(name, function(err, data, fullpath){
			if(err) return callback(err)
			var file = this.filehash[name] = {
				name: name,
				id: this.origin_id++,
				path: fullpath,
				data: typeof data === 'string'?data:data.toString()
			}

			return callback(null, file)
		}.bind(this))
	}

	/* Used internally, parses a Dre file*/
	self.parseDre = function(name, callback){
		this.cache(name, function(err, file){
			if(err) return callback(err)

			var htmlParser = new dreemParser.HTMLParser(file.id)
			var jsobj = htmlParser.parse(file.data)

			// forward the parser errors 
			if(htmlParser.errors.length){
				var err = htmlParser.errors.map(function(e){
					return this.originError(e.message, file.id+'_'+e.where)
				}.bind(this))
				
				return callback(err)
			}

			return callback(null, jsobj)
		}.bind(this))
	}

	/* Concats all the childnodes of a jsonxml node*/
	self.concatCode = function(node){
		var out = ''
		var children = node.child
		if(!children || !children.length) return ''
		for(var i = 0; i<children.length;i++){
			if(children[i].tag == '$text') out += children[i].value
		}
		
		// HACK: Clean up a few common entities that are causing compilation errors.
		out = out.split('&gt;').join('>').split('&lt;').join('<').split('&amp;').join('&');
		
		return out
	}

	/*
	 Main loader function, used internally 
	 The loader just loads all dependencies and assembles all classes, and 
	 gathers all compileable methods and their language types
	 It does not compile any coffeescript / JS
	*/
	self.loader = function(node, callback){
		var deps = {} // dependency hash, stores the from-tags for error reporting
		var loading = 0 // number of in flight dependencies
		var errors = [] // the error array
		var output = {node:node, js:{}, classes:{}, methods:[]}
		var method_id = 0
		
		var loadJS = function(file, from_node){
			// loads javascript
			if(file in output.js) return
			if(!deps[file]){
				deps[file] = [from_node]
				loading++
				this.cache(file, function(err, data){
					if(err){
						errors.push(err)
						var mydep = deps[file]
						for(var i = 0;i < mydep.length; i++){
							errors.push(this.originError('JS file '+name+' used here but could not be loaded', mydep[i]._))
						}
					}
					output.js[file] = data
					if(!--loading) errors.length? callback(errors): callback(null, output)
				})
			}
			else deps[file].push(from_node)
		}.bind(this)

		var loadClass = function(name, from_node){
			if(name in dreemMaker.builtin) return
			if(name in output.classes) return
			
			output.classes[name] = 2 // mark tag as loading but not defined yet

			if(!deps[name]){
				deps[name] = [from_node]
				loading++
				// we should make the load order deterministic by force serializing the dependency order
				var path = name.split('-').join('/');
				this.parseDre(define.expandVariables(define.CLASSES_DIR) + path, function(err, jsobj){
					if(!err) walk(jsobj, null, 'js')
					else{
						if(Array.isArray(err)) errors.push.apply(errors, err)
						else errors.push(err)
						// lets push our errors in err
						var mydep = deps[name]
						for(var i = 0;i < mydep.length; i++){
							errors.push(this.originError('class '+name+' used here could not be loaded', mydep[i]._))
						}
					}
					if(!--loading) errors.length? callback(errors): callback(null, output)
				}.bind(this))
			}
			else deps[name].push(from_node)
		}.bind(this)

		var walk = function(node, parent, language){
			if(node.tag.charAt(0)!='$') loadClass(node.tag, node)
			
			var prune = false;
			if (node.tag == 'class' || node.tag == 'mixin') {
				var nameattr = node.attr && node.attr.name
				if(!nameattr){
					errors.push(this.originError('Class has no name ', node._))
					return
				}
				if (node.attr && node.attr.type) language = node.attr.type
				
				// create a new tag
				output.classes[nameattr] = node
				
				// check extends and view
				if(node.attr && node.attr.extends){
					node.attr.extends.split(/,\s*/).forEach(function(cls){
						loadClass(cls, node)
					})
				}
				if(node.attr && node.attr.with){
					node.attr.with.split(/,\s*/).forEach(function(cls){
						loadClass(cls, node)
					})
				}
				if(node.attr && node.attr.scriptincludes){ // load the script includes
					node.attr.scriptincludes.split(/,\s*/).forEach(function(js){
						loadJS(js, node)
					})
				}
				
				// Remove from parent since classes will get looked up in the
				// output.classes map
				prune = true;
			} else if (node.tag == 'method' || node.tag=='handler' || node.tag == 'getter' || node.tag == 'setter') {
				// potentially 'regexp' createTag or something here?

				if(node.attr && node.attr.type) language = node.attr.type
				
				// lets on-demand load the language
				var langproc = this.languages[language]
				if(!langproc){
					errors.push(this.originError('Unknown language used '+language, node._))
					return
				}
				else loadJS(langproc.lib, node)

				// give the method a unique but human readable name
				var name = node.tag + '_' + (node.attr && node.attr.name) + '_' + node._ + '_' + language
				if(parent && (parent.tag == 'class' || parent.tag == 'mixin')) name = (parent.attr && parent.attr.name) + '_' + name

				node.method_id = output.methods.length
				output.methods.push({
					language: language,
					name:name,
					args: node.attr && node.attr.args ? node.attr.args.split(/,\s*/) : [],
					source: this.concatCode(node),
					origin: node._
				})
				// clear child
				node.child = undefined
			}
			
			if (node.child) {
				for (var i = 0; i < node.child.length; i++) {
					// Prune node if so indicated
					if (walk(node.child[i], node, language)) node.child.splice(i--, 1);
				}
			}
			
			return prune;
		}.bind(this)

		// Walk JSON
		walk(node, null, 'js')
		
		// the impossible case of no dependencies
		if(!loading) errors.length? callback(errors): callback(null, output)
	}

	/**
	 * @method execute
	 * Execute the compiler starting from a 'rootname' .dre file
	 * The result in the callback is a 'package' that contains 
	 * all dreem classes 
	 * package: {
	 *     js:{}, A key value list of js files
	 *     methods:'' A string containing all methods compiled
	 *     root:{} The root in JSONXML
	 *     classes:{} A key value list of all classes as JSONXML 
	 * }
	 * @param {String} rootname Root dre file
	 * @param {Callback} callback When compiler completes callback(error, result)
	 */
	self.execute = function(rootname, callback){
		// load the root
		this.parseDre(rootname, function(err, jsobj){
			if(err) return callback(err)

			this.loader(jsobj, function(err, output){
				if(err) return callback(err)

				// Compile all methods / getters/setters/handlers using the language it has
				var errors = []
				var methods = output.methods
				var code = ''
				for(var i = 0;i < methods.length; i++){
					var method = methods[i]
					var lang = this.languages[method.language]

					var compiled = lang.compile(method.source, output.js[lang.lib], method.args)
					
					if(compiled instanceof DreemError){ // the compiler returned an error
						var err = this.originError(compiled.message, method.origin)
						err.line += compiled.line // adjust for origin
						errors.push(err)
					}
					else{
						// lets build a nice function out of it
						code += 'methods['+i+'] = function '+method.name+'('+ method.args.join(', ') + '){\n' + 
							compiled + '\n}\n' 
					}
				}

				if(errors.length) return callback(errors)
				
				// lets package up the output
				var pkg = {
					js: output.js, // key value list of js files
					methods: code, // the methods codeblock 
					root: jsobj,   // the dreem root file passed into execute
					classes: output.classes // the key/value set of dreem classes as JSON-XML
				}

				return callback(null, pkg)
			}.bind(this))

		}.bind(this))
	}
})