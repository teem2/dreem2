define(function(require, exports){
	var global = {};
	global.addEventListener = function(type, callback, capture)
	{
		log("addEventListener" + type, callback, capture);
	}
	return global;
});