define(function(require, exports){
	var dali = 
	{
		createElement:function(type)
		{
			log("creating element: " + type);
			var elem = {};
			elem.attachEvent = function(eventname, func)
			{
			}

			return elem;
		}
	};
	return dali;
});