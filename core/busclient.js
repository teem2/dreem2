/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/
/**
 * @class BusClient {Internal}
 * Auto (re)connecting always writable socket
 */
define(function(require, exports, module) {
  module.exports = BusClient;

  function BusClient(url, server) {
    this.url = url || '';
    this.targetserver = server || '';
    this.backoff = 1;
    this.__reconnect();
  }

  body.call(BusClient.prototype);

  function body() {
    /** Connect/Reconnect to the server. */
    this.__reconnect = function() {
      // Disconnect
      if (this.socket) {
        this.socket.onclose = undefined;
        this.socket.onerror = undefined;
        this.socket.onmessage = undefined;
        this.socket.onopen = undefined;
        this.socket.close();
        this.socket = undefined;
      }
      
      if (!this.queue) this.queue = [];

      if (typeof(WebSocket) === "undefined"){
        console.log("no websocket available, starting NodeWebSocket using " + this.targetserver + " and " + this.url);
         var NodeWebSocket = require('./nodewebsocket');
         var socketurl = this.targetserver +'/'+ this.url;
        this.socket = new NodeWebSocket(socketurl);
      } else {
        this.socket = new WebSocket('ws://' + window.location.host + this.url);
      }

      this.socket.onConnect = 
      this.socket.onopen = function() {
        this.backoff = 1;
        for (var i = 0; i < this.queue.length; i++) {
          this.socket.send(this.queue[i]);
        }
        this.queue = undefined;
      }.bind(this);
      this.socket.onError = 
      this.socket.onerror = function() {
        //this.__reconnect()
        
      }.bind(this);
      
      this.socket.onClose = 
      this.socket.onclose = function() {
        
        this.backoff = Math.min(1000, 2 * this.backoff);
        setTimeout(function() {this.__reconnect();}.bind(this), this.backoff);
      }.bind(this);
      
      this.socket.onMessage = 
      this.socket.onmessage = function(event) {
          if (typeof(event)==="string"){
            var msgdata = event;
            this.onMessage(JSON.parse(msgdata));
          }else{
            this.onMessage(JSON.parse(event.data));
          }

      }.bind(this);
    };
    
    /**
     * @method send
     * Send a message to the server
     * @param {Object} msg JSON.stringifyable message to send
     */
    this.send = function(msg) {
      if (this.queue) {
        this.queue.push(JSON.stringify(msg));
      } else {
        this.socket.send(JSON.stringify(msg));
      }
    };
    
    /**
     * @event onMessage
     * Called when a message arrives from the server
     * @param {Object} message The received message
     */
    this.onMessage = function(message) {};
  }
})