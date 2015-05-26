/** Tracks focus and provides global focus events. Registered with dr.global 
    as 'focus'.
    
    Events:
        onfocused:View Fired when the focused view changes. The event value is
            the newly focused view.
    
    Attributes:
        lastTraversalWasForward:boolean indicates if the last traversal was
            in the forward direction or not. If false this implies the last
            traversal was in the backward direction. This value is initalized
            to true.
        focusedView:View the view that currently has focus.
        prevFocusedView:View the view that previously had focus.
*/
define(function(require, exports, module){
    var dr = require('$LIB/dr/dr.js');
    var JS = require('$LIB/jsclass.js');
    require('./Global.js');
    require('$SPRITE/sprite.js');
    
    new JS.Singleton('GlobalFocus', {
        include: [
            require('$LIB/dr/events/Observable')
        ],
        
        
        // Constructor /////////////////////////////////////////////////////////////
        initialize: function() {
            dr.global.register('focus', this);
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        /** Sets the currently focused view. */
        set_focusedView: function(v) {
            if (dr.sprite.focus.set_focusedView(v)) {
                this.prevFocusedView = this.focusedView;
                this.focusedView = v;
                this.sendEvent('onfocused', v);
            }
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** Called by a focusable dr.View when it has received focus.
            @param focusable:dr.View The view that received focus.
            @returns void. */
        notifyFocus: function(focusable) {
            dr.sprite.focus.notifyFocus(focusable);
        },
        
        /** Called by a focusable dr.View when it has lost focus.
            @param focusable:dr.View The view that lost focus.
            @returns void. */
        notifyBlur: function(focusable) {
            dr.sprite.focus.notifyBlur(focusable);
        },
        
        /** Clears the current focus.
            @returns void */
        clear: function() {
            dr.sprite.focus.clear();
        },
        
        // Focus Traversal //
        /** Move focus to the next focusable element.
            @param ignoreFocusTrap:boolean If true focus traps will be skipped over.
            @returns void */
        next: function(ignoreFocusTrap) {
            dr.sprite.focus.next(ignoreFocusTrap);
        },
        
        /** Move focus to the previous focusable element.
            @param ignoreFocusTrap:boolean If true focus traps will be skipped over.
            @returns void */
        prev: function(ignoreFocusTrap) {
            dr.sprite.focus.prev(ignoreFocusTrap);
        }
    });
});
