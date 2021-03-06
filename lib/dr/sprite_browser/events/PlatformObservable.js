/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


/** Generates Platform Events and passes them on to one or more event observers.
    
    Events:
        None
    
    Attributes:
        None
    
    Private Attributes:
        __dobsbt:object Stores arrays of dr.sprite.PlatformObservers and 
            method names by event type.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        sprite = require('$SPRITE/sprite.js');
    
    module.exports = sprite.PlatformObservable = new JS.Module('sprite.PlatformObservable', {
        // Methods /////////////////////////////////////////////////////////////////
        /** Adds the observer to the list of event recipients for the event type.
            @param platformObserver:dr.sprite.PlatformObserver The observer that 
                will be notified when a platform event occurs.
            @param methodName:string The method name to call on the platform 
                observer.
            @param eventType:string The type of platform event to register for.
            @param capture:boolean (optional) Indicates if the event registration
                is during capture or bubble phase. Defaults to false, bubble phase.
            @returns boolean True if the observer was successfully registered, 
                false otherwise.*/
        attachPlatformObserver: function(platformObserver, methodName, eventType, capture) {
            if (platformObserver && methodName && eventType) {
                capture = !!capture;
                
                var methodRef = this.createPlatformMethodRef(platformObserver, methodName, eventType);
                if (methodRef) {
                    var platformObserversByType = this.__dobsbt || (this.__dobsbt = {});
                    
                    // Lazy instantiate platform observers array for type and insert observer.
                    var platformObservers = platformObserversByType[eventType];
                    if (!platformObservers) {
                        // Create list with observer
                        platformObserversByType[eventType] = [platformObserver, methodName, methodRef, capture];
                    } else {
                        // Add platform observer to the end of the list
                        platformObservers.push(platformObserver, methodName, methodRef, capture);
                    }
                    
                    var platformEventType = eventType.substring(2); // Remove the 'on' prefix
                    sprite.addEventListener(this.platformObject, platformEventType, methodRef, capture);
                    
                    return true;
                }
            }
            return false;
        },
        
        /** Creates a function that will handle the platform event when it is fired
            by the browser. Must be implemented by the object this mixin is 
            applied to.
            @param platformObserver:dr.sprite.PlatformObserver the observer that 
                must be notified when the platform event fires.
            @param methodName:string the name of the function to pass the event to.
            @param eventType:string the type of the event to fire.
            @returns a function to handle the platform event or null if the event
                is not supported. */
        createPlatformMethodRef: function(platformObserver, methodName, eventType) {
            return null;
        },
        
        /** Used by the createPlatformMethodRef implementations of submixins of 
            dr.sprite.PlatformObservable to implement the standard methodRef.
            @param platformObserver:dr.sprite.PlatformObserver the observer that 
                must be notified when the platform event fires.
            @param methodName:string the name of the function to pass the event to.
            @param eventType:string the type of the event to fire.
            @param observableClass:JS.Class The class that has the common event.
            @param preventDefault:boolean (Optional) If true the default behavior
            @param wrapNativeEvent:funciton (Optional) A function that converts
                native events to sanitized event to prevent leaky abstractions
            @returns a function to handle the platform event or undefined if the 
                event will not be handled. */
        createStandardPlatformMethodRef: function(platformObserver, methodName, eventType, observableClass, preventDefault, wrapNativeEvent) {
            // DRY: Very similar code in dr.sprite.FocusObservable
            var self = this;
            if (observableClass.EVENT_TYPES[eventType]) {
                return function(platformEvent) {
                    var allowBubble, returnEvent;
                    if (!platformEvent) platformEvent = global.event;
                    if (typeof wrapNativeEvent === 'function') {
                        returnEvent = wrapNativeEvent(platformEvent)
                    } else {
                        returnEvent = platformEvent;
                    }
                    
                    allowBubble = platformObserver.invokePlatformObserverCallback(methodName, eventType, returnEvent);
                    if (!allowBubble) {
                        platformEvent.cancelBubble = true;
                        if (platformEvent.stopPropagation) platformEvent.stopPropagation();
                        if (self.preventDefault(platformEvent, eventType, preventDefault)) sprite.preventDefault(platformEvent);
                    }
                };
            }
        },
        
        /** Give classes/instances a chance to define custom behavior. */
        preventDefault: function(platformEvent, eventType, preventDefault) {
            return preventDefault;
        },
        
        /** Removes the observer from the list of platform observers for the 
            event type.
            @param platformObserver:dr.sprite.PlatformObserver The platform 
                observer to unregister.
            @param methodName:string The method name to unregister for.
            @param eventType:string The platform event type to unregister for.
            @param capture:boolean (optional) The event phase to unregister for.
                Defaults to false if not provided.
            @returns boolean True if the observer was successfully unregistered, 
                false otherwise.*/
        detachPlatformObserver: function(platformObserver, methodName, eventType, capture) {
            if (platformObserver && methodName && eventType) {
                capture = !!capture;
                
                var platformObserversByType = this.__dobsbt;
                if (platformObserversByType) {
                    var platformObservers = platformObserversByType[eventType];
                    if (platformObservers) {
                        // Remove platform observer
                        var retval = false, platformObject = this.platformObject, i = platformObservers.length,
                            platformEventType = eventType.substring(2); // Remove the 'on' prefix
                        while (i) {
                            i -= 4;
                            if (platformObserver === platformObservers[i] && 
                                methodName === platformObservers[i + 1] && 
                                capture === platformObservers[i + 3]
                            ) {
                                if (platformObject) sprite.removeEventListener(platformObject, platformEventType, platformObservers[i + 2], capture);
                                platformObservers.splice(i, 4);
                                retval = true;
                            }
                        }
                        return retval;
                    }
                }
            }
            return false;
        },
        
        /** Detaches all platform observers from this PlatformObservable.
            @returns void */
        detachAllPlatformObservers: function() {
            var platformObject = this.platformObject;
            if (platformObject) {
                var platformObserversByType = this.__dobsbt;
                if (platformObserversByType) {
                    var platformObservers, methodRef, capture, i, eventType, platformEventType;
                    for (eventType in platformObserversByType) {
                        platformObservers = platformObserversByType[eventType];
                        i = platformObservers.length;
                        platformEventType = eventType.substring(2); // Remove the 'on' prefix
                        while (i) {
                            capture = platformObservers[--i];
                            methodRef = platformObservers[--i];
                            i -= 2; // methodName and platformObserver
                            sprite.removeEventListener(platformObject, platformEventType, methodRef, capture);
                        }
                        platformObservers.length = 0;
                    }
                }
            }
        }
    });
});
