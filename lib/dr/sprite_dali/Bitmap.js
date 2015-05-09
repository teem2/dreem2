/** Provides an interface to platform specific Bitmap functionality. */
define(function(require, exports, module){
    var dr = require('$LIB/dr/dr.js');
    var JS = require('$LIB/jsclass.js');
    var global = require('$SPRITE/global.js');
    
    require('./View.js');
    
    dr.sprite.Bitmap = new JS.Class('sprite.Bitmap', dr.sprite.View, {
        // Life Cycle //////////////////////////////////////////////////////////////
        createPlatformObject: function(attrs) {
            var elem = this.callSuper(attrs);
            elem.style.backgroundSize = 'cover';
            return elem;
        },
        
        
        // Attributes //////////////////////////////////////////////////////////////
        set_src: function(v) {
            var s = this.styleObj,
                view = this.view;
            
            if (v) {
                s.backgroundImage = 'url("' + v + '")';
                s.backgroundRepeat = 'no-repeat';
                
                var img = this.__img;
                if (!img) img = this.__img = new Image();
                img.src = v;
                
                var sprite = this;
                img.onload = function() {
                    var w = img.width, h = img.height;
                    sprite.naturalWidth = w;
                    sprite.naturalHeight = h;
                    sprite.__updateViewSize();
                    // Delay so that src gets set on the view first
                    setTimeout(function() {view.sendEvent('onload', {width:w, height:h});}, 0);
                }
                img.onerror = function() {
                    sprite.naturalWidth = sprite.naturalHeight = undefined;
                    // Delay so that src gets set on the view first
                    setTimeout(function() {view.sendEvent('onerror', img);}, 0);
                }
            } else {
                s.backgroundImage = '';
                if (view.initing === false) {
                    // Delay so that src gets set on the view first
                    setTimeout(function() {view.sendEvent('onload', {width:0, height:0});}, 0);
                }
            }
            return v;
        },
        
        set_window: function(v) {
            // The window is x,y,w,h
            var args = v.split(',', 4),
                s = this.styleObj;
            if (args.length !== 4) {
                s.backgroundPosition = '';
                this.windowWidth = this.windowHeight = undefined;
            } else {
                var view = this.view,
                    x = args[0],
                    y = args[1],
                    w = this.windowWidth = args[2],
                    h = this.windowHeight = args[3];
                view.setAttribute('width', w);
                view.setAttribute('height', h);
                
                s.backgroundSize = '';
                s.backgroundPosition = (-x) + 'px ' + (-y) + 'px';
            }
            return v;
        },
        
        set_stretches: function(v) {
            var propValue;
            if (v === 'scale') {
              propValue = 'contain';
            } else if (v === 'true') {
              propValue = '100% 100%';
            } else {
              propValue = 'cover';
            }
            this.styleObj.backgroundSize = propValue;
            return v;
        },
        
        set_naturalsize: function(v) {
            this.naturalSize = v;
            if (this.__img) this.__updateViewSize();
            return v;
        },
        
        
        // Methods /////////////////////////////////////////////////////////////
        /** @private */
        __updateViewSize: function() {
            if (this.naturalSize) {
                var view = this.view,
                    w = this.naturalWidth,
                    h = this.naturalHeight,
                    ww = this.windowWidth,
                    wh = this.windowHeight;
                view.setAttribute('width', ww >= 0 ? ww : (w >= 0 ? w : 0));
                view.setAttribute('height', wh >= 0 ? wh : (h >= 0 ? h : 0));
            }
        }
    });
    
    module.exports = dr.sprite.Bitmap;
});
