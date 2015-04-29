/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

define(function(require, exports, module){
	var node = require("$CLASSES/node")
	var sprite = require("$CLASSES/sprite")
	return node.extend("view", function(){
		this.onConstruct = function(){
		}
		this.render = function(){
			return sprite(this)
		}
	})
})