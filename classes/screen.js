/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

define(function(require, exports, module){
	var node = require("../classes/node")
	return node.extend("screen", function(){
		this.message = function(msg){
			console.log("Got message call:" + msg)
		}	
	})
})