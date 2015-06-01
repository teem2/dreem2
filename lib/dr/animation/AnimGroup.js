/** Runs multiple animators in sequence or in parallel.
    
    Attributes:
        sequential:boolean Determines if the child animators are run in
            sequence or in parallel. Defaults to false.
*/
define(function(require, exports, module){
    var dr = require('$LIB/dr/dr.js');
    var JS = require('$LIB/jsclass.js');
    
    module.exports = dr.AnimGroup = new JS.Class('AnimGroup', require('$LIB/dr/animation/AnimBase.js'), {
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
            
            this.callSuper(parent, attrs);
            
            this.__updateDuration();
            
            this.setAttribute('paused', origPaused);
            this.setAttribute('running', origRunning);
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        set_sequential: function(v) {
            if (this.setActual('sequential', v, 'boolean', false)) {
                this.__updateDuration();
            }
        },
        
        set_running: function(v) {
            this.callSuper(v);
            
            if (!this.initing) this.__notifyAnimators('running', this.running);
        },
        
        set_paused: function(v) {
            this.callSuper(v);
            
            if (this.inited) {
                v = this.paused;
                var animators = this.__animators, 
                    i = animators.length;
                while (i) animators[--i].setAttribute('paused', v);
            }
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
                    animator.__sequenceDelay = newDuration;
                    newDuration += animatorDuration;
                } else {
                    newDuration = Math.max(newDuration, animatorDuration);
                }
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
        updateTarget: function(target, oldProgress, flip) {
            var animators = this.__animators, i = animators.length,
                event = {delta:this.__progress - oldProgress};
            while (i) animators[--i].__update(event);
        },
        
        /** @private */
        __repeat: function(remainderTime, reverse, duration) {
            this.__notifyAnimators('running', false);
            this.__notifyAnimators('running', this.running);
            
            this.callSuper();
        }
    });
});
