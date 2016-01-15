/* Copyright 2015 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


/** Provides an interface to platform specific global keyboard functionality. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        globalScope = require('$SPRITE/global.js'),
        globalRegistry = require('$LIB/dr/globals/Global.js'),
        sprite = require('$SPRITE/sprite.js');
    
    module.exports = sprite.GlobalKeys = new JS.Class('sprite.GlobalKeys', {
        include: [
            require('$SPRITE/events/PlatformObservable.js'),
            require('$SPRITE/events/KeyObservable.js')
        ],
        
        
        // Class Methods and Attributes ////////////////////////////////////////////
        extend: {
            KEYCODE_BACKSPACE:8,
            KEYCODE_TAB:9,
            KEYCODE_ENTER:13,
            KEYCODE_SHIFT:16,
            KEYCODE_CONTROL:17,
            KEYCODE_ALT:18,
            KEYCODE_ESC:27,
            KEYCODE_COMMAND:sprite.platform.browser === 'Firefox' ? 224 : 91,
            KEYCODE_RIGHT_COMMAND:sprite.platform.browser === 'Firefox' ? 224 : 93
        },
        
        
        // Constructor /////////////////////////////////////////////////////////////
        /** The standard JSClass initializer function. Subclasses should not
            override this function.
            @param attrs:object A map of attribute names and values.
            @returns void */
        initialize: function(view, attrs) {
            this.view = view;
            this.platformObject = globalScope.document;
            
            this.__keysDown = {};
        },
        
        
        // Properties //////////////////////////////////////////////////////////
        acceleratorChar: sprite.platform.os === 'Mac' ? '⌘' : '⌃',
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** Tests if a key is currently pressed down or not.
            @param keyCode:number the key to test.
            @returns true if the key is down, false otherwise. */
        isKeyDown: function(keyCode) {return !!this.__keysDown[keyCode];},
        
        /** Tests if the 'shift' key is down. */
        isShiftKeyDown: function() {return this.isKeyDown(sprite.GlobalKeys.KEYCODE_SHIFT);},
        
        /** Tests if the 'control' key is down. */
        isControlKeyDown: function() {return this.isKeyDown(sprite.GlobalKeys.KEYCODE_CONTROL);},
        
        /** Tests if the 'alt' key is down. */
        isAltKeyDown: function() {return this.isKeyDown(sprite.GlobalKeys.KEYCODE_ALT);},
        
        /** Tests if the 'command' key is down. */
        isCommandKeyDown: function() {
            return this.isKeyDown(sprite.GlobalKeys.KEYCODE_COMMAND) || this.isKeyDown(sprite.GlobalKeys.KEYCODE_RIGHT_COMMAND);
        },
        
        /** Tests if the platform specific "accelerator" key is down. */
        isAcceleratorKeyDown: function() {
            return sprite.platform.os === 'Mac' ? this.isCommandKeyDown() : this.isControlKeyDown();
        },
        
        /** @private */
        handleEnvironmentHidden: function(platformEvent) {
            // When environment becomes hidden release all keydown states since
            // we won't know if the user releases them while "focus" is lost.
            if (platformEvent === true) {
                var keysDown = this.__keysDown;
                for (var keyCode in keysDown) {
                    keysDown[keyCode] = false;
                    this.__sendEvent('up', {}, keyCode);
                }
            }
        },
        
        /** @private */
        handleFocusChange: function(focused) {
            var view = this.view;
            if (focused) {
                this.__unlistenToDocument();
                
                view.listenToPlatform(focused, 'onkeydown', '__handleKeyDown');
                view.listenToPlatform(focused, 'onkeypress', '__handleKeyPress');
                view.listenToPlatform(focused, 'onkeyup', '__handleKeyUp');
            } else {
                var prevFocused = sprite.focus.prevFocusedView;
                if (prevFocused) {
                    view.stopListeningToPlatform(prevFocused, 'onkeydown', '__handleKeyDown');
                    view.stopListeningToPlatform(prevFocused, 'onkeypress', '__handleKeyPress');
                    view.stopListeningToPlatform(prevFocused, 'onkeyup', '__handleKeyUp');
                }
                
                this.__listenToDocument();
            }
        },
        
        /** @private */
        __listenToDocument: function() {
            var view = this.view;
            view.listenToPlatform(view, 'onkeydown', '__handleKeyDown');
            view.listenToPlatform(view, 'onkeypress', '__handleKeyPress');
            view.listenToPlatform(view, 'onkeyup', '__handleKeyUp');
            this.__listeningToDocument = true;
        },
        
        /** @private */
        __unlistenToDocument: function() {
            var view = this.view;
            view.stopListeningToPlatform(view, 'onkeydown', '__handleKeyDown');
            view.stopListeningToPlatform(view, 'onkeypress', '__handleKeyPress');
            view.stopListeningToPlatform(view, 'onkeyup', '__handleKeyUp');
            this.__listeningToDocument = false;
        },
        
        /** @private */
        __handleKeyDown: function(platformEvent) {
            var keyCode = sprite.KeyObservable.getKeyCodeFromEvent(platformEvent);
            if (this.__shouldPreventDefault(keyCode, platformEvent.target)) sprite.preventDefault(platformEvent);
            
            // Keyup events do not fire when command key is down so fire a keyup
            // event immediately. Not an issue for other meta keys: shift, ctrl 
            // and option.
            var GK = sprite.GlobalKeys;
            if (this.isCommandKeyDown() && keyCode !== GK.KEYCODE_SHIFT && keyCode !== GK.KEYCODE_CONTROL && keyCode !== GK.KEYCODE_ALT) {
                this.__sendEvent('down', platformEvent, keyCode);
                this.__sendEvent('up', platformEvent, keyCode);
            } else {
                this.__keysDown[keyCode] = true;
                
                // Check for 'tab' key and do focus traversal.
                if (keyCode === GK.KEYCODE_TAB) {
                    var ift = this.view.ignoreFocusTrap(), gf = globalRegistry.focus;
                    if (this.isShiftKeyDown()) {
                        gf.prev(ift);
                    } else {
                        gf.next(ift);
                    }
                }
                
                this.__sendEvent('down', platformEvent, keyCode);
            }
        },
        
        /** @private */
        __handleKeyPress: function(platformEvent) {
            var keyCode = sprite.KeyObservable.getKeyCodeFromEvent(platformEvent);
            this.__sendEvent('press', platformEvent, keyCode);
        },
        
        /** @private */
        __handleKeyUp: function(platformEvent) {
            var keyCode = sprite.KeyObservable.getKeyCodeFromEvent(platformEvent);
            if (this.__shouldPreventDefault(keyCode, platformEvent.target)) sprite.preventDefault(platformEvent);
            this.__keysDown[keyCode] = false;
            this.__sendEvent('up', platformEvent, keyCode);
        },
        
        /** @private */
        __shouldPreventDefault: function(keyCode, targetElem) {
            switch (keyCode) {
                case sprite.GlobalKeys.KEYCODE_BACKSPACE: // Backspace
                    // Catch backspace since it navigates the history. Allow it to
                    // go through for text input elements though.
                    var nodeName = targetElem.nodeName;
                    if (nodeName === 'TEXTAREA' || 
                        (nodeName === 'INPUT' && (targetElem.type === 'text' || targetElem.type === 'password')) ||
                        (nodeName === 'DIV' && targetElem.contentEditable === 'true' && targetElem.firstChild)
                    ) return false;
                    
                    return true;
                    
                case 9: // Tab
                    // Tab navigation is handled by the framework.
                    return true;
            }
            return false;
        },
        
        /** @private */
        __sendEvent: function(eventType, platformEvent, keyCode) {
            this.view.sendEvent('onkeycode' + eventType, keyCode);
            if (!this.__listeningToDocument) this.view.sendEvent('onkey' + eventType, platformEvent);
        }
    });
});
