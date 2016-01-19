/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


/** Runs multiple animators in sequence or in parallel.
    
    Attributes:
        sequential:boolean Determines if the child animators are run in
            sequence or in parallel. Defaults to false.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js');
    
    module.exports = dr.AnimGroup = new JS.Class('AnimGroup', require('$LIB/dr/animation/AnimBase.js'), {
        // Class Methods and Attributes ////////////////////////////////////////////
        extend: {
            // Attribute descriptions used in the editor
            attributes: {
              sequential: {
                type: 'boolean',
                value: false,
                category:'animation'
              }
            },
            
            readonlyattrs: {duration:true}
        },
        
        
        // Life Cycle //////////////////////////////////////////////////////////////
        /** @overrides dr.AnimBase */
        initNode: function(parent, attrs) {
            this.__animators = [];
            
            this.sequential = false;
            
            if (!parent.isA(dr.AnimBase)) {
                if (attrs.running === undefined) attrs.running = true;
            }
            var origRunning = attrs.running;
            attrs.running = false;
            
            var origPaused = attrs.paused;
            delete attrs.paused;
            
            // Support a pseudo attribute named "parallel" that is the
            // opposite of the real attribute "sequential".
            if (attrs.parallel !== undefined) {
                attrs.sequential = !(this.coerce('parallel', attrs.parallel, 'boolean', true));
                delete attrs.parallel;
            }
            
            this.callSuper(parent, attrs);
            
            this.__updateDuration();
            
            this.setAttribute('paused', origPaused);
            this.setAttribute('running', origRunning);
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        set_sequential: function(v) {
            if (this.setActual('sequential', v, 'boolean', false)) this.__updateDuration();
        },
        
        set_running: function(v) {
            this.callSuper(v);
            if (!this.initing) this.__notifyAnimators('running', this.running);
        },
        
        set_paused: function(v) {
            this.callSuper(v);
            if (!this.initing) this.__notifyAnimators('paused', this.paused);
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @private */
        __notifyAnimators: function(attrName, value) {
            var animators = this.__animators, 
                i = animators.length;
            while (i) animators[--i].setAttribute(attrName, value);
        },
        
        /** @private */
        __updateDuration: function() {
            var sequential = this.sequential,
                animators = this.__animators, 
                len = animators.length, 
                i = 0,
                animator,
                animatorDuration, 
                newDuration = 0;
            for (; len > i; i++) {
                animator = animators[i];
                animatorDuration = animator.totalDuration;
                if (sequential) {
                    animator.__puppetStart = newDuration;
                    newDuration += animatorDuration;
                } else {
                    animator.__puppetStart = 0;
                    newDuration = Math.max(newDuration, animatorDuration);
                }
                animator.__puppetEnd = animator.__puppetStart + animator.totalDuration;
            }
            
            this.setAttribute('duration', newDuration);
        },
        
        /** @overrides dr.Node */
        doSubnodeAdded: function(node) {
            this.callSuper();
            
            if (node.isA(dr.AnimBase)) {
                this.__animators.push(node);
                node.makePuppet(this);
                this.__updateDuration();
            }
        },
        
        /** @overrides dr.Node */
        doSubnodeRemoved: function(node) {
            if (node.isA(dr.AnimBase)) {
                var animators = this.__animators,
                    idx = animators.indexOf(node);
                if (idx !== -1) {
                    animators.splice(idx, 1);
                    node.releasePuppet(this);
                    this.__updateDuration();
                }
            }
            
            this.callSuper();
        },
        
        /** @overrides */
        clean: function() {
            this.__cfg_sequential = this.sequential = false;
            
            this.callSuper();
        },
        
        /** @overrides */
        updateTarget: function(target, progress, oldProgress, flip) {
            var delay = this.delay;
            
            progress = progress - delay;
            oldProgress = oldProgress - delay;
            
            var animators = this.__animators,
                len = animators.length,
                i = 0, 
                animator, 
                timeDiff = progress - oldProgress, 
                intersection;
            if (flip) {
                while (len) {
                    animator = animators[--len];
                    intersection = this.__getIntersection(progress, oldProgress, animator.__puppetStart, animator.__puppetEnd);
                    if (intersection >= 0) {
                        if (oldProgress >= animator.__puppetEnd) {
                            animator.sendEvent('onstart', animator);
                            animator.sendEvent('onloop', animator.__loopCount);
                        }
                        animator.__update({delta:intersection});
                        if (progress <= animator.__puppetStart) {
                            animator.sendEvent('onend', animator);
                        }
                    }
                }
            } else {
                for (; len > i; i++) {
                    animator = animators[i];
                    intersection = this.__getIntersection(oldProgress, progress, animator.__puppetStart, animator.__puppetEnd);
                    if (intersection >= 0) {
                        if (oldProgress <= animator.__puppetStart) {
                            animator.sendEvent('onstart', animator);
                            animator.sendEvent('onloop', animator.__loopCount);
                        }
                        animator.__update({delta:intersection});
                        if (progress >= animator.__puppetEnd) {
                            animator.sendEvent('onend', animator);
                        }
                    }
                }
            }
        },
        
        /** @private */
        doLoop: function(remainderTime, loopTime) {
            this.__notifyAnimators('running', false);
            this.__notifyAnimators('running', this.running);
            
            this.callSuper();
        },
        
        /** @private */
        __getIntersection: function(a1, a2, b1, b2) {
            var intersection = Math.min(a2, b2) - Math.max(a1, b1);
            if (intersection >= 0) return intersection;
            return -1;
        }
    });
});
