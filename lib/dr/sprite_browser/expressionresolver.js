/** Provides an interface to platform specific Text functionality. */
// browser version


define(function(require, exports, module)
{
	var JS = require('$LIB/jsclass.js');
    var expressionresolver = new JS.Class('expressionresolver', 
	{
		parse:  function(expression)
		{
			console.log("attempting to parse expression: ");
			console.log(expression);
			return expression;
		}
	})
	return expressionresolver;
});