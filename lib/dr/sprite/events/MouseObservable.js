/** Generates Mouse Events and passes them on to one or more event observers.
    Also provides the capability to capture contextmenu events and mouse
    wheel events.
    
    Requires: dr.sprite.PlatformObservable callSuper mixin.
*/
define(function(require, exports){
    var dr = require('../../dr.js');
    var JS = require('../../../../../../lib/jsclass.js');
    
    require('./PlatformObservable.js');
    
    dr.sprite.MouseObservable = new JS.Module('sprite.MouseObservable', {
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
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @overrides dr.sprite.PlatformObservable */
        createPlatformMethodRef: function(platformObserver, methodName, type) {
            return this.createStandardPlatformMethodRef(platformObserver, methodName, type, dr.sprite.MouseObservable, true) || 
                this.callSuper(platformObserver, methodName, type);
        }
    });
});
