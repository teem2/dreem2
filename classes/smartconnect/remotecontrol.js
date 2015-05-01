define(function(require, exports, module)
{
	var node = require("$CLASSES/node")
	var teem = require("$CLASSES/teem")
	
	return node.extend("remotecontrol", function()
	{				
		this.attribute("init", "event")
		
		this.init = function() 
		{
			console.color('~br~SmartConnect~~ remotecontrol started on server\n')	
		}
		
		this.destroy = function()
		{			
			console.color('~br~SmartConnect~~ remotecontrol destroyed on server\n')	
		}
	})
})