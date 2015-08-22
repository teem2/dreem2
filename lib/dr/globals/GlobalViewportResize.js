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
