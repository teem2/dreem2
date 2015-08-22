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
/** An dr.SimplePool that tracks which objects are "active". An "active"
    object is one that has been obtained by the getInstance method.
    
    Events:
        None
    
    Attributes:
        None
    
    Private Attributes:
        __actives:array an array of active instances.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        sprite = require('$SPRITE/sprite.js');
    
    module.exports = dr.TrackActivesPool = new JS.Class('TrackActivesPool', require('./SimplePool.js'), {
        // Life Cycle //////////////////////////////////////////////////////////////
        /** @overrides dr.Destructible */
        destroy: function() {
            var actives = this.__actives;
            if (actives) actives.length = 0;
            
            this.callSuper();
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @overrides dr.AbstractPool */
        getInstance: function() {
            var instance = this.callSuper();
            (this.__actives || (this.__actives = [])).push(instance);
            return instance;
        },
        
        /** @overrides dr.AbstractPool */
        putInstance: function(obj) {
            var actives = this.__actives;
            if (actives) {
                var i = actives.length;
                while (i) {
                    if (actives[--i] === obj) {
                        actives.splice(i, 1);
                        this.callSuper(obj);
                        return;
                    }
                }
                sprite.console.warn("Attempt to putInstance for a non-active instance.", obj, this);
            } else {
                sprite.console.warn("Attempt to putInstance when no actives exist.", obj, this);
            }
        },
        
        /** Gets an array of the active instances.
            @param filterFunc:function (optional) If provided filters the
                results.
            @returns array */
        getActives: function(filterFunc) {
            var actives = this.__actives;
            if (actives) {
                if (filterFunc) {
                    var retval = [], len = actives.length, i = 0, active;
                    for (; len > i;) {
                        active = actives[i++];
                        if (filterFunc.call(this, active)) retval.push(active);
                    }
                    return retval;
                }
                return actives.concat();
            }
            return [];
        },
        
        /** Puts all the active instances back in the pool.
            @returns void */
        putActives: function() {
            var actives = this.__actives;
            if (actives) {
                var i = actives.length;
                while (i) this.putInstance(actives[--i]);
            }
        }
    });
});
