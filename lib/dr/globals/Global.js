/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


/** Holds references to "global" objects and services. Fires events when 
    these globals are registered and unregistered.
    
    Events:
        onregister<key>:object Fired when an object is stored under the key.
        onunregister<key>:object Fired when an object is removed from the key.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        sprite = require('$SPRITE/sprite.js');
    
    module.exports = dr.global = new JS.Singleton('GlobalRegistry', {
        include: [
            require('$LIB/dr/events/Observable.js')
        ],
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** Registers the provided global under the key. Fires a register<key>
            event. If a global is already registered under the key the existing
            global is unregistered first.
            @returns void */
        register: function(key, v) {
            if (this.hasOwnProperty(key)) {
                sprite.console.warn("Warning: dr.global key in use: ", key);
                this.unregister(key);
            }
            this[key] = v;
            this.sendEvent('onregister' + key, v);
        },
        
        /** Unegisters the global for the provided key. Fires an unregister<key>
            event if the key exists.
            @returns void */
        unregister: function(key) {
            if (this.hasOwnProperty(key)) {
                var v = this[key];
                delete this[key];
                this.sendEvent('onunregister' + key, v);
            } else {
                sprite.console.warn("Warning: dr.global key not in use: ", key);
            }
        }
    });
});
