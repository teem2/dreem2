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
define(function(require, exports){
    var dr = require('../dr.js');
    var JS = require('$LIB/jsclass.js');
    
    require('./View.js');
    require('../model/Path.js');
    require('../globals/GlobalRootViewRegistry.js');
    
    dr.RootView = new JS.Module('RootView', {
        // Life Cycle //////////////////////////////////////////////////////////////
        initNode: function(parent, attrs) {
            this.callSuper(parent, attrs);
            dr.global.roots.addRoot(this);
        },
        
        /** @overrides dr.View */
        destroyAfterOrphaning: function() {
            dr.global.roots.removeRoot(this);
            this.callSuper();
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        set_ready: function(v) {
            if (this.setActual('ready', v, 'boolean', false)) {
                // Notify all descendants in a depth first manner since 
                // initialization is now done.
                if (this.ready) this.walk(null, function(node) {node.notifyReady();});
            }
        }
    });
});
