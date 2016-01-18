/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


/** Provides global mouse events by listening to mouse events on the 
    viewport. Registered with dr.global as 'mouse'. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        GlobalRegistry = require('./Global.js'),
        sprite = require('$SPRITE/sprite.js'),
        GlobalMouseSprite = require('$SPRITE/GlobalMouse.js');
    
    module.exports = new JS.Singleton('GlobalMouse', {
        include: [
            require('$LIB/dr/SpriteBacked.js'),
            require('$LIB/dr/events/PlatformObserver.js'),
            require('$LIB/dr/events/Observable.js'),
            require('$LIB/dr/events/Observer.js')
        ],
        
        
        // Constructor /////////////////////////////////////////////////////////////
        initialize: function() {
            this.set_sprite(this.createSprite());
            
            // Store in dr namespace for backwards compatibility with dreem
            if (dr.mouse) {
                dr.dumpStack('dr.mouse already set.');
            } else {
                dr.mouse = this;
            }
            
            this.__xOrYAttachedObserverCount = 0;
            
            GlobalRegistry.register('mouse', this);
        },
        
        createSprite: function(attrs) {
            return new GlobalMouseSprite(this);
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @overrides
            All global mouse platform events should be handled during the
            capture phase. */
        isPlatformEvent: function(eventType) {
            var retval = this.callSuper();
            return typeof retval === 'boolean' ? true : retval;
        },
        
        /** Auto register for platform events when registering for a normal
            event with the same event type.
            @overrides dr.Observable */
        attachObserver: function(observer, methodName, eventType) {
            var retval = this.callSuper(observer, methodName, eventType);
            
            // Provide onmousemove handling for x and y events
            if (eventType === 'onx' || eventType === 'ony') {
                if (++this.__xOrYAttachedObserverCount === 1) {
                    if (this.__handler_xOrY == null) {
                        this.__handler_xOrY = (function(event) {
                            this.x = event.x;
                            this.y = event.y;
                            this.sendEvent('onx', event.x);
                            this.sendEvent('ony', event.y);
                            return true;
                        }).bind(this);
                    }
                    this.listenTo(this, 'onmousemove', '__handler_xOrY');
                }
            }
            
            return retval;
        },
        
        /** Auto unregister for platform events when registering for a normal
            event with the same event type.
            @overrides dr.Observable */
        detachObserver: function(observer, methodName, eventType) {
            var retval = this.callSuper(observer, methodName, eventType);
            
            // Provide onmousemove handling for x and y events
            if (eventType === 'onx' || eventType === 'ony') {
                if (--this.__xOrYAttachedObserverCount === 0) this.stopListening(this, 'onmousemove', '__handler_xOrY');
            }
            
            return retval;
        }
    });
});
