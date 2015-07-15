/** Generates Mouse Events and passes them on to one or more event observers.
    Also provides the capability to capture contextmenu events and mouse
    wheel events.
    
    Requires: dr.sprite.PlatformObservable callSuper mixin.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        sprite = require('$SPRITE/sprite.js');
    require('./PlatformObservable.js');
    
    module.exports = sprite.MouseObservable = new JS.Module('sprite.MouseObservable', {
        // Class Methods and Attributes ////////////////////////////////////////////
        extend: {
            /** A map of supported mouse event types. */
            EVENT_TYPES:{
                onmouseover:true,
                onmouseout:true,
                onmousedown:true,
                onmouseup:true,
                onclick:true,
                ondblclick:true,
                onmousemove:true,
                oncontextmenu:true,
                onwheel:true
            },
            
            /** Gets the mouse coordinates from the provided event.
                @param platformEvent:domEvent
                @returns object: An object with 'x' and 'y' keys containing the
                    x and y mouse position. */
            getMouseFromEvent: function(platformEvent) {
                return {x:platformEvent.pageX, y:platformEvent.pageY};
            },
            
            getMouseFromEventRelativeToView: function(platformEvent, view) {
                var viewPos = view.getAbsolutePosition(),
                    pos = this.getMouseFromEvent(platformEvent);
                pos.x -= viewPos.x;
                pos.y -= viewPos.y;
                return pos;
            }
        },
        
        // converts a native event to a sanatized object to prevent leaky abstractions
        coerceNativeEvent: function(event) {
            var t = event.target;
            var view = null;

            while (t !== document) {
              if (t.$view) {
                // don't prevent bubbling for mouseup events
                view = t.$view;
                break
              }
              t = t.parentNode;
            }
            return {type: 'on' + event.type, view: view, rawtarget: event.target, x: event.pageX, y: event.pageY};
        },

        // Methods /////////////////////////////////////////////////////////////////
        /** @overrides dr.sprite.PlatformObservable */
        createPlatformMethodRef: function(platformObserver, methodName, type) {
            return this.createStandardPlatformMethodRef(
                platformObserver, methodName, type, sprite.MouseObservable, 
                type !== 'onwheel', // Prevent default for all mouse event except wheel since we want the browser to scroll for us.
                this.coerceNativeEvent
            ) || this.callSuper(platformObserver, methodName, type);
        }
    });
});
