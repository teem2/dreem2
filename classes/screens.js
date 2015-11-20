/* Copyright 2015 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License. */

define(function(require, exports, module){
  var Node = require('$CLASSES/teem_node'),
    teem = require('$CLASSES/teem'),
    RpcProxy = require('$CORE/rpcproxy'),
    RpcMulti = require('$CORE/rpcmulti');

  return Node.extend('screens', function() {
    this.__attribute('init', 'event');
    
    this.rpcDef = function(name, rpcdefs, rpcpromise) {
      this.name = name;
      this.rpcdefs = {};
      
      // lets pull out the rpcdef
      for (var i = 0; i < this.child.length; i++) {
        var child = this.child[i];
        var rpcdef = RpcProxy.createRpcDef(child, Node.prototype);
        
        rpcdefs[name + '.' + child.name] = rpcdef;
        this.rpcdefs[child.name] = rpcdef;
        
        // lets spawn up our own multiset here
        this[child.name] = RpcMulti.createFromDef(rpcdef);
      }
    };
    
    // this method is used serverside to compute the rpc interface
    this.screenJoin = function(socket, attribute_sets) {
      var url = socket.url;
      
      // Extract Query
      var query = {}, queryIndex = url.indexOf('?');
      if (queryIndex !== -1) {
        query = url.substring(queryIndex + 1);
        url = url.substring(0, queryIndex);
        
        if (query) {
          var parts = query.split('&'), pair;
          query = {};
          for (var i = 0, len = parts.length; len > i; i++) {
            pair = parts[i].split('=');
            query[pair[0]] = pair[1] == null ? null : pair[1]; // Clobber instead of support for multivalue query params
          }
        }
      }
      
      // Extract screen name
      var screenName = query.screen || 'default';
      
      // so how are we going to send this out. ok so how do we do this
      var multi = this[screenName];
      if (multi) {
        var index = multi.length++;
        var rpcid = this.name + '.' + screenName;

        // send the joins on all previous screens to the new screen
        for(var otherScreen in this.rpcdefs){
          var oindex = this[otherScreen].length
          var orpcid = this.name + '.' + otherScreen;
          for (var i = 0; i < oindex; i++) {
            socket.send({
              index:i,
              type:'join',
              rpcid:orpcid
            });
          }
        }

        // now lets send all attribute sets that have have happened
        for(var key in attribute_sets){
          socket.send(attribute_sets[key])
        }

        multi._addNewProxy(index, rpcid, socket.rpcpromise);

        teem.bus.broadcast({
          index:index,
          type:'join',
          rpcid:rpcid
        });
      } else {
        console.log('Screen not found:', screenName);
      }
    };
  });
});