// Acorn AST -> Javascript conversion

define(function(require, exports, module)
{

	var astDef = {
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

	function AstSerializer(){

	}

	function statements(array, parent, serializer, dictionary)
	{
			
		var out = ''
		for(var i = 0;i < array.length; i++)
		{
			var node = array[i]
			out += serializer[node.type](node, parent, dictionary) 
		}
		return out
	}
	
	
	function list(array, parent, serializer, dictionary)
	{
	
		var out = ''
		for(var i = 0;i < array.length; i++)
		{
			var node = array[i]
			if(out)  out += ', '
			out += serializer[node.type](node, parent, dictionary)
		}
		return out
	}

	var astSerializer = 
	{
		call:function(node, parent, dictionary)
		{
			
	
			if(!(node.type in this)) throw new Error('Dont have '+node.type + ' in AST serialize')
			return this[node.type](node, parent, dictionary)
		},
		Program:function(node, parent, dictionary)
		{
			return statements(node.body, node, this, dictionary)
		},
		BinaryExpression:function(node, parent, dictionary)
		{
			return this.call(node.left, node, dictionary) + node.operator + this.call(node.right, node, dictionary)
		},
		AssignmentExpression:function(node, parent, dictionary)
		{
			return this.call(node.left, node, dictionary) + "=" + this.call(node.right, node, dictionary)
		},
		ExpressionStatement:function(node, parent, dictionary)
		{
			return this.call(node.expression,node, dictionary)
		},
		ThisExpression:function()
		{
			return 'this';
		},
		MemberExpression:function(node,parent,  dictionary)
		{
			if(node.computed) return this.call(node.object,  node, dictionary) + '[' + this.call(node.property, node, dictionary) + ']'
			
			var leftdictionary = dictionary;
			var rightdictionary = dictionary;
				
			if (node.object.type == "ThisExpression") 
			{
				leftdictionary = {};
			}
			else
			{
				rightdictionary = {};
			}
			
			 return this.call(node.object,node, leftdictionary) + '.' + this.call(node.property, node, rightdictionary)
		},
		CallExpression:function(node, parent, dictionary)
		{
			return this.call(node.callee, node, dictionary) + '(' + list(node.arguments, node, this, dictionary) + ')'
		},
		Identifier:function(node,parent, dictionary)
		{
			if (node.name in dictionary)
			{
				return "dr.IDdictionary." + node.name;
				
			}
			return node.name
		},
		
		Literal:function(node)
		{
			return node.raw
		}
	}

	function dumpAst(ast, depth)
	{
		if (depth == "undefined") depth = "";
		var out = ast.type + '\n'
		//for(var key in ast) out += depth + ' - ' + key
		var lut = astDef[ast.type]
		if(!lut) console.log(ast)
		for(var item in lut){
			var type = lut[item]
			if(type == 2){//array
				var array  = ast[item]
				if(array) for(var i = 0; i<array.length; i++)
				{
					out += depth + item + ' -> ' + dumpAst(array[i], depth + ' ')
				}				
			}
			else if(type == 1){
				out += depth + item + ' -> ' + dumpAst(ast[item], depth + ' ')
			}
		}
		return out
	}

	function serialize(ast, dictionary)
	{	
		return  astSerializer.call(ast,undefined, dictionary) ;
	}
	
		module.exports = {serialize: serialize, dump: dumpAst}

})
