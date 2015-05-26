/** Provides both MouseOver and MouseDown mixins as a single mixin. */
define(function(require, exports, module){
    var dr = require('$LIB/dr/dr.js');
    var JS = require('$LIB/jsclass.js');
    
    dr.MouseOverAndDown = new JS.Module('MouseOverAndDown', {
        include: [
            require('./MouseOver.js'),
            require('./MouseDown.js')
        ]
    });
    
    module.exports = dr.MouseOverAndDown;
});
