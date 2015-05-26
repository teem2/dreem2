/** Objects that can be used in an dr.AbstractPool should use this mixin and 
    implement the "clean" method. */
define(function(require, exports, module){
    var dr = require('$LIB/dr/dr.js');
    var JS = require('$LIB/jsclass.js');
    
    dr.Reusable = new JS.Module('Reusable', {
        // Methods /////////////////////////////////////////////////////////////////
        /** Puts this object back into a default state suitable for storage in
            an dr.AbstractPool
            @returns void */
        clean: function() {}
    });
    
    module.exports = dr.Reusable;
});
