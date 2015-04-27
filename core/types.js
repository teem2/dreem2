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

	exports.positivenumber = {
		name:'positivenumber',
		parse:function(str){
			return Math.max(0, parseFloat(str))
		}
	}

	exports.easing_function = {
		name:'easing_function',
		parse:function(str){
			return str
		}
	}

	exports.json = {
		name:'json',
		parse:function(str){
			try {
				return JSON.parse(value);
			} catch (e) {
				return str;
			}
		}
	}

	exports.expression = {
		name:'expression',
		parse:function(str){
			return (new Function('return ' + str)).bind(this)()
		}
	}

	exports['*'] = {
		name:'*',
		parse:function(str){
			return str
		}
	}

	exports.object = {
		name:'object',
		parse:function(str){
			return str
		}
	}

	exports.function = {
		name:'function',
		parse:function(str){
			return str
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