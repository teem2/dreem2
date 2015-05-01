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
		return node.extend("text", function(){

			this.attribute("x", "number")
			this.attribute("y", "number")
			this.attribute("width", "number", 0)
			this.attribute("height", "number", 0)
			this.attribute("rotation", "number", 0)
			this.attribute("bgcolor", "string", "orange")
			this.attribute("fgcolor", "string", "white")
			this.attribute("text", "string", "")
			this.attribute("click", "event")
			this.attribute("mousedown", "event")
			this.attribute("mouseout", "event")
			this.attribute("mouseover", "event")
			this.attribute("mouseup", "event")
			this.attribute("scroll", "event")

			this.onConstruct = function(){
			}

			this.render = function(){
				this.x
				this.y
				this.width
				this.height
				this.rotation
				this.text
			}

			this.spawn = function(parent){
				this.dom_node = document.createElement('div')
				this.dom_node.style.backgroundColor = this.bgcolor
				this.dom_node.style.position = 'absolute'
				this.dom_node.style.left = this.x + 'px'
				this.dom_node.style.top = this.y + 'px'

				this.dom_node.addEventListener('click', function(){
					this.on_click.emit()
				}.bind(this))

				if(this.width) this.dom_node.style.width = this.width + 'px'
				if(this.height) this.dom_node.style.height = this.height + 'px'
				if(this.rotation) this.dom_node.style.transform = 'rotateZ('+this.rotation+'deg)'

				if(this.text !== ""){
					var node = document.createTextNode(""+this.text)
					this.dom_node.style.color = this.fgcolor
					this.dom_node.appendChild(node)
				}
				parent.dom_node.appendChild(this.dom_node)
			}
		})
	}
	else{
		return node.extend("sprite")
	}

})