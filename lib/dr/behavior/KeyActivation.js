/** Provides keyboard handling to "activate" the component when a key is 
    pressed down or released up. By default, when a keyup event occurs for
    an activation key and this view is not disabled, the 'doActivated' method
    will get called.
    
    Events:
        None
    
    Attributes:
        activationkeys:array of chars The keys that when keyed down will
            activate this component. Note: The value is not copied so
            modification of the array outside the scope of this object will
            effect behavior.
        activateKeyDown:number (read only) The keycode of the activation key that is
            currently down. This will be -1 when no key is down.
        repeatkeydown:boolean Indicates if doActivationKeyDown will be called
            for repeated keydown events or not. Defaults to false.
*/
define(function(require, exports){
    var dr = require('../dr.js');
    var JS = require('$LIB/jsclass.js');
    require('../globals/GlobalKeys.js');
    
    dr.KeyActivation = new JS.Module('KeyActivation', {
        // Class Methods and Attributes ////////////////////////////////////////////
        extend: {
            /** The default activation keys are enter (13) and spacebar (32). */
            DEFAULT_ACTIVATION_KEYS: [13,32]
        },
        
        
        // Life Cycle //////////////////////////////////////////////////////////////
        /** @overrides */
        initNode: function(parent, attrs) {
            this.activateKeyDown = -1;
            
            if (attrs.activationkeys === undefined) {
                attrs.activationkeys = dr.KeyActivation.DEFAULT_ACTIVATION_KEYS;
            }
            
            this.callSuper(parent, attrs);
            
            this.listenToPlatform(this, 'onkeydown', '__handleKeyDown');
            this.listenToPlatform(this, 'onkeypress', '__handleKeyPress');
            this.listenToPlatform(this, 'onkeyup', '__handleKeyUp');
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        set_activationkeys: function(v) {this.setSimpleActual('activationkeys', v);},
        set_repeatkeydown: function(v) {this.setSimpleActual('repeatkeydown', v);},
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @private */
        __handleKeyDown: function(platformEvent) {
            if (!this.disabled) {
                if (this.activateKeyDown === -1 || this.repeatkeydown) {
                    var keyCode = dr.sprite.KeyObservable.getKeyCodeFromEvent(platformEvent),
                        keys = this.activationkeys, i = keys.length;
                    while (i) {
                        if (keyCode === keys[--i]) {
                            if (this.activateKeyDown === keyCode) {
                                this.doActivationKeyDown(keyCode, true);
                            } else {
                                this.activateKeyDown = keyCode;
                                this.doActivationKeyDown(keyCode, false);
                            }
                            dr.sprite.preventDefault(platformEvent);
                            return;
                        }
                    }
                }
            }
        },
        
        /** @private */
        __handleKeyPress: function(platformEvent) {
            if (!this.disabled) {
                var keyCode = dr.sprite.KeyObservable.getKeyCodeFromEvent(platformEvent);
                if (this.activateKeyDown === keyCode) {
                    var keys = this.activationkeys, i = keys.length;
                    while (i) {
                        if (keyCode === keys[--i]) {
                            dr.sprite.preventDefault(platformEvent);
                            return;
                        }
                    }
                }
            }
        },
        
        /** @private */
        __handleKeyUp: function(platformEvent) {
            if (!this.disabled) {
                var keyCode = dr.sprite.KeyObservable.getKeyCodeFromEvent(platformEvent);
                if (this.activateKeyDown === keyCode) {
                    var keys = this.activationkeys, i = keys.length;
                    while (i) {
                        if (keyCode === keys[--i]) {
                            this.activateKeyDown = -1;
                            this.doActivationKeyUp(keyCode);
                            dr.sprite.preventDefault(platformEvent);
                            return;
                        }
                    }
                }
            }
        },
        
        doBlur: function() {
            this.callSuper();
            
            if (!this.disabled) {
                var keyThatWasDown = this.activateKeyDown;
                if (keyThatWasDown !== -1) {
                    this.activateKeyDown = -1;
                    this.doActivationKeyAborted(keyThatWasDown);
                }
            }
        },
        
        /** Called when an activation key is pressed down. Default implementation
            does nothing.
            @param key:number the keycode that is down.
            @param isRepeat:boolean Indicates if this is a key repeat event or not.
            @returns void */
        doActivationKeyDown: function(key, isRepeat) {
            // Subclasses to implement as needed.
        },
        
        /** Called when an activation key is release up. This executes the
            'doActivated' method by default. 
            @param key:number the keycode that is up.
            @returns void */
        doActivationKeyUp: function(key) {
            this.doActivated();
        },
        
        /** Called when focus is lost while an activation key is down. Default 
            implementation does nothing.
            @param key:number the keycode that is down.
            @returns void */
        doActivationKeyAborted: function(key) {
            // Subclasses to implement as needed.
        }
    });
});
