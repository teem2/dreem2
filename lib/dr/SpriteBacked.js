/* Copyright 2015 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/

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