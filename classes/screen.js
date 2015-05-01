define(function(require, exports, module){
	var node = require("$CLASSES/node.js")
	var sprite = require("$CLASSES/sprite")
	var teem = require("$CLASSES/teem.js")

	module.exports = node.extend("screen", function(){
		this.attribute("init", "string")
		this.spawn = function(){}
		this.render = function(){
			return sprite(this)
		}
		this.testCall = function(){
			console.log("Getting call")
			return "HII"
		}
	})
})