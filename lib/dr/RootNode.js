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
/** Allows a node to act as a "root" for a node hierarchy. 
    
    Events:
        onready:boolean Fired when the root node has been 
            completely instantiated.
    
    Attributes:
        ready:boolean Indicates that this root node is now ready for use. This
            starts as undefined and gets set to true when dr.notifyReady is
            called.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        globalRootRegistry = require('$LIB/dr/globals/GlobalRootRegistry.js');
    require('$LIB/dr/view/View.js');
    
    module.exports = dr.RootNode = new JS.Module('RootNode', {
        // Life Cycle //////////////////////////////////////////////////////////////
        initNode: function(parent, attrs) {
            this.callSuper(parent, attrs);
            globalRootRegistry.addRoot(this);
        },
        
        /** @overrides dr.View */
        destroyAfterOrphaning: function() {
            globalRootRegistry.removeRoot(this);
            this.callSuper();
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        set_ready: function(v) {
            if (this.setActual('ready', v, 'boolean', false)) {
                // Notify all descendants in a depth first manner since 
                // initialization is now done.
                if (this.ready) this.walk(null, function(node) {node.notifyReady();});
            }
        },
        
        set_classroot: function(v) {
            this.setSimpleActual('classroot', this);
        }
    });
});
