/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

define(function(require){
	// load up the requires
	var Node = require('./node.js')

	// export the main class
	return Node.extend('Dali', function(){

		this.attribute('construct', this.types.Event)

		this.constructor = function(){
		}

		this.render = function(){

			// we return ourselves when rendering
			return this
		}
	})
})