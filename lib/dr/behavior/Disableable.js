/** Adds the capability to be "disabled" to a dr.Node. When a dr.Node is 
    disabled the user should typically not be able to interact with it.
    
    When disabled becomes true an attempt will be made to give away the focus
    using dr.View's giveAwayFocus method.
    
    Attributes:
        disabled:boolean Indicates that this component is disabled.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js');
    require('./UpdateableUI.js');
    
    module.exports = dr.Disableable = new JS.Module('Disableable', {
        // Life Cycle //////////////////////////////////////////////////////////////
        /** @overrides */
        initNode: function(parent, attrs) {
            if (attrs.disabled === undefined) attrs.disabled = false;
            
            this.callSuper(parent, attrs);
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        set_disabled: function(v) {
            if (this.setActual('disabled', v, 'boolean', false)) this.doDisabled();
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** Called after the disabled attribute is set. Default behavior attempts
            to give away focus and calls the updateUI method of dr.UpdateableUI if 
            it is defined.
            @returns void */
        doDisabled: function() {
            if (this.initing === false) {
                // Give away focus if we become disabled and this instance is
                // a dr.View
                if (this.disabled && this.giveAwayFocus) this.giveAwayFocus();
                
                if (this.updateUI) this.updateUI();
            }
        }
    });
});
