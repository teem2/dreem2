/** Generates focus and blur events and passes them on to one or more 
    event observers. Also provides focus related events to a view. When a view
    is focused or blurred, dr.global.focus will be notified via the
    'notifyFocus' and 'notifyBlur' methods.
    
    Requires dr.sprite.DomObservable as a callSuper mixin.
    
    Events:
        focused:object Fired when this view gets focus. The value is this view.
        focus:object Fired when this view gets focus. The value is a dom
            focus event.
        blur:object Fired when this view loses focus. The value is a dom
            focus event.
    
    Attributes:
        focusable:boolean Indicates if this view can have focus or not.
*/
define(function(require, exports){
    var dr = require('../../dr.js');
    var JS = require('../../../../../../lib/jsclass.js');
    
    require('./PlatformObservable.js');
    require('../../globals/GlobalFocus.js');
    
    dr.sprite.FocusObservable = new JS.Module('sprite.FocusObservable', {
        // Class Methods and Attributes ////////////////////////////////////////////
        extend: {
            /** A map of supported focus event types. */
            EVENT_TYPES:{
                onfocus:true,
                onblur:true
            }
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        set_focusable: function(v) {
            var view = this.view;
            if (v) {
                this.platformObject.tabIndex = 0; // Make focusable. -1 is programtic only
                view.listenToPlatform(view, 'onfocus', '__handleFocus');
                view.listenToPlatform(view, 'onblur', '__handleBlur');
            } else if (wasFocusable) {
                this.platformObject.removeAttribute('tabIndex'); // Make unfocusable
                view.stopListeningToPlatform(view, 'onfocus', '__handleFocus');
                view.stopListeningToPlatform(view, 'onblur', '__handleBlur');
            }
            return v;
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        showFocusEmbellishment: function() {
            // IE
            this.platformObject.hideFocus = false;
            
            // Mozilla and Webkit
            var s = this.styleObj;
            s.outlineWidth = 'thin';
            s.outlineColor = '#88bbff';
            s.outlineStyle = 'solid';
            s.outlineOffset = '0px';
        },
        
        hideFocusEmbellishment: function() {
            // IE
            this.platformObject.hideFocus = true;
            
            // Mozilla and Webkit
            this.styleObj.outlineStyle = 'none';
        },
        
        /** Calling this method will set focus onto this view if it is focusable.
            @param noScroll:boolean (optional) if true is provided no auto-scrolling
                will occur when focus is set.
            @returns void */
        focus: function(noScroll) {
            var po = this.platformObject;
            if (noScroll) {
                // Maintain scrollTop/scrollLeft
                var ancestors = this.getAncestorArray(po),
                    len = ancestors.length, i = len, ancestor,
                    scrollPositions = [], scrollPosition;
                while (i) {
                    ancestor = ancestors[--i];
                    scrollPositions.unshift({scrollTop:ancestor.scrollTop, scrollLeft:ancestor.scrollLeft});
                }
                
                po.focus();
                
                // Restore scrollTop/scrollLeft
                i = len;
                while (i) {
                    ancestor = ancestors[--i];
                    scrollPosition = scrollPositions[i];
                    ancestor.scrollTop = scrollPosition.scrollTop;
                    ancestor.scrollLeft = scrollPosition.scrollLeft;
                }
            } else {
                po.focus();
            }
        },
        
        /** Removes the focus from this view. Do not call this method directly.
            @private
            @returns void */
        blur: function() {
            this.platformObject.blur();
        },
        
        /** @overrides dr.PlatformObservable */
        createPlatformMethodRef: function(platformObserver, methodName, type) {
            if (dr.sprite.FocusObservable.EVENT_TYPES[type]) {
                var self = this;
                return function(platformEvent) {
                    if (!platformEvent) var platformEvent = global.event;
                    
                    // OPTIMIZATION: prevent extra focus events under special 
                    // circumstances. See dr.VariableLayout for more detail.
                    if (self._ignoreFocus) {
                        platformEvent.cancelBubble = true;
                        if (platformEvent.stopPropagation) platformEvent.stopPropagation();
                        dr.sprite.preventDefault(platformEvent);
                        return;
                    }
                    
                    var allowBubble = platformObserver[methodName](platformEvent);
                    if (!allowBubble) {
                        platformEvent.cancelBubble = true;
                        if (platformEvent.stopPropagation) platformEvent.stopPropagation();
                    }
                };
            }
            
            return this.callSuper(platformObserver, methodName, type);
        }
    });
});
