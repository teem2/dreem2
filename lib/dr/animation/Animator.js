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
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js');
    require('$LIB/dr/model/Color.js');
    
    module.exports = dr.Animator = new JS.Class('Animator', require('$LIB/dr/animation/AnimBase.js'), {
        // Class Methods and Attributes ////////////////////////////////////////////
        extend: {
            // Attribute descriptions used in the editor
            attributes: {
              from: {
                type: 'expression',
                value: undefined,
                importance: 15,
              },
              to: {
                type: 'expression',
                value: undefined,
                importance: 16,
              },
              motion: {
                type: 'motion',
                value: 'inOutQuad',
                importance: 17,
              },
              attribute: {
                type: 'string',
                value: '',
                importance: 18,
              },
              relative: {
                type: 'boolean',
                value: false,
                importance: 19,
              }
            }
        },
        
        
        // Life Cycle //////////////////////////////////////////////////////////////
        /** @overrides dr.AnimBase */
        initNode: function(parent, attrs) {
            this.motion = dr.Animator.DEFAULT_MOTION;
            this.relative = false;
            
            this.__cfg_motion = 'inOutQuad';
            this.__cfg_relative = false;
            
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
            if (!this.__isPuppet && this.__temporaryFrom) this.from = undefined;
            this.__temporaryFrom = false;
            this.callSuper();
        },
        
        /** @overrides */
        updateTarget: function(target, progress, oldProgress, flip) {
            var relative = this.relative,
                delay = this.delay,
                duration = this.duration,
                progressPercent = Math.max(0, (progress - delay) / duration), 
                oldProgressPercent = Math.max(0, (oldProgress - delay) / duration);
            
            // Determine what "from" to use if none was provided.
            if (this.from == null) {
                this.__temporaryFrom = true;
                this.from = relative ? (this.__isColorAnim ? 'black' : 0) : target.getActualAttribute(this.attribute);
            }
            
            var motionValue = this.motion(progressPercent) - (relative ? this.motion(oldProgressPercent) : 0),
                value = relative ? target.getActualAttribute(this.attribute) : this.from;
            target.setAttribute(
                this.attribute,
                this.__isColorAnim ? this.__getColorValue(this.from, this.to, motionValue, relative, value) : value + ((this.to - this.from) * motionValue)
            );
        },
        
        /** @private */
        __getColorValue: function(from, to, motionValue, relative, value) {
            var C = dr.Color,
                fromColor = C.makeColorFromHexOrNameString(from),
                toColor = C.makeColorFromHexOrNameString(to),
                colorObj = relative ? C.makeColorFromHexOrNameString(value) : fromColor;
            colorObj.setRed(colorObj.red + ((toColor.red - fromColor.red) * motionValue));
            colorObj.setGreen(colorObj.green + ((toColor.green - fromColor.green) * motionValue));
            colorObj.setBlue(colorObj.blue + ((toColor.blue - fromColor.blue) * motionValue));
            return colorObj.getHtmlHexString();
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
        linear:function(t){return t;},
        inQuad:function(t){return t*t;},
        outQuad:function(t){return -t*(t-2);},
        inOutQuad:function(t){return (t/=0.5) < 1 ? 0.5*t*t : -0.5 * ((--t)*(t-2) - 1);},
        inCubic:function(t){return t*t*t;},
        outCubic:function(t){return ((t=t-1)*t*t + 1);},
        inOutCubic:function(t){return (t/=0.5) < 1 ? 0.5*t*t*t : 1 /2*((t-=2)*t*t + 2);},
        inQuart:function(t){return t*t*t*t;},
        outQuart:function(t){return -((t=t-1)*t*t*t - 1);},
        inOutQuart:function(t){return (t/=0.5) < 1 ? 0.5*t*t*t*t : -0.5 * ((t-=2)*t*t*t - 2);},
        inQuint:function(t){return t*t*t*t*t;},
        outQuint:function(t){return ((t=t-1)*t*t*t*t + 1);},
        inOutQuint:function(t){return (t/=0.5) < 1 ? 0.5*t*t*t*t*t : 0.5*((t-=2)*t*t*t*t + 2);},
        inSine:function(t){return - Math.cos(t * (Math.PI/2)) + 1;},
        outSine:function(t){return Math.sin(t * (Math.PI/2));},
        inOutSine:function(t){return -0.5 * (Math.cos(Math.PI*t) - 1);},
        inExpo:function(t){return (t==0)? 0: Math.pow(2, 10 * (t - 1));},
        outExpo:function(t){return (t==1)? 1: (-Math.pow(2, -10 * t) + 1);},
        inCirc:function(t){return - (Math.sqrt(1 - t*t) - 1);},
        outCirc:function(t){return Math.sqrt(1 - (t=t-1)*t);},
        inOutCirc:function(t){return (t/=0.5) < 1? -0.5 * (Math.sqrt(1 - t*t) - 1): 0.5 * (Math.sqrt(1 - (t-=2)*t) + 1);},
        inOutExpo:function(t){
            if (t==0) return 0;
            if (t==1) return 1;
            if ((t/=0.5) < 1) return 0.5 * Math.pow(2, 10 * (t - 1));
            return 0.5 * (-Math.pow(2, -10 * --t) + 2);
        },
        inElastic:function(t){
            var s=1.70158, p=0, a=1;
            if (t==0) return 0;
            if (t==1) return 1;
            if (!p) p=0.3;
            if (a < 1) {
                a=1; var s=p/4;
            } else {
                var s = p/(2*Math.PI) * Math.asin (1/a);
            }
            return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*1-s)*(2*Math.PI)/p));
        },
        
        outElastic:function(t){
            var s=1.70158, p=0, a=1;
            if (t==0) return 0;
            if (t==1) return 1;
            if (!p) p=1*0.3;
            if (a < 1) {
                a=1; var s=p/4;
            } else {
                var s = p/(2*Math.PI) * Math.asin (1/a);
            }
            return a*Math.pow(2,-10*t) * Math.sin((t*1-s)*(2*Math.PI)/p) + 1;
        },
        inOutElastic:function(t){
            var s=1.70158, p=0, a=1;
            if (t==0) return 0;
            if ((t/=0.5)==2) return 1;
            if (!p) p=(0.3*1.5);
            if (a < 1) {
                a=1; var s=p/4;
            } else {
                var s = p/(2*Math.PI) * Math.asin (1/a);
            }
            if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin((t*1-s)*(2*Math.PI)/p));
            return a*Math.pow(2,-10*(t-=1)) * Math.sin((t*1-s)*(2*Math.PI)/p)*0.5 + 1;
        },
        inBack:function(t, s){
            if (s == undefined) s = 1.70158;
            return (t/=1)*t*((s+1)*t - s);
        },
        outBack:function(t, s){
            if (s == undefined) s = 1.70158;
            return ((t=t/1-1)*t*((s+1)*t + s) + 1);
        },
        inOutBack:function(t, s){
            if (s == undefined) s = 1.70158;
            if ((t/=0.5) < 1) return 0.5*(t*t*(((s*=(1.525))+1)*t - s));
            return 0.5*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2);
        },
        inBounce:function(t){return 1 - dr.Animator.motionFunctions.outBounce (1-t);},
        outBounce:function(t){
            if (t < (1/2.75)) {
                return (7.5625*t*t);
            } else if (t < (2/2.75)) {
                return (7.5625*(t-=(1.5/2.75))*t + 0.75);
            } else if (t < (2.5/2.75)) {
                return (7.5625*(t-=(2.25/2.75))*t + 0.9375);
            }
            return (7.5625*(t-=(2.625/2.75))*t + .984375);
        },
        inOutBounce:function(t){
            if (t < 0.5) return dr.Animator.motionFunctions.inBounce (t*2) * 0.5;
            return motion.outBounce (t*2-1) * 0.5 + 0.5;
        }
    };
    
    /** Setup the default easing function. */
    dr.Animator.DEFAULT_MOTION = dr.Animator.motionFunctions.inOutQuad;
});
