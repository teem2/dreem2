define(function(require, exports){
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
	return global;
});