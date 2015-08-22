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
/** Provides an interface to platform specific Webview functionality. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        sprite = require('$SPRITE/sprite.js');
    
    module.exports = sprite.Webview = new JS.Class('sprite.Webview', require('$SPRITE/View.js'), {
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
