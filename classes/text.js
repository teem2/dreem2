/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

define(function(require, exports, module){
	var node = require("../classes/node")

	if(define.env == 'v8'){
		return node.extend("sprite", function(){
			this.spawn = function(parent){
			}
		})
	}
	else if(define.env == 'browser'){
		return node.extend("sprite", function(){

			this.attribute('bgcolor', 'color')

			this.render = function(){
				return this
			}

			this.spawn = function(parent){
				this.domNode = document.createElement('div')
				parent.domNode.appendChild(this.domNode)
			}
		})
	}
	else{
		return node.extend("sprite")
	}

})