/**
 * Copyright (c) 2015 Teem2 LLC
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
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
