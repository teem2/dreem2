/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

/* Promisify turns a node-callback using function into a promise using function*/
define(function(require, exports, module){
	module.exports = promisify

	function promisify(call){
		return function(){
			var arg = Array.prototype.slice.call(arguments)
			return new Promise(function(resolve, reject){
				arg.push(function(err, result){
					if(err) reject(err)
					else resolve(result)
				})
				call.apply(this, arg)
			}.bind(this))
		}
	}
})