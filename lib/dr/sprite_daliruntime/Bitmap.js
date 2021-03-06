/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/

/** Provides an interface to platform specific Bitmap functionality. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        sprite = require('$SPRITE/sprite.js');
    module.exports = sprite.Bitmap = new JS.Class('sprite.Bitmap', require('./View.js'), {
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
                var sprite = this;
                sprite.naturalWidth = 1;
                sprite.naturalHeight = 1;
                setTimeout(function() {
                    view.sendEvent('onload', {
                        width: 1,
                        height: 1
                    });
                }, 0);
            } else {
                s.backgroundImage = '';
                if (view.initing === false) {
                    setTimeout(function() {
                        view.sendEvent('onload', {
                            width: 0,
                            height: 0
                        });
                    }, 0);
                }
            }
            if (v.length > 0) this.platformObject.loadBitmap(v);
            else this.platformObject.unloadBitmap();
            return v;
        },
        set_window: function(v) {
            // The window is x,y,w,h
            var args = v.split(',', 4),
                s = this.styleObj;
            if (args.length !== 4) {
                s.backgroundPosition = '';
                this.windowWidth = this.windowHeight = undefined;
                if (this.__img) this.__updateViewSize();
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
            if (v === 'scale' || v === 'contain' || v === 'fit') {
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
});