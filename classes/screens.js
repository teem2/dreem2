/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/
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
    this.screenJoin = function(socket) {
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
      var index = multi.length++;
      var rpcid = this.name + '.' + screenName;
      
      // send it the joins for the previous ones to the new one
      for (var i = 0; i < index; i++) {
        socket.send({
          index:i,
          type:'join',
          rpcid:rpcid
        });
      }
      multi._addNewProxy(index, rpcid, socket.rpcpromise);
      
      teem.bus.broadcast({
        index:index,
        type:'join',
        rpcid:rpcid
      });
    };
  });
})