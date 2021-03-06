/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/

/** Provides a destroy method that can be used as part of an Object creation
    and destruction lifecycle. When an object is "destroyed" it will have
    a 'destroyed' attribute with a value of true.
    
    Events:
        None
    
    Attributes:
        destroyed:boolean Set to true when the object is in the "destroyed"
            state, undefinded otherwise.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js');
    
    module.exports = dr.Destructible = new JS.Module('Destructible', {
        // Methods /////////////////////////////////////////////////////////////////
        /** Destroys this Object. Subclasses must call callSuper.
            @returns void */
        destroy: function() {
            // See http://perfectionkills.com/understanding-delete/ for details
            // on how delete works. This is why we use Object.keys below since it
            // avoids iterating over many of the properties that are not deletable.
            var keys, i;
            
            // OPTIMIZATION: Improve garbage collection for JS.Class
            var meta = this.__meta__;
            if (meta) {
                keys = Object.keys(meta);
                i = keys.length;
                while (i) delete meta[keys[--i]];
            }
            
            keys = Object.keys(this);
            i = keys.length;
            while (i) delete this[keys[--i]];
            
            this.destroyed = true;
        }
    });
});
