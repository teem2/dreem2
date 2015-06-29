/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
 */
/**
 * @class DaliGen
 * Class to create dali JS app (testing)
 */
define(function(require, exports, module) {
  module.exports = DaliClient;

  var http = require('http'),
    url = require('url'),
    fs = require('fs'),
    cp = require('child_process'),
    forever = require('forever-monitor'),
    NodeWebSocket = require('./nodewebsocket');

  // lets monitor all our dependencies and terminate if they change
  function DaliClient(args) {
    this.args = args;
    this.host = args['-dali'] === true? 'http://127.0.0.1:8080/uitest/dali': args['-dali'];
    this.url = url.parse(this.host);
    console.log("DaliClient connecting to " + this.host);
    this.reconnect();
  };

  function killDaliProcessTree(pid, killTree, signal, callback) {
    signal   = signal   || 'SIGKILL';
    callback = callback || function () {};

    if (killTree && process.platform !== 'win32') {
      psTree(pid, function (err, children) {
        [pid].concat(
          children.map(function (p) {
            return p.PID;
          })
        ).forEach(function (tpid) {
            try { process.kill(tpid, signal) }
            catch (ex) { }
          });

        callback();
      });
    }
    else {
      try { process.kill(pid, signal) }
      catch (ex) { }
      callback();
    }
  }

  body.call(DaliClient.prototype);

  function body() {
    // connect to server
    this.redownload = function() {
      console.log('starting redownload...');

      // lets fetch the main thing
      http.get({
          host: this.url.hostname,
          port: this.url.port,
          path: this.url.path
        },
        function(res) {
          var data = '';
          res.on('data', function(buf) {
            data += buf;
          });
          res.on('end', function() {
            var that = this;
            that.isRestarting = false;
            console.log('Dreem application updated, writing dali.js!');
            // write it and restart it.
            try {
              fs.writeFileSync('./dali.js', data);
              if (this.child) {
                  if (that.curProcId != -1) {
                    console.log("Stopping Dali application with PID " + that.curProcId);
                    process.kill(that.curProcId);
                    that.curProcId = -1;
                  }

              } else {
                this.child = forever.start([ './scriptrunner.example', './dali.js' ], {
                  silent: true,
                  'uid': 'dreemdali',
                  'minUptime': 3000,     // Minimum time a child process has to be up. Forever will 'exit' otherwise.
                  'spinSleepTime': 1000, // Interval between restarts if a child is spinning (i.e. alive < minUptime).
                  // 'sourceDir': 'script/path',// Directory that the source script is in
                });
                console.log('Spawning forever-monitor instance for Dali: pid=', this.child.child.pid);
                this.child.on('start', function() {
                  that.curProcId = that.child.child.pid;
                  console.log("forever process started: curProcId=" + that.curProcId);
                });
                this.child.on('restart', function() {
                  that.curProcId = that.child.child.pid;
                  console.log("forever process started: curProcId=" + that.curProcId);
                });
                this.child.on('exit', function() {
                  console.log("forever process with PID " + that.curProcId + " exited");
                });
              }


              /* this.child = child_process.spawn('./scriptrunner.example', ['./dali.js']);
               this.child.on('close', function(code) {
               this.child = undefined;
               }.bind(this));
               this.child.on('error', function(){
               });*/
            } catch(e) {
              console.log(e)
            }
          }.bind(this));
        }.bind(this));
    }

    this.reconnect = function() {
      // put up websocket.
      if (this.sock) this.sock.close();

      this.sock = new NodeWebSocket(this.host);
      this.sock.onError = function(msg) {
        setTimeout(function() {
          this.reconnect();
        }.bind(this), 500);
      }.bind(this);

      this.sock.onMessage = function(msg) {
        try {
          msg = JSON.parse(msg);
        } catch(e){}
        if (msg.type == "sessionCheck") {
          console.log('attempting redownload!');
          this.redownload();
        }
      }.bind(this);

      this.sock.onClose = function() {
        setTimeout(function() {
          this.reconnect();
        }.bind(this), 500);
      }.bind(this);
    };
  }
})