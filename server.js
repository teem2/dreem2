/*
 The MIT License (MIT) (see LICENSE)
 Copyright ( c ) 2014-2015 Teem2 LLC

 TEEM ES6 server
*/
require = require('./define'); // support define.js modules

if (process.argv.indexOf('-nomoni') != -1) {
  define.onRequire = function(filename) {
    process.stderr.write('\x0F' + filename + '\n', function(){});
  };
}

var fs = require('fs'),
  path = require('path');

// Create a colorization function (ANSI output) use ~rb~ to set color in string
// and ~~ to end colorization.
console.color = (function colorize() {
    var colors = {
      bl:"30",   // black
      bo:"1",    // bold current color
      r:"0;31",  // red
      g:"0;32",  // green
      y:"0;33",  // yellow
      b:"0;34",  // blue
      m:"0;35",  // magenta
      c:"0;36",  // cyan
      w:"0;37",  // white
      br:"1;31", // bold red
      bg:"1;32", // bold green
      by:"1;33", // bold yellow
      bb:"1;34", // bold blue
      bm:"1;35", // bold magenta
      bc:"1;36", // bold cyan
      bw:"1;37"  // bold white
    };
    return function() {
      for (var v = Array.prototype.slice.call(arguments), i = 0; i < v.length; i++) {
        v[i] = String(v[i]).replace(/~(\w*)~/g, function(m, a) {
          return "\033[" + (colors[a] || 0) + "m";
        }) + "\033[0m";
        process.stdout.write(v[i]);
      }
    }
  })();

function main() {
  var argv = process.argv,
    args = {};

  for (var lastkey = '', arg, i = 0; i < argv.length; i++) {
    arg = argv[i];
    if (arg.charAt(0) == '-') {
      lastkey = arg;
      args[lastkey] = true;
    } else {
      args[lastkey] = arg;
    }
  }

  if (args['-web']) {
    args['-edit'] = true;
    args['-notify'] = true;
    args['-devtools'] = true;
    args['-delay'] = true;
    args['-nodreem'] = true;
    args['-browser'] = args['-web'];
    args['-extlib'] = args['-extlib'] || "../projects";
  }

  if (args['-h'] || args['-help'] || args['--h'] || args['--help']) {
    console.color('~by~Teem~~ Server ~bm~2.0~~\n');
    console.color('commandline: node server.js <flags>\n');
    console.color('~bc~-web htmlfile.html~~ Short for -edit -notify -devtools -nodreem -delay -browser htmlfile.html\n');
    console.color('~bc~-port ~br~[port]~~ Server port\n');
    console.color('~bc~-nomoni ~~ Start process without monitor\n');
    console.color('~bc~-iface ~br~[interface]~~ Server interface\n');
    console.color('~bc~-browser~~ Opens webbrowser on default app\n');
    console.color('~bc~-notify~~ Shows errors in system notification\n')
    console.color('~bc~-devtools~~ Automatically opens devtools in the browser\n');
    console.color('~bc~-close~~ Auto closes your tab when reloading the server\n');
    console.color('~bc~-delay~~ Delay reloads your pages when reloading the server\n');
    console.color('~bc~-nodreem~~ Ignore dreem.js changes for server reload\n');
    console.color('~bc~-restart~~ Auto restarts after crash (Handy for client dev, not server dev)\n');
    console.color('~bc~-edit~~ Automatically open an exception in your code editor at the right line\n');
    return process.exit(0);
  }

  define.EXTLIB = define.joinPath(define.ROOT, args['-extlib'] || '../projects');

  // Try to make a build dir. If it fails for any reason other than that it
  // already exists then exit.
  try {
    fs.mkdirSync(define.expandVariables(define.BUILD));
  } catch(e) {
    if (e.code !== 'EEXIST') {
      console.color('~br~Could not make build directory. ' + e + '~~\n');
      return process.exit(0);
    }
  }

  // Startup the appropriate class. The first time through we will startup
  // the run monitor. The run monitor will call main again causing the
  // teemserver or dali client to start up.
  var klass;
  if (args['-nomoni']) {
    klass = args['-dali'] ? require('$CORE/daliclient') : require('$CORE/teemserver');
  } else{
    klass = require('$CORE/runmonitor');
  }
  new klass(args);
}

main();