/** Generates input events and passes them on to one or more event observers.
    
    Requires: dr.sprite.PlatformObservable super mixin.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js');
    require('./PlatformObservable.js');
    
    module.exports = dr.sprite.InputObservable = new JS.Module('sprite.InputObservable', {
        // Class Methods and Attributes ////////////////////////////////////////////
        extend: {
            /** A map of supported input event types. */
            EVENT_TYPES:{
                oninput:true,
                onselect:true,
                onchange:true
            }
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @overrides dr.sprite.PlatformObservable */
        createPlatformMethodRef: function(platformObserver, methodName, type) {
            return this.createStandardPlatformMethodRef(platformObserver, methodName, type, dr.sprite.InputObservable) || 
                this.callSuper(platformObserver, methodName, type);
        }
    });
});
