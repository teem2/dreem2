/** Provides an interface to platform specific viewport resize functionality. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        globalScope = require('$SPRITE/global.js'),
        sprite = require('$SPRITE/sprite.js');
    
    module.exports = GlobalViewportResize = new JS.Class('sprite.GlobalViewportResize', {
        // Constructor /////////////////////////////////////////////////////////////
        /** The standard JSClass initializer function. Subclasses should not
            override this function.
            @param attrs:object A map of attribute names and values.
            @returns void */
        initialize: function(view, attrs) {
            this.view = view;
            
            var self = this;
            //sprite.addEventListener(globalScope, 'resize', function(domEvent) {
            //    view.__handleResizeEvent(self.getViewportWidth(), self.getViewportHeight());
          //  });
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        getViewportWidth: function() {
            return globalScope.innerWidth;
        },
        
        getViewportHeight: function() {
            return globalScope.innerHeight;
        }
    });
});
