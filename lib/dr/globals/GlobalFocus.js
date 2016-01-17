/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


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
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        GlobalRegistry = require('./Global.js'),
        sprite = require('$SPRITE/sprite.js');
    
    module.exports = new JS.Singleton('GlobalFocus', {
        include: [
            require('$LIB/dr/events/Observable')
        ],
        
        
        // Constructor /////////////////////////////////////////////////////////////
        initialize: function() {
            this.lastTraversalWasForward = true;
            
            GlobalRegistry.register('focus', this);
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        /** Sets the currently focused view. */
        set_focusedView: function(v) {
            if (sprite.focus.set_focusedView(v)) {
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
            sprite.focus.notifyFocus(focusable);
        },
        
        /** Called by a focusable dr.View when it has lost focus.
            @param focusable:dr.View The view that lost focus.
            @returns void. */
        notifyBlur: function(focusable) {
            sprite.focus.notifyBlur(focusable);
        },
        
        /** Clears the current focus.
            @returns void */
        clear: function() {
            sprite.focus.clear();
        },
        
        // Focus Traversal //
        /** Move focus to the next focusable element.
            @param ignoreFocusTrap:boolean If true focus traps will be skipped over.
            @returns void */
        next: function(ignoreFocusTrap) {
            sprite.focus.next(ignoreFocusTrap);
        },
        
        /** Move focus to the previous focusable element.
            @param ignoreFocusTrap:boolean If true focus traps will be skipped over.
            @returns void */
        prev: function(ignoreFocusTrap) {
            sprite.focus.prev(ignoreFocusTrap);
        }
    });
});
