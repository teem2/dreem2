define(function(require, exports, module)
{
	var node = require("$CLASSES/node")
	var teem = require("$CLASSES/teem")
	
	return node.extend("mouse", function()
	{				
		this.attribute("init", "event")
		
		this.init = function() 
		{
			console.color('~br~SmartConnect~~ mouse started on server\n')	
		}
		
		this.destroy = function()
		{			
			console.color('~br~SmartConnect~~ mouse destroyed on server\n')	
		}
	})
})