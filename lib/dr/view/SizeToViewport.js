/** A mixin that sizes a root view to the viewport width, height or both.
    
    Events:
        None
    
    Attributes:
        minwidth:number the minimum width below which this view will not 
            resize its width. Defaults to 0.
        minheight:number the minimum height below which this view will not
            resize its height. Defaults to 0.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js');
    require('$LIB/dr/globals/GlobalViewportResize.js');
    
    module.exports = dr.SizeToViewport = new JS.Module('SizeToViewport', {
        include: [
            require('$LIB/dr/RootNode.js')
        ],
        
        
        // Life Cycle //////////////////////////////////////////////////////////////
        /** @overrides */
        initNode: function(parent, attrs) {
            this.minwidth = this.minheight = 0;
            this.callSuper(parent, attrs);
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        set_minwidth: function(v) {this.setActual('minwidth', v, 'number', 0);},
        set_minheight: function(v) {this.setActual('minheight', v, 'number', 0);}
    });
});
