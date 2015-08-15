/** Generates events for browser drag and drop events.
    
    Requires: dr.sprite.PlatformObservable super mixin.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        sprite = require('$SPRITE/sprite.js');
    require('./PlatformObservable.js');
    
    module.exports = sprite.DropObservable = new JS.Module('sprite.DropObservable', {
        // Class Methods and Attributes ////////////////////////////////////////////
        extend: {
            /** A map of supported input event types. */
            EVENT_TYPES:{
                ondragover:true,
                ondrop:true
            }
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @overrides dr.sprite.PlatformObservable */
        createPlatformMethodRef: function(platformObserver, methodName, type) {
            return this.createStandardPlatformMethodRef(platformObserver, methodName, type, sprite.DropObservable) || 
                this.callSuper(platformObserver, methodName, type);
        }
    });
});
