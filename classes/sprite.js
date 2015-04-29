/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

define(function(require, exports, module){
	var node = require("$CLASSES/node")

	if(define.env == 'v8'){
		return node.extend("sprite", function(){
			this.spawn = function(parent){
			}
		})
	}
	else if(define.env == 'browser'){
		return node.extend("sprite", function(){

			this.attribute("x", "number")
			this.attribute("y", "number")
			this.attribute("width", "number", 100)
			this.attribute("height", "number", 100)
			this.attribute("rotation", "number", 0)
			this.attribute("bgcolor", "string", "orange")

			this.onConstruct = function(){
			}

			this.render = function(){
			}

			this.spawn = function(parent){
				this.dom_node = document.createElement('div')
				this.dom_node.style.backgroundColor = this.bgcolor
				this.dom_node.style.position = 'absolute'
				this.dom_node.style.left = this.x + 'px'
				this.dom_node.style.top = this.y + 'px'
				this.dom_node.style.width = this.width + 'px'
				this.dom_node.style.height = this.height + 'px'
				if(this.rotation) this.dom_node.style.transform = 'rotateZ('+this.rotation+'deg)'
				parent.dom_node.appendChild(this.dom_node)
			}
		})
	}
	else{
		return node.extend("sprite")
	}

})