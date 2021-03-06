/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


/** An implementation of an dr.AbstractPool.
    
    Events
        None
    
    Attributes:
        instanceClass:JS.Class (initializer only) the class to use for 
            new instances. Defaults to Object.
        instanceParent:dr.Node (initializer only) The node to create new
            instances on.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js');
    
    module.exports = dr.SimplePool = new JS.Class('SimplePool', require('./AbstractPool.js'), {
        // Constructor /////////////////////////////////////////////////////////////
        /** Create a new dr.SimplePool
            @param instanceClass:JS.Class the class to create instances from.
            @param instanceParent:object (optional) The place to create instances 
                on. When instanceClass is an dr.Node this will be the node parent.
            @returns void */
        initialize: function(instanceClass, instanceParent) {
            this.callSuper();
            
            this.instanceClass = instanceClass || Object;
            this.instanceParent = instanceParent;
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @overrides dr.AbstractPool
            Creates an instance of this.instanceClass and passes in 
            this.instanceParent as the first argument if it exists.
            @param arguments[0]:object (optional) the attrs to be passed to a
                created dr.Node. */
        createInstance: function() {
            // If we ever need full arguments with new, see:
            // http://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible
            var parent = this.instanceParent, instanceClass = this.instanceClass;
            return parent ? new instanceClass(parent, arguments[0]) : new instanceClass();
        }
    });
});
