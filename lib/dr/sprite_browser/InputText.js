/** Provides an interface to platform specific Input Text functionality. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        globalScope = require('$SPRITE/global.js'),
        sprite = require('$SPRITE/sprite.js');
    
    module.exports = sprite.InputText = new JS.Class('sprite.InputText', require('./Text.js'), {
        // Life Cycle //////////////////////////////////////////////////////////////
        createPlatformObject: function(attrs) {
            var isMulti = attrs.multiline === 'true';
            attrs.ELEMENT_TYPE = isMulti ? 'textarea' : 'input';
            
            var elem = this.callSuper(attrs);
            
            if (isMulti) {
                elem.style.resize = 'none';
            } else {
                elem.setAttribute('type', 'text');
            }
            
            return elem;
        },
        
        
        // Attributes //////////////////////////////////////////////////////////////
        set_rows: function(v) {
            this.platformObject.rows = v;
            return v;
        },
        
        set_value: function(v) {
            if (this.platformObject.value !== v) this.platformObject.value = v;
            return v;
        },
        
        get_value: function() {
            return this.platformObject.value;
        },
        
        set_maxlength: function(v) {
            if (v == null || 0 > v) {
                this.platformObject.removeAttribute('maxLength');
            } else {
                this.platformObject.maxLength = v;
            }
            return v;
        },
        
        set_disabled: function(v) {
            if (this.platformObject.disabled !== v) this.platformObject.disabled = v;
            return v;
        },
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @overrides */
        preventDefault: function(platformEvent, eventType, preventDefault) {
            // Never prevent default behavior with input text.
            return false;
        },
        
        /** @private */
        filterInputPress: function(platformEvent) {
            var charCode = platformEvent.which;
            
            // Firefox fires events for arrow keys and backspace which should be
            // ignored completely.
            switch (charCode) {
                case 8: // backspace key
                case 0: // arrow keys have a "charCode" of 0 in firefox.
                    return;
            }
            
            // Filter for allowed characters
            var allowedchars = this.view.allowedchars;
            if (allowedchars && allowedchars.indexOf(String.fromCharCode(charCode)) === -1) dr.sprite.preventDefault(platformEvent);
        }
    });
});
