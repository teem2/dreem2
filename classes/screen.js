/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

define(function(require, exports, module){
	var node = require("./node")
	var sprite = require("./sprite")

	return node.extend("screen", function(){
		this.attribute('init','event')
		this.message = function(msg){
			console.log("Got message call:" + msg)
		}	

		this.render = function(children){
			return sprite(children)
		}
	})
})