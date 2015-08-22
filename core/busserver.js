/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/
/**
 * @class BusServer {Internal}
 * Holds a set of server side sockets for broadcast
 */
define(function(require, exports, module) {
  module.exports = BusServer;

  function BusServer() {
    this.sockets = [];
  };

  body.call(BusServer.prototype);

  function body() {
    /**
      * @method addWebSocket
      * adds a WebSocket to the BusServer
      * @param {WebSocket} sock socket to add
      */
    this.addWebSocket = function(sock) {
      this.sockets.push(sock);
      
      sock.onClose = function() {
        this.sockets.splice(this.sockets.indexOf(sock), 1);
        sock.onClose = undefined;
      }.bind(this);
      
      sock.onMessage = function(message) {
        this.onMessage(JSON.parse(message), sock);
      }.bind(this);
      
      this.onConnect(sock);
    };
    
    /**
     * @event onMessage
     * Called when a new message appears on any of the sockets
     * @param {Object} message
     * @param {WebSocket} socket
     */
    this.onMessage = function(message, socket) {};
    
    /**
     * @event onConnect
     * Called when a new socket appears on the bus
     * @param {Object} message
     * @param {WebSocket} socket
     */
    this.onConnect = function(message, socket) {};
    
    /** 
      * @method broadcast
      * Send a message to all connected sockets
      * @param {Object} message
      */
    this.broadcast = function(message, ignore) {
      message = JSON.stringify(message);
      for (var i = 0; i < this.sockets.length; i++){
        var socket = this.sockets[i]
        if(socket !== ignore) socket.send(message);
      }
    };
    
    this.closeAll = function() {
      for (var i = 0; i < this.sockets.length; i++) this.sockets[i].close();
      this.sockets = [];
    };
  }
})