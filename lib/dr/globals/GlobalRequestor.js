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
/** Provides the ability to send and receive data over the network. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        GlobalRegistry = require('./Global.js'),
        GlobalRequestorSprite = require('$SPRITE/GlobalRequestor.js');
    
    module.exports = new JS.Singleton('GlobalRequestor', {
        include: [
            require('$LIB/dr/SpriteBacked.js')
        ],
        
        
        // Constructor /////////////////////////////////////////////////////////////
        initialize: function() {
            this.set_sprite(this.createSprite());
            GlobalRegistry.register('requestor', this);
        },
        
        createSprite: function(attrs) {
            return new GlobalRequestorSprite(this);
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        fetch: function(url) {
            return this.sprite.fetch(url);
        },
        
        send: function(url, data) {
            return this.sprite.send(url, data);
        }
    });
});
