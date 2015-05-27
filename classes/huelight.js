/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/
define(function(require, exports, module)
{
	var node = require("$CLASSES/teem_node")
	return node.extend("huelight", function()
	{
		this.__attribute("init", "event")
		this.init = function()
		{
			console.log(this);
			console.color('~br~H~~~by~y~~~br~e~~ object started on server\n')	
		}
	})
})