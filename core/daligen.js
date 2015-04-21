/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

/**
 * @class DaliGen
 * Class to create dali JS app (testing)
 */

define(function(require, exports, module){
	module.exports = DaliGen
	
	var Composition = require('./composition')

	// lets monitor all our dependencies and terminate if they change
	function DaliGen(args){
		this.args = args

		// lets load up a composition
		console.log("Running in DaliGen mode")
		var file = 'dalitest.dre'
		if(args['-dali'] !== true) file = args['-dali']
		var comp = new Composition(args, path.resolve(__dirname), file)
		var child

		comp.onChange = function(){
			if(child) child.kill()
			child = null
			comp.reload(function(err, pkg){
				if(err) return
				// output dali application
				var code = 'var dreem_classes = ' + JSON.stringify(pkg.classes) + '\n'
				code += 'var dreem_root = ' + JSON.stringify(pkg.root) + '\n'
				code += 'var methods = []\n' + pkg.methods + '\n'
				code += fs.readFileSync('dalihead.js')
				fs.writeFileSync('dalitest.js', code)
				child = child_process.spawn('dalirun',['dalitest.js'])
				console.log('Written new new dalitest.js')
			})
		}
		comp.onChange()
	}
})