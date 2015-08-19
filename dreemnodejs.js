    var require = require('./define.js');
    var NodeWebSocket = require('./core/nodewebsocket');
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
    if (args["-server"]) server = args["-server"];
    if (args["-composition"]) {
        composition = args["-composition"];
    } else {
        console.log("not starting without composition! use \"-composition composition\" to load composition.dre from the server!");
        process.exit();
    }
    if (args["-screen"]) screen = args["-screen"];
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
    if (fs.existsSync("./dalicache") == false) {
        fs.mkdir("./dalicache");
    }
    if (fs.existsSync("./dalicache/classes") == false) {
        fs.mkdir("./dalicache/classes");
    }
    if (fs.existsSync("./dalicache/compositions") == false) {
        fs.mkdir("./dalicache/compositions");
    }
    define.MAIN = '';
    var loadedscripts = [];
    // the main dependency download queue counter
    var downloads = 0;
    var script_tags = {};
    var loaded = false;

    function startMain() {
        Unload();
        define.ROOT = define.filePath(module.filename.replace(/\\/g, '/'));
        define.BUILD = "$ROOT/dalicache";
        define.MAIN = "$BUILD/compositions/" + composition + ".dre.screens." + screen + ".js";
        var F = require(define.MAIN)();
        define.startMain();
        loaded = true;
    }

    function Unload() {
        if (loaded == false) return;
        console.color("~~** ~rb~Unloading!~~");
    }

    function CreateNeededFoldersForFilePath(path) {
        console.log(path);
        var S = path.split('/');
        var pathsofar = '';
        if (path[0] == '/') pathsofar = '/';
        for (i = 1; i < S.length - 1; i++) {
            pathsofar += S[i] + '/';
            //console.log(pathsofar);
            if (fs.existsSync(pathsofar) == false) {
                fs.mkdir(pathsofar);
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

    function LoadAll() {
        var originalroot = define.ROOT;
        define.ROOT = server + "/" + composition + "/default";
        define.MAIN = server + "/build/compositions/" + composition + ".dre.screens." + screen + ".js";
        requireWalker(define.MAIN, define.ROOT, main_file);
    }
    var sock;
    var sockethost = server + "/compositions/" + composition + ".dre"
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
            if (msg.type == "sessionCheck") {
                console.color('~~** ~by~Files updated on server: downloading~~.');
                LoadAll();
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
            x: 100,
            y: 0,
            width: 600,
            height: 508,
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

//        global.dali.stage.add(new global.dali.ImageActor(new global.dali.ResourceImage({url:"./img/shoarma.jpg"})));

        console.color("~~** Dali loaded");
        global.dalihost = require('./lib/dr/sprite_daliruntime/dalihost.js');
        global.dalihost.init();
    }
    // attempt to connect to the notifier service, download initial version and download again if changes have been made.
    reconnect();
    //LoadAll();