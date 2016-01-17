/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/

/** Generates input events and passes them on to one or more event observers.
    
    Requires: dr.sprite.PlatformObservable super mixin.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        sprite = require('$SPRITE/sprite.js');
    require('./PlatformObservable.js');
    
    module.exports = sprite.InputObservable = new JS.Module('sprite.InputObservable', {
        // Class Methods and Attributes ////////////////////////////////////////////
        extend: {
            /** A map of supported input event types. */
            EVENT_TYPES:{
                oninput:true,
                onselect:true,
                onchange:true
            }
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @overrides dr.sprite.PlatformObservable */
        createPlatformMethodRef: function(platformObserver, methodName, type) {
            return this.createStandardPlatformMethodRef(platformObserver, methodName, type, sprite.InputObservable) || 
                this.callSuper(platformObserver, methodName, type);
        }
    });
});
