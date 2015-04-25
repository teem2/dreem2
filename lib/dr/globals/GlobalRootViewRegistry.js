/** Provides events when a new dr.RootView is created or destroyed.
    Registered in dr.global as 'roots'.
    
    Events:
        onrootAdded:RootView Fired when a RootView is added. The value is the 
            RootView added.
        onrootRemoved:RootView Fired when a RootView is removed. The value is the 
            RootView removed.
    
    Attributes:
        None
    
    Private Attributes:
        __roots:array Holds an array of RootViews.
*/
define(function(require, exports){
    var dr = require('../dr.js');
    var JS = require('$LIB/jsclass.js');
    
    require('./Global.js');
    require('../events/Observable.js');
    
    new JS.Singleton('GlobalRootViewRegistry', {
        include: [dr.Observable],
        
        
        // Life Cycle //////////////////////////////////////////////////////////////
        initialize: function() {
            this.__roots = [];
            dr.global.register('roots', this);
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        /** Gets the list of global root views.
            @returns array of RootViews. */
        getRoots: function() {
            return this.__roots;
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** Add a rootable to the global list of root views.
            @param r:RootView the RootView to add.
            @returns void */
        addRoot: function(r) {
            this.__roots.push(r);
            
            // If dr is already ready then make the new root view ready
            // immediately.
            if (dr.ready) r.setAttribute('ready', true);
            
            this.sendEvent('onrootAdded', r);
        },
        
        /** Remove a rootable from the global list of root views.
            @param r:RootView the RootView to remove.
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
});
