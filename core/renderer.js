/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

define(function(require, exports, module){
	module.exports = Renderer
	
	var Node = require('$CLASSES/node')
	var acorn = require('$LIB/acorn')
	var AstBindingWalker = require('$CORE/astbindingwalker')

	/**
	 * @constructor
	 */
	function Renderer(){
	}

	body.call(Renderer.prototype)

	function body(){
		this.render = function(object, parent, globals, redraw){
			while(1){
				// store the attribute dependencies
				object.onAttributeGet = function(key){
					if(key == 'scaleval'){
						var attr = this['attr_' + key]
					}
					this[key] = function(){
						redraw()
					}
				}
				// set up property binding values
				object.parent = parent

				var jsonml = object.render(parent)
				object.onAttributeGet = undefined

				if(!jsonml) break // we were an endpoint

				// lets transfer attributes from object to temp
				var temp = Node.createFromJSONML(jsonml)
				
				temp.outer = object

				// what if we have an array
				if(object.child){
					if(!temp.child) temp.child = []
					temp.child.push.apply(temp.child, object.child)
				}

				object = temp
			}
	
			this.propertyBind(object, globals)
		
			if(object.child){
				for(var i = 0; i < object.child.length; i++){
					object.child[i] = this.render(object.child[i], object, globals, redraw)
				}
			}
		
			return object
		}

		this.destroy = function(object, parent){
			// tear down all listener structures
			var obj = object
			while(obj){
				var listeners = obj._proplisten
				if(listeners){
					for(var i = 0;i < listeners.length; i++){
						listeners[i]()
					}
					obj._proplisten = undefined
				}
				for(var key in obj){
					var attr = obj['attr_' + key]
					if(attr && attr.owner == obj){
						attr.clear()
					} 
				}
				if(obj.child){
					for(var i =0; i<obj.child.length; i++){
						this.destroy(obj.child[i], obj)
					}
				}
				obj = obj.outer
			}
		}

		this.spawn = function(object, parent){
			// lets call spawn
			object.spawn(parent)
			if(object.child){
				for(var i =0; i<object.child.length; i++){
					this.spawn(object.child[i], object)
				}
			}
		}

		this.propertyBind = function(obj, globals){
			var lazy = []
			// allright lets resolve the property binds
			var binds = obj._propbinds
			if(binds){
				obj._proplisten = []
				//console.log(object._propbinds)
				for(var i = 0; i < binds.length; i++){
					var bind = binds[i]
					// lets parse it
					var attr = obj['on_' + bind]
					var ast = acorn.parse(attr.binding.slice(2, -1))

					// ok we have to parse it and wire the things up
					var walker = new AstBindingWalker()
					var out = walker.walk(ast)
					var refs = []
					//console.log(attr.binding.slice(2, -1), attr.listeners[0].toString())

					var code = "return function(){ \n"

					for(var j = 0;j < walker.references.length; j++){
						var reference = walker.references[j]
						var base = globals
						for(var k = 0; k < reference.length; k++){
							var refpart = reference[k]
							// lets walk into the node
							if(k == reference.length - 1 && base['attr_' + refpart]){
								// lets store it on this
								//console.log(bind, 'to', reference.join('.'))
								obj._proplisten.push(
									base['on_' + refpart].addListener(function(bind, ref){
									var value = this['attr_' + bind].expr()
									//console.log("WE HAZ THING for "+value)
									this[bind] = value
								}.bind(obj, bind, reference.join('.'))))
							}
							else if(refpart in base){
								base = base[refpart]
							}
							else if(refpart == 'this'){
								base = obj
							}
							else if(refpart == 'Math'){
								break
							}
							else{
								throw new Error('Cannot traverse binding ' + reference.join('.'))
							}
						}
						if(!base){
							throw new Error('Cannot bind to global ')
						}
						code += 'if(' + reference.join('.') + ' === null) return null\n'
					}
					var arg_names = []
					var arg_vars = []
					for(var key in globals){
						arg_names.push(key)
						arg_vars.push(globals[key])
					}

					code += "return " + out + "}.bind(this)"
					arg_names.push(code)
					// if this function returns Object it failed, 
					attr.expr = Function.apply(null, arg_names).apply(obj, arg_vars)

					// ok so 
					attr.value = attr.expr()
					if(attr.value === null){
						lazy.push(bind)
					}
				}
			}
			for(var i = 0; i < lazy.length; i++){
				var bind = lazy[i]
				var attr = obj['on_' + bind]
				attr.value = attr.expr()
				if(attr.value === null) console.log("Still could not resolve property "+bind)
			}
		}
	}
})