/** Provides a mechanism to remember which PlatformObservables this 
    PlatformObserver has attached itself to. This is useful when the instance 
    is being destroyed to automatically cleanup the observer/observable 
    relationships.
    
    When this mixin is used attachment and detachment should be done 
    using the 'listenToPlatform' and 'stopListeningToPlatform' methods of this 
    mixin. If this is not done, it is possible for the relationship between 
    observer and observable to become broken.
    
    Events:
        None
    
    Attributes:
        None
    
    Private Attributes:
        __dobt: (Object) Holds arrays of PlatformObservables by event type.
*/
define(function(require, exports){
    var dr = require('../dr.js');
    var JS = require('../../../../../lib/jsclass.js');
    
    dr.PlatformObserver = new JS.Module('PlatformObserver', {
        // Methods /////////////////////////////////////////////////////////////////
        /** Attaches this PlatformObserverAdapter to the a SpriteBacked Node
            for an event type.
            @returns void */
        listenToPlatform: function(spriteBacked, eventType, methodName, capture) {
            if (spriteBacked && methodName && eventType) {
                capture = !!capture;
                
                var observable = spriteBacked.get_sprite();
                if (observable.attachPlatformObserver) {
                    // Lazy instantiate __dobt map.
                    var observablesByType = this.__dobt || (this.__dobt = {});
                    var observables = observablesByType[eventType] || (observablesByType[eventType] = []);
                    
                    // Attach this PlatformObserver to the PlatformObservable
                    if (observable.attachPlatformObserver(this, methodName, eventType, capture)) {
                        observables.push(capture, methodName, observable);
                    }
                }
            }
        },
        
        /** Detaches this PlatformObserverAdapter from a SpriteBacked Node for an
            event type.
            @returns boolean True if detachment succeeded, false otherwise. */
        stopListeningToPlatform: function(spriteBacked, eventType, methodName, capture) {
            if (spriteBacked && methodName && eventType) {
                capture = !!capture;
                
                var observable = spriteBacked.get_sprite();
                if (observable.detachPlatformObserver) {
                    // No need to detach if observable array doesn't exist.
                    var observablesByType = this.__dobt;
                    if (observablesByType) {
                        var observables = observablesByType[eventType];
                        if (observables) {
                            // Remove all instances of this observer/methodName/type/capture 
                            // from the observable
                            var retval = false, i = observables.length;
                            while (i) {
                                i -= 3;
                                if (observable === observables[i + 2] && 
                                    methodName === observables[i + 1] && 
                                    capture === observables[i]
                                ) {
                                    if (observable.detachPlatformObserver(this, methodName, eventType, capture)) {
                                        observables.splice(i, 3);
                                        retval = true;
                                    }
                                }
                            }
                            
                            // Observable wasn't found
                            return retval;
                        }
                    }
                }
            }
            return false;
        },
        
        /** Detaches this PlatformObserver from all PlatformObservables it is attached to.
            @returns void */
        stopListeningToAllPlatformSources: function() {
            var observablesByType = this.__dobt;
            if (observablesByType) {
                var observables, i, eventType;
                for (eventType in observablesByType) {
                    observables = observablesByType[eventType];
                    i = observables.length;
                    while (i) observables[--i].detachPlatformObserver(this, observables[--i], eventType, observables[--i]);
                    observables.length = 0;
                }
            }
        }
    });
});
