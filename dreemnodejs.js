    var require = require('./define.js');
    var NodeWebSocket = require('./core/nodewebsocket');

    global.WebSocket = NodeWebSocket;
    // Create a colorization function (ANSI output) use ~rb~ to set color in string
    // and ~~ to end colorization.
    console.color = (function colorize() {
        var colors = {
            bl: "30", // black
            bo: "1", // bold current color
            r: "0;31", // red
            g: "0;32", // green
            y: "0;33", // yellow
            b: "0;34", // blue
            m: "0;35", // magenta
            c: "0;36", // cyan
            w: "0;37", // white
            br: "1;31", // bold red
            bg: "1;32", // bold green
            by: "1;33", // bold yellow
            bb: "1;34", // bold blue
            bm: "1;35", // bold magenta
            bc: "1;36", // bold cyan
            bw: "1;37" // bold white
        };
        return function() {
            for (var v = Array.prototype.slice.call(arguments), i = 0; i < v.length; i++) {
                v[i] = String(v[i]).replace(/~(\w*)~/g, function(m, a) {
                    return "\033[" + (colors[a] || 0) + "m";
                }) + "\033[0m";
                process.stdout.write(v[i] + "\n");
            }
        }
    })();
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
    var server = "http://localhost:8080";
    var composition = "example_spirallayout";
    var screen = "default";
    var reload = false;
    if (args["-server"]) server = args["-server"];
    
    // If preview exists, add preview to urls when communicating to the server.
    var preview = args["-preview"];

    // If loading exists, show a loading screen immediately, and remove when 
    // the application ui starts.
    var loading = args["-loading"];

    if (args["-composition"]) {
        composition = args["-composition"];
    } else {
        console.log("not starting without composition! use \"-composition composition\" to load composition.dre from the server!");
        process.exit();
    }
    
    if (args["-screen"]) screen = args["-screen"];
    if (args["-reload"]) reload = process.argv.join(' ');

    if (args["-dali"]) {
        define.SPRITE = "$ROOT/lib/dr/sprite_daliruntime";
        console.color("*** ~bw~D~bb~r~bg~e~by~e~br~m ~bw~Dali Runtime~~ ***");
    } else {
        define.SPRITE = "$ROOT/lib/dr/sprite_headless";
        console.color("*** ~bw~D~bb~r~bg~e~by~e~br~m ~bw~Headless Runtime~~ ***");
    }
    
    console.color("** using server: ~by~" + server + "~~");
    console.color("** using composition: ~by~" + composition + "~~");
    console.color("** using screen: ~by~" + screen + "~~");
    define.env = "v8";
    var http = require('http');
    var url = require('url');
    var fs = require('fs');

    // Some directories must be manually created
    // (ex: /dalicache is removed)
    var dirs = ["./dalicache", "./dalicache/classes", "./dalicache/classes/behavior", "./dalicache/compositions", "./dalicache/resources"];
    for (var i in dirs) {
        var dir = dirs[i];
	console.log('dir', dir, fs.existsSync(dir));
	if (fs.existsSync(dir) == false) {
            fs.mkdir(dir);
	}
    }

    define.MAIN = '';
    var loadedscripts = [];
    // the main dependency download queue counter
    var downloads = 0;
    var script_tags = {};
    var loaded = false;

    function startMain() {
        Unload();

        //the next line is a hack... but we need it for now..
        var JP = require("json-path");
        global.JsonPath = JP;
        
        define.ROOTSERVER = server;
        define.COMPOSITIONROOT = "./compositions/" +define.filePath( composition )+ "/";
        define.ROOTURL = "compositions/"+ composition + ".dre";
        define.ROOT = define.filePath(module.filename.replace(/\\/g, '/'));
        define.BUILD = "$ROOT/dalicache";
        define.MAIN = "$BUILD/compositions/" + composition + ".dre.screens." + screen + ".js";

	if (preview) {
	    define.COMPOSITIONROOT = UpdatePreview(define.COMPOSITIONROOT);
	    define.ROOTURL = UpdatePreview(define.ROOTURL);
	    define.BUILD = UpdatePreview(define.BUILD);
	    define.MAIN = UpdatePreview(define.MAIN);
	}

        var F = require(define.MAIN)();
        define.startMain();
        loaded = true;
    }


    function UpdatePreview(str) {
	return str.replace(/compositions/g, 'preview/compositions');
    }

    function Unload() {
        if (loaded == false) return;
        console.color("~~** ~rb~Unloading!~~");
    }

    function Reload() {
        // Reload the application (by replacing the running program with another
	// instance of ourself) if reload is set.
	if (reload) {
            console.log('Reloading application: ' + reload);
            var kexec = require('kexec');
	    kexec(reload);
	}
    }

    // Retrieve the main application file from the server to detect if the file
    // is in edit mode. A reload is invoked ONLY if the file is not in edit
    // mode. No changes to the server are required because this is only needed
    // in the short term.
    function selectiveReload() {
        script_url = server + "/build/compositions/" + composition + ".dre.screens." + screen + ".js";

	if (preview) script_url = UpdatePreview(script_url);

        var script = {}
        var scripturl = url.parse(script_url);
        var base_path = define.filePath(script_url);
        script.src = script_url;
        script_tags[script_url] = script;

        http.get({
            host: scripturl.hostname,
            port: scripturl.port,
            path: scripturl.path
        }, function(res) {
            res.src = script_url;
            res.data = "";
            res.on('data', function(buf) {
                this.data += buf;
            });
            res.on('end', function() {
                var editable = this.data.indexOf('editable');
                //console.log('*****onend. File loaded', editable);
	        if (editable == -1) {
		    // Reload because the application is not in edit mode
		    Reload();
		}
            });
        }.bind(this));
    }


    function CreateNeededFoldersForFilePath(path) {
        //console.log(path);
        var S = path.split('/');
        var pathsofar = '';
        if (path[0] == '/') pathsofar = '/';
        for (i = 1; i < S.length - 1; i++) {
            pathsofar += S[i] + '/';
            //console.log(pathsofar);
            if (fs.existsSync(pathsofar) == false) {
				console.log('mkdir', pathsofar);
                fs.mkdirSync(pathsofar);
            }
        }
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
            host: scripturl.hostname,
            port: scripturl.port,
            path: scripturl.path
        }, function(res) {
            res.src = script_url;
            res.data = "";
            res.on('data', function(buf) {
                this.data += buf;
            });
            res.on('end', function() {
                if (save_path.indexOf("/dalicache") > -1) {
                    CreateNeededFoldersForFilePath(save_path);
                    fs.writeFileSync(save_path, this.data);
                }
                define.findRequires(this.data).forEach(function(path) {
                    // Make path absolute and process variables
                    var dep_path = define.joinPath(base_path, remoteExpand(path));
                    var local_dep_path = define.joinPath(base_path, localExpand(path));
                    // automatic .js appending if not given
                    if (dep_path.indexOf(".js") != dep_path.length - 3) dep_path += '.js';
                    // load it
                    if (!script_tags[dep_path]) requireWalker(dep_path, script_url, local_dep_path);
                });
                if (!--downloads) {
                    console.color('~~** ~bg~download complete~~.');
                    startMain(); // no more deps
                }
            });
        }.bind(this));
        loadedscripts.push(script);
    }
    var main_file = "./dalicache/compositions/" + composition + ".dre.screens." + screen + ".js";
    if (preview) main_file = UpdatePreview(main_file);
