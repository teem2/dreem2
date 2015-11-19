/* Copyright 2015 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


/** Provides events when the viewport is resized. Registered with dr.global
    as 'viewportResize'.
    
    Events:
        resize:object Fired when the viewport is resized. This is a
            reused event stored at dr.global.viewportResize.EVENT. The type
            is 'resize' and the value is an object containing:
                w:number the new viewport width.
                h:number the new viewport height.
    
    Attributes:
        EVENT:object The common resize event that gets fired.
    
    Private Attributes:
        __viewportWidth:number The width of the viewport.
        __viewportHeight:number The height of the viewport.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        GlobalRegistry = require('./Global.js'),
        GlobalViewportResizeSprite = require('$SPRITE/GlobalViewportResize.js');

    module.exports = new JS.Singleton('GlobalViewportResize', {
        include: [
            require('$LIB/dr/SpriteBacked.js'),
            require('$LIB/dr/events/Observable.js')
        ],

        // Life Cycle //////////////////////////////////////////////////////////////
        initialize: function() {
            this.set_sprite(this.createSprite());
            
            // The common resize event that gets reused.
            this.EVENT = {w:this.getWidth(), h:this.getHeight()};
            
            GlobalRegistry.register('viewportResize', this);
        },
        
        createSprite: function(attrs) {
            return new GlobalViewportResizeSprite(this);
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        /** Gets the window's innerWidth.
            @returns the current width of the window. */
        getWidth: function() {
            return this.width || (this.width = this.sprite.getViewportWidth());
        },
        
        /** Gets the window's innerHeight.
            @returns the current height of the window. */
        getHeight: function() {
            return this.height || (this.height = this.sprite.getViewportHeight());
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @private */
        __handleResizeEvent: function(w, h) {
            var event = this.EVENT, isChanged;
            if (w !== event.w) {
                event.w = this.width = w;
                isChanged = true;
            }
            if (h !== event.h) {
                event.h = this.height = h;
                isChanged = true;
            }
            if (isChanged) {
                this.sendEvent('onresize', event);
                this.sendEvent('onwidth', this.width);
                this.sendEvent('onheight', this.height);
            }
        }
    });
});
