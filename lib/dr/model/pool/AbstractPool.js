/* Copyright 2015 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


/** Implements an object pool. Subclasses must at a minimum implement the 
    createInstance method.
    
    Events:
        None
    
    Attributes:
        None
    
    Private Attributes:
        __objPool:array The array of objects stored in the pool.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js');
    require('./Reusable.js');
    
    module.exports = dr.AbstractPool = new JS.Class('AbstractPool', {
        include: [
            require('$LIB/dr/Destructible.js')
        ],
        
        
        // Constructor /////////////////////////////////////////////////////////////
        /** Initialize does nothing. */
        initialize: function() {},
        
        
        // Life Cycle //////////////////////////////////////////////////////////////
        /** @overrides dr.Destructible */
        destroy: function() {
            var objPool = this.__objPool;
            if (objPool) objPool.length = 0;
            
            this.callSuper();
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** Get an instance from the pool.
            @param arguments:arguments (optional) arguments to be passed to the
                createInstance method. Note: these have no effect if an object
                already exists in the pool.
            @returns object */
        getInstance: function() {
            var objPool = this.__objPool;
            if (!objPool) objPool = this.__objPool = [];
            
            return objPool.length ? objPool.pop() : this.createInstance.apply(this, arguments);
        },
        
        /** Creates a new object that can be stored in the pool. The default
            implementation does nothing. */
        createInstance: function() {
            return null;
        },
        
        /** Puts the object back in the pool. The object will be "cleaned"
            before it is stored.
            @param obj:object the object to put in the pool.
            @returns void */
        putInstance: function(obj) {
            var objPool = this.__objPool;
            if (!objPool) objPool = this.__objPool = [];
            
            objPool.push(this.cleanInstance(obj));
        },
        
        /** Cleans the object in preparation for putting it back in the pool. The
            default implementation calls the clean method on the object if it is
            a dr.Reusable. Otherwise it does nothing.
            @param obj:object the object to be cleaned.
            @returns object the cleaned object. */
        cleanInstance: function(obj) {
            if (typeof obj.clean === 'function') obj.clean();
            return obj;
        },
        
        /** Calls the destroy method on all object stored in the pool if they
            have a destroy function.
            @returns void */
        destroyPooledInstances: function() {
            var objPool = this.__objPool;
            if (objPool) {
                var i = objPool.length, obj;
                while (i) {
                    obj = objPool[--i];
                    if (typeof obj.destroy === 'function') obj.destroy();
                }
            }
        }
    });
});
