/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License. */

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
      
      // delaying connect a bit.
      setTimeout(function(){this.onConnect(sock)}.bind(this), 10);
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
    this.onConnect = function( socket) {console.log("empty sock? ")};
    
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