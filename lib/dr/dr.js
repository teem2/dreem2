/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/

define(function(require, exports, module) {
    require('$LIB/dr/shim/language.js');
    var globalScope = require('$SPRITE/global.js');
    
    // PhantomJS doesn't support Promises so polyfill
    if (!globalScope.Promise) globalScope.Promise = require('$CORE/promisepolyfill.js');
    
    module.exports = {
        // Expose JSClass
        JS:require('$LIB/jsclass.js'),
        
        // Use the current date and time as a version
        version: 20150623.1045,
        
        /** Dictionary to map global ID's to the dreem global root. Used for 
            constraint-resolving. See dr.sprite.storeGlobal and 
            dr.sprite.retrieveGlobal for methods that access this dictionary.
            @private */
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
        
        /** Called from previewers to deserialize undoables. Not intended for
            use in other contexts, though it may still be useful. */
        deserialize: function(json) {
          var objTree = JSON.parse(json),
            classname = objTree.classname,
            data = objTree.data;
            
          var klass = this.lookupClass(classname);
          if (klass) {
              var obj = new klass();
              if (obj.deserialize) obj.deserialize(data);
              return obj;
          }
          return null;
        },
        
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
                    scope = this;
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
                    return this;
                } else if (objName.startsWith('dr.')) {
                    objName = objName.substring(3);
                    scope = this;
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
                    this.sprite.console.warn("resolveName failed for:" + objName.join('.') + ' at part:' + i + ' "' + objName[i] + '"');
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
            this.global.error.notify(type || 'error', err, err, typeof err === 'string' ? null : err);
        },
        
        // Text Templating
        /** Populates a text "template" with 1 or more arguments. The
            template consists of a string with text interspersed with 
            curly-braced indices. The arguments are replaced in order one at
            a time into the template. For example:
            
                dr.fillTextTemplate("{0}/{2}/{1} hey {0}", 1, 2, 3) 
                will return "1/3/2 hey 1".
            
            @param (first arg):string The template to use.
            @param (remaining args):(coerced to string) The parameters for the
                template.
            @returns A populated string. */
        fillTextTemplate: function() {
            var params = Array.prototype.slice.call(arguments),
                template = params.shift();
            
            if (template == null) return '';
            
            var param, i = 0, len = params.length;
            for (; len > i; ++i) {
                param = params[i];
                template = template.split("{" + i + "}").join(param == null ? '' : param);
            }
            return template;
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
        
        /** Get the closest point on a line to a given point.
            @param Ax:number The x-coordinate of the first point that defines 
                the line.
            @param Ay:number The y-coordinate of the first point that defines 
                the line.
            @param Bx:number The x-coordinate of the second point that defines 
                the line.
            @param By:number The y-coordinate of the second point that defines 
                the line.
            @param Px:number The x-coordinate of the point.
            @param Py:number The y-coordinate of the point.
            @returns object: A position object with x and y properties. */
        getClosestPointOnALineToAPoint: function(Ax, Ay, Bx, By, Px, Py) {
            var APx = Px - Ax,
                APy = Py - Ay,
                ABx = Bx - Ax,
                ABy = By - Ay,
                magAB2 = ABx * ABx + ABy * ABy,
                ABdotAP = ABx * APx + ABy * APy,
                t = ABdotAP / magAB2;
            return {x:Ax + ABx * t, y:Ay + ABy * t};
        },
        
        // Random numbers
        /** @returns a random number between 0 (inclusive) and 1 (exclusive)
            @param func:function (optional) a distribution function for the
                random numbers. The function should map a number between 0 and 1
                to another number between 0 (inclusive) and 1 (exclusive). If not 
                provided a flat distribution will be used. Example functions:
                    - function(v) {return v * v;} will skew the value towards 0.
                    - function(v) {return 0.9999999999 - v * v;} will skew the 
                      value towards a value very close to 1.
            @returns number: a random number between 0 and almost 1. */
        getRandom: function(func) {
            var v = Math.random();
            if (func) {
                v = func(v);
                
                // Correct for badly behaved skew functions.
                if (v >= 1) {
                    v = 0.9999999999;
                } else if (v < 0) {
                    v = 0;
                }
            }
            return v;
        },
        
        /** @returns a random number between min (inclusive) and max (exclusive).
            @param min:number the minimum value returned.
            @param max:number the maximum value returned.
            @param func:function a skew function. See myt.getRandom for more info.
            @returns number: between min and max. */
        getRandomArbitrary: function(min, max, func) {
            if (min > max) {
                var tmp = min;
                min = max;
                max = tmp;
            }
            return this.getRandom(func) * (max - min) + min;
        },
        
        /** @returns a random integer between min (inclusive) and max (inclusive)
            @param min:number the minimum value returned.
            @param max:number the maximum value returned.
            @param func:function a skew function. See myt.getRandom for more info.
            @returns number: an integer between min and max. */
        getRandomInt: function(min, max, func) {
            if (min > max) {
                var tmp = min;
                min = max;
                max = tmp;
            }
            return Math.floor(this.getRandom(func) * (max - min + 1) + min);
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
                        refTarget = ref ? this.resolveName(ref, target) : target;
                        if (refTarget) target.listenTo(refTarget, handler.event, handler.name);
                    }
                }
            }
        },
        
        /** Called at the end of instantiation. Bind all the constraints registered
            during instantiation and notifies each root view that we are "ready". */
        notifyReady: function() {
            this.ready = true;
            
            // Hide the spinner if it exists
            var scope = this.getGlobalScope();
            if (typeof scope.__stopSpinner === 'function') scope.__stopSpinner();
            
            // Fire any pending events
            if (this.Observable) this.Observable.firePendingEvents();
            
            // Notify every view that we are now ready. Will also trigger the
            // firing of oninit events for each node depth first.
            if (this.global.roots) {
                var rootViews = this.global.roots.getRoots(), len = rootViews.length, i = 0;
                for (; len > i;) rootViews[i++].setAttribute('ready', true);
            }
            
            // Send a dreeminit event. Used by phantomjs testing
            if (this.sprite.sendReadyEvent) this.sprite.sendReadyEvent();
        }
    };
});
