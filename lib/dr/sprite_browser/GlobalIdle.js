/* Copyright 2015 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


/** Provides an interface to platform specific Idle functionality. Also
    provides document visibility change events. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        globalScope = require('$SPRITE/global.js'),
        sprite = require('$SPRITE/sprite.js');
    
    module.exports = sprite.GlobalIdle = new JS.Class('sprite.GlobalIdle', {
        include: [
            require('$SPRITE/events/PlatformObservable.js')
        ],
        
        
        // Class Methods and Attributes ////////////////////////////////////////////
        extend: {
            EVENT_TYPES:{
                onvisibilitychange:true
            }
        },
        
        
        // Constructor /////////////////////////////////////////////////////////////
        /** The standard JSClass initializer function. Subclasses should not
            override this function.
            @param attrs:object A map of attribute names and values.
            @returns void */
        initialize: function(view, attrs) {
            this.view = view;
            this.platformObject = globalScope.document;
            
            var vendor, vendors = ['webkit','moz','ms','o'], g = globalScope;
            for (var i = 0; i < vendors.length && !g.requestAnimationFrame; ++i) {
                vendor = vendors[i];
                g.requestAnimationFrame = g[vendor + 'RequestAnimationFrame'];
                g.cancelAnimationFrame = g[vendor + 'CancelAnimationFrame'] || g[vendor + 'CancelRequestAnimationFrame'];
            }
            
            // Setup callback function
            var self = this;
            this.__event = {};
            this.__doIdle = function doIdle(time) {
                self.__timerId = g.requestAnimationFrame(doIdle);
                var lastTime = self.lastTime;
                if (lastTime !== -1) {
                    time = Math.round(time);
                    var event = self.__event;
                    event.delta = time - lastTime;
                    event.time = time;
                    view.sendEvent('onidle', event);
                }
                self.lastTime = time;
            };
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @overrides dr.sprite.PlatformObservable */
        createPlatformMethodRef: function(platformObserver, methodName, type) {
            return this.createStandardPlatformMethodRef(platformObserver, methodName, type, sprite.GlobalIdle) || 
                this.callSuper(platformObserver, methodName, type);
        },
        
        start: function() {
            this.lastTime = -1;
            this.__timerId = globalScope.requestAnimationFrame(this.__doIdle);
        },
        
        stop: function() {
            globalScope.cancelAnimationFrame(this.__timerId);
        }
    });
});
