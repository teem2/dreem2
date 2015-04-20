/*
 The MIT License (MIT) (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC

 Micro AMD module loader for browser and node.js
 Also includes a bit of util from node.js
*/

(function(){

	// the main define function
	function define(factory){
		if(arguments.length == 2){ // precompiled version
			define.factory[factory] = arguments[1]
			return
		}
		define.last_factory = factory // store for the script tag
		// continue calling
		if(define.define) define.define(factory)
	}

	// default config variables
	define.ROOT = '/'
	define.CLASSES_DIR = '$ROOT/classes/'
	define.DEFAULT_DIR = '$ROOT/lib/'
	define.LIB_DIR = '$ROOT/lib/'
	define.FILE_BASE = ''

	define.inherit = function(base_class, sub_class){
		var proto = sub_class.prototype = Object.create(base_class.prototype)
		proto.constructor = sub_class
		// copy mixins
		if(arguments.length > 2){
			for(var i = 2; i < arguments.length; i++){
				var obj = arguments[i]
				if(typeof obj == 'function') obj = obj.prototype
				for(var key in obj){
					// copy over getters and setters
					if(obj.__lookupGetter__(key) || obj.__lookupSetter__(key)){

					}
					else{
						// other
						proto[key] = obj[key]
					}
				}
			}
		}
		return proto
	}

	define.filePath = function(file){
		if(!file) return ''
		file = file.replace(/\.\//g, '')
		var m = file.match(/([\s\S]*)\/[^\/]*$/)
		return m ? m[1] : ''
	}

	define.cleanPath = function(path){
		return path.replace(/^\/+/,'/').replace(/([^:])\/+/g,'$1/')
	}

	define.absPath = function(base, relative){
		if(relative.charAt(0) != '.'){ // relative is already absolute
			var path = this.FILE_BASE + (relative.charAt(0) == '/'? relative: '/' + relative) 
			return cleanPath(path)
		}
		base = base.split(/\//)
		relative = relative.replace(/\.\.\//g,function(){ base.pop(); return ''}).replace(/\.\//g, '')
		return define.cleanPath(base.join('/') + '/' + relative)
	}

	// expand define variables
	define.expandVariables = function(str){
		return define.cleanPath(str.replace(/\$([^\/$]*)/g, function(all, lut){
			if(!(lut in define)) throw new Error("Cannot find $" + lut + " used in require")
			return define.expandVariables(define[lut])
		}))
	}

	// storage structures
	define.module = {}
	define.factory = {}

	if(typeof window !== 'undefined')(function(){ // browser implementation
		// if define was already defined use it as a config store
		var config_define = window.define

		define.FILE_BASE = location.origin

		// copy configuration onto define
		if(typeof config_define == 'object') for(var key in config_define){
			define[key] = config_define[key]
		}

		// storage structures
		define.script_tags = {}

		// the require function passed into the factory is local
		function localRequire(base_path){
			function require(dep_path){
				abs_path = absPath(base_path, define.expandVariables(dep_path))
				// lets look it up
				var module = define.module[abs_path]
				if(module) return module.exports

				// otherwise lets initialize the module
				var factory = define.factory[abs_path]
				module = {exports:{}}
				define.module[abs_path] = module

				if(factory === null) return null // its not an AMD module, but accept that
				if(!factory) throw new Error("Cannot find factory for module:" + abs_path)

				// call the factory
				factory(localRequire(define.filePath(abs_path)), module.exports, module)
				return module.exports
			}
			return require
		}
		
		var app_root = define.filePath(window.location.href)

		function startMain(){
			// lets find our main and execute the factory
			var main_mod = absPath(app_root, define.MAIN)
			var factory = define.factory[main_mod]
			if(!factory) throw new Error("Cannot find main: " + main_mod)

			// lets boot up
			var module = {exports:{}}
			define.module[main_mod] = module
			factory(localRequire(define.filePath(main_mod)), module.exports, module)
		}

		// the main dependency download queue counter
		var downloads = 0

		// insert by script tag
		function insertScriptTag(script_url, from_file){
			var script = document.createElement('script')
			var base_path = define.filePath(script_url)

			script.type = 'text/javascript'
			script.src = script_url
			define.script_tags[script_url] = script
				
			downloads++
			function onLoad(){
				// pull out the last factor
				var factory = define.factory[script_url] = define.last_factory || null
				define.last_factory = undefined
				// parse the function for other requires
				if(factory) factory.toString().replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]/g,'').replace(/require\s*\(\s*["']([^"']+)["']\s*\)/g, function(m, path){
					// Make path absolute and process variables
					var dep_path = absPath(base_path, define.expandVariables(path))
					// automatic .js appending if not given
					if(dep_path.indexOf(".js") != dep_path.length -3) dep_path += '.js'
					// load it
					if(!define.script_tags[dep_path]) insertScriptTag(dep_path, script_url)
				})
				if(!--downloads) startMain() // no more deps
			}
			script.onerror = function(){ console.error("Error loading " + script.src + " from " + from_file) }
			script.onload = onLoad
			script.onreadystatechange = function(){
				if(s.readyState == 'loaded' || s.readyState == 'complete') onLoad()
			}
			document.getElementsByTagName('head')[0].appendChild(script)
		}

		// make it available globally
		window.define = define

		// boot up using the MAIN property
		if(define.MAIN){
			insertScriptTag(absPath(app_root, define.expandVariables(define.MAIN)), window.location.href)
		}
	})()
	else (function(){ // nodeJS implementation
		module.exports = global.define = define

		var Module = require("module")

		var modules = []
		var _compile = module.constructor.prototype._compile

		// hook compile to keep track of module objects
		module.constructor.prototype._compile = function(content, filename){  
			modules.push(this)
			try {
				return _compile.call(this, content, filename)
			}
			finally {
				modules.pop()
			}
		}

		define.define = function(factory) {

			if(factory instanceof Array) throw new Error("injects-style not supported")

			var module = modules[modules.length - 1] || require.main

			// store module and factory just like in the other envs
			define.module[module.filename] = module
			define.factory[module.filename] = factory

			function localRequire(name) {
				if(arguments.length != 1) throw new Error("Unsupported require style")

				name = define.expandVariables(name)
				var full_name = Module._resolveFilename(name, module)
				if (full_name instanceof Array) full_name = full_name[0]

				return require(full_name)
			}

			if (typeof factory !== "function") return module.exports = factory
						
			factory(localRequire, module.exports, module)
		}

		global.define.require = require
		global.define.module = {}
		global.define.factory = {}
	})()
})()
