/** Provides an 'ismousedown' attribute that tracks mouse up/down state.
    
    Requires: dr.MouseOver super mixins.
    
    Suggested: dr.UpdateableUI and dr.Activateable super mixins.
    
    Attributes:
        ismousedown:boolean Indicates if the mouse is down or not.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js');
    require('./MouseOver.js');
    require('$LIB/dr/globals/GlobalMouse.js');
    
    module.exports = dr.MouseDown = new JS.Module('MouseDown', {
        // Life Cycle //////////////////////////////////////////////////////////////
        /** @overrides */
        initNode: function(parent, attrs) {
            if (attrs.ismousedown === undefined) attrs.ismousedown = false;
            if (attrs.clickable === undefined) attrs.clickable = true;
            
            this.callSuper(parent, attrs);
            
            this.listenToPlatform(this, 'onmousedown', 'doMouseDown');
            this.listenToPlatform(this, 'onmouseup', 'doMouseUp');
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        set_ismousedown: function(v) {
            if (this.setActual('ismousedown', v, 'boolean', false)) {
                if (this.initing === false) {
                    if (this.ismousedown) this.focus(true);
                    if (this.updateUI) this.updateUI();
                }
            }
        },
        
        /** @overrides dr.Disableable */
        set_disabled: function(v) {
            if (this.callSuper) this.callSuper(v);
            
            // When about to disable the view make sure ismousedown is not 
            // true. This helps prevent unwanted activation of a disabled view.
            if (this.disabled && this.ismousedown) this.set_ismousedown(false);
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @overrides dr.MouseOver */
        doMouseOver: function(event) {
            this.callSuper(event);
            if (this.ismousedown) this.stopListeningToPlatform(dr.global.mouse, 'onmouseup', 'doMouseUp', true);
        },
        
        /** @overrides dr.MouseOut */
        doMouseOut: function(event) {
            this.callSuper(event);
            
            // Wait for a mouse up anywhere if the user moves the mouse out of the
            // view while the mouse is still down. This allows the user to move
            // the mouse in and out of the view with the view still behaving 
            // as moused down.
            if (!this.disabled && this.ismousedown) this.listenToPlatform(dr.global.mouse, 'onmouseup', 'doMouseUp', true);
        },
        
        /** Called when the mouse is down on this view. Subclasses must call callSuper.
            @returns void */
        doMouseDown: function(event) {
            if (!this.disabled) this.set_ismousedown(true);
        },
        
        /** Called when the mouse is up on this view. Subclasses must call callSuper.
            @returns void */
        doMouseUp: function(event) {
            // Cleanup global mouse listener since the mouseUp occurred outside
            // the view.
            if (!this.ismouseover) this.stopListeningToPlatform(dr.global.mouse, 'onmouseup', 'doMouseUp', true);
            
            if (!this.disabled && this.ismousedown) {
                this.set_ismousedown(false);
                
                // Only do mouseUpInside if the mouse is actually over the view.
                // This means the user can mouse down on a view, move the mouse
                // out and then mouse up and not "activate" the view.
                if (this.ismouseover) {
                    this.doMouseUpInside(event);
                } else {
                    this.doMouseUpOutside(event);
                }
            }
        },
        
        /** Called when the mouse is up and we are still over the view. Executes
            the 'doActivated' method by default.
            @returns void */
        doMouseUpInside: function(event) {
            if (this.doActivated) this.doActivated();
        },
        
        /** Called when the mouse is up and we are not over the view. Fires
            an 'onmouseupoutside' event.
            @returns void */
        doMouseUpOutside: function(event) {
            if (!this.disabled) {
                this.sendEvent('onmouseupoutside', true);
                
                // Also try and send it to the global mouse
                dr.mouse.sendEvent('onmouseupoutside', true);
            }
        }
    });
});
