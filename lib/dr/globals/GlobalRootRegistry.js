/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


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
