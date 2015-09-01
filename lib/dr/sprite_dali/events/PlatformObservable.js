/**
 * Copyright (c) 2015 Teem2 LLC
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
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
    require('$SPRITE/sprite.js');
    
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
                of the platform event will be prevented.
            @returns a function to handle the platform event or undefined if the 
                event will not be handled. */
        createStandardPlatformMethodRef: function(platformObserver, methodName, eventType, observableClass, preventDefault) {
            if (observableClass.EVENT_TYPES[eventType]) {
                return function(platformEvent) {
                    if (!platformEvent) var platformEvent = global.event;
                    
                    var allowBubble = platformObserver[methodName](platformEvent);
                    if (!allowBubble) {
                        platformEvent.cancelBubble = true;
                        if (platformEvent.stopPropagation) platformEvent.stopPropagation();
                        if (preventDefault) sprite.preventDefault(platformEvent);
                    }
                };
            }
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
