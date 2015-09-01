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
/**
 * @class Eventable {Core Dreem}
 * @extends Module
 * 
 * The baseclass used by everything in dreem. Adds higher level event APIs.
 *
 * An object that provides accessors, events and simple lifecycle management.
 * Useful as a light weight alternative to dr.Node when parent child
 * relationships are not needed.
 *
 * @attribute {Boolean} initing Set to true during initialization and then false
 * when initialization is complete.
 * @readonly
 *
 * @attribute {Boolean} inited Set to true after this Eventable has completed
 * initializing
 * @readonly
 */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js');
    
    module.exports = dr.Eventable = new JS.Class('Eventable', {
        include: [
            require('$LIB/dr/AccessorSupport.js'), 
            require('$LIB/dr/Destructible.js'), 
            require('$LIB/dr/events/Observable.js'), 
            require('$LIB/dr/events/Observer.js')
        ],
        
        // Constructor /////////////////////////////////////////////////////////////
        /** The standard JSClass initializer function.
            @param attrs:object (Optional) A map of attribute names and values.
            @param mixins:array (Optional) a list of mixins to be added onto
                the new instance.
            @returns void */
        initialize: function(attrs, mixins) {
            if (mixins) {
                var i = 0, len = mixins.length, mixin;
                for (; len > i;) {
                    mixin = mixins[i++];
                    if (mixin) {
                        this.extend(mixin);
                    } else {
                        sprite.console.warn("Undefined mixin in initialization of: " + this.klass.__displayName);
                    }
                }
                
                // Pull in default attrs from mixins
                var mixinAttrs = {};
                dr.maker.doMixinExtension(mixinAttrs, mixins);
                attrs = dr.extend(mixinAttrs, attrs);
            }
            
            this.inited = false;
            this.initing = true;
            this.$textcontent = '';
            
            var defaultKlassAttrValues = this.klass.defaultAttrValues;
            if (defaultKlassAttrValues) attrs = dr.extend({}, defaultKlassAttrValues, attrs);
            
            this.init(attrs || {});
        },
        
        
        // Life Cycle //////////////////////////////////////////////////////////////
        /** Called during initialization. Calls setter methods and lastly, sets 
            inited to true and initing to false. Subclasses must callSuper.
            @param attrs:object A map of attribute names and values.
            @returns void */
        init: function(attrs) {
            var CONSTRAINTS = dr.AccessorSupport.CONSTRAINTS;
            CONSTRAINTS.incrementLockCount();
            
            this.setAttributes(attrs);
            
            CONSTRAINTS.decrementLockCount();
            
            this.initing = false;
            this.inited = true;
        },
        
        /** @overrides dr.Destructible. */
        destroy: function() {
            this.stopListeningToAllObservables();
            this.detachAllObservers();
            
            this.callSuper();
        }
    });
});
