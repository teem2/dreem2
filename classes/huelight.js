/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

define(function(require, exports, module)
{
	var node = require("$CLASSES/node")
	return node.extend("huelight", function(){
		this.attribute("init", "event")

		this.init = function(){
			console.log(this);
			console.color('~br~H~~~by~y~~~br~e~~ object started on server\n')	
		}

		this.powerOn = function(){
			console.log("YESS", this.parent)
			return "I POWERED ON!"
		}
	})
})