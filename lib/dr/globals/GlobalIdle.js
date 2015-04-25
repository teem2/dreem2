/** Provides idle events. Registered with dr.global as 'idle'.
    
    Events:
        onidle:object Fired when a browser idle event occurs. The event value is
            an object containing:
                delta: The time in millis since the last idle evnet.
                time: The time in millis of this idle event.
    
    Attributes:
        running:boolean Indicates if idle events are currently being fired
            or not.
        lastTime:number The millis of the last idle event fired.
    
    Private Attributes:
        __timerId:number The ID of the last onidle event in the browser.
        __doIdle:function The function that gets executed on idle.
        __event:object The onidle event object that gets reused.
*/
define(function(require, exports){
    var dr = require('../dr.js');
    var JS = require('$LIB/jsclass.js');
    
    require('../SpriteBacked.js');
    require('./Global.js');
    require('../sprite/GlobalIdle.js');
    require('../events/Observer.js');
    require('../Eventable.js');
    
    new JS.Singleton('GlobalIdle', {
        include: [
            dr.SpriteBacked,
            dr.Observable
        ],
        
        
        // Constructor /////////////////////////////////////////////////////////////
        initialize: function() {
            this.running = false;
            this.set_sprite(this.createSprite());
            
            // Stores Eventables for callOnIdle
            this.__callOnIdleRegistry = {};
            
            // Store in dr namespace for backwards compatibility with dreem
            if (dr.idle) {
                dr.dumpStack('dr.idle already set.');
            } else {
                dr.idle = this;
            }
            
            dr.global.register('idle', this);
        },
        
        createSprite: function(attrs) {
            return new dr.sprite.GlobalIdle(this);
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @overrides dr.Observable */
        attachObserver: function(observer, methodName, type) {
            var retval = this.callSuper(observer, methodName, type);
            
            // Start firing onidle events
            if (!this.running && this.hasObservers('onidle')) {
                this.running = true;
                this.sprite.start();
            }
            
            return retval;
        },
        
        /** @overrides dr.Observable */
        detachObserver: function(observer, methodName, type) {
            var retval = this.callSuper(observer, methodName, type);
            
            // Stop firing onidle events
            if (this.running && !this.hasObservers('onidle')) {
                this.sprite.stop();
                this.running = false;
            }
            
            return retval;
        },
        
        /** Invokes the provided callback function once on the next idle event.
            @param callback:function The function to call.
            @returns void */
        callOnIdle: function(callback) {
            if (callback) {
                var guid = dr.generateGuid(),
                    registry = this.__callOnIdleRegistry,
                    observer = registry[guid] = new dr.Eventable({}, [{
                    invoke: function(event) {
                            try {
                                callback(event.time, event.delta);
                            } catch (e) {
                                dr.dumpStack(e);
                            } finally {
                                delete registry[guid];
                                this.destroy();
                            }
                        }
                    }]);
                observer.listenTo(this, 'onidle', 'invoke', true);
            }
        }
    });
});
