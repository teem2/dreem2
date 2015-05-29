/** Changes the value of an attribute on a target over time.
    
    Attributes:
        attribute:string The attribute to animate.
        from:number The starting value of the attribute. If not specified the 
            current value on the target will be used.
        to:number The ending value of the attribute.
        motion:string/function Controls the rate of animation.
            string: See http://easings.net/ for more info. One of the following:
                linear, 
                inQuad, outQuad, inOutQuad(default), 
                inCubic, outCubic, inOutCubic, 
                inQuart, outQuart, inOutQuart, 
                inQuint, outQuint, inOutQuint, 
                inSine, outSine, inOutSine,
                inExpo ,outExpo, inOutExpo, 
                inCirc, outCirc, inOutCirc,
                inElastic ,outElastic, inOutElastic, 
                inBack, outBack, inOutBack, 
                inBounce, outBounce, inOutBounce
            
            function: A function that determines the rate of change of the 
                attribute. The arguments to the easing function are:
                t: Animation progress in millis
                c: Value change (to - from)
                d: Animation duration in millis
        relative:boolean Determines if the animated value is set on the target 
            (false), or added to the exiting value on the target (true). Note
            that this means the difference between the from and to values
            will be "added" to the existing value on the target. The default 
            value is false.
    
    Private Attributes:
        __temporaryFrom:boolean Indicates no "from" was set on the animator so 
            we will have to generate one when needed. We want to reset back to 
            undefined after the animation completes so that subsequent calls 
            to start the animation will behave the same.
        __isColorAnim:boolean Indicates if this is a color property being
            animated.
*/
define(function(require, exports, module){
    var dr = require('$LIB/dr/dr.js');
    var JS = require('$LIB/jsclass.js');
    require('$LIB/dr/model/Color.js');
    
    module.exports = dr.Animator = new JS.Class('Animator', require('$LIB/dr/animation/AnimBase.js'), {
        // Life Cycle //////////////////////////////////////////////////////////////
        /** @overrides dr.AnimBase */
        initNode: function(parent, attrs) {
            this.motion = dr.Animator.DEFAULT_MOTION;
            this.relative = false;
            
            this.callSuper(parent, attrs);
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        set_attribute: function(v) {
            if (this.setActual('attribute', v, 'string')) {
                // FIXME: It would be better if we could inspect the type of
                // the attribute being animated
                v = this.attribute;
                this.__isColorAnim = v === 'bgcolor' || v === 'color';
            }
        },
        set_from: function(v) {
            // Allow colors or numbers
            var newValue = parseFloat(v);
            this.setActual('from', isNaN(newValue) ? v : newValue, '*');
        },
        set_to: function(v) {
            // Allow colors or numbers
            var newValue = parseFloat(v);
            this.setActual('to', isNaN(newValue) ? v : newValue, '*');
        },
        set_motion: function(v) {this.setActual('motion', v, 'motion');},
        set_relative: function(v) {this.setActual('relative', v, 'boolean', false);},
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @overrides */
        clean: function() {
            this.__cfg_to = this.__cfg_from = this.__cfg_attribute = this.to = this.from = this.attribute = undefined;
            this.__cfg_relative = this.relative = false;
            this.__cfg_motion = this.motion = dr.Animator.DEFAULT_MOTION;
            
            this.callSuper();
        },
        
        /** @overrides */
        reset: function() {
            this.__temporaryFrom = false;
            this.callSuper();
        },
        
        /** @overrides */
        updateTarget: function(target, oldProgress, flip) {
            var duration = this.duration, 
                attribute = this.attribute,
                isColorAnim = this.__isColorAnim;
            
            // Apply to attribute
            if (this.from == null) {
                this.__temporaryFrom = true;
                this.from = this.relative ? (isColorAnim ? 'black' : 0) : target.getAttribute(attribute);
            }
            
            if (isColorAnim) {
                this.__updateColor(target, oldProgress, flip, duration, attribute);
            } else {
                var from = this.from,
                    attributeDiff = this.to - from,
                    newValue = this.motion(flip ? duration - this.__progress : this.__progress, attributeDiff, duration);
                if (this.relative) {
                    // Need to calculate old value since it's possible for
                    // multiple animators to be animating the same attribute
                    // at one time.
                    var oldValue = this.motion(flip ? duration - oldProgress : oldProgress, attributeDiff, duration),
                        curValue = target.getAttribute(attribute);
                    target.setAttribute(attribute, curValue + newValue - oldValue);
                } else {
                    target.setAttribute(attribute, from + newValue);
                }
            }
        },
        
        /** @private */
        __updateColor: function(target, oldProgress, flip, duration, attribute) {
            var fromColor = dr.Color.makeColorFromHexOrNameString(this.from),
                fromRed = fromColor.red,
                fromGreen = fromColor.green,
                fromBlue = fromColor.blue;
            
            var toColor = dr.Color.makeColorFromHexOrNameString(this.to),
                toRed = toColor.red,
                toGreen = toColor.green,
                toBlue = toColor.blue;
            
            var redDiff = toRed - fromRed,
                greenDiff = toGreen - fromGreen,
                blueDiff = toBlue - fromBlue;
            
            var progress = this.__progress;
            var newRed = this.motion(flip ? duration - progress : progress, redDiff, duration),
                newGreen = this.motion(flip ? duration - progress : progress, greenDiff, duration),
                newBlue = this.motion(flip ? duration - progress : progress, blueDiff, duration);
            if (this.relative) {
                // Need to calculate old value since it's possible for
                // multiple animators to be animating the same attribute
                // at one time.
                var oldRed = this.motion(flip ? duration - oldProgress : oldProgress, redDiff, duration),
                    oldGreen = this.motion(flip ? duration - oldProgress : oldProgress, greenDiff, duration),
                    oldBlue = this.motion(flip ? duration - oldProgress : oldProgress, blueDiff, duration),
                    
                    curColor = dr.Color.makeColorFromHexOrNameString(target.getAttribute(attribute)),
                    curRed = curColor.red,
                    curGreen = curColor.green,
                    curBlue = curColor.blue;
                
                curColor.setRed(curRed + newRed - oldRed);
                curColor.setGreen(curGreen + newGreen - oldGreen);
                curColor.setBlue(curBlue + newBlue - oldBlue);
                
                target.setAttribute(attribute, curColor.getHtmlHexString());
            } else {
                fromColor.setRed(fromRed + newRed);
                fromColor.setGreen(fromGreen + newGreen);
                fromColor.setBlue(fromBlue + newBlue);
                
                target.setAttribute(attribute, fromColor.getHtmlHexString());
            }
        }
    });
    
    /*
     * TERMS OF USE - EASING EQUATIONS
     * 
     * Open source under the BSD License. 
     * 
     * Copyright © 2001 Robert Penner
     * All rights reserved.
     * 
     * Redistribution and use in source and binary forms, with or without modification, 
     * are permitted provided that the following conditions are met:
     * 
     * Redistributions of source code must retain the above copyright notice, this list of 
     * conditions and the following disclaimer.
     * Redistributions in binary form must reproduce the above copyright notice, this list 
     * of conditions and the following disclaimer in the documentation and/or other materials 
     * provided with the distribution.
     * 
     * Neither the name of the author nor the names of contributors may be used to endorse 
     * or promote products derived from this software without specific prior written permission.
     * 
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
     * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
     * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
     * COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
     * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
     * GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
     * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
     * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
     * OF THE POSSIBILITY OF SUCH DAMAGE. 
     *
     * ============================================================
     * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
     *
     * Open source under the BSD License.
     *
     * Copyright © 2008 George McGinley Smith
     * All rights reserved.
     * https://raw.github.com/danro/jquery-easing/master/LICENSE
     * ============================================================
     */
    dr.Animator.motionFunctions = {
        linear:function(t, c, d) {
            return c*(t/d);
        },
        inQuad:function(t, c, d) {
            return c*(t/=d)*t;
        },
        outQuad:function(t, c, d) {
            return -c *(t/=d)*(t-2);
        },
        inOutQuad:function(t, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t;
            return -c/2 * ((--t)*(t-2) - 1);
        },
        inCubic:function(t, c, d) {
            return c*(t/=d)*t*t;
        },
        outCubic:function(t, c, d) {
            return c*((t=t/d-1)*t*t + 1);
        },
        inOutCubic:function(t, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t*t;
            return c/2*((t-=2)*t*t + 2);
        },
        inQuart:function(t, c, d) {
            return c*(t/=d)*t*t*t;
        },
        outQuart:function(t, c, d) {
            return -c * ((t=t/d-1)*t*t*t - 1);
        },
        inOutQuart:function(t, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t*t*t;
            return -c/2 * ((t-=2)*t*t*t - 2);
        },
        inQuint:function(t, c, d) {
            return c*(t/=d)*t*t*t*t;
        },
        outQuint:function(t, c, d) {
            return c*((t=t/d-1)*t*t*t*t + 1);
        },
        inOutQuint:function(t, c, d) {
            if ((t/=d/2) < 1) return c/2*t*t*t*t*t;
            return c/2*((t-=2)*t*t*t*t + 2);
        },
        inSine: function (t, c, d) {
            return -c * Math.cos(t/d * (Math.PI/2)) + c;
        },
        outSine: function (t, c, d) {
            return c * Math.sin(t/d * (Math.PI/2));
        },
        inOutSine: function (t, c, d) {
            return -c/2 * (Math.cos(Math.PI*t/d) - 1);
        },
        inExpo: function (t, c, d) {
            return (t===0) ? 0 : c * Math.pow(2, 10 * (t/d - 1));
        },
        outExpo: function (t, c, d) {
            return (t===d) ? c : c * (-Math.pow(2, -10 * t/d) + 1);
        },
        inOutExpo: function (t, c, d) {
            if (t===0) return 0;
            if (t===d) return c;
            if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1));
            return c/2 * (-Math.pow(2, -10 * --t) + 2);
        },
        inCirc: function (t, c, d) {
            return -c * (Math.sqrt(1 - (t/=d)*t) - 1);
        },
        outCirc: function (t, c, d) {
            return c * Math.sqrt(1 - (t=t/d-1)*t);
        },
        inOutCirc: function (t, c, d) {
            if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1);
            return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1);
        },
        inElastic: function (t, c, d) {
            var s = 1.70158, p = 0, a = c;
            if (t===0) return 0;
            if ((t/=d)===1) return c;
            if (!p) p = d*.3;
            if (a < Math.abs(c)) {
                //a = c;
                s = p/4;
            } else {
                s = p/(2*Math.PI) * Math.asin(c/a);
            }
            return -(a*Math.pow(2,10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p));
        },
        outElastic: function (t, c, d) {
            var s = 1.70158, p = 0, a = c;
            if (t===0) return 0;
            if ((t/=d)===1) return c;
            if (!p) p = d*.3;
            if (a < Math.abs(c)) {
                //a = c;
                s = p/4;
            } else {
                s = p/(2*Math.PI) * Math.asin(c/a);
            }
            return a*Math.pow(2,-10*t) * Math.sin((t*d-s)*(2*Math.PI)/p) + c;
        },
        inOutElastic: function (t, c, d) {
            var s = 1.70158, p = 0, a = c;
            if (t===0) return 0;
            if ((t/=d/2)===2) return c;
            if (!p) p = d*(.3*1.5);
            if (a < Math.abs(c)) {
                //a = c;
                s = p/4;
            } else {
                s = p/(2*Math.PI) * Math.asin(c/a);
            }
            if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p));
            return a*Math.pow(2,-10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p)*.5 + c;
        },
        inBack: function (t, c, d, s) {
            if (s === undefined) s = 1.70158;
            return c*(t/=d)*t*((s+1)*t - s);
        },
        outBack: function (t, c, d, s) {
            if (s === undefined) s = 1.70158;
            return c*((t=t/d-1)*t*((s+1)*t + s) + 1);
        },
        inOutBack: function (t, c, d, s) {
            if (s === undefined) s = 1.70158; 
            if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s));
            return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2);
        },
        inBounce: function (t, c, d) {
            return c - dr.Animator.motionFunctions.outBounce(d-t, c, d);
        },
        outBounce: function (t, c, d) {
            if ((t/=d) < (1/2.75)) {
                return c*(7.5625*t*t);
            } else if (t < (2/2.75)) {
                return c*(7.5625*(t-=(1.5/2.75))*t + .75);
            } else if (t < (2.5/2.75)) {
                return c*(7.5625*(t-=(2.25/2.75))*t + .9375);
            } else {
                return c*(7.5625*(t-=(2.625/2.75))*t + .984375);
            }
        },
        inOutBounce: function (t, c, d) {
            if (t < d/2) return dr.Animator.motionFunctions.inBounce(t*2, c, d) * .5;
            return dr.Animator.motionFunctions.outBounce(t*2-d, c, d) * .5 + c*.5;
        }
    };
    
    /** Setup the default easing function. */
    dr.Animator.DEFAULT_MOTION = dr.Animator.motionFunctions.inOutQuad;
});
