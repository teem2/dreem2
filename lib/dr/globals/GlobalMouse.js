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
