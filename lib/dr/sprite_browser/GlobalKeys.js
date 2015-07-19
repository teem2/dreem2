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
        
        
        // Constructor /////////////////////////////////////////////////////////////
        /** The standard JSClass initializer function. Subclasses should not
            override this function.
            @param attrs:object A map of attribute names and values.
            @returns void */
        initialize: function(view, attrs) {
            this.view = view;
            this.platformObject = globalScope.document;
            
            // Constants
            this.KEYCODE_SHIFT = 16;
            this.KEYCODE_CONTROL = 17;
            this.KEYCODE_ALT = 18;
            var isFirefox = sprite.platform.browser === 'Firefox';
            this.KEYCODE_COMMAND = isFirefox ? 224 : 91;
            this.KEYCODE_RIGHT_COMMAND = isFirefox ? 224 : 93;
            
            this.__keysDown = {};
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** Tests if a key is currently pressed down or not.
            @param keyCode:number the key to test.
            @returns true if the key is down, false otherwise. */
        isKeyDown: function(keyCode) {return !!this.__keysDown[keyCode];},
        
        /** Tests if the 'shift' key is down. */
        isShiftKeyDown: function() {return this.isKeyDown(this.KEYCODE_SHIFT);},
        
        /** Tests if the 'control' key is down. */
        isControlKeyDown: function() {return this.isKeyDown(this.KEYCODE_CONTROL);},
        
        /** Tests if the 'alt' key is down. */
        isAltKeyDown: function() {return this.isKeyDown(this.KEYCODE_ALT);},
        
        /** Tests if the 'command' key is down. */
        isCommandKeyDown: function() {
            return this.isKeyDown(this.KEYCODE_COMMAND) || this.isKeyDown(this.KEYCODE_RIGHT_COMMAND);
        },
        
        /** Tests if the platform specific "accelerator" key is down. */
        isAcceleratorKeyDown: function() {
            return sprite.platform.os === 'Mac' ? this.isCommandKeyDown() : this.isControlKeyDown();
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
            this.__listeningToDocuemnt = true;
        },
        
        /** @private */
        __unlistenToDocument: function() {
            var view = this.view;
            view.stopListeningToPlatform(view, 'onkeydown', '__handleKeyDown');
            view.stopListeningToPlatform(view, 'onkeypress', '__handleKeyPress');
            view.stopListeningToPlatform(view, 'onkeyup', '__handleKeyUp');
            this.__listeningToDocuemnt = false;
        },
        
        /** @private */
        __handleKeyDown: function(platformEvent) {
            var keyCode = sprite.KeyObservable.getKeyCodeFromEvent(platformEvent);
            if (this.__shouldPreventDefault(keyCode, platformEvent.target)) sprite.preventDefault(platformEvent);
            
            // Keyup events do not fire when command key is down so fire a keyup
            // event immediately. Not an issue for other meta keys: shift, ctrl 
            // and option.
            if (this.isCommandKeyDown() && keyCode !== 16 && keyCode !== 17 && keyCode !== 18) {
                this.__sendEvent('down', platformEvent, keyCode);
                this.__sendEvent('up', platformEvent, keyCode);
                
                // Assume command key goes back up since it is common for the page
                // to lose focus after the command key is used. Do this for every 
                // key other than 'z' since repeated undo/redo is 
                // nice to have and doesn't typically result in loss of focus 
                // to the page.
                // Also don't do it for F(70) since find will rip focus away.
                /*if (keyCode !== 90 && keyCode !== 70) {
                    this.__sendEvent('up', platformEvent, this.KEYCODE_COMMAND);
                    this.__keysDown[this.KEYCODE_COMMAND] = false;
                }*/
            } else {
                this.__keysDown[keyCode] = true;
                
                // Check for 'tab' key and do focus traversal.
                if (keyCode === 9) {
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
                case 8: // Backspace
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
            if (!this.__listeningToDocuemnt) this.view.sendEvent('onkey' + eventType, platformEvent);
        }
    });
});
