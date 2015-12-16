/* Copyright 2015 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


/** Apply this mixin to any Object that needs to fire events.
    
    Attributes:
        None
    
    Private Attributes:
        __obsbt:object Stores arrays of dr.Observers and method names 
            by event type
        __aet:object Stores active event type strings. An event type is active
            if it has been fired from this Observable as part of the current 
            call stack. If an event type is "active" it will not be fired 
            again. This provides protection against infinite event loops.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js');
    
    module.exports = dr.Observable = new JS.Module('Observable', {
        // Class Methods and Attributes ////////////////////////////////////////////
        extend: {
            /** Holds events until dr.ready is true. */
            pendingEventQueue: [],
            
            firePendingEvents: function() {
                if (dr.ready) {
                    var queue = this.pendingEventQueue, entry;
                    while (queue.length > 0) {
                        entry = queue.shift();
                        entry[0].sendEvent(entry[1], entry[2]);
                    }
                }
            }
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** Adds the observer to the list of event recipients for the event type.
            @param observer:dr.Observer The observer that will observe this
                observable. If methodName is a function this object will be the
                context for the function when it is called.
            @param methodName:string|function The name of the method to call, or
                a function, on the observer when the event fires.
            @param type:string The name of the event the observer will listen to.
            @returns boolean true if the observer was successfully attached, 
                false otherwise. */
        attachObserver: function(observer, methodName, type) {
            if (observer && methodName && type) {
                this.getObservers(type).unshift(methodName, observer);
                return true;
            }
            return false;
        },
        
        /** Removes the observer from the list of observers for the event type.
            @param observer:dr.Observer The observer that will no longer be
                observing this observable.
            @param methodName:string|function The name of the method that was
                to be called or the function to be called.
            @param type:string The name of the event the observer will no longer
                be listening to.
            @returns boolean true if the observer was successfully detached, 
                false otherwise. */
        detachObserver: function(observer, methodName, type) {
            if (observer && methodName && type) {
                var observersByType = this.__obsbt;
                if (observersByType) {
                    var observers = observersByType[type];
                    if (observers) {
                        // Remove all instances of the observer and methodName 
                        // combination.
                        var retval = false, i = observers.length;
                        while (i) {
                            // Ensures we decrement twice. First with --i, then 
                            // with i-- since the part after && may not be executed.
                            --i;
                            if (observer === observers[i--] && methodName === observers[i]) {
                                observers.splice(i, 2); // <- Detach Activity that detachAllObservers cares about.
                                retval = true;
                            }
                        }
                        return retval;
                    }
                }
            }
            return false;
        },
        
        /** Removes all observers from this Observable.
            @returns void */
        detachAllObservers: function() {
            var observersByType = this.__obsbt;
            if (observersByType) {
                var observers, observer, methodName, i, type;
                for (type in observersByType) {
                    observers = observersByType[type];
                    i = observers.length;
                    while (i) {
                        observer = observers[--i];
                        methodName = observers[--i];
                        
                        // If an observer is registered more than once the list may 
                        // get shortened by observer.stopListening. If so, just 
                        // continue decrementing downwards.
                        if (observer && methodName) {
                            if (typeof observer.stopListening !== 'function' || 
                                !observer.stopListening(this, type, methodName)
                            ) {
                                // Observer may not have a stopListening function or 
                                // observer may not have attached via 
                                // Observer.listenTo so do default detach activity 
                                // as implemented in Observable.detachObserver
                                observers.splice(i, 2);
                            }
                        }
                    }
                }
            }
        },
        
        /** Gets an array of observers and method names for the provided type.
            The array is structured as:
                [methodName1, observerObj1, methodName2, observerObj2,...].
            @param type:string The name of the event to get observers for.
            @returns array: The observers of the event. */
        getObservers: function(type) {
            var observersByType = this.__obsbt || (this.__obsbt = {});
            return observersByType[type] || (observersByType[type] = []);
        },
        
        getUniqueObservers: function() {
            var observersByType = this.__obsbt, retval = [];
            if (observersByType) {
                var type, observers, i, observer, found = {}, guid;
                for (type in observersByType) {
                    observers = observersByType[type];
                    i = observers.length;
                    while (i) {
                        observer = observers[--i];
                        --i;
                        guid = observer.__GUID || (observer.__GUID = dr.generateGuid());
                        if (!found[guid]) {
                            found[guid] = true;
                            retval.push(observer);
                        }
                    }
                }
            }
            return retval;
        },
        
        /** Checks if any observers exist for the provided event type.
            @param type:string The name of the event to check.
            @returns boolean: True if any exist, false otherwise. */
        hasObservers: function(type) {
            var observersByType = this.__obsbt;
            if (!observersByType) return false;
            var observers = observersByType[type];
            return observers && observers.length > 0;
        },
        
        /** Generates a new event from the provided type and value and fires it
            to the provided observers or the registered observers.
            @param type:string The event type to fire.
            @param value:* The value to set on the event.
            @returns This object for chainability. */
        sendEvent: function(type, value) {
            if (dr.ready) {
                var observers = this.hasObservers(type) ? this.__obsbt[type] : null;
                if (observers) this.__fireEvent(type, value, observers);
            } else {
                // Queue up events during initialization
                dr.Observable.pendingEventQueue.push([this, type, value]);
            }
            return this;
        },
        
        /** Fire the event to the observers.
            @private
            @param type:string The type of event to fire.
            @param event:Object The event to fire.
            @param observers:array An array of method names and contexts to invoke
                providing the event as the sole argument.
            @returns void */
        __fireEvent: function(type, event, observers) {
            // Prevent "active" events from being fired again
            var activeEventTypes = this.__aet || (this.__aet = {});
            if (activeEventTypes[type] === true) {
                dr.global.error.notifyWarn('eventLoop', "Attempt to refire active event: " + type);
            } else {
                // Mark event type as "active"
                activeEventTypes[type] = true;
                
                // Walk through observers backwards so that if the observer is
                // detached by the event handler the index won't get messed up.
                // FIXME: If necessary we could queue up detachObserver calls that 
                // come in during iteration or make some sort of adjustment to 'i'.
                var i = observers.length, observer, methodName;
                while (i) {
                    observer = observers[--i]
                    methodName = observers[--i];
                    
                    // Sometimes the list gets shortened by the method we called so
                    // just continue decrementing downwards.
                    if (observer && methodName) {
                        try {
                            if (typeof methodName === 'function') {
                                methodName.call(observer, event, dr); // TAG:Global Scope
                            } else {
                                if (typeof observer[methodName] === 'function') {
                                    observer[methodName](event, dr); // TAG:Global Scope
                                } else {
                                    if (observer[methodName] == null) {
                                        dr.global.error.logWarn('Target method "' + methodName + '" not found when firing "' + type + '" event.');
                                    } else {
                                        dr.global.error.logWarn('Target method "' + methodName + '" not a function when firing "' + type + '" event.');
                                    }
                                }
                            }
                        } catch (err) {
                            dr.dumpStack(err);
                        }
                    }
                }
                
                // Mark event type as "inactive"
                activeEventTypes[type] = false;
            }
        }
    });
});
