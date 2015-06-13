/** Provides an interface to platform specific Webview functionality. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js');
    
    module.exports = dr.sprite.Webview = new JS.Class('sprite.Webview', require('./View.js'), {
        // Class Methods and Attributes ////////////////////////////////////////////
        extend: {
            /** A map of supported iframe event types. */
            EVENT_TYPES:{
                onload:true
            }
        },
        
        
        // Life Cycle //////////////////////////////////////////////////////////////
        createPlatformObject: function(attrs) {
            attrs.ELEMENT_TYPE = 'iframe';
            
            var elem = this.callSuper(attrs);
            elem.setAttribute('seamless', 'seamless');
            
            return elem;
        },
        
        
        // Attributes //////////////////////////////////////////////////////////////
        set_src: function(v) {
            this.platformObject.src = v;
            return v;
        },
        
        set_contents: function(v) {
            if (v && v.length > 0) this.platformObject.contentDocument.write(v);
            return v;
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @overrides */
        createPlatformMethodRef: function(platformObserver, methodName, eventType) {
            return this.createStandardPlatformMethodRef(platformObserver, methodName, eventType, dr.sprite.Webview) || 
                this.callSuper(platformObserver, methodName, type);
        }
    });
});
