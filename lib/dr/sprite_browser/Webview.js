/** Provides an interface to platform specific Webview functionality. */
define(function(require, exports, module){
    var dr = require('$LIB/dr/dr.js');
    var JS = require('$LIB/jsclass.js');
    var global = require('$SPRITE/global.js');
    
    require('./View.js');
    
    dr.sprite.Webview = new JS.Class('sprite.Webview', dr.sprite.View, {
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
            if (v && v.length > 0) {
                this.platformObject.contentDocument.write(v);
                
                /*var doc = this.platformObject.contentWindow.document;
                doc.open('text/htmlreplace');
                doc.write('<!DOCTYPE html><html><head><title></title></head><body>' + v + '</body></html>');
                doc.close();*/
            }
            return v;
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @overrides */
        createPlatformMethodRef: function(platformObserver, methodName, eventType) {
            return this.createStandardPlatformMethodRef(platformObserver, methodName, eventType, dr.sprite.Webview) || 
                this.callSuper(platformObserver, methodName, type);
        },
    });
    
    module.exports = dr.sprite.Webview;
});
