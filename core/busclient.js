/* Copyright 2015 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License. */

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

      var socketUrl;
      if (typeof(window) === "undefined") {
        // NodeJS Server
        socketUrl = this.targetserver + '/' + this.url;
      } else {
        // Client Browser
        socketUrl = 'ws://' + window.location.host + this.url;
      }
      this.socket = new WebSocket(socketUrl);

      this.socket.onConnect = this.socket.onopen = function() {
        this.backoff = 1;
        for (var i = 0; i < this.queue.length; i++) {
          this.socket.send(this.queue[i]);
        }
        this.queue = undefined;
      }.bind(this);

      this.socket.onError = this.socket.onerror = function() {
        //this.__reconnect()
      }.bind(this);

      this.socket.onClose = this.socket.onclose = function() {
        this.backoff = Math.min(1000, 2 * this.backoff);
        setTimeout(function() {this.__reconnect();}.bind(this), this.backoff);
      }.bind(this);

      this.socket.onMessage = this.socket.onmessage = function(event) {
        var msgdata = typeof(event) === "string" ? event : event.data;
        this.onMessage(JSON.parse(msgdata));
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