/** Generates Scroll Events and passes them on to one or more event observers.
    
    Requires: dr.sprite.PlatformObservable callSuper mixin.
*/
define(function(require, exports){
    var dr = require('../../dr.js');
    var JS = require('$LIB/jsclass.js');
    
    require('./PlatformObservable.js');
    
    dr.sprite.ScrollObservable = new JS.Module('sprite.ScrollObservable', {
        // Class Methods and Attributes ////////////////////////////////////////////
        extend: {
            /** A map of supported scroll event types. */
            EVENT_TYPES:{
                onscroll:true
            }
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @overrides dr.sprite.PlatformObservable */
        createPlatformMethodRef: function(platformObserver, methodName, type) {
            return this.createStandardPlatformMethodRef(platformObserver, methodName, type, dr.sprite.ScrollObservable) || 
                this.callSuper(platformObserver, methodName, type);
        }
    });
});
