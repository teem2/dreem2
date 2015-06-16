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
define(function(require, exports, module) {
    require('./shim/language.js');
    var globalScope = require('$SPRITE/global.js');
    
    var dr = module.exports = {
        // Expose JSClass
        JS:require('$LIB/jsclass.js'),
        
        // Use the current date and time as a version
        version: 20150613.1716,
        
        // Dictionary to map global ID's to the dreem global root. Used for 
        // constraint-resolving.
        IDdictionary: {},
        
        /** Used to generate globally unique IDs.
            @private */
        __GUID_COUNTER: 0,
        
        /** Generates a globally unique id, (GUID).
            @return number */
        generateGuid: function() {
            return ++this.__GUID_COUNTER;
        },
        
        getGlobalScope: function() {
            return globalScope;
        },
        
        /** Common noop function. Also used as a return value for setters to 
            prevent the default setAttribute behavior. */
        noop: function() {},
        
        /** Takes a '.' separated string such as "foo.bar.baz" and resolves it
            into the value found at that location relative to a starting scope.
            If no scope is provided global scope is used.
            @param objName:string|array The name to resolve or an array of path
                parts in descending order.
            @param scope:Object The scope to resolve from. If resolution fails
                against this scope the global scope will then be tried.
            @returns The referenced object or undefined if resolution failed. */
        resolveName: function(objName, scope) {
            if (!objName || objName.length === 0) return undefined;
            
            var isArray = Array.isArray(objName);
            if (isArray) {
                var firstName = objName[0];
                if (firstName === 'dr') {
                    scope = dr;
                    objName.shift();
                    if (objName.length === 0) return scope;
                } else if (firstName === 'global') {
                    scope = this.getGlobalScope();
                    objName.shift();
                    if (objName.length === 0) return scope;
                }
            } else {
                if (objName === 'this') {
                    return scope;
                } else if (objName.startsWith('this.')) {
                    objName = objName.substring(5);
                } else if (objName === 'dr') {
                    return dr;
                } else if (objName.startsWith('dr.')) {
                    objName = objName.substring(3);
                    scope = dr;
                } else if (objName === 'global') {
                    return this.getGlobalScope();
                } else if (objName.startsWith('global.')) {
                    objName = objName.substring(7);
                    scope = this.getGlobalScope();
                }
            }
            
            objName = isArray ? objName : objName.split(".");
            
            // Check first part against provided scope. If it's undefined
            // then fail over to global scope
            if (scope[objName[0]] === undefined) scope = this.getGlobalScope();
            
            for (var i = 0, len = objName.length; i < len; ++i) {
                scope = scope[objName[i]];
                if (scope === undefined) {
                    dr.sprite.console.warn("resolveName failed for:" + objName.join('.') + ' at part:' + i + ' "' + objName[i] + '"');
                    return undefined;
                }
            }
            
            return scope;
        },
        
        /** Used to wrap the first function with the second function. The first
            function is exposed as this.callSuper within the wrapper function.
            @param fn:function the function to wrap.
            @param wrapperFn:function the wrapper function.
            @returns a wrapped function. */
        wrapFunction: function(fn, wrapperFn) {
            return function() {
                // Store existing callSuper function so we can put it back later.
                var oldSuper = this.callSuper;
                
                // Assign new callSuper and execute wrapperFn
                this.callSuper = fn;
                var retval = wrapperFn.apply(this, arguments);
                
                // Restore existing callSuper or delete new callSuper
                if (oldSuper !== undefined) {
                    this.callSuper = oldSuper;
                } else {
                    delete this.callSuper;
                }
                
                return retval;
            };
        },
        
        /** A wrapper on dr.global.error.notify
            @param err:Error/string The error or message to dump stack for.
            @param type:string (optional) The type of console message to write.
                Allowed values are 'error', 'warn', 'log' and 'debug'. Defaults to
                'error'.
            @returns void */
        dumpStack: function(err, type) {
            dr.global.error.notify(type || 'error', err, err, typeof err === 'string' ? null : err);
        },
        
        // Misc
        /** Memoize a function.
            @param f:function The function to memoize
            @returns function: The memoized function. */
        memoize: function(f) {
            return function() {
                var hash = JSON.stringify(arguments),
                    cache = f.__cache || (f.__cache = {});
                return (hash in cache) ? cache[hash] : cache[hash] = f.apply(this, arguments);
            };
        },
        
        /** Copies properties from the source objects to the target object.
            @param targetObj:object The object that properties will be copied into.
            @param sourceObj:object The object that properties will be copied from.
            @param arguments... Additional arguments beyond the second will also
                be used as source objects and copied in order from left to right.
            @param mappingFunction:function (optional) If the last argument is a 
                function it will be used to copy values from the source to the
                target. The function will be passed three values, the key, the 
                target and the source. The mapping function should copy the
                source value into the target value if so desired.
            @returns The target object. */
        extend: function(targetObj, sourceObj) {
            var iterable = targetObj, 
                result = iterable,
                args = arguments, argsLength = args.length, argsIndex = 0,
                key, mappingFunc, ownIndex, ownKeys, length;
            
            if (iterable) {
                if (argsLength > 2 && typeof args[argsLength - 1] === 'function') mappingFunc = args[--argsLength];
                
                while (++argsIndex < argsLength) {
                    iterable = args[argsIndex];
                    
                    if (iterable) {
                        ownIndex = -1;
                        ownKeys = Object.keys(iterable);
                        length = ownKeys ? ownKeys.length : 0;
                        
                        while (++ownIndex < length) {
                            key = ownKeys[ownIndex];
                            if (mappingFunc) {
                                mappingFunc(key, result, iterable);
                            } else {
                                result[key] = iterable[key];
                            }
                        }
                    }
                }
            }
            return result
        },
        
        /** Common float comparison function. */
        closeTo: function(a, b, epsilon) {
            // Default of 0.01 is appropriate for many pixel related comparisons
            return Math.abs(a - b) < (epsilon != null ? epsilon : 0.01);
        },
        
        // Geometry
        measureDistance: function(x1, y1, x2, y2, squared) {
            var diffX = x2 - x1, 
                diffY = y2 - y1, 
                diffSquared = diffX * diffX + diffY * diffY;
            return squared ? diffSquared : Math.sqrt(diffSquared);
        },
        
        // Dreem Instantiation
        lookupClass: function(classname) {
            return this.maker.lookupClass(classname, this.pkg);
        },
        
        makeChildren: function(target, json, isClassroot) {
            this.maker.walkForInstance(target, json, isClassroot, this.pkg);
        },
        
        registerHandlers: function(target, handlers) {
            if (handlers) {
                var len = handlers.length;
                if (len > 0) {
                    var i = 0, handler, ref, refTarget;
                    for (; len > i;) {
                        handler = handlers[i++];
                        ref = handler.reference;
                        refTarget = ref ? dr.resolveName(ref, target) : target;
                        if (refTarget) target.listenTo(refTarget, handler.event, handler.name);
                    }
                }
            }
        },
        
        /** Called at the end of instantiation. Bind all the constraints registered
            during instantiation and notifies each root view that we are "ready". */
        notifyReady: function() {
            this.ready = true;
            
            // Fire any pending events
            this.Observable.firePendingEvents();
            
            // Notify every view that we are now ready. Will also trigger the
            // firing of oninit events for each node depth first.
            var rootViews = dr.global.roots.getRoots(), len = rootViews.length, i = 0;
            for (; len > i;) rootViews[i++].setAttribute('ready', true);
            
            // Send a dreeminit event. Used by phantomjs testing
            dr.sprite.sendReadyEvent();
        }
    };
});
