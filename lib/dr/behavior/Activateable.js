/** Adds the capability for an dr.View to be "activated". A doActivated method
    is added that gets called when the view is "activated". */
define(function(require, exports, module){
    var dr = require('$LIB/dr/dr.js');
    var JS = require('$LIB/jsclass.js');
    
    dr.Activateable = new JS.Module('Activateable', {
        // Methods /////////////////////////////////////////////////////////////////
        /** Called when this view should be activated.
            @returns void */
        doActivated: function() {
            this.sendEvent('onactivated', true);
        }
    });
    
    module.exports = dr.Activateable;
});
