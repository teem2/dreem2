/** Provides an interface to platform specific Text functionality. */
// browser version

define(function(require, exports, module)
{
    function expressionresolver(expression)
	{
		//passthrough on browser
		return expression;
	}
	
	return expressionresolver;
});