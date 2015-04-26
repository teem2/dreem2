define(function(require, exports){

	var view = require('$SPRITE/view.js');
	
	var global = {};

	global.addEventListener = function(type, callback, capture)
	{
		log("addEventListener" + type, callback, capture);
	}
	
	global.idleCallBackID = 0;
	global.idleCallbackMap = {};
	
	global.SetupIdleCallback = function(func)
	{
		this.idleCallBackID++;				
		this.idleCallbackMap[this.idleCallBackID] = func;
		return this.idleCallBackID ;
	}
	
	global.CancleIdleCallback = function(id)
	{
		delete idleCallbackMap[id];
	}
	
	global.createTextNode = function()
	{
		return view.createPlatformObject();
	}
	return global;
});