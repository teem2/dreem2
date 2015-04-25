/** Provides support for getter and setter functions on an object.
    
    Events:
        None
    
    Attributes:
        earlyAttrs:array An array of attribute names that will be set first.
        lateAttrs:array An array of attribute names that will be set last.
*/
define(function(require, exports){
    var dr = require('./dr.js');
    var JS = require('../../../../lib/jsclass.js');
    var acorn = require('../../../../lib/acornn.js');

    dr.AccessorSupport = new JS.Module('AccessorSupport', {
        // Class Methods and Attributes ////////////////////////////////////////////
        extend: {
            /** Generate a setter name for an attribute.
                @returns string */
            generateSetterName: function(attrName) {
                return this.SETTER_NAMES[attrName] || (this.SETTER_NAMES[attrName] = this.generateName(attrName, 'set_'));
            },
            
            /** Generate a getter name for an attribute.
                @returns string */
            generateGetterName: function(attrName) {
                return this.GETTER_NAMES[attrName] || (this.GETTER_NAMES[attrName] = this.generateName(attrName, 'get_'));
            },
            
            /** Generate a config name for an attribute.
                @returns string */
            generateConfigAttrName: function(attrName) {
                return this.CONFIG_ATTR_NAMES[attrName] || (this.CONFIG_ATTR_NAMES[attrName] = this.generateName(attrName, '__cfg_'));
            },
            
            /** Generate a constraint function name for an attribute.
                @returns string */
            generateConstraintFunctionName: function(attrName) {
                return this.CONSTRAINT_FUNCTION_NAMES[attrName] || (this.CONSTRAINT_FUNCTION_NAMES[attrName] = this.generateName(attrName, '__fnc_'));
            },
            
            /** Generates a method name by capitalizing the attrName and
                prepending the prefix.
                @returns string */
            generateName: function(attrName, prefix) {
                return prefix + attrName;
            },
            
            /** Caches getter names. */
            GETTER_NAMES:{},
            
            /** Caches setter names. */
            SETTER_NAMES:{},
            
            /** Caches config attribute names. */
            CONFIG_ATTR_NAMES:{},
            
            /** Caches constraint function names. */
            CONSTRAINT_FUNCTION_NAMES:{},
            
            CONSTRAINTS: {
                BINDINGS:{},
                SCOPES: null,
                PROPERTY_BINDINGS: {
                    MemberExpression: function(n, parent) {
                        // avoid binding to CallExpressions whose parent is a 
                        // function call, e.g. Math.round(...) shouldn't attempt 
                        // to bind to 'round' on Math
                        if (parent.node.type !== 'CallExpression' || parent.sub !== 'callee') {
                            dr.AccessorSupport.CONSTRAINTS.SCOPES.push({
                                binding:acorn.stringify(n.object),
                                property:n.property.name
                            });
                        }
                        return true;
                    }
                },
                
                __registeredConstraints: [],
                __lockCount: 0,
                incrementLockCount: function() {
                    ++this.__lockCount;
                },
                decrementLockCount: function() {
                    if (--this.__lockCount === 0) {
                        // Bind constraints
                        var rcs = this.__registeredConstraints;
                        while (rcs.length) rcs.shift().bindConstraint(rcs.shift(), rcs.shift(), true);
                    }
                },
                registerConstraint: function(node, attrName, expression) {
                    if (this.__lockCount === 0) {
                        // Bind immediatly if no nodes are being instantiated.
                        node.bindConstraint(attrName, expression);
                    } else {
                        this.__registeredConstraints.push(node, attrName, expression);
                    }
                }
            }
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        appendToEarlyAttrs: function() {Array.prototype.push.apply(this.earlyAttrs || (this.earlyAttrs = []), arguments);},
        prependToEarlyAttrs: function() {Array.prototype.unshift.apply(this.earlyAttrs || (this.earlyAttrs = []), arguments);},
        appendToLateAttrs: function() {Array.prototype.push.apply(this.lateAttrs || (this.lateAttrs = []), arguments);},
        prependToLateAttrs: function() {Array.prototype.unshift.apply(this.lateAttrs || (this.lateAttrs = []), arguments);},
        
        coerce: function(attrName, value, type, defaultValue) {
            switch (type) {
                case 'number':
                    value = parseFloat(value);
                    if (isNaN(value)) {
                        if (defaultValue !== undefined) {
                            value = defaultValue;
                        } else {
                            this.dumpStack("NaN encountered parsing value as number with no default: " + value);
                        }
                    }
                    break;
                case 'positivenumber':
                    value = parseFloat(value);
                    if (isNaN(value)) {
                        if (defaultValue !== undefined) {
                            value = defaultValue;
                        } else {
                            value = 0;
                        }
                    }
                    value = Math.max(0, value);
                    break;
                case 'boolean':
                    if (value == null) {
                        value = defaultValue !== undefined ? defaultValue : false;
                    } else if (typeof value === 'string') {
                        value = value === 'true';
                    } else {
                        value = value ? true : false;
                    }
                    break;
                case 'string':
                    if (value == null) {
                        value = defaultValue !== undefined ? defaultValue : '';
                    } else {
                        value = '' + value;
                    }
                    break;
                case 'color':
                    if (value == null) {
                        value = defaultValue !== undefined ? defaultValue : 'transparent';
                    } else {
                        value = '' + value;
                    }
                    break;
                case 'easing_function':
                    // Lookup easing function if a string is provided.
                    if (typeof value === 'string') value = dr.Animator.easingFunctions[value];
                    
                    // Use default if invalid
                    if (!value) value = dr.Animator.DEFAULT_EASING_FUNCTION;
                    break;
                case 'json':
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        dr.dumpStack("error parsing json value '" + value + "' for attribute '" + attrName + "'");
                    }
                    break;
                case 'expression':
                    if (typeof value === 'string') {
                        value = (new Function('return ' + value)).bind(this)();
                    }
                    break;
                case '*':
                case 'object':
                case 'function':
                default:
            }
            return value;
        },
        
        /** Calls a setter function for each attribute in the provided map.
            @param attrs:object a map of attributes to set.
            @returns void. */
        callSetters: function(attrs) {
            var earlyAttrs = this.earlyAttrs,
                lateAttrs = this.lateAttrs,
                attrName, extractedLateAttrs, i, len;
            if (earlyAttrs || lateAttrs) {
                // Make a shallow copy of attrs since we can't guarantee that
                // attrs won't be reused
                var copyOfAttrs = {};
                for (attrName in attrs) copyOfAttrs[attrName] = attrs[attrName];
                attrs = copyOfAttrs;
                
                // Do early setters
                if (earlyAttrs) {
                    i = 0;
                    len = earlyAttrs.length;
                    while (len > i) {
                        attrName = earlyAttrs[i++];
                        if (attrName in attrs) {
                            this.setAttribute(attrName, attrs[attrName]);
                            delete attrs[attrName];
                        }
                    }
                }
                
                // Extract late setters for later execution
                if (lateAttrs) {
                    extractedLateAttrs = [];
                    i = 0;
                    len = lateAttrs.length;
                    while (len > i) {
                        attrName = lateAttrs[i++];
                        if (attrName in attrs) {
                            extractedLateAttrs.push(attrName, attrs[attrName]);
                            delete attrs[attrName];
                        }
                    }
                }
            }
            
            // Do normal setters in alphabetical order
            var keys = Object.keys(attrs).sort();
            len = keys.length;
            i = 0;
            for (; len > i;) {
                attrName = keys[i++];
                this.setAttribute(attrName, attrs[attrName]);
            }
            
            // Do late setters
            if (extractedLateAttrs) {
                i = 0;
                len = extractedLateAttrs.length;
                while (len > i) this.setAttribute(extractedLateAttrs[i++], extractedLateAttrs[i++]);
            }
        },
        
        /** A generic getter function that can be called to get a value from this
            object. Will defer to a defined getter if it exists.
            @param attrName:string The name of the attribute to get.
            @returns the attribute value. */
        getAttribute: function(attrName) {
            var getterName = dr.AccessorSupport.generateGetterName(attrName);
            return this[getterName] ? this[getterName]() : this[attrName];
        },
        
        /** A generic setter function that can be called to set a value on this
            object. Will defer to a defined setter if it exists. The implementation
            assumes this object is an Observable so it will have a 'sendEvent'
            method.
            @param attrName:string The name of the attribute to set.
            @param value:* The value to set.
            @returns void */
        setAttribute: function(attrName, value, isActual) {
            if (isActual) {
                var setterName = dr.AccessorSupport.generateSetterName(attrName);
                if (this[setterName]) {
                    this[setterName](value);
                } else {
                    this.setActual(attrName, value);
                }
            } else {
                var cfgAttrName = dr.AccessorSupport.generateConfigAttrName(attrName);
                if (this[cfgAttrName] !== value) {
                    this[cfgAttrName] = value;
                    
                    // Teardown Constraint if one already exists
                    this.unbindConstraint(attrName);
                    
                    // Bind New Constraint if necessary and return actual value
                    if (!this.setupConstraint(attrName, value)) {
                        // Call set for the actual value
                        this.setAttribute(attrName, value, true);
                    }
                }
            }
        },
        
        // Common Setter Helpers //
        /** Sets the actual value of an attribute on an object and fires an
            event if the value has changed.
            @param attrName:string The name of the attribute to set.
            @param value:* The value to set.
            @param type:string The type to try to coerce the value to.
            @param defaultValue:* (optional) The default value to use when
                coercion fails.
            @param beforeEventFunc:function (optional) A function that gets called
                before the event may be fired.
            @returns boolean: True if the value was changed, false otherwise. */
        setActual: function(attrName, value, type, defaultValue, beforeEventFunc) {
            if (this[attrName] !== (value = this.coerce(attrName, value, type, defaultValue))) {
                // Store value and invoke setter on sprite if it exists
                var setterName = dr.AccessorSupport.generateSetterName(attrName),
                    sprite = this.sprite;
                this[attrName] = (sprite && sprite[setterName]) ? sprite[setterName](value) : value;
                
                // Invoke the beforeEventFunc if possible
                if (beforeEventFunc) beforeEventFunc();
                
                // Fire an event if possible
                if (this.initing === false && this.sendEvent) {
                    this.sendEvent('on' + attrName, this[attrName]);
                }
                return true;
            }
            return false;
        },
        
        /** Sets the actual value of an attribute on an object.
            @param attrName:string The name of the attribute to set.
            @param value:* The value to set.
            @param fireEvent:boolean (optional) If true an attempt will be made
                to fire an event. Defaults to undefined which is equivalent 
                to false.
            @returns boolean: True if the value was changed, false otherwise. */
        setSimpleActual: function(attrName, value, fireEvent) {
            if (this[attrName] !== value) {
                this[attrName] = value;
                
                // Fire an event if possible
                if (fireEvent && this.initing === false && this.sendEvent) {
                    this.sendEvent('on' + attrName, this[attrName]);
                }
                
                return true;
            }
            return false;
        },
        
        // Constraints //
        unbindConstraint: function(attrName) {
            var constraints = this.constraints,
                constraintInfo = constraints ? constraints[attrName] : null;
            if (constraintInfo) {
                var funcName = constraintInfo.funcName,
                    bindings = constraintInfo.bindings, i = bindings.length, binding;
                while (i) {
                    binding = bindings[--i];
                    this.stopListening(binding.target, binding.eventName, funcName);
                }
                delete this[funcName];
                delete constraints[attrName];
            }
        },
        
        /** Attempts to setup the provided value as a constraint.
            @param attrName:string The name of the attribute the constraint is for.
            @param value:* The value, possibly a constraint expression, to set.
            @return boolean True if the value was a constraint, false otherwise. */
        setupConstraint: function(attrName, value) {
            if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
                // Defer constraint resolution until later.
                dr.AccessorSupport.CONSTRAINTS.registerConstraint(
                    this, attrName, value.substring(2, value.length - 1)
                );
                return true;
            }
            return false;
        },
        
        /** @private */
        bindConstraint: function(attrName, expression, isAsync) {
            // Unbind again in case multiple constraints got registered for the
            // same attribute during initialization.
            if (isAsync) this.unbindConstraint(attrName);
            
            // Find Bindings
            var AS = dr.AccessorSupport,
                CONSTRAINTS = AS.CONSTRAINTS,
                bindingCache = CONSTRAINTS.BINDINGS;
            if (!(expression in bindingCache)) {
                CONSTRAINTS.SCOPES = [];
                acorn.walkDown(acorn.parse(expression), CONSTRAINTS.PROPERTY_BINDINGS);
                bindingCache[expression] = CONSTRAINTS.SCOPES;
            }
            
            // Create function to be called for the constraint.
            var fn = (new Function('event','dr','this.setAttribute("' + attrName + '",' + expression + ', true)')).bind(this);
            
            // Resolve binding paths and start listening to binding targets
            if (fn) {
                var funcName = AS.generateConstraintFunctionName(attrName),
                    bindings = [],
                    scopes = bindingCache[expression], i = scopes.length, 
                    scope, eventName, target, binding;
                while (i) {
                    scope = scopes[--i];
                    
                    binding = scope.binding;
                    if (binding === 'this') {
                        target = this;
                    } else if (binding.startsWith('this.')) {
                        target = dr.resolveName(binding.substring(5), this);
                    } else {
                        target = dr.resolveName(binding);
                    }
                    
                    if (target) {
                        eventName = 'on' + scope.property;
                        this.listenTo(target, eventName, funcName);
                        bindings.push({target:target, eventName:eventName});
                    }
                }
                (this.constraints || (this.constraints = {}))[attrName] = {funcName:funcName, bindings:bindings};
                
                // Assign function to this object and execute immediately
                this[funcName] = fn;
                fn(null, dr);
            }
        }
    });
});
