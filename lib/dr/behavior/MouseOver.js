/** Provides a 'mouseover' attribute that tracks mouse over/out state. Also
    provides a mechanism to smoothe over/out events so only one call to
    'doSmoothMouseOver' occurs per onidle event.
    
    Requires dr.Disableable and dr.MouseObservable callSuper mixins.
    
    Events:
        None
    
    Attributes:
        mouseover:boolean Indicates if the mouse is over this view or not.
    
    Private Attributes:
        __attachedToOverIdle:boolean Used by the code that smoothes out
            mouseover events. Indicates that we are registered with the
            onidle event.
        __lastOverIdleValue:boolean Used by the code that smoothes out
            mouseover events. Stores the last mouseover value.
*/
define(function(require, exports){
    var dr = require('../dr.js');
    var JS = require('../../../../../lib/jsclass.js');
    require('./Disableable.js');
    require('../globals/GlobalIdle.js');
    
    dr.MouseOver = new JS.Module('MouseOver', {
        // Life Cycle //////////////////////////////////////////////////////////////
        /** @overrides */
        initNode: function(parent, attrs) {
            if (attrs.mouseover === undefined) attrs.mouseover = false;
            if (attrs.clickable === undefined) attrs.clickable = true;
            
            this.callSuper(parent, attrs);
            
            this.listenToPlatform(this, 'onmouseover', 'doMouseOver');
            this.listenToPlatform(this, 'onmouseout', 'doMouseOut');
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        set_mouseover: function(v) {
            if (this.setActual('mouseover', v, 'boolean', false)) {
                // Smooth over/out events by delaying until the next onidle event.
                if (this.initing === false && !this.__attachedToOverIdle) {
                    this.__attachedToOverIdle = true;
                    this.listenTo(dr.global.idle, 'onidle', '__doMouseOverOnIdle');
                }
            }
        },
        
        /** @overrides dr.Disableable */
        set_disabled: function(v) {
            // When about to disable make sure mouseover is not true. This 
            // helps prevent unwanted behavior of a disabled view.
            if (v && this.mouseover) this.set_mouseover(false);
            
            this.callSuper(v);
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @private */
        __doMouseOverOnIdle: function() {
            this.stopListening(dr.global.idle, 'onidle', '__doMouseOverOnIdle');
            this.__attachedToOverIdle = false;
            
            // Only call doSmoothOver if the over/out state has changed since the
            // last time it was called.
            var isOver = this.mouseover;
            if (this.__lastOverIdleValue !== isOver) {
                this.__lastOverIdleValue = isOver;
                this.doSmoothMouseOver(isOver);
            }
        },
        
        /** Called when mouseover state changes. This method is called after
            an event filtering process has reduced frequent over/out events
            originating from the dom.
            @returns void */
        doSmoothMouseOver: function(isOver) {
            if (this.initing === false && this.updateUI) this.updateUI();
        },
        
        /** Called when the mouse is over this view. Subclasses must call callSuper.
            @returns void */
        doMouseOver: function(event) {
            if (!this.disabled) this.set_mouseover(true);
        },
        
        /** Called when the mouse leaves this view. Subclasses must call callSuper.
            @returns void */
        doMouseOut: function(event) {
            if (!this.disabled) this.set_mouseover(false);
        }
    });
});
