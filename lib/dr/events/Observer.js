/** Provides a mechanism to remember which Observables this instance has 
    registered itself with. This can be useful when we need to cleanup the 
    instance later.
    
    When this module is used registration and unregistration must be done 
    using the methods below. Otherwise, it is possible for the relationship 
    between observer and observable to be broken.
    
    Events:
        None
    
    Attributes:
        None
    
    Private Attributes:
        __obt:object Stores arrays of Observables by event type
        __methodNameCounter:int Used to create unique method names when a
            callback should only be called once.
        __DO_ONCE_*:function The names used for methods that only get run
            one time. */
define(function(require, exports){
    var dr = require('../dr.js');
    var JS = require('$LIB/jsclass.js');
    
    require('./Observable.js');
    
    dr.Observer = new JS.Module('Observer', {
        // Methods /////////////////////////////////////////////////////////////////
        /** Does the same thing as this.listenTo and also immediately calls the
            method with an event containing the attributes value. If 'once' is
            true no attachment will occur which means this probably isn't the
            correct method to use in that situation.
            @param observable:dr.Observable the Observable to attach to.
            @param eventType:string the event type to attach for.
            @param methodName:string the method name on this instance to execute.
            @param attrName:string (optional: the eventType will be used if not
                provided) the name of the attribute on the Observable
                to pull the value from.
            @param once:boolean (optional) if true  this Observer will detach
                from the Observable after the event is handled once.
            @returns void */
        syncTo: function(observable, eventType, methodName, attrName, once) {
            if (attrName === undefined) {
                // Trim 'on' prefix if necessary
                attrName = eventType.startsWith('on') ? eventType.substring(2) : eventType;
            }
            try {
                var event = observable.createEvent(eventType, observable.getAttribute(attrName));
                if (typeof methodName === 'function') {
                    methodName.call(this, event, dr);
                } else {
                    this[methodName](event, dr);
                }
            } catch (err) {
                dr.dumpStack(err);
            }
            
            // Providing a true value for once means we'll never actually attach.
            if (once) return;
            
            this.listenTo(observable, eventType, methodName, once);
        },
        
        /** Checks if this Observer is attached to the provided observable for
            the methodName and eventType.
            @param observable:dr.Observable the Observable to check with.
            @param eventType:string the event type to check for.
            @param methodName:string the method name on this instance to execute.
            @returns true if attached, false otherwise. */
        isListeningTo: function(observable, eventType, methodName) {
            if (observable && methodName && eventType) {
                var observablesByType = this.__obt;
                if (observablesByType) {
                    var observables = observablesByType[eventType];
                    if (observables) {
                        var i = observables.length;
                        while (i) {
                            // Ensures we decrement twice. First with --i, then 
                            // with i-- since the part after && may not be executed.
                            --i;
                            if (observable === observables[i--] && methodName === observables[i]) return true;
                        }
                    }
                }
            }
            return false;
        },
        
        /** Gets an array of observables and method names for the provided type.
            The array is structured as:
                [methodName1, observableObj1, methodName2, observableObj2,...].
            @param eventType:string the event type to check for.
            @returns an array of observables. */
        getObservables: function(eventType) {
            var observablesByType = this.__obt || (this.__obt = {});
            return observablesByType[eventType] || (observablesByType[eventType] = []);
        },
        
        /** Checks if any observables exist for the provided event type.
            @param eventType:string the event type to check for.
            @returns true if any exist, false otherwise. */
        hasObservables: function(eventType) {
            var observablesByType = this.__obt;
            if (!observablesByType) return false;
            var observables = observablesByType[eventType];
            return observables && observables.length > 0;
        },
        
        /** A wrapper on listenTo where the 'once' argument is set to true. */
        listenToOnce: function(observable, eventType, methodName) {
            return this.listenTo(observable, eventType, methodName, true);
        },
        
        /** Registers this Observer with the provided Observable
            for the provided eventType.
            @param observable:dr.Observable the Observable to attach to.
            @param eventType:string the event type to attach for.
            @param methodName:string the method name on this instance to execute.
            @param once:boolean (optional) if true  this Observer will detach
                from the Observable after the event is handled once.
            @returns boolean true if the observable was successfully registered, 
                false otherwise. */
        listenTo: function(observable, eventType, methodName, once) {
            if (observable && methodName && eventType) {
                var observables = this.getObservables(eventType);
                
                // Setup wrapper method when 'once' is true.
                if (once) {
                    var self = this, origMethodName = methodName;
                    
                    // Generate one time method name.
                    if (this.__methodNameCounter === undefined) this.__methodNameCounter = 0;
                    methodName = '__DO_ONCE_' + this.__methodNameCounter++;
                    
                    // Setup wrapper method that will do the stopListening.
                    this[methodName] = function(event) {
                        self.stopListening(observable, eventType, methodName);
                        delete self[methodName];
                        return self[origMethodName](event);
                    };
                }
                
                // Register this observer with the observable
                if (observable.attachObserver(this, methodName, eventType)) {
                    observables.push(methodName, observable);
                    return true;
                }
            }
            return false;
        },
        
        /** Unregisters this Observer from the provided Observable
            for the provided eventType.
            @param observable:dr.Observable the Observable to attach to.
            @param eventType:string the event type to attach for.
            @param methodName:string the method name on this instance to execute.
            @returns boolean true if one or more detachments occurred, false 
                otherwise. */
        stopListening: function(observable, eventType, methodName) {
            if (observable && methodName && eventType) {
                // No need to unregister if observable array doesn't exist.
                var observablesByType = this.__obt;
                if (observablesByType) {
                    var observables = observablesByType[eventType];
                    if (observables) {
                        // Remove all instances of this observer/methodName/eventType 
                        // from the observable
                        var retval = false, i = observables.length;
                        while (i) {
                            --i;
                            if (observable === observables[i--] && methodName === observables[i]) {
                                if (observable.detachObserver(this, methodName, eventType)) {
                                    observables.splice(i, 2);
                                    retval = true;
                                }
                            }
                        }
                        
                        // Source wasn't found
                        return retval;
                    }
                }
            }
            return false;
        },
        
        /** Tries to detach this Observer from all Observables it
            is attached to.
            @returns void */
        stopListeningToAllObservables: function() {
            var observablesByType = this.__obt;
            if (observablesByType) {
                var observables, i;
                for (var eventType in observablesByType) {
                    observables = observablesByType[eventType];
                    i = observables.length;
                    while (i) observables[--i].detachObserver(this, observables[--i], eventType);
                    observables.length = 0;
                }
            }
        }
    });
});
