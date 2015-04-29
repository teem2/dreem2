// Acorn AST -> Javascript conversion

define(function(require, exports, module){
	module.exports = AcornSerializer

	function AcornSerializer(){
	}

	body.call(AcornSerializer.prototype)

	function body(){

		this.statements = function(array, parent, args){
			var out = ''
			for(var i = 0; i < array.length; i++){
				var node = array[i]
				out += this[node.type](node, parent, args) 
			}
			return out
		}
	
		this.list = function(array, parent, args){
			var out = ''
			for(var i = 0;i < array.length; i++){
				var node = array[i]
				if(out)  out += ', '
				out += this[node.type](node, parent, args)
			}
			return out
		}

		this.astDef = {
			Program:{ body:2 },
			BinaryExpression:{left:1, right:1, operator:0},
			ExpressionStatement:{expression:1},
			MemberExpression:{object:1, property:1, computed:0},
			CallExpression:{callee:1, arguments:2},
			Identifier:{name:0},
			Literal:{raw:0, value:0},
			ThisExpression:{},
			AssignmentExpression: {left:1, right:1}
		}

		this.walk = function(node, parent, args){
			if(!(node.type in this)) throw new Error('Dont have '+node.type + ' in AST serialize')
			return this[node.type](node, parent, args)
		}

		this.Program = function(node, parent, args){
			return this.statements(node.body, node, args)
		}

		this.BinaryExpression = function(node, parent, args){
			return this.walk(node.left, node, args) + node.operator + this.walk(node.right, node, args)
		}

		this.AssignmentExpression = function(node, parent, args){
			return this.walk(node.left, node, args) + "=" + this.walk(node.right, node, args)
		}

		this.ExpressionStatement = function(node, parent, args){
			return this.walk(node.expression, node, args)
		}

		this.ThisExpression = function(){
			return 'this'
		}

		this.MemberExpression = function(node, parent, args){
			if(node.computed) return this.walk(node.object, node, args) + '[' + this.walk(node.property, node, args) + ']'
			return this.walk(node.object, node, args) + '.' + node.property.name
		}

		this.CallExpression = function(node, parent, args){
			return this.walk(node.callee, node, args) + '(' + this.list(node.arguments, node, args) + ')'
		}

		this.Identifier = function(node, parent, args){
			return node.name
		}
		
		this.Literal = function(node, parent, args){
			return node.raw
		}	
	}

	AcornSerializer.dump = function(ast, depth){
		if (depth == "undefined") depth = "";
		var out = ast.type + '\n'
		//for(var key in ast) out += depth + ' - ' + key
		var lut = astDef[ast.type]
		if(!lut) console.log(ast)
		for(var item in lut){
			var type = lut[item]
			if(type == 2){//array
				var array  = ast[item]
				if(array) for(var i = 0; i<array.length; i++) {
					out += depth + item + ' -> ' + dumpAst(array[i], depth + ' ')
				}				
			}
			else if(type == 1){
				out += depth + item + ' -> ' + dumpAst(ast[item], depth + ' ')
			}
		}
		return out
	}
})
