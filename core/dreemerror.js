/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

/**
 * @class DreemError
 * Unified Error class that holds enough information to 
 * find the right file at the right line
 */

define(function(require, exports, module){
	module.exports = DreemError
	
		/**
		 * @constructor
		 * @param {String} message Message
		 * @param {String} path Path of file
		 * @param {Int} line Line of error
		 * @param {Int} col Column of error
		 */
		function DreemError(message, path, line, col){
			this.message = message
			this.path = path
			this.line = line
			this.col = col
		}
		body.call(DreemError.prototype)

		function body(){
			this.toString = function(){
				return 'Dreem Error: '+this.path+(this.line!==undefined?":"+this.line+(this.col?":"+this.col:""):"")+"- " + this.message 
			}
		}
})