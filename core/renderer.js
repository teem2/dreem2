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
		this.render = function(object){
			while(1){
				var temp = object.render()
				if(temp === object) break
				object = temp
			}

			if(object.child){
				for(var i = 0; i<object.child.length; i++){
					object.child[i] = this.render(object.child[i])
				}
			}
			return object
		}
	}
})