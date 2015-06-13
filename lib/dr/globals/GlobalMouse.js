/** Provides global mouse events by listening to mouse events on the 
    viewport. Registered with dr.global as 'mouse'. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        GlobalRegistry = require('./Global.js'),
        GlobalMouseSprite = require('$SPRITE/GlobalMouse.js');
    
    module.exports = new JS.Singleton('GlobalMouse', {
        include: [
            require('$LIB/dr/SpriteBacked.js'),
            require('$LIB/dr/events/PlatformObserver.js'),
            require('$LIB/dr/events/Observable.js'),
            require('$LIB/dr/events/Observer.js')
        ],
        
        
        // Constructor /////////////////////////////////////////////////////////////
        initialize: function() {
            this.set_sprite(this.createSprite());
            
            // Store in dr namespace for backwards compatibility with dreem
            if (dr.mouse) {
                dr.dumpStack('dr.mouse already set.');
            } else {
                dr.mouse = this;
            }
            
            // Keep a reference count of observers so we can register/unregister
            // from each platform event only once
            this.__attachedObserverCount = {};
            
            // Used to lookup which events are platform events.
            this.__platformEventNames = dr.sprite.MouseObservable.EVENT_TYPES;
            
            this.__xOrYAttachedObserverCount = 0;
            
            GlobalRegistry.register('mouse', this);
        },
        
        createSprite: function(attrs) {
            return new GlobalMouseSprite(this);
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** Auto register for platform events when registering for a normal
            event with the same event type.
            @overrides dr.Observable */
        attachObserver: function(observer, methodName, eventType) {
            var retval = this.callSuper(observer, methodName, eventType);
            
            if (this.__platformEventNames[eventType]) {
                var counts = this.__attachedObserverCount;
                if (counts[eventType] > 0) {
                    counts[eventType]++;
                } else {
                    counts[eventType] = 1;
                    var funcName = '__handler_' + eventType;
                    
                    // Make a handler function to refire the platform event
                    // as a normal event.
                    if (this[funcName] == null) {
                        this[funcName] = (function(event) {this.sendEvent(eventType, event); return true;}).bind(this);
                    }
                    
                    this.listenToPlatform(this, eventType, funcName, true);
                }
            }
            
            // Provide onmousemove handling for x and y events
            if (eventType === 'onx' || eventType === 'ony') {
                if (++this.__xOrYAttachedObserverCount === 1) {
                    if (this.__handler_xOrY == null) {
                        this.__handler_xOrY = (function(event) {
                            var pos = dr.sprite.MouseObservable.getMouseFromEvent(event);
                            this.x = pos.x;
                            this.y = pos.y;
                            this.sendEvent('onx', pos.x);
                            this.sendEvent('ony', pos.y);
                        }).bind(this);
                    }
                    this.listenTo(this, 'onmousemove', '__handler_xOrY');
                }
            }
            
            return retval;
        },
        
        /** Auto unregister for platform events when registering for a normal
            event with the same event type.
            @overrides dr.Observable */
        detachObserver: function(observer, methodName, eventType) {
            var retval = this.callSuper(observer, methodName, eventType);
            
            if (this.__platformEventNames[eventType]) {
                var counts = this.__attachedObserverCount;
                if (counts[eventType] >= 1) {
                    counts[eventType]--;
                    if (counts[eventType] === 0) {
                        this.stopListeningToPlatform(this, eventType, '__handler_' + eventType, true);
                    }
                }
            }
            
            // Provide onmousemove handling for x and y events
            if (eventType === 'onx' || eventType === 'ony') {
                if (--this.__xOrYAttachedObserverCount === 0) this.stopListening(this, 'onmousemove', '__handler_xOrY');
            }
            
            return retval;
        }
    });
});
