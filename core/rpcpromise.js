/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License. */

define(function(require, exports, module) {
  module.exports = RpcPromise;

  function RpcPromise(sendbus) {
    // ok lets initialize from rpcObject by forwarding to all individual rpc objects.
    // how?...
    this.sendbus = sendbus;
    this.promises = {};
    this.uid_free = [];
    this.uid = 0;
  };

  body.call(RpcPromise.prototype);

  function body() {
    this.sendAndCreatePromise = function(msg) {
      var uid;
      
      if (this.uid_free.length) {
        uid = this.uid_free.pop();
      } else {
        uid = this.uid++;
      }
      
      if (this.uid > 100) {
        // TODO make a promise timeout cleanup
        console.log('Warning, we have an RPC promise leak');
        for (var i = 0; i < 100; i++) {
          console.log(this.promises[i].msg);
        }
      }
      
      var resolve, reject;
      var prom = new Promise(function(_resolve, _reject) {resolve = _resolve, reject = _reject;});
      prom.resolve = resolve;
      prom.reject = reject;
      prom.msg = msg;
      
      this.promises[uid] = prom;
      msg.uid = uid;
      
      if (this.sendbus.readyState == 3) {
        prom.resolve(null);
        return prom;
      }
      
      this.sendbus.send(msg);
      
      return prom;
    }
    
    this.resolveResult = function(msg) {
      var promise = this.promises[msg.uid];
      if (!promise) return console.log('Error resolving RPC promise id ' + msg.uid);
      this.uid_free.push(msg.uid);
      this.promises[msg.uid] = undefined;
      if (msg.error) {
        promise.reject(msg.value);
      } else{
        promise.resolve(msg.value);
      }
    };
  };
})