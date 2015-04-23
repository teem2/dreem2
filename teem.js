/*
 The MIT License (MIT) (see LICENSE)
 Copyright ( c ) 2014-2015 Teem2 LLC

 TEEM ES6 server
*/
require = require('./define') // support define.js modules

if(process.argv.indexOf('-nomoni') != -1){
	define.onRequire = function(filename){
		process.stderr.write('\x0F'+filename+'\n', function(){})
	}
}

var fs = require('fs')
var path = require('path')

// ok now we can require components
var colorize = require('./core/colorize')

console.color = colorize(function(v){
	process.stdout.write(v)
})

function main(){
	var args = {}
	var argv = process.argv
	for(var lastkey = '', arg, i = 0; i<argv.length; i++){
		arg = argv[i]
		if(arg.charAt(0) == '-') lastkey = arg, args[lastkey] = true
		else args[lastkey] = arg
	}

	if(args['-web']){
		args['-edit'] = true
		args['-notify'] = true
		args['-devtools'] = true
		args['-delay'] = true
		args['-nodreem'] = true
		args['-browser'] = args['-web']
	}

	if(args['-h'] || args['-help'] || args['--h']|| args['--help']){
		console.color('~by~Teem~~ Server ~bm~2.0~~\n')
		console.color('commandline: node teem.js <flags>\n')
		console.color('~bc~-web htmlfile.html~~ Short for -edit -notify -devtools -nodreem -delay -browser htmlfile.html\n')	
		console.color('~bc~-port ~br~[port]~~ Server port\n')
		console.color('~bc~-nomoni ~~ Start process without monitor\n')
		console.color('~bc~-iface ~br~[interface]~~ Server interface\n')
		console.color('~bc~-browser~~ Opens webbrowser on default app\n')
		console.color('~bc~-notify~~ Shows errors in system notification\n')
		console.color('~bc~-devtools~~ Automatically opens devtools in the browser\n')
		console.color('~bc~-close~~ Auto closes your tab when reloading the server\n')
		console.color('~bc~-delay~~ Delay reloads your pages when reloading the server\n')
		console.color('~bc~-nodreem~~ Ignore dreem.js changes for server reload\n')
		console.color('~bc~-restart~~ Auto restarts after crash (Handy for client dev, not server dev)\n')
		console.color('~bc~-edit~~ Automatically open an exception in your code editor at the right line\n')
		return process.exit(0)
	}

	if(args['-nomoni']){
		if(args['-dali']){
			var DaliGen = require('./core/daligen')
			new DaliGen(args)
		}
		else{
			var TeemServer = require('./core/teemserver')
			new TeemServer(args, define.filePath(module.filename))
		}
	}
	else{
		var RunMonitor = require('./core/runmonitor')
		new RunMonitor(args)
	}
}

main()