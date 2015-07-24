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
