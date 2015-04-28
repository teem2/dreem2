define(function(require, exports, module){
	module.exports = serializer

	var acorn = require('$LIB/acorn')

	var ast = acorn.parse("im(a+5)*expr+es-ion.b.c")

	var astDef = {
		Program:{ body:2 },
		BinaryExpression:{left:1, right:1, operator:0},
		ExpressionStatement:{expression:1},
		MemberExpression:{object:1, property:1, computed:0},
		CallExpression:{callee:1, arguments:2},
		Identifier:{name:0},
		Literal:{raw:0, value:0}
	}

	function AstSerializer(){

	}

	function statements(array, parent, serializer){
		var out = ''
		for(var i = 0;i < array.length; i++){
			var node = array[i]
			out += serializer[node.type](node) +';\n'
		}
		return out
	}
	
	function list(array, parent, serializer){
		var out = ''
		for(var i = 0;i < array.length; i++){
			var node = array[i]
			if(out)  out += ', '
			out += serializer[node.type](node, parent)
		}
		return out
	}

	var astSerializer = {
		call:function(node, parent){
			if(!(node.type in this)) throw new Error('Dont have '+node.type + ' in AST serialize')
			return this[node.type](node, parent)
		},
		Program:function(node){
			return statements(node.body, node, this)
		},
		BinaryExpression:function(node){
			return this.call(node.left, node) + node.operator + this.call(node.right, node)
		},
		ExpressionStatement:function(node){
			return this.call(node.expression)
		},
		MemberExpression:function(node){
			if(node.computed) return this.call(node.object,  node) + '[' + this.call(node.property, node) + ']'
			else return this.call(node.object) + '.' + this.call(node.property)
		},
		CallExpression:function(node){
			return this.call(node.callee) + '(' + list(node.arguments, node, this) + ')'
		},
		Identifier:function(node){
			return node.name
		},
		Literal:function(node){
			return node.raw
		}
	}

	function dumpAst(ast, depth){
		var out = ast.type + '\n'
		//for(var key in ast) out += depth + ' - ' + key
		var lut = astDef[ast.type]
		if(!lut) console.log(ast)
		for(var item in lut){
			var type = lut[item]
			if(type == 2){//array
				var array  = ast[item]
				if(array) for(var i = 0; i<array.length; i++){
					out += depth + item + ' -> ' + dumpAst(array[i], depth + ' ')
				}
			}
			else if(type == 1){
				out += depth + item + ' -> ' + dumpAst(ast[item], depth + ' ')
			}
		}
		return out
	}

	//console.log(dumpAst(ast, ''))

	console.log( astSerializer.call(ast) )

	function serializer(ast){
		switch(ast.type){
		}

	}

})
