/** Provides an interface to platform specific Text functionality. */
// dali version

define(function(require, exports, module)
{
	var JS = require('$LIB/jsclass.js');
    var acorn = require('$LIB/acorn.js');

   var expressionresolver = new JS.Class('expressionresolver',  
	{
		parse:  function(expression)
		{
			console.log("attempting to parse expression: ");
			console.log(expression);
			
			console.dir(JSON.stringify(acorn.parse(expression)));
			
			return expression;
		}
	})
	return expressionresolver;
});