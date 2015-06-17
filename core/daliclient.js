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
    child_process = require('child_process'),
    NodeWebSocket = require('./nodewebsocket');

  // lets monitor all our dependencies and terminate if they change
  function DaliClient(args) {
    this.args = args;
    this.host = args['-dali'] === true? 'http://127.0.0.1:8080/uitest/dali': args['-dali'];
    this.url = url.parse(this.host);
    console.log("DaliClient connecting to " + this.host);
    this.reconnect();
  };

  body.call(DaliClient.prototype);

  function body() {
    // connect to server
    this.redownload = function() {
      // lets fetch the main thing
      http.get({
        host: this.url.hostname,
        port: this.url.port,
        path: this.url.path
      }, 
      function(res) {
        var data = '';
        res.on('data', function(buf) {data += buf;});
        res.on('end', function() {
          // write it and restart it.
          try {
            fs.writeFileSync('./dali.js', data);
            if (this.child) {
              var kill = this.child;
              this.child = undefined;
              var i = 0;
              var itv = this.setInterval(function() {
                try {kill.kill('SIGTERM');} catch(e) {}
                if (i++ > 20) this.clearInterval(itv);
              },10);
            }
            this.child = child_process.spawn('./scriptrunner.example', ['./dali.js']);
            this.child.on('close', function(code) {
              this.child = undefined;
            }.bind(this));
            this.child.on('error', function(){});
          } catch(e) {
            //console.log(e)
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