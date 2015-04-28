define(function(require, exports, module)
{
	var view = require('$SPRITE/view.js');
	
	
	function Global()
	{
		this.addEventListener= function(type, callback, capture)
		{
			log("addEventListener" + type, callback, capture);
		},
		
		this.idleCallBackID=0;
		
		this.idleCallbackMap={};
		
		this.attachEvent = function (eventname, func)
		{
			console.log("attach Event on global");
			for(a in arguments)
			{
				console.log(a + " " + arguments[a]);
			}
			
		}
		
		this.SetupIdleCallback=function(func)
		{
			this.idleCallBackID++;				
			this.idleCallbackMap[this.idleCallBackID] = func;		
			return this.idleCallBackID ;
		};
		
		this.CancleIdleCallback= function(id)
		{
			delete this.idleCallbackMap[id];
		};
		
		this.Time = 0;
		
		this.callAllIdleFunctions =function()
		{
		this.Time+=30;
			for (a in this.idleCallbackMap)
			{
				this.idleCallbackMap[a](Time);			
			}
		};
		
		this.createTextNode=function()
		{
			return view.prototype.createPlatformObject();
		}
	};
	
	module.exports = new Global();
});