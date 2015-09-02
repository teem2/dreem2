/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/
/**
 * @class TeemServer {Internal}
 * Main NodeJS HTTP server with support for WebSockets, static file handling and 
 * Composition objects
 */
define(function(require, exports, module) {
  module.exports = TeemServer;

  var http = require('http'),
    os = require('os'),
    path = require('path'),
    fs = require('fs'),
    
    FileWatcher = require('$CORE/filewatcher'),
    ExternalApps = require('$CORE/externalapps'),
    BusServer = require('$CORE/busserver'),
    CompositionServer = require('$CORE/compositionserver'),
    PluginLoader = require('./pluginloader'),
    NodeWebSocket = require('$CORE/nodewebsocket'),
    SauceRunner = require('$CORE/saucerunner');

  // Create a function to determine a mime type for a file.
  var mimeFromFile = (function() {
    var mimeTypes = {
      htm:"text/html;charset=utf-8",
      html:"text/html;charset=utf-8",
      js:"application/javascript;charset=utf-8",
      txt:"text/plain;charset=utf-8",
      css:"text/css;charset=utf-8",
      jpg:"image/jpeg",
      jpeg:"image/jpeg",
      ico:"image/x-icon",
      png:"image/png",
      gif:"image/gif"
    };
    var regex = RegExp("\\.(" + Object.keys(mimeTypes).join("|") + ")$");
    return function(name) {
      var ext = name.match(regex);
      return ext && mimeTypes[ext[1]] || "text/plain";
    }
  })();

  /**
    * @constructor
    */
  function TeemServer(args) {
    this.compositions = {};

    this.args = args;
    var port = this.args['-port'] || 8080,
      iface = this.args['-iface'] || '0.0.0.0';

    this.server = http.createServer(this.request.bind(this));
    this.server.listen(port, iface);
    this.server.on('upgrade', this.__upgrade.bind(this));

    if (iface == '0.0.0.0') {
      var ifaces = os.networkInterfaces(),
        txt = '', firstTime = true;
      Object.keys(ifaces).forEach(function(ifname) {
        var alias = 0;
        ifaces[ifname].forEach(function(iface) {
          if ('IPv4' !== iface.family) return;
          var addr = 'http://' + iface.address + ':' + port + '/';
          if (!this.address) this.address = addr;
          txt += ' ~~' + (firstTime ? 'on' : 'and') + ' ~c~' + addr;
          firstTime = false;
        }.bind(this));
      }.bind(this));
      console.color('Server running' + txt + '~~ Ready to go!\n');
    } else {
      this.address = 'http://' + iface + ':' + port + '/';
      console.color('Server running on ~c~' + this.address+"~~\n");
    }
    
    // Spawn a browser if so indicated
    var browser = this.args['-browser'];
    if (browser && (!this.args['-delay'] || this.args['-count'] == 0)) {
      ExternalApps.browser(this.address + (browser === true ? '' : browser), this.args['-devtools']);
    }
    
    this.watcher = new FileWatcher();
    this.watcher.onChange = function(file) {
      if (!args['-nodreem'] && file.indexOf('dreem.js') !== -1) {
        return this.broadcast({type:'delay'});
      }
      this.broadcast({
        type:'filechange',
        file:file
      })
    }.bind(this);
    
    this.busserver = new BusServer();
    
    process.on('SIGHUP', function() {
      if (this.args['-close']) this.broadcast({type:'close'});
      if (this.args['-delay']) this.broadcast({type:'delay'});
    }.bind(this))
    
    if (this.args['-web']) this.__getComposition(this.args['-web']);
    
    this.saucerunner = new SauceRunner();

    this.pluginLoader = new PluginLoader(this.args, this.name, this);
  }

  body.call(TeemServer.prototype)

  function body() {
    /** 
      * @method broadcast
      * Send a message to all my connected websockets and those on the compositions
      * @param {Object} msg JSON Serializable message to send
      */
    this.broadcast = function(msg) {
      this.busserver.broadcast(msg);
      for (var k in this.compositions) {
        this.compositions[k].busserver.broadcast(msg);
      }
    }

    /**
      * Find composition object by url 
      * @param {String} url 
      * @return {Composition|undefined} 
      */
    this.__getComposition = function(url) {
      // Strip Query
      var queryIndex = url.indexOf('?');
      if (queryIndex !== -1) url = url.substring(0, queryIndex);

      if (url.endsWith(define.DREEM_EXTENSION)) {
        url = url.substring(0, url.length - define.DREEM_EXTENSION.length);
        
        var pathParts = url.split('/'),
          i = pathParts.length,
          part, compName;
        while (i) {
          part = pathParts[--i];
          if (!part) pathParts.splice(i, 1);
        }
        compName = pathParts.join('/');
        
        if (compName) {
          var compositions = this.compositions;
          return compositions[compName] || (compositions[compName] = new CompositionServer(this.args, compName, this));
        }
      }
    };

    /**
      * Handle protocol upgrade to WebSocket
      * @param {Request} req 
      * @param {Socket} sock
      * @param {Object} head 
      */
    this.__upgrade = function(req, sock, head) {
      // lets connect the sockets to the app

      console.log(req.url);
      var sock = new NodeWebSocket(req, sock, head);
      sock.url = req.url;
      var composition = this.__getComposition(req.url);
      if (composition) {
		    composition.busserver.addWebSocket(sock);
      } else {
        this.busserver.addWebSocket(sock);
      }
    };

    /**
      * @method request
      * Handle main http server request
      * @param {Request} req 
      * @param {Response} res
      */
    this.request = function(req, res) {
      var url = req.url,
        composition = this.__getComposition(url);
      if (composition) {
        // if we are a composition request, send it to composition
        composition.request(req, res);
      } else {
        // otherwise handle as static file
        var filePath;
        if (url.indexOf('_extlib_') !== -1) {
          filePath = url.replace(/\_extlib\_/, define.expandVariables(define.EXTLIB));
        } else {
          filePath = path.join(define.expandVariables(define.ROOT), url);
        }
        
        if (filePath.indexOf('?') !== -1) {
          filePath = filePath.substring(0, filePath.indexOf('?'))
        }
        filePath = decodeURI(filePath);

        if (url[url.length - 1] == '/' && fs.existsSync(filePath + 'index.html')) {
          url = url + 'index.html';
          filePath = filePath + 'index.html';
        }

        fs.stat(filePath, function(err, stat) {
          if (err || !stat.isFile()) {
            if (url == '/favicon.ico') {
              res.writeHead(200);
              res.end();
            } else {
              res.writeHead(404);
              res.write('FILE NOT FOUND');
              res.end();
              console.color('~br~Error~y~ ' + filePath + '~~ In teemserver.js request handling. File not found, returning 404\n');
            }
          } else {
            var header = {
              "Cache-control":"max-age=0",
              "Content-Type": mimeFromFile(filePath),
              "ETag": stat.mtime.getTime() + '_' + stat.ctime.getTime() + '_' + stat.size
            };
            
            if (filePath.indexOf('saucerunner') !== -1) {
              var sauceRunnerHTML = this.saucerunner.getHTML(filePath);
              res.writeHead(200, header);
              res.end(sauceRunnerHTML);
            } else {
              this.watcher.watch(filePath);

              if (req.headers['if-none-match'] == header.ETag) {
                res.writeHead(304, header);
                res.end();
              } else {
                var stream = fs.createReadStream(filePath);
                res.writeHead(200, header);
                stream.pipe(res);
              }
            }
          }
        }.bind(this));
      }
    };
  }
});
