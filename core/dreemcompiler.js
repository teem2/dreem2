/*
 The MIT License (see LICENSE)
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
	
	var HTMLParser = require('./htmlparser')
	var DreemError = require('./dreemerror')

	// Builtin modules, belongs here
	exports.system = {
		/* Built in tags that dont resolve to class files */
		class: true,
		method: true,
		attribute: true,
		handler: true,
		state: true,
		getter: true,
		setter: true
	}

	exports.charPos = function(source, line, col){
		var myline = 0, mycol = 0
		for(var i = 0; i < source.length; i++, mycol++){
			if(source.charCodeAt(i) == 10) myline++, mycol = 0
			if(myline > line) return i
			if(myline == line && col == mycol) return i
		}
		return -1
	}

	/* Supported languages, these are lazily loaded */
	exports.languages = {
		js:{
			compiler: require('$LIB/acorn'),
			compile: function(string, args){
				// this returns a compiled function or an error
				var head = 'function __parsetest__('+args.join(',')+'){'
				var src = head + string+'}'
				try{ // we parse it just for errors
					this.compiler.parse(src)
				}
				catch(e){
					var at = exports.charPos(src, e.loc && e.loc.line - 1, e.loc && e.loc.column + 1)
					return new DreemError(e.message, at - head.length)
				}
				return string
			}
		},
		coffee:{
			compiler: require('$LIB/coffee-script'),
			compile: function(string, args){
				// compile the code
				try{
					var out = this.compiler.compile(string)
				}
				catch(e){ // we have an exception. throw it back
					return new DreemError(e.message, exports.charPos(string, e.location && e.location.first_line, e.location && e.location.first_column))
				}
				// lets return the blob without the function headers
				return out.split('\n').slice(1,-2).join('\n')
			}
		}
	}

	/* Concats all the childnodes of a jsonxml node*/
	exports.concatCode = function(node){
		var out = ''
		var children = node.child
		if(!children || !children.length) return ''
		for(var i = 0; i<children.length;i++){
			var child = children[i]
			if(child.tag == '$text') out += child.value
			if(child.tag == '$cdata') out += child.value
		}
		return out
	}

	exports.default_deps = {
		teem:1
	}

	exports.classnameToJS = function(name){
		return name.replace(/-/g,'_')
	}

	exports.classnameToPath = function(name){
		return name.replace(/-/g,'/')
	}

	exports.classnameToBuild = function(name){
		return name.replace(/-/g,'.')
	}

	exports.compileClass = function(node, errors){
		var body = ''
		var deps = Object.create(this.default_deps)
		if(node.tag !== 'class' && node.tag !== 'mixin'){
			errors.push(new DreemError('compileClass on non class', node.pos))
			return
		}

		// ok lets iterate the class children
		var clsname = node.attr && node.attr.name
		if(!clsname){
			errors.push(new DreemError('Class has no name ', node.pos))
			return
		}

		var language = 'js'
		if (node.attr && node.attr.type) language = node.attr.type

		// lets fetch our base class
		var baseclass = 'teem_node'
		deps['teem_node'] = 1
		if(node.attr && node.attr.extends){
			if(node.attr.extends.indexOf(',') != -1){
				errors.push(new DreemError('Cant use multiple baseclasses ', node.pos))
				return
			}
			baseclass = node.attr.extends
			deps[baseclass] = 1
		}

		body += exports.classnameToJS(baseclass) + '.extend("' + clsname + '", function(){\n'

		if(node.attr && node.attr.with){
			node.attr.with.split(/,\s*|\s+/).forEach(function(cls){
				deps[cls] = 1
				body += '\t\tthis.mixin('+exports.classnameToJS(cls)+')\n'
				return
			})
		}
		
		// ok lets compile a dreem class to a module
		if (node.child) for (var i = 0; i < node.child.length; i++) {
			var child = node.child[i]
			if (child.tag == 'attribute' || child.tag == 'method' || child.tag == 'handler' || child.tag == 'getter' || child.tag == 'setter'){
				var attrnameset = child.attr && (child.attr.name || child.attr.event)

				var attrnames = attrnameset.split(/,\s*|\s+/)
				for(var j = 0; j < attrnames.length; j++){
					var attrname = attrnames[j]
					if(!attrname){
						errors.push(new DreemError('Attribute has no name ', child.pos))
						return
					}
					var type = child.attr && child.attr.type || 'string'
					if(child.tag == 'attribute'){
						body += '\t\tthis.attribute("' + attrname + '", "' + type.toLowerCase() + '")\n'
					}
					else{
						var fn = this.compileMethod(child, node, language, errors, '\t\t\t\t')
						if(!fn) continue
						var args = fn.args
						if(!args && child.tag == 'setter') args = ['value']
						body += '\t\tthis.' + attrname +' = function(' + args.join(', ') + '){' + fn.comp + '}\n'
					}
				}
			}
			else if(child.tag.charAt(0) != '$'){ // its our render-node
				var inst = this.compileInstance(child, errors, '\t\t\t')
				for(var key in inst.deps) deps[key] = 1
				body += '\t\tthis.render = function(){\n'
				body += '\t\t\treturn ' + inst.body +'\n'
				body += '\t\t}\n'
			}
		}
		body += '\t})'

		return {
			name:clsname,
			deps:deps,
			body:body
		}
	}

	exports.compileMethod = function(node, parent, language, errors, indent){
		language = language || 'js'

		if(node.attr && node.attr.type) language = node.attr.type
		
		// lets on-demand load the language
		var langproc = this.languages[language]
		if(!langproc){
			errors.push(new DreemError('Unknown language used ' + language, node.pos))
			return {errors:errors}
		}

		// give the method a unique but human readable name
		var name = node.tag + '_' + (node.attr && node.attr.name) + '_' + node.pos + '_' + language
		if(parent && (parent.tag == 'class' || parent.tag == 'mixin')) name = (parent.attr && parent.attr.name) + '_' + name
		name = exports.classnameToJS(name)

		//node.method_id = output.methods.length
		var lang = this.languages[language]
		var args = node.attr && node.attr.args ? node.attr.args.split(/,\s*|\s+/): []
		var compiled = lang.compile(this.concatCode(node), args)

		if(compiled instanceof DreemError){ // the compiler returned an error
			compiled.where += node.child[0].pos
			errors.push(compiled)
			return
		}

		// lets re-indent this thing.
		var lines = compiled.split('\n')
		
		// lets scan for the shortest indentation which is not \n
		var shortest = Infinity
		for(var i = 0;i<lines.length;i++){
			var m = lines[i].match(/^( |\t)+/g)
			if(m && m[0].length){
				m = m[0]
				var len = m.length
				if(m.charCodeAt(0) == 32){
					// replace by tabs, just because.
					if(len&1) len ++ // use tabstop of 2 to fix up spaces
					len = len / 2
					lines[i] = Array(len + 1).join('\t') + lines[i].slice(m.length)
				}
				if(len < shortest && lines[i] !== '\n') shortest = len
			}
		}
		if(shortest != Infinity){
			for(var i = 0;i<lines.length;i++){
				if(i> 0 || lines[0].length !== 0)
					lines[i] = indent + lines[i].slice(shortest).replace(/( |\t)+$/g,'')
			}
			compiled = lines.join('\n')
		}

		return {
			name: name,
			args: args,
			comp: compiled
		}
	}

	exports.compileInstance = function(node, errors, indent, onLocalClass){
		var deps = Object.create(this.default_deps)
		
		var walk = function(node, parent, indent, depth){
			deps[node.tag] = 1
			var myindent = indent + '\t'
			var props = '' 
			var children = ''

			if(node.attr) for(var key in node.attr){
				var value = node.attr[key]
				if(props) props += ',\n' + myindent
				else props = '{\n' + myindent
				if(value !== 'true' && value !== 'false' && parseFloat(value) != value) value = '"' + value.split('"').join('\\"') + '"'
				props += key + ':' + value
			}

			if (node.child) for (var i = 0; i < node.child.length; i++) {
				var child = node.child[i]
				
				if (child.tag == 'class' || child.tag == 'mixin') {
					// lets output a local class 
					if(onLocalClass) onLocalClass(child, errors)
					else errors.push(new DreemError('Cant support class in this location', node.pos))
				}
				else if (child.tag == 'method' || child.tag == 'handler' || child.tag == 'getter' || child.tag == 'setter'){
					var fn = this.compileMethod(child, parent, 'js', errors, indent + '\t')
					if(!fn) continue
					if(!child.attr || (!child.attr.name && !child.attr.event)){
						errors.push(new DreemError('code tag has no name', child.pos))
						continue
					}
					var attrnameset = child.attr.name || child.attr.event
					
					var attrnames = attrnameset.split(/,\s*|\s+/)
					for(var j = 0; j < attrnames.length; j++){
						var attrname = attrnames[j]
		
						if(props) props += ',\n' + myindent
						else props = '{\n' + myindent
						var pre = '', post = ''
						if(child.tag == 'getter') attrname = 'get_' + attrname
						else if(child.tag == 'setter') attrname = 'set_' + attrname

						if(child.tag == 'handler') attrname = 'handle_' + attrname
						props += attrname + ': function(' + fn.args.join(', ') + '){' + fn.comp + '}' 
					}

				}
				else if(child.tag == 'attribute'){
					if(!child.attr || !child.attr.name){
						errors.push(new DreemError('attribute tag has no name', child.pos))
						continue
					}
					var name = child.attr.name
					var type = child.attr.type || 'string'
					if(props) props += ',\n' + myindent
					else props = '{\n' + myindent
					var value = child.attr.value
					if(value !== undefined && value !== 'true' && value !== 'false' && parseFloat(value) != value) value = '"' + value.split('"').join('\\"') + '"'
					props += 'attr_' + name + ': {type:"'+type+'", value:'+value+'}'
				} 
				else if(child.tag.charAt(0) != '$'){
					if(children) children += ',\n' + myindent
					else children = '\n' + myindent
					children += walk(child, node, myindent, depth+1)
				}
			}
			var out = exports.classnameToJS(node.tag) + '('

			if(props){
				if(!children) out += props+'\n'+indent+'}'
				else out += props+'\n'+myindent+'}'
			}

			if(children){
				if(props) out += ','
				out += children
			}
			if (children){
				out += '\n' + indent
			}

			out += ')'

			return out

		}.bind(this)

		// Walk JSON
		var body = walk(node, null, indent || '', 0)

		return {
			tag: node.tag,
			name: node.attr && node.attr.name || node.tag,
			deps: deps,
			body: body
		}
	}
})