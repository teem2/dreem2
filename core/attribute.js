/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License. */

define(function(require, exports, module) {
  module.exports = Attribute;

  function Attribute(type){
    this.type = type;
  };

  body.call(Attribute.prototype);

  function body() {
    this.addListener = function(callback) {
      if (!this.listeners) this.listeners = [];
      if (this.listeners.indexOf(callback) == -1) {
        this.listeners.push(callback);
      }
      // return a subscription function you can call to unregister
      return function() {
        this.removeListener(callback);
      }.bind(this);
    };
    
    this.once = function(callback) {
      this.addListener(function(value, old, attr, cb) {
        callback(value, old);
        attr.removeListener(cb);
      }.bind(this));
    };
    
    this.removeListener = function(callback) {
      if (this.listeners) {
        var id = this.listeners.indexOf(callback);
        if (id !== -1) this.listeners.splice(id, 1);
      }
    };
    
    this.removeAllListeners = function() {
      this.listeners = undefined;
    };
    
    this.emit = this.set = function(value) {
      if (this.setter) {
        var ret = this.setter.call(this, value, this);
        if (ret !== undefined) value = ret;
      }
      
      var old = this.value;
      this.value = value;
      
      if (this.listeners) {
        var proto = this;
        while (proto) {
          if (proto.hasOwnProperty('listeners') && (list = proto.listeners)) {
            for (var i = list.length - 1; i >= 0; i--) {
              var cb = list[i];
              cb.call(this.owner, value, old, this, cb);
            }
          }
          proto = Object.getPrototypeOf(proto);
        }
      }
    };
  }
})