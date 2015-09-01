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
/**
LICENSE

The MIT License

Copyright (c) 2014 Todd Motto

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

Based on a fork by Rene Hernandez found at:
  https://github.com/renehernandez/atomic/blob/develop/src/atomic.js
*/
/** Provides the ability to send and receive data over the network. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        globalScope = require('$SPRITE/global.js'),
        sprite = require('$SPRITE/sprite.js');
    
    module.exports = sprite.GlobalRequestor = new JS.Class('sprite.GlobalRequestor', {
        // Constructor /////////////////////////////////////////////////////////////
        /** The standard JSClass initializer function. Subclasses should not
            override this function.
            @param attrs:object A map of attribute names and values.
            @returns void */
        initialize: function(view, attrs) {
            this.view = view;
            
            this.__xhr = function (type, url, data) {
                var methods = {
                        success: function() {},
                        error: function() {},
                        always: function() {}
                    },
                    XHR = globalScope.XMLHttpRequest || ActiveXObject,
                    request = new XHR('MSXML2.XMLHTTP.3.0');
                
                request.open(type, url, true);
                request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                
                request.onreadystatechange = function() {
                    if (request.readyState === 4) {
                        var response = request.responseText;
                        
                        if (request.status >= 200 && request.status < 300) {
                            methods.success.call(methods, response, request.status);
                        } else {
                            methods.error.call(methods, response, request.status);
                        }
                        methods.always.call(methods, response, request.status);
                    }
                };
                request.send(data);
                
                var callbacks = {
                    success: function(callback) {
                        methods.success = callback;
                        return callbacks;
                    },
                    error: function(callback) {
                        methods.error = callback;
                        return callbacks;
                    },
                    always: function(callback) {
                        methods.always = callback;
                        return callbacks;
                    }
                };
                return callbacks;
            };
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        fetch: function(url) {
            return this.__xhr('GET', url);
        },
        
        send: function(url, data) {
            return this.__xhr('POST', url, data);
        }
    });
});
