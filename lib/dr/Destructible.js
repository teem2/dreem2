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
/** Provides a destroy method that can be used as part of an Object creation
    and destruction lifecycle. When an object is "destroyed" it will have
    a 'destroyed' attribute with a value of true.
    
    Events:
        None
    
    Attributes:
        destroyed:boolean Set to true when the object is in the "destroyed"
            state, undefinded otherwise.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js');
    
    module.exports = dr.Destructible = new JS.Module('Destructible', {
        // Methods /////////////////////////////////////////////////////////////////
        /** Destroys this Object. Subclasses must call callSuper.
            @returns void */
        destroy: function() {
            // See http://perfectionkills.com/understanding-delete/ for details
            // on how delete works. This is why we use Object.keys below since it
            // avoids iterating over many of the properties that are not deletable.
            var keys, i;
            
            // OPTIMIZATION: Improve garbage collection for JS.Class
            var meta = this.__meta__;
            if (meta) {
                keys = Object.keys(meta);
                i = keys.length;
                while (i) delete meta[keys[--i]];
            }
            
            keys = Object.keys(this);
            i = keys.length;
            while (i) delete this[keys[--i]];
            
            this.destroyed = true;
        }
    });
});
