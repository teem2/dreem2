/** Provides an interface to platform specific VideoPlayer functionality. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        sprite = require('$SPRITE/sprite.js');
    
    module.exports = sprite.VideoPlayer = new JS.Class('sprite.VideoPlayer', require('./View.js'), {
        // Class Methods and Attributes ////////////////////////////////////////////
        extend: {
            /** A map of supported video event types. */
            EVENT_TYPES:{
                ondurationchange:true,
                ontimeupdate:true,
                onplay:true,
                onpause:true,
                onended:true
            }
        },
        
        
        // Life Cycle //////////////////////////////////////////////////////////////
        createPlatformObject: function(attrs) {
            attrs.ELEMENT_TYPE = 'video';
            return this.callSuper(attrs);
        },
        
        
        // Attributes //////////////////////////////////////////////////////////////
        set_poster: function(v) {
            this.platformObject.setAttribute('poster', v);
            return v;
        },
        
        set_controls: function(v) {
            this.platformObject.setAttribute('controls', v);
            return v;
        },
        
        set_autoplay: function(v) {
            this.platformObject.setAttribute('autoplay', v);
            return v;
        },
        
        set_loop: function(v) {
            this.platformObject.setAttribute('loop', v);
            return v;
        },
        
        set_volume: function(v) {
            this.platformObject.setAttribute('volume', v);
            return v;
        },
        
        set_preload: function(v) {
            this.platformObject.setAttribute('preload', v ? 'auto' : 'none');
            return v;
        },
        
        set_playing: function(v) {
            var po = this.platformObject;
            if (v) {
                if (po.play) po.play();
            } else {
                if (po.pause) po.pause();
            }
            return v;
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        getDuration: function() {
            return this.platformObject.duration;
        },
        
        getCurrentTime: function() {
            return this.platformObject.currentTime;
        },
        
        loadVideo: function(sources) {
            var po = this.platformObject;
            
            if (po.canPlayType && po.load) {
                this.view.setAttribute('playing', false);
                po.src = '';
                
                for (var type in sources) {
                    if (po.canPlayType(type)) {
                        po.src = sources[type];
                        po.load();
                        return type;
                    }
                }
            }
            return null
        },
        
        /** @overrides */
        createPlatformMethodRef: function(platformObserver, methodName, eventType) {
            return this.createStandardPlatformMethodRef(platformObserver, methodName, eventType, sprite.VideoPlayer) || 
                this.callSuper(platformObserver, methodName, type);
        }
    });
});
