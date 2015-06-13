/** Allows a view to act as a "root" for a view hierarchy. A "root" view is 
    backed by a dom element from the page rather than a dom element created 
    by the view.
    
    Events:
        onready:boolean Fired when the root view has been 
            completely instantiated.
    
    Attributes:
        ready:boolean Indicates that this root view is now ready for use. This
            starts as undefined and gets set to true when dr.notifyReady is
            called.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        globalRootViewRegistry = require('$LIB/dr/globals/GlobalRootViewRegistry.js');
    require('./View.js');
    
    module.exports = dr.RootView = new JS.Module('RootView', {
        // Life Cycle //////////////////////////////////////////////////////////////
        initNode: function(parent, attrs) {
            this.callSuper(parent, attrs);
            globalRootViewRegistry.addRoot(this);
        },
        
        /** @overrides dr.View */
        destroyAfterOrphaning: function() {
            globalRootViewRegistry.removeRoot(this);
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
