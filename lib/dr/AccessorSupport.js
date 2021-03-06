/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/
/** Provides support for getter and setter functions on an object.
    
    Events:
        None
    
    Attributes:
        earlyAttrs:array An array of attribute names that will be set first.
        lateAttrs:array An array of attribute names that will be set last.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        acorn = require('$LIB/acorn.js'),
        evaluator = require('$SPRITE/expressionresolver.js');
    
    module.exports = dr.AccessorSupport = new JS.Module('AccessorSupport', {
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
                        while (rcs.length) rcs.shift().bindConstraint(rcs.shift(), rcs.shift(), true, rcs.shift());
                    }
                },
                registerConstraint: function(node, attrName, expression, isDatapath) {
                    if (this.__lockCount === 0) {
                        // Bind immediatly if no nodes are being instantiated.
                        node.bindConstraint(attrName, expression, false, isDatapath);
                    } else {
                        this.__registeredConstraints.push(node, attrName, expression, isDatapath);
                    }
                }
            },
            
            coerce: function(attrName, value, type, defaultValue, scope) {
                switch (type) {
                    case 'number':
                        var newValue = parseFloat(value);
                        if (isNaN(newValue)) {
                            if (defaultValue !== undefined) {
                                value = defaultValue;
                            } else {
                                dr.dumpStack("NaN encountered parsing value as number with no default. Attr: " + attrName);
                                value = NaN;
                            }
                        } else {
                            value = newValue;
                        }
                        break;
                    case 'positivenumber':
                        var newValue = parseFloat(value);
                        if (isNaN(newValue)) {
                            if (defaultValue !== undefined) {
                                value = defaultValue;
                            } else {
                                value = 0;
                            }
                        } else {
                            value = newValue;
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
                    case 'motion':
                        // Lookup easing function if a string is provided.
                        if (typeof value === 'string') value = dr.Animator.motionFunctions[value];
                        
                        // Use default if invalid
                        if (!value) value = dr.Animator.DEFAULT_MOTION;
                        break;
                    case 'json':
                        if (value == null || value === '') {
                            value = undefined;
                        } else {
                            try {
                                value = JSON.parse(value);
                            } catch (e) {
                                dr.global.error.logWarn("error parsing json value '" + value + "' for attribute '" + attrName + "'");
                            }
                        }
                        break;
                    case 'expression':
                        if (typeof value === 'string') {
                            value = (new Function('dr', 'return ' + value)).bind(scope)(dr);
                        }
                        break;
                    case '*':
                    case 'object':
                    case 'function':
                    default:
                }
                return value;
            }
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        appendToEarlyAttrs: function() {Array.prototype.push.apply(this.earlyAttrs || (this.earlyAttrs = []), arguments);},
        prependToEarlyAttrs: function() {Array.prototype.unshift.apply(this.earlyAttrs || (this.earlyAttrs = []), arguments);},
        appendToLateAttrs: function() {Array.prototype.push.apply(this.lateAttrs || (this.lateAttrs = []), arguments);},
        prependToLateAttrs: function() {Array.prototype.unshift.apply(this.lateAttrs || (this.lateAttrs = []), arguments);},
        
        coerce: function(attrName, value, type, defaultValue) {
            return dr.AccessorSupport.coerce(attrName, value, type, defaultValue, this);
        },
        
        /** Calls a setter function for each attribute in the provided map.
            @param attrs:object a map of attributes to set.
            @returns void. */
        setAttributes: function(attrs) {
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
        
        /** Gets the config value of the attribute. For example, a view might
            have a config value of 'center' for the x attribute but the actual
            value would be something like 75.
            @param attrName:string The name of the attribute to get the config
                value for.
            @returns the attribute config value. */
        getAttribute: function(attrName) {
            return this[dr.AccessorSupport.generateConfigAttrName(attrName)];
        },
        
        /** A generic getter function that can be called to get a value from this
            object. Will defer to a defined getter if it exists.
            @param attrName:string The name of the attribute to get.
            @returns the attribute value. */
        getActualAttribute: function(attrName) {
            var getterName = dr.AccessorSupport.generateGetterName(attrName);
            return this[getterName] ? this[getterName]() : this[attrName];
        },
        
        /** A generic setter function that can be called to set the configured
            value of an attribute on this object. Will first test if the 
            "config" value has changed and if so it will proceed to update the
            value, bind/unbind constraints and finally set the actual
            attribute value via  the setActualAttribute method.
            @param attrName:string The name of the attribute to set.
            @param value:* The value to set.
            @returns This object for chainability. */
        setAttribute: function(attrName, value) {
            var cfgAttrName = dr.AccessorSupport.generateConfigAttrName(attrName);
            if (this[cfgAttrName] !== value) {
                this[cfgAttrName] = value;
                
                // Teardown Constraint if one already exists
                this.unbindConstraint(attrName);
                
                // Bind New Constraint if necessary and then set actual value
                if (!this.setupConstraint(attrName, value)) this.setActualAttribute(attrName, value);
                
                // Fire a config value event if possible
                if (this.sendEvent) this.sendEvent('on' + cfgAttrName, value);
            }
            return this;
        },
        
        /** A generic setter function that is called to set the actual value 
            of an attribute on this object. Will defer to a defined setter if 
            it exists. The implementation assumes this object is an 
            Observable so it will have a 'sendEvent' method.
            @param attrName:string The name of the attribute to set.
            @param value:* The value to set.
            @returns This object for chainability. */
        setActualAttribute: function(attrName, value) {
            var setterName = dr.AccessorSupport.generateSetterName(attrName);
            if (this[setterName]) {
                value = this[setterName](value);
                if (value !== dr.noop && value !== undefined) this.setActual(attrName, value);
            } else {
                this.setActual(attrName, value);
            }
            return this;
        },
        
        /** @private */
        getTypeForAttrName: function(attrName) {
            return '*';
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
            if (!type) type = this.getTypeForAttrName(attrName);
            
            if (this[attrName] !== (value = this.coerce(attrName, value, type, defaultValue))) {
                // Store value and invoke setter on sprite if it exists
                var setterName = dr.AccessorSupport.generateSetterName(attrName),
                    sprite = this.sprite;
                this[attrName] = (sprite && sprite[setterName]) ? sprite[setterName](value) : value;
                
                // Invoke the beforeEventFunc if possible
                if (beforeEventFunc) beforeEventFunc();
                
                // Fire an event if possible
                if (this.sendEvent) this.sendEvent('on' + attrName, this[attrName]);
                
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
                if (fireEvent && this.sendEvent) this.sendEvent('on' + attrName, this[attrName]);
                
                return true;
            }
            return false;
        },
        
        // Constraints //
        /** A convienence method for setting an attribute as a constraint.
            This is a wrapper around setAttribute with '${expression}' for
            the value.
            @param attrName:string The name of the attribute to set.
            @param expression:string The expression to set.
            @returns This object for chainability. */
        setConstraint: function(attrName, expression) {
            this.setAttribute(attrName, this.constraintify(expression));
            return this;
        },
        
        /** A convienence method for setting an attribute as a datapath 
            constraint. This is a wrapper around setAttribute with 
            '$datapath{expression}' for the value.
            @param attrName:string The name of the attribute to set.
            @param expression:string The expression to set.
            @returns This object for chainability. */
        setDatapathConstraint: function(attrName, expression) {
            this.setAttribute(attrName, this.datapathConstraintify(expression));
            return this;
        },
        
        unbindConstraint: function(attrName) {
            var constraints = this.constraints,
                constraintInfo = constraints ? constraints[attrName] : null;
            if (constraintInfo) {
                var funcName = constraintInfo.funcName,
                    isdatapath = constraintInfo.isdatapath,
                    bindings = constraintInfo.bindings, i = bindings.length, binding;
                while (i) {
                    binding = bindings[--i];
                    this.stopListening(binding.target, binding.eventName, funcName);
                }
                if (isdatapath) this[funcName].destroy();
                delete this[funcName];
                delete constraints[attrName];
            }
        },
        
        /** Attempts to setup the provided value as a constraint.
            @param attrName:string The name of the attribute the constraint is for.
            @param value:* The value, possibly a constraint expression, to set.
            @return boolean True if the value was a constraint, false otherwise. */
        setupConstraint: function(attrName, value) {
            if (this.isConstraintExpression(value)) {
                // Defer constraint resolution until later.
                dr.AccessorSupport.CONSTRAINTS.registerConstraint(
                    this, attrName, this.extractConstraintExpression(value), false
                );
                return true;
            } else if (this.isDatapathConstraintExpression(value)) {
                // Defer constraint resolution until later.
                dr.AccessorSupport.CONSTRAINTS.registerConstraint(
                    this, attrName, this.extractDatapathConstraintExpression(value), true
                );
                return true;
            }
            return false;
        },
        
        /** @private */
        constraintify: function(expression) {return '${' + expression + '}';},
        
        /** @private */
        datapathConstraintify: function(expression) {return '$datapath{' + expression + '}';},
        
        /** @private */
        isConstraintExpression: function(value) {
            return typeof value === 'string' && value.startsWith('${') && value.endsWith('}');
        },
        
        /** @private */
        isDatapathConstraintExpression: function(value) {
            return typeof value === 'string' && value.startsWith('$datapath{') && value.endsWith('}');
        },
        
        /** @private */
        extractConstraintExpression: function(value) {
            return value.substring(2, value.length - 1);
        },
        
        /** @private */
        extractDatapathConstraintExpression: function(value) {
            return value.substring(10, value.length - 1);
        },
        
        /** Rebinds all constraints on this object. */
        rebindConstraints: function() {
            var constraints = this.constraints;
            if (constraints) {
                for (var attrName in constraints) {
                    this.bindConstraint(attrName, constraints[attrName].expression);
                }
            }
        },
        
        /** Rebinds all constraints on this object that are bound to the provided target. */
        rebindConstraintsForTarget: function(target) {
            var constraints = this.constraints;
            if (constraints) {
                var attrName, constraint, bindings, i;
                for (attrName in constraints) {
                    constraint = constraints[attrName];
                    bindings = constraint.bindings;
                    i = bindings.length;
                    while (i) {
                        if (bindings[--i].target === target) {
                            this.bindConstraint(attrName, constraint.expression);
                            break;
                        }
                    }
                }
            }
        },
        
        /** @private */
        getConstraintTemplate: function(attrName, expression) {
            return 'this.setActualAttribute("' + attrName + '",' + expression + ')';
        },
        
        /** @private */
        bindConstraint: function(attrName, expression, isAsync, isDatapath) {
            // Unbind again in case multiple constraints got registered for the
            // same attribute during initialization.
            
            if (isAsync) this.unbindConstraint(attrName);
            
            if (isDatapath) {
              // Create function to be called for the constraint.
              var fn = (new Function('data','dr',this.getConstraintTemplate(attrName, 'data'))).bind(this), // TAG:Global Scope
                datapathRefName = '__DATAPATH_CONSTRAINT_' + attrName,
                datapath = this[datapathRefName] = new dr.datapath(this, {isconstraint:true});
              this.listenTo(datapath, 'onresult', fn);
              datapath.setAttribute('path', expression);
              
              var bindings = [{target:datapath, eventName:'onresult'}];
              (this.constraints || (this.constraints = {}))[attrName] = {isdatapath:true, funcName:datapathRefName, bindings:bindings, expression:expression};
              return;
            }
            
            expression = evaluator(expression);
            
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
            var fn = (new Function('event','dr',this.getConstraintTemplate(attrName, expression))).bind(this); // TAG:Global Scope
            
            // Resolve binding paths and start listening to binding targets
            if (fn) {
                var funcName = AS.generateConstraintFunctionName(attrName),
                    bindings = [],
                    scopes = bindingCache[expression], i = scopes.length, 
                    scope, eventName, target;
                while (i) {
                    scope = scopes[--i];
                    target = dr.resolveName(scope.binding, this);
                    if (target) {
                        eventName = 'on' + scope.property;
                        // its an rpc class
                        if (target._rpcpromise) {
                            if (target['on_' + scope.property]) {
                                target['on_' + scope.property].addListener(fn.bind(this, null, dr));
                            } else {
                                console.log("RPC binding "+ 'on_' + scope.property + " not found");
                            }
                        } else {
                            this.listenTo(target, eventName, funcName);
                        }
                        bindings.push({target:target, eventName:eventName});
                    }
                }
                (this.constraints || (this.constraints = {}))[attrName] = {funcName:funcName, bindings:bindings, expression:expression};
                
                // Assign function to this object and execute immediately
                this[funcName] = fn;
                fn(null, dr); // TAG:Global Scope
            }
        }
    });
});
