/*
 The MIT License (MIT) (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

define(function(require, exports, module){
	var colorParser = require('./colorparser.js')

	exports.number = {
		name:'number',
		parse:function(str){
			return parseFloat(str)
		}
	}

	exports.string = {
		name:'string',
		parse:function(str){
			return str
		}
	}

	exports.boolean = {
		name:'boolean',
		parse:function(str){
			if(str === 'true') return true
			else return false
		}
	}

	exports.color = {
		name:'color',
		parse:function(col){
			return colorParser(col)
		}
	}

	exports.event = {
		name:'event',
		parse:function(v){ return v }
	}
})