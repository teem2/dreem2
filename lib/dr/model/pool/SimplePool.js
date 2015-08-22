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
/** An implementation of an dr.AbstractPool.
    
    Events
        None
    
    Attributes:
        instanceClass:JS.Class (initializer only) the class to use for 
            new instances. Defaults to Object.
        instanceParent:dr.Node (initializer only) The node to create new
            instances on.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js');
    
    module.exports = dr.SimplePool = new JS.Class('SimplePool', require('./AbstractPool.js'), {
        // Constructor /////////////////////////////////////////////////////////////
        /** Create a new dr.SimplePool
            @param instanceClass:JS.Class the class to create instances from.
            @param instanceParent:object (optional) The place to create instances 
                on. When instanceClass is an dr.Node this will be the node parent.
            @returns void */
        initialize: function(instanceClass, instanceParent) {
            this.callSuper();
            
            this.instanceClass = instanceClass || Object;
            this.instanceParent = instanceParent;
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @overrides dr.AbstractPool
            Creates an instance of this.instanceClass and passes in 
            this.instanceParent as the first argument if it exists.
            @param arguments[0]:object (optional) the attrs to be passed to a
                created dr.Node. */
        createInstance: function() {
            // If we ever need full arguments with new, see:
            // http://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible
            var parent = this.instanceParent, instanceClass = this.instanceClass;
            return parent ? new instanceClass(parent, arguments[0]) : new instanceClass();
        }
    });
});
