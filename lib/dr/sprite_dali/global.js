define(function(require, exports, module){

	var view = require('$SPRITE/view.js');
	
	
	function Global()
	{
	this.addEventListener= function(type, callback, capture)
	{
		log("addEventListener" + type, callback, capture);
	},
	
	this.idleCallBackID=0,
	this.idleCallbackMap={},
	
	this.SetupIdleCallback=function(func)
	{
		this.idleCallBackID++;				
		this.idleCallbackMap[this.idleCallBackID] = func;
		return this.idleCallBackID ;
	},
	
	this.CancleIdleCallback= function(id)
	{
		delete idleCallbackMap[id];
	},
	this.createTextNode=function()
	{
		return view.createPlatformObject();
	}
	};
	
	module.exports = new Global();
});