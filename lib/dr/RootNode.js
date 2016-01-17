/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/

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