console.log('main_file', main_file);

    function LoadAll() {
        var originalroot = define.ROOT;
        define.ROOT = server + "/" + composition + "/default";
        define.MAIN = server + "/build/compositions/" + composition + ".dre.screens." + screen + ".js";

	if (preview) {
	    define.ROOT = UpdatePreview(define.ROOT);
	    define.MAIN = UpdatePreview(define.MAIN);
	}

        requireWalker(define.MAIN, define.ROOT, main_file);
    }
    var sock;
    var sockethost = server + "/compositions/" + composition + ".dre"
    if (preview) sockethost = UpdatePreview(sockethost);

    var reconnect = function() {
        // put up websocket.
        console.color("~~** reconnect started");
        if (sock) sock.close();
        sock = new NodeWebSocket(sockethost);
        sock.onError = function(msg) {
            console.log("error in socket!");
            setTimeout(function() {
                reconnect();
            }.bind(this), 500);
        }.bind(this);
        sock.onMessage = function(msg) {
            try {
                msg = JSON.parse(msg);
            } catch (e) {}

	    // Dynamic editing support messages
	    switch (msg.type) {
            case 'undostack_do':
            case 'undostack_undo':
            case 'undostack_redo':
            case 'undostack_reset':
		console.log('*** undostack message', msg.type);
		break;
	    }

            if (msg.type == "sessionCheck") {
                console.color('~~** ~by~Files updated on server: downloading~~.');
		if (loaded) {
		    // selectiveReload only loads the file when not in edit mode
		    selectiveReload();
		    //Reload();
		} else {
		    LoadAll();
		}
            }
        }.bind(this);
        sock.onConnect = function() {
            console.color('~~** ~bg~Connected to server~~.');
        }
        sock.onClose = function() {
            setTimeout(function() {
                reconnect();
            }.bind(this), 500);
        }.bind(this);
    };
    // dali setup code
    var dalicontainer;
    var dalihost;
    var RootActor;
    if (args["-dali"]) {
        var window = {
            x: 0,
            y: 0,
	    // NOTE: I'm using a smaller size while debugging dynamic editing
            width: 1067, //1920,
            height: 600, //1080,
            transparent: false,
            name: 'Dreem Dali Runtime: ' + composition
        };
        
        var viewMode = {
            'stereoscopic-mode': 'mono', // stereo-horizontal, stereo-vertical, stereo-interlaced,
            'stereo-base': 65 // Distance in millimeters between left/right cameras typically between (50-70mm)
        };

        var options = {
            'window': window,
            'view-mode': viewMode,
        }
        
        console.log("** loading Dali")
        global.dali = require('./dalinode/dali')(options);

		// Show/hide a loading page
		global.show_loading_page = function() {
			var sz = dali.stage.getSize();
			dali.stage.setBackgroundColor([0.5, 0.5, 0.5, 1]);
			global.loading_page = new dali.Control('TextField');
			loading_page.text = "Loading...";

			// Compute scale to fit the text to the screen size
			var lpsz = loading_page.getNaturalSize();
			var scale = Math.min (sz.x / lpsz.x, sz.y / lpsz.y);
			var ptsize = loading_page.pointSize * scale / 2;
			loading_page.pointSize = ptsize;

			loading_page.parentOrigin = dali.CENTER;
			loading_page.anchorPoint = dali.CENTER;
			loading_page.horizontalAlignment = 'CENTER';
			loading_page.verticalAlignment = 'CENTER';

			dali.stage.add(loading_page);
		};

		global.remove_loading_page = function() {
			if (global.loading_page) {
				//console.log('Removing loading_page');
				dali.stage.remove(global.loading_page);
				global.loading_page = null;
			}
		};

		// Show a loading page
		if (loading)
			global.show_loading_page();


//        global.dali.stage.add(new global.dali.ImageActor(new global.dali.ResourceImage({url:"./img/shoarma.jpg"})));

        console.color("~~** Dali loaded");
        global.dalihost = require('./lib/dr/sprite_daliruntime/dalihost.js');
        global.dalihost.init();
    }
    // attempt to connect to the notifier service, download initial version and download again if changes have been made.
    reconnect();
    //LoadAll();
