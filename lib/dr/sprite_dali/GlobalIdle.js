/** Provides an interface to platform specific Idle functionality. */
define(function(require, exports, module){
    var dr = require('$LIB/dr/dr.js');
    var JS = require('$LIB/jsclass.js');
	var global = require('$SPRITE/global.js');
	var dali = require('$SPRITE/dali.js')
    require('./sprite.js');
    
    var GlobalIdle = new JS.Class('sprite.GlobalIdle', 
	{
        // Constructor /////////////////////////////////////////////////////////////
        /** The standard JSClass initializer function. Subclasses should not
            override this function.
            @param attrs:object A map of attribute names and values.
            @returns void */
        
		initialize: function(view, attrs) 
		{
            this.view = view;
            dali.StartIdleTick(global.callAllIdleFunctions);
            // Setup callback function
            var self = this;
            this.__event = {};
            this.__doIdle = function doIdle(time) 
			{
                var lastTime = self.lastTime;
                if (lastTime !== -1) 
				{
                    time = Math.round(time);
                    var event = self.__event;
                    event.delta = time - lastTime;
                    event.time = time;
                    view.sendEvent('onidle', event);
                }
                self.lastTime = time;
            };
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        start: function() 
		{
            this.lastTime = -1;
            this.__timerId = global.SetupIdleCallback(this.__doIdle);
        },
        
        stop: function() 
		{
            global.CancleIdleCallback(this.__timerId);
        }
		
    });
	module.exports = GlobalIdle;
});
