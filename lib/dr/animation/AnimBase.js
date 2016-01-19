/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


/** A base class for animators and animator groups.
    
    Animation Progress:
        Expected Behavior for combinations of bounce, reverse and repeat. Loop
        count starts at 0 for forward motion and increases. For reverse motion
        the loop count starts at the repeat value minus one. Negative repeat
        values (which indicate infinite looping) always start at 0 regardless of
        direction of motion.
        
        In the tables below, 
            --> indicates "regular" animation progess which is from the "from" 
            to the "to" value of the animation as time increases. 
            
            <-- indicates "flipped" animation progress which is from the "to" 
            to the "from" value of the animation as time increases.
            
            Loop counts are organized so that time proceeds from top to bottom.
        
        Even repeat values (2, 4, 6, ...):
            
                   | Forward (loop) | Reverse (loop) |
            -------+----------------+----------------+
            Normal |     --> (0)    |     <-- (1)    |
                   |     --> (1)    |     <-- (0)    |
            -------+----------------+----------------+
            Bounce |     --> (0)    |     <-- (1)    |
                   |     <-- (1)    |     --> (0)    |
            -------+----------------+----------------+
        
        Odd repeat values (1, 3, 5, ...):
            
                   | Forward (loop) | Reverse (loop) |
            -------+----------------+----------------+
            Normal |     --> (0)    |     <-- (2)    |
                   |     --> (1)    |     <-- (1)    |
                   |     --> (2)    |     <-- (0)    |
            -------+----------------+----------------+
            Bounce |     --> (0)    |     <-- (2)    |
                   |     <-- (1)    |     --> (1)    |
                   |     --> (2)    |     <-- (0)    |
            -------+----------------+----------------+
    
    Delay is always at the "front" of an animation. This means if an animation
    is flipped the delay will happen at the end of the animation loop.
    
    Events:
        onstart:this Fired when the animation starts running.
        onend:this Fired when the animation stops running.
        ontick:this Fired each time the animation updates.
        onloop:Fired when the animation repeats. The value is the current
            loop count.
        running:boolean Fired when the animation starts or stops.
        paused:boolean Fired when the animation is paused or unpaused.
        
    Attributes:
        target:object The object to animate the attribute on. The default is 
            the parent of this node.
        duration:number The length of time the animation will run in millis.
        delay:number The length of time before the animation begins updating.
            The default is 0.
        repeat:number The number of times to repeat the animation. If negative 
            the animation will repeat forever. The default value is 1.
        reverse:boolean If true, the animation is run in reverse.
        bounce:boolean If true, each loop alternates between forward and
            reverse. Defaults to false.
        running:boolean Indicates if the animation is currently running. The 
            default value is true.
        paused:boolean Indicates if the animation is temporarily paused. The 
            default value is false.
        callback:function A function that gets called when the animation
            completes. A boolean value is passed into the function and will be
            true if the animation completed successfully or false if not.
    
    Private Attributes:
        __loopCount:number the loop currently being run.
        __progress:number the number of millis currently used during the
            current animation loop.
        __loopTime:number The total time for a single loop of the animation.
        __isPuppet:boolean Indicates if this animator is being puppeted by
            an animation group or not. Defaults to undefined which is
            equivalent to false.
        totalDuration:number The total duration of this animator if run.
        __puppetStart:number When this animator starts animating when
            puppeted.
        __puppetEnd:number When this animator stops animating when
            puppeted.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        sprite = require('$SPRITE/sprite.js');
    require('$LIB/dr/globals/GlobalIdle.js');
    
    module.exports = dr.AnimBase = new JS.Class('AnimBase', require('$LIB/dr/Node.js'), {
        include: [
            require('$LIB/dr/model/pool/Reusable.js')
        ],
        
        
        // Class Methods and Attributes ////////////////////////////////////////////
        extend: {
            // Attribute descriptions used in the editor
            attributes: {
              delay: {
                type: 'number',
                value: 0,
                category:'animation'
              },
              duration: {
                type: 'number',
                value: 600, // Should be the same as dr.AnimBase.DEFAULT_DURATION
                category:'animation'
              },
              repeat: {
                type: 'number',
                category:'animation'
              },
              
              reverse: {
                type: 'boolean',
                value: false,
                category:'animation'
              },
              bounce: {
                type: 'boolean',
                value: false,
                weight:1,
                category:'animation'
              }/*,
              FIXME: need a mechanism to trigger play/stop and pause for animations
              running: {
                type: 'boolean',
                value: true,
                 category:'animation'
              },
              paused: {
                type: 'boolean',
                value: false,
                 category:'animation'
              }*/
            }
        },
        
        
        // Life Cycle //////////////////////////////////////////////////////////////
        /** @overrides dr.Node */
        initNode: function(parent, attrs) {
            // Initialize default values to reduce setter calls during initialization
            this.duration = this.totalDuration = this.__loopTime = dr.AnimBase.DEFAULT_DURATION;
            this.reverse = this.paused = this.bounce = false;
            this.repeat = 1;
            this.delay = 0;
            
            // Initialize __cfg_ values too
            this.__cfg_duration = dr.AnimBase.DEFAULT_DURATION;
            this.__cfg_reverse = this.__cfg_bounce = false;
            this.__cfg_repeat = 1;
            this.__cfg_delay = 0;
            
            // Running default to true if not in an AnimGroup.
            if (!parent.isA(dr.AnimBase)) {
                if (attrs.running === undefined) attrs.running = true;
            }
            
            var target = attrs.target;
            if (target && typeof target === 'string' && !this.isConstraintExpression(target)) {
                attrs.target = this.constraintify(target);
            }
            
            this.callSuper(parent, attrs);
            
            this.reset();
            
            if (this.running && !this.__isPuppet) {
                this.sendEvent('onstart', this);
                this.sendEvent('onloop', this.__loopCount);
            }
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        set_target: function(v) {this.setActual('target', v, 'object');},
        
        get_target: function() {
            var target = this.target;
            if (!target) {
                target = this.parent;
                if (target.isA(dr.AnimBase)) {
                    this.searchAncestors(function(n) {
                        if (n.target) {
                            target = n.target;
                            return true;
                        }
                        
                        if (!n.isA(dr.AnimBase)) {
                            target = n;
                            return true;
                        }
                        
                        return false;
                    });
                }
            }
            return target;
        },
        
        set_delay: function(v) {
            if (this.setActual('delay', v, 'number', 0)) {
                this.__calculateLoopTime();
                this.__calculateTotalDuration();
            }
        },
        set_duration: function(v) {
            if (this.setActual('duration', v, 'number', dr.AnimBase.DEFAULT_DURATION)) {
                this.__calculateLoopTime();
                this.__calculateTotalDuration();
            }
        },
        set_repeat: function(v) {
            if (this.setActual('repeat', v, 'number', 1)) {
                this.__calculateTotalDuration();
            }
        },
        
        set_bounce: function(v) {this.setActual('bounce', v, 'boolean', false);},
        
        set_reverse: function(v) {
            if (this.setActual('reverse', v, 'boolean', false)) {
                if (!this.running) this.reset();
            }
        },
        
        get_reverse: function() {
            var reverse = this.reverse;
            if (this.parent && this.parent.isA(dr.AnimBase)) {
                if (reverse) {
                    return !this.parent.__isFlipped();
                } else {
                    return this.parent.__isFlipped();
                }
            }
            return reverse;
        },
        
        set_running: function(v) {
            if (this.setActual('running', v, 'boolean', true)) {
                if (!this.paused) {
                    if (this.running) {
                        if (!this.__isPuppet) {
                            this.listenTo(dr.global.idle, 'onidle', '__update');
                            if (!this.initing) {
                                this.sendEvent('onstart', this);
                                this.sendEvent('onloop', this.__loopCount);
                            }
                        }
                    } else {
                        this.reset();
                        if (!this.__isPuppet) {
                            this.stopListening(dr.global.idle, 'onidle', '__update');
                            if (!this.initing) {
                                this.sendEvent('onend', this);
                            }
                        }
                    }
                }
            }
        },
        
        set_paused: function(v) {
            if (this.setActual('paused', v, 'boolean', false)) {
                if (this.running) {
                    if (!this.__isPuppet) {
                        if (this.paused) {
                            this.stopListening(dr.global.idle, 'onidle', '__update');
                        } else {
                            this.listenTo(dr.global.idle, 'onidle', '__update');
                        }
                    }
                }
            }
        },
        
        set_callback: function(v) {this.setSimpleActual('callback', v);},
        
        
        // Methods /////////////////////////////////////////////////////////////////
        pause: function() {this.setAttribute('paused', true);},
        resume: function() {this.setAttribute('paused', false);},
        
        stop: function() {this.setAttribute('running', false);},
        play: function() {this.setAttribute('running', true);},
        
        /** @private */
        makePuppet: function(animGroup) {this.__isPuppet = true;},
        
        /** @private */
        releasePuppet: function(animGroup) {this.__isPuppet = false;},
        
        /** @private */
        __calculateLoopTime: function() {
            this.__loopTime = this.delay + this.duration;
        },
        
        /** @private */
        __calculateTotalDuration: function() {
            if (this.repeat === 0) {
                this.totalDuration = 0;
            } else if (this.repeat > 0) {
                this.totalDuration = this.__loopTime * this.repeat;
            } else {
                this.totalDuration = -1;
            }
            
            // Notify parent animation
            if (this.__isPuppet) this.parent.__updateDuration();
        },
        
        /** A convienence method to set the callback to run when the animator
            stops running. If a callback already exists the provided callback
            will be executed after the existing one.
            @param callback:function the function to run.
            @param replace:boolean (optional) if true the existing callback will 
                be replaced with the new callback.
            @returns void */
        next: function(callback, replace) {
            var existingCallback = this.callback;
            if (existingCallback && !replace) {
                var anim = this;
                this.set_callback(function(success, remainderTime) {
                    existingCallback.call(anim, success, remainderTime);
                    callback.call(anim, success, remainderTime);
                });
            } else {
                this.set_callback(callback);
            }
        },
        
        /** Puts the animator back to an initial configured state.
            @param executeCallback:boolean (optional) if true the callback, if
                it exists, will be executed.
            @returns void */
        rewind: function(executeCallback) {
            this.reset();
            
            this.set_running(false);
            this.set_paused(false);
            
            if (executeCallback && this.callback) this.callback.call(this, false);
        },
        
        /** @overrides dr.Reusable */
        clean: function() {
            this.__cfg_callback = this.callback = undefined;
            this.__cfg_duration = this.duration = this.totalDuration = dr.AnimBase.DEFAULT_DURATION;
            this.__cfg_reverse = this.__cfg_bounce = this.reverse = this.bounce = false;
            this.__cfg_repeat = this.repeat = 1;
            this.__cfg_delay = this.delay = 0;
            
            this.rewind(false);
        },
        
        /** @private */
        reset: function() {
            this.__loopCount = this.getActualAttribute('reverse') && this.repeat > 0 ? this.repeat - 1 : 0;
            this.__resetProgress();
        },
        
        /** @private */
        __resetProgress: function() {
            this.__progress = this.__isFlipped() ? this.__loopTime : 0;
        },
        
        /** @private */
        __isFlipped: function() {
            if (this.bounce) {
                if (this.getActualAttribute('reverse')) {
                    if (this.repeat % 2 === 0) {
                        return this.__loopCount % 2 !== 0;
                    } else {
                        return this.__loopCount % 2 === 0;
                    }
                } else {
                    return this.__loopCount % 2 !== 0;
                }
            } else {
                return this.getActualAttribute('reverse');
            }
        },
        
        /** @private */
        __update: function(idleEvent) {
            this.__advance(idleEvent.delta);
            this.sendEvent('ontick', this);
        },
        
        /** @private */
        __advance: function(timeDiff) {
            if (this.running && !this.paused) {
                var reverse = this.getActualAttribute('reverse'), 
                    duration = this.duration,
                    loopTime = this.__loopTime,
                    delay = this.delay,
                    repeat = this.repeat,
                    remainderTime,
                    flip = this.__isFlipped(),
                    oldProgress = this.__progress,
                    target = this.getActualAttribute('target');
                
                // An animation in reverse is like time going backward.
                this.__progress += flip ? -timeDiff : timeDiff;
                
                // Check for overage
                var loopIncr;
                if (this.__progress > loopTime) {
                    remainderTime = this.__calculateRemainder(reverse, repeat, this.__progress - loopTime);
                    loopIncr = reverse ? -1 : 1;
                    this.__progress = loopTime;
                } else if (0 > this.__progress) {
                    remainderTime = this.__calculateRemainder(reverse, repeat, -this.__progress);
                    loopIncr = reverse ? -1 : 1;
                    this.__progress = 0;
                } else {
                    remainderTime = 0;
                    loopIncr = 0;
                }
                
                if (target) {
                    this.updateTarget(target, this.__progress, oldProgress, flip);
                    
                    this.__loopCount += loopIncr;
                    
                    if (
                        (!reverse && this.__loopCount === repeat) || // Forward done check
                        (reverse && 0 > this.__loopCount && repeat > 0) // Reverse done check
                    ) {
                        this.set_running(false);
                        if (this.callback) this.callback.call(this, true, remainderTime);
                    } else if (remainderTime > 0) {
                        this.doLoop(remainderTime, loopTime);
                    }
                } else {
                    sprite.console.warn("No target found for animator.", this);
                    this.set_running(false);
                    if (this.callback) this.callback.call(this, false);
                }
            }
        },
        
        /** @private */
        __calculateRemainder: function(reverse, repeat, remainderTime) {
            if (reverse) {
                if (0 > this.__loopCount - 1 && repeat > 0) return 0;
            } else {
                if (this.__loopCount + 1 === repeat) return 0;
            }
            return remainderTime;
        },
        
        updateTarget: function(target, progress, oldProgress, flip) {
            // Subclasses to implement as needed.
        },
        
        /** @private */
        doLoop: function(remainderTime, loopTime) {
            // Advance again if time is remaining. This occurs when
            // the timeDiff provided was greater than the animation
            // duration and the animation loops.
            this.sendEvent('onloop', this.__loopCount);
            this.__resetProgress();
            this.__advance(remainderTime);
        }
    });
    
    dr.AnimBase.DEFAULT_DURATION = 600;
});
