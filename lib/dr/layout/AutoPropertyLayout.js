/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


/** A private layout used by the special value for width/height of 'auto'.
    This layout sizes the view to fit its child views. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js');
    
    module.exports = dr.AutoPropertyLayout = new JS.Class('AutoPropertyLayout', require('./Layout.js'), {
        // Life Cycle //////////////////////////////////////////////////////////////
        doAfterAdoption: function() {
            this.callSuper();
            this.listenTo(this.parent, 'onborder,onpadding', 'update');
        },
        
        // Attributes //////////////////////////////////////////////////////////////
        set_axis: function(v) {this.setActual('axis', v, 'string', 'x');},
        
        
        // Methods /////////////////////////////////////////////////////////////////
        startMonitoringSubview: function(view) {
            if (this.axis === 'x') {
                this.listenTo(view, 'onvisible,onboundsx,onboundswidth', 'update');
            } else {
                this.listenTo(view, 'onvisible,onboundsy,onboundsheight', 'update');
            }
        },
        
        stopMonitoringSubview: function(view) {
            if (this.axis === 'x') {
                this.stopListening(view, 'onvisible,onboundsx,onboundswidth', 'update');
            } else {
                this.stopListening(view, 'onvisible,onboundsy,onboundsheight', 'update');
            }
        },
        
        update: function() {
            if (!this.locked && this.axis) {
                // Prevent inadvertent loops
                this.locked = true;
                
                var svs = this.subviews,
                    i = svs.length,
                    maxFunc = Math.max,
                    parent = this.parent,
                    max = 0,
                    sv, val;
                if (this.axis === 'x') {
                    // Find the farthest horizontal extent of any subview
                    while (i) {
                        sv = svs[--i];
                        if (!this.__skipX(sv)) max = maxFunc(max, sv.boundsx + maxFunc(0, sv.boundswidth));
                    }
                    val = max + parent.__fullBorderPaddingWidth;
                    if (parent.width !== val) parent.setActualAttribute('width', val);
                } else{
                    // Find the farthest vertical extent of any subview
                    while (i) {
                        sv = svs[--i]
                        if (!this.__skipY(sv)) max = maxFunc(max, sv.boundsy + maxFunc(0, sv.boundsheight));
                    }
                    val = max + parent.__fullBorderPaddingHeight;
                    if (parent.height !== val) parent.setActualAttribute('height', val);
                }
                
                this.locked = false;
            }
        },
        
        /** No need to measure children that are not visible or that use a percent
            position or size since this leads to circular sizing constraints.
            Also skip children that use an align of bottom/right or center/middle
            since those also lead to circular sizing constraints.
            @private */
        __skipX: function(view) {
            return !view.visible || view.__isPercentConstraint_x || view.__isPercentConstraint_width || view.__noAutoForAlignConstraint_x;
        },
        
        /** @private */
        __skipY: function(view) {
            return !view.visible || view.__isPercentConstraint_y || view.__isPercentConstraint_height || view.__noAutoForAlignConstraint_y;
        }
    });
});
