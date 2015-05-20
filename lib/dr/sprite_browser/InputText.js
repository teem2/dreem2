/** Provides an interface to platform specific Input Text functionality. */
define(function(require, exports, module){
    var dr = require('$LIB/dr/dr.js');
    var JS = require('$LIB/jsclass.js');
    var global = require('$SPRITE/global.js');
    
    require('./Text.js');
    
    dr.sprite.InputText = new JS.Class('sprite.InputText', dr.sprite.Text, {
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
            this.platformObject.value = v;
            return v;
        },
        
        get_value: function() {
            return this.platformObject.value;
        }
    });
    
    module.exports = dr.sprite.InputText;
});
