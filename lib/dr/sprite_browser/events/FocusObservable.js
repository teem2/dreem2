/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


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
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        sprite = require('$SPRITE/sprite.js');
    require('./PlatformObservable.js');
    require('$LIB/dr/globals/GlobalFocus.js');
    
    module.exports = sprite.FocusObservable = new JS.Module('sprite.FocusObservable', {
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
            } else if (view.focusable) {
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
                var ancestors = this.getAncestorArray(),
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
            // DRY: Very similar code in dr.sprite.PlatformObservable
            if (sprite.FocusObservable.EVENT_TYPES[type]) {
                var self = this;
                return function(platformEvent) {
                    if (!platformEvent) platformEvent = global.event;
                    
                    // OPTIMIZATION: prevent extra focus events under special 
                    // circumstances. See dr.VariableLayout for more detail.
                    if (self.__ignoreFocus) {
                        platformEvent.cancelBubble = true;
                        if (platformEvent.stopPropagation) platformEvent.stopPropagation();
                        sprite.preventDefault(platformEvent);
                        return;
                    }
                    
                    var allowBubble;
                    if (typeof methodName === 'function') {
                        allowBubble = methodName.call(platformObserver, platformEvent);
                    } else {
                        allowBubble = platformObserver[methodName](platformEvent);
                    }
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
