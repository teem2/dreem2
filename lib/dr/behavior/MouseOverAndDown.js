/** Provides both MouseOver and MouseDown mixins as a single mixin. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js');
    
    module.exports = dr.MouseOverAndDown = new JS.Module('MouseOverAndDown', {
        include: [
            require('./MouseOver.js'),
            require('./MouseDown.js')
        ]
    });
});
