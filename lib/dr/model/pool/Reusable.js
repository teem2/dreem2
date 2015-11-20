/* Copyright 2015 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


/** Objects that can be used in an dr.AbstractPool should use this mixin and 
    implement the "clean" method. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js');
    
    module.exports = dr.Reusable = new JS.Module('Reusable', {
        // Methods /////////////////////////////////////////////////////////////////
        /** Puts this object back into a default state suitable for storage in
            an dr.AbstractPool
            @returns void */
        clean: function() {}
    });
});
