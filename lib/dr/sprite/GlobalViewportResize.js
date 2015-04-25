/** Provides an interface to platform specific viewport resize functionality. */
define(function(require, exports){
    var dr = require('../dr.js');
    var JS = require('$LIB/jsclass.js');
    
    require('./sprite.js');
    
    dr.sprite.GlobalViewportResize = new JS.Class('sprite.GlobalViewportResize', {
        // Constructor /////////////////////////////////////////////////////////////
        /** The standard JSClass initializer function. Subclasses should not
            override this function.
            @param attrs:object A map of attribute names and values.
            @returns void */
        initialize: function(view, attrs) {
            this.view = view;
            
            var self = this;
            dr.sprite.addEventListener(global, 'resize', function(domEvent) {
                view.__handleResizeEvent(self.getViewportWidth(), self.getViewportHeight());
            });
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        getViewportWidth: function() {
            return global.innerWidth;
        },
        
        getViewportHeight: function() {
            return global.innerHeight;
        }
    });
});
