/* Copyright 2015 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


/** Provides an interface to platform specific Webview functionality. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        sprite = require('$SPRITE/sprite.js');
    
    module.exports = sprite.Webview = new JS.Class('sprite.Webview', require('./View.js'), {
        // Class Methods and Attributes ////////////////////////////////////////////
        extend: {
            /** A map of supported iframe event types. */
            EVENT_TYPES:{
                onload:true
            }
        },
        
        
        // Life Cycle //////////////////////////////////////////////////////////////
        createPlatformObject: function(attrs) {
            attrs.ELEMENT_TYPE = 'iframe';
            
            var elem = this.callSuper(attrs);
            elem.setAttribute('seamless', 'seamless');
            
            return elem;
        },
        
        
        // Attributes //////////////////////////////////////////////////////////////
        set_src: function(v) {
            this.platformObject.src = v;
            return v;
        },
        
        set_contents: function(v) {
            if (v && v.length > 0) this.platformObject.contentDocument.write(v);
            return v;
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @overrides */
        createPlatformMethodRef: function(platformObserver, methodName, eventType) {
            return this.createStandardPlatformMethodRef(platformObserver, methodName, eventType, sprite.Webview) || 
                this.callSuper(platformObserver, methodName, type);
        }
    });
});
