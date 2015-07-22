
console.log("*** Dreem Headless Runner ***");

var require = require('./define.js');
 var NodeWebSocket = require('./core/nodewebsocket');

define.SPRITE = "$ROOT/lib/dr/sprite_headless";
define.env = "v8";

var http = require('http');
var url = require('url');
var fs = require('fs');

if (fs.existsSync("./dalicache") == false) {
	fs.mkdir("./dalicache");
}

var server = "http://localhost:8080";
var composition = "example_spirallayout";
var screen = "default";

define.MAIN = './build/compositions.example_spirallayout.dre.screens.default.js';

var loadedscripts = [];

// the main dependency download queue counter
var downloads = 0;
var script_tags = {};

function startMain() {
	console.log("starting!");
	define.ROOT = define.filePath(module.filename.replace(/\\/g, '/'));
	define.BUILD = "$ROOT/dalicache";
	define.MAIN =  "$BUILD/compositions." + composition + ".dre.screens." + screen + ".js";

	var F = require(define.MAIN)();
	define.startMain();
}

function localExpand(path) {
	var originalroot = define.ROOT;
	var originalbuild = define.BUILD;
	define.BUILD = "$ROOT/dalicache";
	define.ROOT = define.filePath(module.filename.replace(/\\/g, '/'));
	var ret = define.expandVariables(path)
		define.ROOT = originalroot;
	define.BUILD = originalbuild;
	return ret;
}

function remoteExpand(path) {
	var originalroot = define.ROOT;
	var originalbuild = define.BUILD;
	define.BUILD = "$ROOT/build";
	define.ROOT = server; // + "/" + composition + "/default";
	var ret = define.expandVariables(path)
		define.ROOT = originalroot;
	define.BUILD = originalbuild;
	return ret;
}

function requireWalker(script_url, from_file, save_path) {

	var script = {}
	var scripturl = url.parse(script_url);
	var base_path = define.filePath(script_url);

	script.src = script_url;
	script_tags[script_url] = script;
	downloads++;

	http.get({
		host : scripturl.hostname,
		port : scripturl.port,
		path : scripturl.path
	},
		function (res) {
		res.src = script_url;
		res.data = "";
		res.on('data', function (buf) {
			this.data += buf;
		});

		res.on('end', function () {
			if (save_path.indexOf("/dalicache") > -1) {
				fs.writeFileSync(save_path, this.data);
			}

			define.findRequires(this.data).forEach(function (path) {
				// Make path absolute and process variables
				var dep_path = define.joinPath(base_path, remoteExpand(path));
				var local_dep_path = define.joinPath(base_path, localExpand(path));

				// automatic .js appending if not given
				if (dep_path.indexOf(".js") != dep_path.length - 3)
					dep_path += '.js';

				// load it
				if (!script_tags[dep_path])
					requireWalker(dep_path, script_url, local_dep_path);
			});
			if (!--downloads)
				startMain(); // no more deps

		});
	}
		.bind(this));

	loadedscripts.push(script);
}

var main_file = "./dalicache/compositions." + composition + ".dre.screens." + screen + ".js";

function LoadAll() {
	var originalroot = define.ROOT;
	define.ROOT = server + "/" + composition + "/default";
	define.MAIN = server + "/build/compositions." + composition + ".dre.screens." + screen + ".js";
	requireWalker(define.MAIN, define.ROOT, main_file);
}

//LoadAll();
var sock;

var sockethost = server + "/" + composition + "/default";
var reconnect = function() {
      // put up websocket.
      if (sock) sock.close();
      
      sock = new NodeWebSocket(sockethost);
      sock.onError = function(msg) {
        setTimeout(function() {
          reconnect();
        }.bind(this), 500);
      }.bind(this);
      
      sock.onMessage = function(msg) {
        try {
          msg = JSON.parse(msg);
        } catch(e){}
        if (msg.type == "sessionCheck") {
          console.log('attempting redownload!');
          LoadAll();
        }
      }.bind(this);
      
      sock.onClose = function() {
        setTimeout(function() {
          reconnect();
        }.bind(this), 500);
      }.bind(this);
    };
	
reconnect();
	
//define.ROOT = originalroot;

// open dre file
// download all built files for this composition to a local folder
// require them + download their dependencies
