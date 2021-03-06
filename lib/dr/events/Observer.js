/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


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
        __DO_ONCE_*:function The names used for methods that only get run
            one time. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js');
    require('./Observable.js');
    
    module.exports = dr.Observer = new JS.Module('Observer', {
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
            @returns This object for chainability. */
        syncTo: function(observable, eventType, methodName, attrName, once) {
            if (attrName === undefined) {
                // Trim 'on' prefix if necessary
                attrName = eventType.startsWith('on') ? eventType.substring(2) : eventType;
            }
            try {
                var event = observable.getActualAttribute(attrName);
                if (typeof methodName === 'function') {
                    methodName.call(this, event, dr); // TAG:Global Scope
                } else {
                    this[methodName](event, dr); // TAG:Global Scope
                }
            } catch (err) {
                dr.dumpStack(err);
            }
            
            // Providing a true value for once means we'll never actually attach.
            if (once) return this;
            
            return this.listenTo(observable, eventType, methodName, once);
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
            @param eventTypes:string the event type to attach for. May be a
                comma or space separated list of event types.
            @param methodName:string the method name on this instance to execute.
            @param once:boolean (optional) if true  this Observer will detach
                from the Observable after the event is handled once.
            @returns This object for chainability. */
        listenTo: function(observable, eventTypes, methodName, once) {
            if (observable && methodName && eventTypes) {
                // Setup wrapper method when 'once' is true.
                if (once) {
                    var self = this, 
                        origMethodName = methodName,
                        origEventTypes = eventTypes;
                    
                    // Generate one time method name.
                    methodName = '__DO_ONCE_' + dr.generateGuid();
                    
                    // Setup wrapper method that will do the stopListening.
                    this[methodName] = function(event) {
                        self.stopListening(observable, origEventTypes, methodName);
                        delete self[methodName];
                        return self[origMethodName](event);
                    };
                }
                
                eventTypes = eventTypes.split(/[ ,]+/);
                var i = eventTypes.length, eventType, platformEventInfo;
                
                // First see if this should be handled as a platform event.
                if (this.listenToPlatform && observable.isPlatformEvent) {
                    while (i) {
                        eventType = eventTypes[--i];
                        if (eventType) {
                            platformEventInfo = observable.isPlatformEvent(eventType);
                            if (platformEventInfo != null) {
                                this.listenToPlatform(observable, eventType, methodName, platformEventInfo);
                                eventTypes.splice(i, 0);
                            }
                        }
                    }
                }
                
                var len = eventTypes.length, observables;
                for (i = 0; len > i;) {
                    eventType = eventTypes[i++];
                    if (eventType) {
                        observables = this.getObservables(eventType);
                        
                        // Register this observer with the observable
                        if (observable.attachObserver(this, methodName, eventType)) {
                            observables.push(methodName, observable);
                        }
                    }
                }
            }
            
            return this;
        },
        
        /** Unregisters this Observer from the provided Observable
            for the provided eventType.
            @param observable:dr.Observable the Observable to attach to.
            @param eventTypes:string the event type to unattach for. May be a
                comma or space separated list of event types.
            @param methodName:string the method name on this instance to execute.
            @returns This object for chainability. */
        stopListening: function(observable, eventTypes, methodName) {
            if (observable && methodName && eventTypes) {
                eventTypes = eventTypes.split(/[ ,]+/);
                var i = eventTypes.length, eventType, platformEventInfo;
                
                // First see if this should be handled as a platform event.
                if (this.listenToPlatform && observable.isPlatformEvent) {
                    while (i) {
                        eventType = eventTypes[--i];
                        if (eventType) {
                            platformEventInfo = observable.isPlatformEvent(eventType);
                            if (platformEventInfo != null) {
                                this.stopListeningToPlatform(observable, eventType, methodName, platformEventInfo);
                                eventTypes.splice(i, 0);
                            }
                        }
                    }
                }
                
                // No need to unregister if observable array doesn't exist.
                var observablesByType = this.__obt;
                if (observablesByType) {
                    var len = eventTypes.length, j, observables;
                    for (i = 0; len > i;) {
                        eventType = eventTypes[i++];
                        if (eventType) {
                            observables = observablesByType[eventType];
                            if (observables) {
                                // Remove all instances of this observer/methodName/eventType 
                                // from the observable
                                j = observables.length;
                                while (j) {
                                    --j;
                                    if (observable === observables[j--] && methodName === observables[j]) {
                                        if (observable.detachObserver(this, methodName, eventType)) {
                                            observables.splice(j, 2);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return this;
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
