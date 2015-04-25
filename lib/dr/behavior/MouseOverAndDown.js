/** Provides both MouseOver and MouseDown mixins as a single mixin. */
define(function(require, exports){
    var dr = require('../dr.js');
    var JS = require('../../../../../lib/jsclass.js');
    require('./MouseDown.js');
    
    dr.MouseOverAndDown = new JS.Module('MouseOverAndDown', {
        include: [dr.MouseOver, dr.MouseDown]
    });
});
