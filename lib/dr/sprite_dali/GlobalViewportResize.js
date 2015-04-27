/** Provides an interface to platform specific viewport resize functionality. */
define(function(require, exports, module)
{
    var dr = require('$LIB/dr/dr.js');
    var JS = require('$LIB/jsclass.js');
	var global = require('$SPRITE/global.js');
	var sprite = require('$SPRITE/sprite.js');
    require('./sprite.js');
    
    var GlobalViewportResize = new JS.Class('sprite.GlobalViewportResize', 
	{
        // Constructor /////////////////////////////////////////////////////////////
        /** The standard JSClass initializer function. Subclasses should not
            override this function.
            @param attrs:object A map of attribute names and values.
            @returns void */
    
		initialize: function(view, attrs) 
		{
            this.view = view;            
            var self = this;
            sprite.addEventListener(global, 'resize', function(domEvent) 
			{
                view.__handleResizeEvent(self.getViewportWidth(), self.getViewportHeight());
            });
        },

        // Methods /////////////////////////////////////////////////////////////////
        getViewportWidth: function() 
		{
            return global.innerWidth;
        },
        
        getViewportHeight: function() 
		{
            return global.innerHeight;
        }
    });
	
	module.exports = GlobalViewportResize
});
