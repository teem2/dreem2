/** Provides an interface to platform specific Idle functionality. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        globalScope = require('$SPRITE/global.js'),
        sprite = require('$SPRITE/sprite.js');
    
    module.exports = sprite.GlobalIdle = new JS.Class('sprite.GlobalIdle', {
        // Constructor /////////////////////////////////////////////////////////////
        /** The standard JSClass initializer function. Subclasses should not
            override this function.
            @param attrs:object A map of attribute names and values.
            @returns void */
        initialize: function(view, attrs) {
            this.view = view;
            
            
            // Setup callback function
            var self = this;
            this.__event = {};
            this.__doIdle = function doIdle(time) {
                var lastTime = self.lastTime;
                if (lastTime !== -1) {
                    time = Math.round(time);
                    var event = self.__event;
                    event.delta = time - lastTime;
                    event.time = time;
                    //console.log("idle!");
                    view.sendEvent('onidle', event);
                }
                self.lastTime = time;
            };
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        start: function() {
			this.stop();
            this.lastTime = -1;
			this.theTimer = setInterval(this.__doIdle.bind(this), 20)
        },
        
        stop: function() {
			if (this.theTimer) {
				clearInterval(this.theTimer);
				this.theTimer = null;
			}
        }
    });
});
