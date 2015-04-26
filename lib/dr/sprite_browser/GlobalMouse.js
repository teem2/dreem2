/** Provides an interface to platform specific global mouse functionality. */
define(function(require, exports, module){
    var dr = require('$LIB/dr/dr.js');
    var JS = require('$LIB/jsclass.js');
    var global = window
    var sprite = require('./sprite.js');
    
    sprite.GlobalMouse = new JS.Class('sprite.GlobalMouse', {
        include: [
            require('$SPRITE/events/PlatformObservable.js'),
            require('$SPRITE/events/MouseObservable.js')
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
	
	module.exports = sprite.GlobalMouse
});
