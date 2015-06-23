/** Provides an interface to platform specific Idle functionality. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        globalScope = require('$SPRITE/global.js');
    var sprite = require('$SPRITE/sprite.js');
    module.exports = sprite.GlobalIdle = new JS.Class('sprite.GlobalIdle', {
        // Constructor /////////////////////////////////////////////////////////////
        /** The standard JSClass initializer function. Subclasses should not
            override this function.
            @param attrs:object A map of attribute names and values.
            @returns void */
        initialize: function(view, attrs) {
            this.view = view;
            
            var vendor, vendors = ['webkit','moz','ms','o'], g = globalScope;
            for (var i = 0; i < vendors.length && !g.requestAnimationFrame; ++i) {
                vendor = vendors[i];
                g.requestAnimationFrame = g[vendor + 'RequestAnimationFrame'];
                g.cancelAnimationFrame = g[vendor + 'CancelAnimationFrame'] || g[vendor + 'CancelRequestAnimationFrame'];
            }
            
            // Setup callback function
            var self = this;
            this.__event = {};
            this.__doIdle = function doIdle(time) {
                self.__timerId = g.requestAnimationFrame(doIdle);
                var lastTime = self.lastTime;
                if (lastTime !== -1) {
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
        start: function() {
            this.lastTime = -1;
            this.__timerId = globalScope.requestAnimationFrame(this.__doIdle);
        },
        
        stop: function() {
            globalScope.cancelAnimationFrame(this.__timerId);
        }
    });
});
