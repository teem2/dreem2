/** A base class for animators and animator groups.
    
    Events:
        start:this Fired when the animation starts running.
        end:this Fired when the animation stops running.
        tick:this Fired each time the animation updates.
        running:boolean Fired when the animation starts or stops.
        paused:boolean Fired when the animation is paused or unpaused.
        reverse:boolean
        repeat:Fired when the animation repeats. The value is the current
            loop count.
        
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
        __delayProgress:number Used when the animation has a delay to track
            how much of the delay has gone by.
        __isPuppet:boolean Indicates if this animator is being puppeted by
            an animation group or not. Defaults to undefined which is
            equivalent to false.
        totalDuration:number The total duration of this animator if run.
*/
define(function(require, exports, module){
    var dr = require('$LIB/dr/dr.js');
    var JS = require('$LIB/jsclass.js');
    require('$LIB/dr/globals/GlobalIdle.js');
    
    module.exports = dr.AnimBase = new JS.Class('AnimBase', require('$LIB/dr/Node.js'), {
        include: [
            require('$LIB/dr/model/pool/Reusable.js')
        ],
        
        
        // Life Cycle //////////////////////////////////////////////////////////////
        /** @overrides dr.Node */
        initNode: function(parent, attrs) {
            this.duration = dr.AnimBase.DEFAULT_DURATION;
            this.reverse = this.paused = this.bounce = false;
            this.repeat = 1;
            this.delay = this.__sequenceDelay = 0;
            
            if (!parent.isA(dr.AnimBase)) {
                if (attrs.running === undefined) attrs.running = true;
            }
            
            var target = attrs.target;
            if (target && typeof target === 'string' && !this.isConstraintExpression(target)) {
                attrs.target = this.constraintify(target);
            }
            
            this.callSuper(parent, attrs);
            
            this.reset();
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        set_target: function(v) {this.setActual('target', v, 'object');},
        set_delay: function(v) {
            if (this.setActual('delay', v, 'number', 0)) {
                this.calculateTotalDuration();
            }
        },
        set_duration: function(v) {
            if (this.setActual('duration', v, 'number', dr.AnimBase.DEFAULT_DURATION)) {
                this.calculateTotalDuration();
            }
        },
        set_repeat: function(v) {
            if (this.setActual('repeat', v, 'number', 1)) {
                this.calculateTotalDuration();
            }
        },
        
        set_bounce: function(v) {this.setActual('bounce', v, 'boolean', false);},
        
        set_reverse: function(v) {
            if (this.setActual('reverse', v, 'boolean', false)) {
                if (!this.running) this.reset();
            }
        },
        
        set_running: function(v) {
            if (this.setActual('running', v, 'boolean', true)) {
                if (!this.paused) {
                    if (this.running) {
                        if (!this.__isPuppet) this.listenTo(dr.global.idle, 'onidle', '__update');
                        this.sendEvent('onstart', this);
                    } else {
                        this.reset();
                        if (!this.__isPuppet) this.stopListening(dr.global.idle, 'onidle', '__update');
                        this.sendEvent('onend', this);
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
        makePuppet: function(animGroup) {
            this.__isPuppet = true;
            //this.__master = animGroup;
        },
        
        /** @private */
        releasePuppet: function(animGroup) {
            this.__isPuppet = false;
            //this.__master = null;
        },
        
        /** @private */
        calculateTotalDuration: function() {
            if (this.repeat === 0) {
                return this.totalDuration = 0;
            } else if (this.repeat > 0) {
                return this.totalDuration = (this.delay + this.duration) * this.repeat;
            } else {
                return this.totalDuration = -1;
            }
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
            this.__cfg_duration = this.duration = dr.AnimBase.DEFAULT_DURATION;
            this.__cfg_reverse = this.__cfg_bounce = this.reverse = this.bounce = false;
            this.__cfg_repeat = this.repeat = 1;
            this.__cfg_delay = this.delay = 0;
            
            this.rewind(false);
        },
        
        /** @private */
        reset: function() {
            this.__loopCount = this.reverse ? this.repeat - 1 : 0;
            this.__progress = this.reverse ? this.duration : 0;
            this.__delayProgress = 0;
        },
        
        /** @private */
        __update: function(idleEvent) {
            this.__advance(idleEvent.delta);
            this.sendEvent('ontick', this);
        },
        
        /** @private */
        __advance: function(timeDiff) {
            if (this.running && !this.paused) {
                var reverse = this.reverse, 
                    duration = this.duration, 
                    repeat = this.repeat;
                
                var flip = this.bounce && this.__loopCount % 2 === 1;
                
                // Handle delay if necessary
                if (reverse === flip) {
                    var delay = this.delay + this.__sequenceDelay;
                    if (delay > 0 && delay > this.__delayProgress) {
                        this.__delayProgress += timeDiff;
                        timeDiff = this.__delayProgress - delay;
                        //if (0 >= timeDiff) return;
                        timeDiff = 0;
                    }
                }
                
                // An animation in reverse is like time going backward.
                if (reverse) timeDiff = timeDiff * -1;
                
                // Determine how much time to move forward by.
                var oldProgress = this.__progress;
                this.__progress += timeDiff;
                
                // Check for overage
                var remainderTime = 0;
                if (this.__progress > duration) {
                    remainderTime = this.__progress - duration;
                    this.__progress = duration;
                    this.__delayProgress = 0;
                    
                    // Increment loop count and halt looping if necessary
                    if (++this.__loopCount === repeat) remainderTime = 0;
                } else if (0 > this.__progress) {
                    // Reverse case
                    remainderTime = -this.__progress; // Flip reverse time back to forward time
                    this.__progress = 0;
                    this.__delayProgress = 0;
                    
                    // Decrement loop count and halt looping if necessary
                    if (0 > --this.__loopCount && repeat > 0) remainderTime = 0;
                }
                
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
                
                if (target) {
                    this.updateTarget(target, oldProgress, flip);
                    this.__continue(remainderTime);
                } else {
                    this.__abort();
                }
            }
        },
        
        updateTarget: function(target, oldProgress, flip) {
            // Subclasses to implement as needed.
        },
        
        /** @private */
        __continue: function(remainderTime) {
            var reverse = this.reverse, 
                duration = this.duration, 
                repeat = this.repeat;
            
            if (
                (!reverse && this.__loopCount === repeat) || // Forward check
                (reverse && 0 > this.__loopCount && repeat > 0) // Reverse check
            ) {
                // Stop animation since loop count exceeded repeat count.
                this.set_running(false);
                if (this.callback) this.callback.call(this, true, remainderTime);
            } else if (remainderTime > 0) {
                this.__repeat(remainderTime, reverse, duration);
            }
        },
        
        /** @private */
        __abort: function() {
            dr.sprite.console.log("No target found for animator.", this);
            this.set_running(false);
            if (this.callback) this.callback.call(this, false);
        },
        
        /** @private */
        __repeat: function(remainderTime, reverse, duration) {
            // Advance again if time is remaining. This occurs when
            // the timeDiff provided was greater than the animation
            // duration and the animation loops.
            this.sendEvent('onrepeat', this.__loopCount);
            this.__progress = reverse ? duration : 0;
            this.__advance(remainderTime);
        }
    });
    
    dr.AnimBase.DEFAULT_DURATION = 600;
});
