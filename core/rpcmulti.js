/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License. */

/**
 * @class RunMonitor {Internal}
 * RunMonitor class executes ourselves as a subprocess, receives the dependency file names
 * from the child process and manages restart/killing when files change
 */
define(function(require, exports, module) {
  var Node = require('$CLASSES/teem_node'),
    RpcProxy = require('./rpcproxy');

  function defineIndex(obj, i) {
    Object.defineProperty(obj, i, {
      get:function() {
        if (i >= this._array.length) return this._voidproxy;
        return this._array[i];
      },
      set:function() {
        // set a multi rpc thing?
      }
    });
  };

  function defineSetFwd(obj, key) {
    Object.defineProperty(obj, key, {
      get:function() {
        // lets just get the first value
        return this._array[0][key];
      },
      set:function(v) {
        // set all
        for (var i = 0; i < this._array.length; i++) {
          this._array[i][key] = v;
        }
      }
    });
  };

  function defineMethodFwd(obj, method) {
    obj[method] = function() {
      var out = [];
      for (var i = 0; i < this._array.length; i++) {
        var item = this._array[i];
        if (item) out.push(item[method].apply(item, arguments));
      }
      return Promise.all(out);
    };
  };

  var RpcMulti = module.exports = Node.extend('RpcMulti', function() {
    this.length = 0; //this.attribute('length', 'number', 0)
    // lets define array indices
    for(var i = 0; i < 256; i++) {
      defineIndex(this, i);
    }
    
    this._addNewProxy = function(index, rpcid, rpcpromise) {
      var proxy = RpcProxy.createFromDef(this._def, rpcid + '[' + index + ']', rpcpromise);
      this._array[index] = proxy;
    }
  });

  RpcMulti.createFromDef = function(def, rpcid, rpcpromise) {
    var obj = new RpcMulti();
    
    obj._array = [];
    obj._def = def;
    
    obj._voidproxy = RpcProxy.createFromDef(def);
    // lets interpret the def
    for (var key in def) {
      var prop = def[key];
      if (typeof prop == 'object') {
        if (prop.kind == 'attribute') {
          defineSetFwd(obj, key);
          defineSetFwd(obj, 'on_' + key);
        } else if (prop.kind == 'method') {
          defineMethodFwd(obj, key);
        }
      } else{ // we are a plain value, dont do much
        obj[key] = prop;
      }
    }
    
    return obj;
  };
})