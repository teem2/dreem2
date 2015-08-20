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
/** Indicates that a dr.Node is backed by a sprite. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        ViewSprite = require('$SPRITE/View.js'),
        sprite = require('$SPRITE/sprite.js');
    
    module.exports = dr.SpriteBacked = new JS.Module('SpriteBacked', {
        // Class Methods and Attributes ////////////////////////////////////////////
        extend: {
            /** The boolean indicates if it is capture phase or not. */
            PLATFORM_EVENTS: {
                // sprite.FocusObservable
                onfocus:false,
                onblur:false,
                
                // sprite.KeyObservable
                onkeypress:false,
                onkeydown:false,
                onkeyup:false,
                
                // sprite.MouseObservable
                onmouseover:false,
                onmouseout:false,
                onmousedown:false,
                onmouseup:false,
                onclick:false,
                ondblclick:false,
                onmousemove:false,
                oncontextmenu:false,
                onwheel:false
                
                // sprite.ScrollObservable
                // onscroll:false not needed because dr.View.set_scrollable
                // sets up handlers automatically.
                
                // sprite.InputObservable
                // Overide in inputtext.dre
                
                // sprite.DropObservable
                // Override in dimmer.dre
            }
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        set_sprite: function(sprite) {
            if (this.sprite) {
                dr.dumpStack('Attempt to reset sprite.');
            } else {
                this.sprite = sprite;
            }
        },
        
        get_sprite: function() {
            return this.sprite;
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        createSprite: function(attrs) {
            // Default implementation is a View sprite.
            return new ViewSprite(this, attrs);
        },
        
        /** Determines if the provided event type is for a platform event or
            not.
            @param eventType:string The event type to check.
            @returns boolean True if the eventType is a platform event, false
                otherwise. */
        isPlatformEvent: function(eventType) {
            return dr.SpriteBacked.PLATFORM_EVENTS[eventType];
        },
        
        /** Triggers a simulated platform event on this SpriteBacked. */
        trigger: function(platformEventName, opts) {
            sprite.simulatePlatformEvent(this, platformEventName, opts);
        }
    });
});