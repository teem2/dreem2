/* Copyright 2015 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/

/** A mixin that sizes a root view to the viewport width, height or both.
    
    Events:
        None
    
    Attributes:
        minwidth:number the minimum width below which this view will not 
            resize its width. Defaults to 0.
        minheight:number the minimum height below which this view will not
            resize its height. Defaults to 0.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js');
    require('$LIB/dr/globals/GlobalViewportResize.js');
    
    module.exports = dr.SizeToViewport = new JS.Module('SizeToViewport', {
        include: [
            require('$LIB/dr/RootNode.js')
        ],
        
        
        // Life Cycle //////////////////////////////////////////////////////////////
        /** @overrides */
        initNode: function(parent, attrs) {
            this.minwidth = this.minheight = 0;
            this.callSuper(parent, attrs);
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        set_minwidth: function(v) {this.setActual('minwidth', v, 'number', 0);},
        set_minheight: function(v) {this.setActual('minheight', v, 'number', 0);}
    });
});
