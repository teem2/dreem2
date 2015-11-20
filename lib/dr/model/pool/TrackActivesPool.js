/* Copyright 2015 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


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
