/** Provides button functionality to a dr.View. Most of the functionality 
    comes from the mixins included by this mixin. This mixin resolves issues 
    that arise when the various mixins are used together.
    
    By default dr.Button instances are focusable.
    
    Attributes:
        None
    
    Private Attributes:
        __restoreCursor:string The cursor to restore to when the button is
            no longer disabled.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js');
    
    module.exports = dr.Button = new JS.Module('Button', {
        include: [
            require('$LIB/dr/behavior/Activateable'),
            require('$LIB/dr/behavior/UpdateableUI'),
            require('$LIB/dr/behavior/MouseOverAndDown'),
            require('$LIB/dr/behavior/Disableable'),
            require('$LIB/dr/behavior/KeyActivation')
        ],
        
        
        // Life Cycle //////////////////////////////////////////////////////////////
        /** @overrides */
        initNode: function(parent, attrs) {
            if (attrs.focusable === undefined) attrs.focusable = true;
            if (attrs.cursor === undefined) attrs.cursor = 'pointer';
            
            this.callSuper(parent, attrs);
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        /** @overrides dr.View */
        set_focused: function(v) {
            var existing = this.focused;
            this.callSuper(v);
            if (this.initing === false && this.focused !== existing) this.updateUI();
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @overrides dr.KeyActivation. */
        doActivationKeyDown: function(key, isRepeat) {
            // Prevent unnecessary UI updates when the activation key is repeating.
            if (!isRepeat) this.updateUI();
        },
        
        /** @overrides dr.KeyActivation. */
        doActivationKeyUp: function(key) {
            this.callSuper(key);
            if (!this.destroyed) this.updateUI();
        },
        
        /** @overrides dr.KeyActivation. */
        doActivationKeyAborted: function(key) {
            this.callSuper(key);
            this.updateUI();
        },
        
        /** @overrides dr.UpdateableUI. */
        updateUI: function() {
            if (this.disabled) {
                // Remember the cursor to change back to, but don't re-remember
                // if we're already remembering one.
                if (this.__restoreCursor == null) this.__restoreCursor = this.cursor;
                this.set_cursor('not-allowed');
                this.drawDisabledState();
            } else {
                var rc = this.__restoreCursor;
                if (rc) {
                    this.set_cursor(rc);
                    this.__restoreCursor = null;
                }
                
                if (this.activateKeyDown !== -1 || this.ismousedown) {
                    this.drawActiveState();
                } else if (this.focused) {
                    this.drawFocusedState();
                } else if (this.ismouseover) {
                    this.drawHoverState();
                } else {
                    this.drawReadyState();
                }
            }
        },
        
        /** Draw the UI when the component is in the disabled state.
            @returns void */
        drawDisabledState: function() {
            // Subclasses to implement as needed.
        },
        
        /** Draw the UI when the component has focus. The default implementation
            calls drawHoverState.
            @returns void */
        drawFocusedState: function() {
            this.drawHoverState();
        },
        
        /** Draw the UI when the component is on the verge of being interacted 
            with. For mouse interactions this corresponds to the over state.
            @returns void */
        drawHoverState: function() {
            // Subclasses to implement as needed.
        },
        
        /** Draw the UI when the component has a pending activation. For mouse
            interactions this corresponds to the down state.
            @returns void */
        drawActiveState: function() {
            // Subclasses to implement as needed.
        },
        
        /** Draw the UI when the component is ready to be interacted with. For
            mouse interactions this corresponds to the enabled state when the
            mouse is not over the component.
            @returns void */
        drawReadyState: function() {
            // Subclasses to implement as needed.
        }
    });
});
