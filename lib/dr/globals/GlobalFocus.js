/**
 * Copyright (c) 2015 Teem2 LLC
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
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
