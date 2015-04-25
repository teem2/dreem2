define(function(require, exports, module){
	var node = require("../classes/node")
	var view = require("../classes/view")
	var text = require("../classes/text")
	var teem = require("../classes/teem")
	return view.extend("button", function(){
		this.attribute("label", "string")
		this.render = function(){
			return view({
				bgcolor:"gray",
				padding:10
				},				
				text({
					text:"${this.label}"
					}
				)
			)
		}
	})
})