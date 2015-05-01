/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/


define(function(require, exports, module)
{
	var RpcProxy = require("$CORE/rpcproxy")
	var node = require("$CLASSES/node")
	return node.extend("huelight", function()
	{
		var colorparse = require("$CORE/colorparser.js");
				
		Object.defineProperty(this, 'subRpcDef',
		{
				value:function(){ return {kind:'single',self:RpcProxy.createRpcDef(this, node)}}
		})
		
		this.attribute("parent", "number");
		this.attribute("init", "event")
				
		this.init = function()
		{
				console.color('~bg~H~~~by~u~~~br~e~~ object started on server\n')	
				this.hueID = 0;
				this.color = "black";
				console.log(this.parent);
		}
		
		this.attribute("color", "string" );
		
		this.color = function (newcol)
		{
			var RGB = colorparse(newcol);
			if (this.parent) this.parent.setLightRGB(this.hueID, RGB);
		};
				
		this.powerOn = function()
		{
			console.log("YESS", this.parent)
			return "I POWERED ON!"
		}
	})
})