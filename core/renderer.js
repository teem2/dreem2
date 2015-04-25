/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

define(function(require, exports, module){
	module.exports = Renderer

	/**
	 * @constructor
	 */
	function Renderer(){
	}
	body.call(Renderer.prototype)

	function body(){
		this.render = function(object, parent){
			while(1){
				var temp = object.render(parent)
				
				object.child

				object.mount = temp
				if(temp === object) break
				object = temp
			}

			if(object.child){
				for(var i = 0; i<object.child.length; i++){
					object.child[i] = this.render(object.child[i], object)
				}
			}
			return object
		}

		this.spawn = function(object, parent){
			// lets call spawn
			object.spawn(parent)
			if(object.child){
				for(var i =0; i<object.child.length; i++){
					object.child[i].spawn(object)
				}
			}
		}
	}
})