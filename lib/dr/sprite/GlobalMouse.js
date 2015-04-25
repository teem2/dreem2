/** Provides an interface to platform specific global mouse functionality. */
define(function(require, exports){
    var dr = require('../dr.js');
    var JS = require('$LIB/jsclass.js');
    
    require('./sprite.js');
    
    dr.sprite.GlobalMouse = new JS.Class('sprite.GlobalMouse', {
        include: [
            dr.sprite.PlatformObservable,
            dr.sprite.MouseObservable
        ],
        
        
        // Constructor /////////////////////////////////////////////////////////////
        /** The standard JSClass initializer function. Subclasses should not
            override this function.
            @param attrs:object A map of attribute names and values.
            @returns void */
        initialize: function(view, attrs) {
            this.view = view;
            this.platformObject = global.document;
        }
    });
});
