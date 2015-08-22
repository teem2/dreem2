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
/** Provides an interface to platform specific viewport resize functionality. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        globalScope = require('$SPRITE/global.js'),
        sprite = require('$SPRITE/sprite.js');
    
    module.exports = GlobalViewportResize = new JS.Class('sprite.GlobalViewportResize', {
        // Constructor /////////////////////////////////////////////////////////////
        /** The standard JSClass initializer function. Subclasses should not
            override this function.
            @param attrs:object A map of attribute names and values.
            @returns void */
        initialize: function(view, attrs) {
            this.view = view;
            
            var self = this;
            sprite.addEventListener(globalScope, 'resize', function(domEvent) {
                view.__handleResizeEvent(self.getViewportWidth(), self.getViewportHeight());
            });
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        getViewportWidth: function() {
            return globalScope.innerWidth;
        },
        
        getViewportHeight: function() {
            return globalScope.innerHeight;
        }
    });
});
