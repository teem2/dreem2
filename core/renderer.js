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
					this[key] = function(){
						redraw()
					}
				}
				// set up property binding vlaues
				this.propertyBind(object, globals)

				var jsonml = object.render(parent)
				object.onAttributeGet = undefined

				if(!jsonml) break // we were an endpoint

				// lets transfer attributes from object to temp
				var temp = Node.createFromJSONML(jsonml)
				
				temp.outer = object

				//if(object._propbinds){
				//	var array = temp._propbinds || (temp._propbinds = [])
				//	array.push.apply(array, object._propbinds)
				//}

				// what if we have an array
				if(object.child){
					if(!temp.child) temp.child = []
					temp.child.push.apply(temp.child, object.child)
				}

				object = temp
			}

			if(object.child){
				for(var i = 0; i < object.child.length; i++){
					object.child[i] = this.render(object.child[i], object, globals, redraw)
				}
			}
			return object
		}

		this.destroy = function(object, parent){
			// lets call spawn
			// lets tear down all listeners
			var obj = object
			while(obj){
				for(var key in obj){
					var attr = obj['attr_' + key]
					if(attr && attr.owner == obj){
						//console.log('clearing ', key)
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
			// allright lets resolve the property binds
			var binds = obj._propbinds
			if(binds){
				//console.log(object._propbinds)
				for(var i = 0; i < binds.length; i++){
					var bind = binds[i]
					// lets parse it
					var attr = obj['on_' + bind]
					var ast = acorn.parse(attr.binding)
					// ok we have to parse it and wire the things up
					var walker = new AstBindingWalker()
					var out = walker.walk(ast)
					for(var j = 0;j < walker.references.length; j++){
						var items = walker.references[j]
						var base = globals
						for(var k = 0; k < items.length; k++){
							var key = items[k]
							// lets walk into the node
							if(k == items.length -1 && base['attr_' + key]){
								// lets create a watch
								base[key] = function(bind, value){
									// recompute
									var value = this[bind] = this['attr_' + bind].expr()
								}.bind(obj, bind)
							}
							else if(key in base){
								base = base[key]
							}
							else{
								throw new Error('Cannot traverse binding ' + items.join('.'))
							}
						}

						if(!base){
							throw new Error('Cannot bind to global ')
						}
					}
					for(var key in globals){
						globals
					}
					var args = []
					var gargs = []
					for(var key in globals){
						args.push(key)
						gargs.push(globals[key])
					}
					args.push("return function(){ return " + out + "}.bind(this)")
					attr.expr = Function.apply(null, args).apply(obj, gargs)
					attr.value = attr.expr()
				}
			}
			// hop outwards over our outer objects
			//obj = obj.outer
		}
			//if(object.child){
			//	for(var i =0; i<object.child.length; i++){
			//		this.propertyBind(object.child[i], object, globals)
			//	}
			//}			
	}
})