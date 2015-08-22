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
/** Provides events when a new dr.RootNode is created or destroyed.
    Registered in dr.global as 'roots'.
    
    Events:
        onrootAdded:RootNode Fired when a RootNode is added. The value is the 
            RootNode added.
        onrootRemoved:RootView Fired when a RootNode is removed. The value is the 
            RootNode removed.
    
    Attributes:
        None
    
    Private Attributes:
        __roots:array Holds an array of RootNodes.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        GlobalRegistry = require('./Global.js');
    
    module.exports = new JS.Singleton('GlobalRootRegistry', {
        include: [
            require('$LIB/dr/events/Observable.js')
        ],
        
        
        // Life Cycle //////////////////////////////////////////////////////////////
        initialize: function() {
            this.__roots = [];
            GlobalRegistry.register('roots', this);
        },
        
        // Accessors ///////////////////////////////////////////////////////////////
        /** Gets the list of global root views.
            @returns array of RootNodes. */
        getRoots: function() {
            return this.__roots;
        },
        
        // Methods /////////////////////////////////////////////////////////////////
        /** Add a rootable to the global list of root views.
            @param r:RootNode the RootNode to add.
            @returns void */
        addRoot: function(r) {
            this.__roots.push(r);
            
            // If dr is already ready then make the new root view ready
            // immediately.
            if (dr.ready) r.setAttribute('ready', true);
            
            this.sendEvent('onrootAdded', r);
        },
        
        /** Remove a rootable from the global list of root views.
            @param r:RootNode the RootNode to remove.
            @returns void */
        removeRoot: function(r) {
            var roots = this.__roots, i = roots.length, root;
            while(i) {
                root = roots[--i];
                if (root === r) {
                    roots.splice(i, 1);
                    this.sendEvent('onrootRemoved', root);
                    break;
                }
            }
        }
    });
})
