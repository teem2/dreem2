// Acorn AST -> Javascript conversion

define(function(require, exports, module){

	var AcornSerializer = require('$CORE/acornserializer')

	module.exports = AstBindingWalker
	function AstBindingWalker(){
		this.references = []
	}

	AstBindingWalker.prototype = Object.create(AcornSerializer.prototype)
	body.call(AstBindingWalker.prototype)

	function body(){

		this.MemberExpression = function(node, parent, arg){
			// ok we are a member expression
			if(node.computed) return this.walk(node.object, node, arg) + '[' + this.walk(node.property, node) + ']'
			if(arg) arg.unshift(node.property.name)
			else {
				this.references.push(arg = [node.property.name])
			}
			return this.walk(node.object, node, arg) + '.' + node.property.name
		}

		this.Identifier = function(node, parent, arg){
			if(arg) arg.unshift(node.name)
			return node.name
		}
		
		this.Literal = function(node, parent, arg){
			return node.raw
		}	
	}
})
