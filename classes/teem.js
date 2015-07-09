/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/
define(function(require, exports, module) {
  // lets return our singleton teem object
  var Node = require('$CLASSES/teem_node'),
    teem = Node.singleton('Teem'),
    RpcProxy = require('$CORE/rpcproxy'),
    RpcPromise = require('$CORE/rpcpromise'),
    RpcMulti = require('$CORE/rpcmulti');

  teem._modules = {};

  teem.destroy = function() {
    for (var key in teem) {
      prop = teem[key];
      if (typeof prop == 'object' && prop !== teem && typeof prop.destroy == 'function') prop.destroy();
    }
  };

  if (define.env == 'nodejs') {
    console.log('Teem server module started');
    
    // our teem bus is the local server bus
    define.onMain = function(moddescs, bus) {
      teem.bus = bus;
      
      teem.session = '' + Math.random() * 10000000;
      
      // lets render all modules and store them on the teem tag
      var rpcdef = {};
      for (var i = 0; i < moddescs.length; i++) {
        // lets instance all modules
        var moddesc = moddescs[i];
        try {
          // lets store the modules
          var render = require(moddesc.path);
          var mod = teem._modules[moddesc.name] = {
            name: moddesc.name,
            render: render,
            vdom: render()
          };
        } catch(e) {
          console.error(e.stack + '\x0E');
          return;
        }
        
        // ok so. we have a vdom
        var def = RpcProxy.createRpcDef(mod.vdom, Node.prototype);
        
        // this is the rpc def for the clients
        rpcdef[mod.name] = def;
        
        // store the vdom object as our main object
        var obj = teem[mod.name] = mod.vdom;
        
        RpcProxy.bindSetAttribute(obj, mod.name, teem.bus);
        
        // allow extension of the rpc def with multiples by the class itself
        if (obj.rpcDef) obj.rpcDef(mod.name, rpcdef, rpcpromise);
        
        if (obj.on_init) obj.on_init.emit();
      }
      
      // Build our RPC interface
      teem.postAPI = function(msg, response) {
        if (msg.type == 'attribute') {
          var obj = RpcProxy.decodeRpcID(teem, msg.rpcid);
          if (obj) obj[msg.attribute] = msg.value;
          response.send({type:'return', value:'OK'});
        } else if (msg.type == 'method') {
          var obj = RpcProxy.decodeRpcID(teem, msg.rpcid);
          if (obj) RpcProxy.handleCall(obj, msg, response);
        } else {
          response.send({type:'error', value:'please set type to rpcAttribute or rpcCall'});
        }
      }
      
      bus.broadcast({type:'sessionCheck', session:teem.session});
      
      bus.onConnect = function(socket) {
        socket.send({type:'sessionCheck', session:teem.session});
      }
      
      bus.onMessage = function(msg, socket) {
        // we will get messages from the clients
        if (msg.type == 'connectBrowser') {
          socket.send({type:'connectBrowserOK', rpcdef: rpcdef});
          // ok we have to send it all historic joins.
          socket.rpcpromise = new RpcPromise(socket);
          
          if (teem.screens) teem.screens.screenJoin(socket);
        } else if (msg.type == 'attribute') {
          var obj = RpcProxy.decodeRpcID(teem, msg.rpcid);
          if (obj) obj[msg.attribute] = msg.value;
        } else if (msg.type == 'method') {
          var obj = RpcProxy.decodeRpcID(teem, msg.rpcid);
          if (obj) RpcProxy.handleCall(obj, msg, socket);
        } else if (msg.type == 'return') {
          // we got an rpc return
          socket.rpcpromise.resolveResult(msg);
        }
      }
      
      return function destroy() {
        // destroy teem modules
      };
    }
  } else if (define.env == 'browser') {
    // web environment
    var BusClient = require('$CORE/busclient');
    
    teem.bus = new BusClient(location.pathname + location.search);
    var rpcpromise = new RpcPromise(teem.bus);
    
    // Called from define.js
    define.onMain = function(mainModuleExports) {
      teem.bus.onMessage = function(msg) {
        switch (msg.type) {
          case 'sessionCheck':
            if (teem.session != msg.session) {
              teem.session = msg.session;
              teem.bus.send({type:'connectBrowser'});
            }
            break;
            
          case 'join':
            var obj = RpcProxy.decodeRpcID(teem, msg.rpcid);
            if (obj) obj._addNewProxy(msg.index, msg.rpcid, rpcpromise);
            break;
            
          case 'attribute':
            var obj = RpcProxy.decodeRpcID(teem, msg.rpcid);
            if (obj) obj[msg.attribute] = msg.value;
            break;
            
          case 'method':
            // lets call our method on root.
            if (!teem.root[msg.method]) {
              return console.log('Rpc call received on nonexisting method ' + msg.method);
            }
            RpcProxy.handleCall(teem.root, msg, teem.bus);
            break;
            
          case 'return':
            rpcpromise.resolveResult(msg);
            break;
            
          case 'connectBrowserOK':
            // lets set up our teem.bla base RPC layer (nonmultiples)
            for (var key in msg.rpcdef) {
              var def = msg.rpcdef[key];
              
              if (key.indexOf('.') !== -1) { // its a sub object property
                var parts = key.split('.');
                teem[parts[0]][parts[1]] = RpcMulti.createFromDef(def, key, rpcpromise);
              } else{
                teem[key] = RpcProxy.createFromDef(def, key, rpcpromise);
              }
            }
            //var proxy = new RpcProxy(); // Doesn't appear to be used.
            teem.root = mainModuleExports();
            
            teem.__startup(mainModuleExports);
            break;
            
          default:
            console.log('Unexpected message type: ', msg);
        }
      }
    }
  } else if (define.env == 'v8') {
    // dali environment
    define.onMain = teem.__startup;
  }

  teem.__startup = function(mainModuleExports) {
    var dreemMaker = require('$LIB/dr/dreemMaker.js'),
      compiler = new dreemMaker.Compiler();
    compiler.execute(mainModuleExports.dre, mainModuleExports.classmap, teem);
  };

  return teem;
})