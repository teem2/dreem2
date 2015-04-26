define(function(require, exports){
	var dali = 
	{
		createElement:function(type)
		{
			log("creating element: " + type);
			var elem = {};
			elem.style = {};
			elem.children = [];
			elem.appendChild = function(child)
			{
				elem.children.push(child);
			}
			elem.attachEvent = function(eventname, func)
			{
			}

			return elem;
		}
	};
	return dali;
});