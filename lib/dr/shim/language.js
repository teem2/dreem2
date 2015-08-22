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
define(function(require, exports, module) {
    // Object
    /** Provides support for Object.keys in IE8 and earlier.
        Taken from: http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation */
    Object.keys = Object.keys || (function() {
        var hasOwnProperty = Object.prototype.hasOwnProperty,
            hasDontEnumBug = !{toString:null}.propertyIsEnumerable("toString"),
            DontEnums = [
                'toString',
                'toLocaleString',
                'valueOf',
                'hasOwnProperty',
                'isPrototypeOf',
                'propertyIsEnumerable',
                'constructor'
            ],
            DontEnumsLength = DontEnums.length;
        
        return function(o) {
            if (typeof o !== "object" && typeof o !== "function" || o === null)
                throw new TypeError("Object.keys called on non-object");
            
            var result = [], n;
            for (n in o) {
                if (hasOwnProperty.call(o, n)) result.push(n);
            }
            
            if (hasDontEnumBug) {
                for (var i = 0; i < DontEnumsLength; ++i) {
                    if (hasOwnProperty.call(o, DontEnums[i])) result.push(DontEnums[i]);
                }
            }
            
            return result
        }
    })();
    
    // Array
    /** Provides support for Array.isArray in IE8 and earlier.
        Taken from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray */
    Array.isArray = Array.isArray || function(v) {
        return Object.prototype.toString.call(v) === "[object Array]"
    };
    
    // String
    /** Provides support for String.trim in IE8 and earlier.
        Taken from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim */
    if (!String.prototype.trim) {
        String.prototype.trim = function() {
            return this.replace(/^\s+|\s+$/g,'')
        };
        String.prototype.trimLeft = function() {
            return this.replace(/^\s+/,'')
        };
        String.prototype.trimRight = function() {
            return this.replace(/\s+$/,'')
        };
    };
    
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function(searchString, position) {
            position = position || 0;
            return this.lastIndexOf(searchString, position) === position;
        };
    };
    
    if (!String.prototype.endsWith) {
        String.prototype.endsWith = function(searchString, position) {
            var subjectString = this.toString();
            if (position === undefined || position > subjectString.length) {
                position = subjectString.length;
            }
            position -= searchString.length;
            var lastIndex = subjectString.indexOf(searchString, position);
            return lastIndex !== -1 && lastIndex === position;
        };
    };
    
    // Date
    /** Provides support for Date.now in IE8 and ealier.
        Taken from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now */
    Date.now = Date.now || function() {
        return new Date().getTime()
    };
});
