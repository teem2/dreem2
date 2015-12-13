/* Copyright 2015 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


/** Provides an interface to platform specific View functionality.
    
    Attributes:
        view:dr.SpritBacked A reference to the view that is backed by
            this sprite.
        platformObject:object The platform specific object. In this case
            a dom element.
        styleObj:object A reference to the style property object of the
            dom element.
    
    Private Attributes:
        __clickable:boolean Indicates if this sprite is currently click/touch
            enabled.
        __clip:boolean Indicates if this sprite is currently clipped.
        __scrollable:boolean Indicates if this sprite is currently scrollable.
        __BP_TOGGLE:boolean Used in the webkit position hack to ensure each
            perturbation is opposite to the previous one.
*/
// browser version
define(function(require, exports, module) {
    var JS = require('$LIB/jsclass.js'),
        dr = require('$LIB/dr/dr.js'),
        globalScope = require('$SPRITE/global.js'),
        sprite = require('$SPRITE/sprite.js');
    
    module.exports = sprite.View = new JS.Class('sprite.View', {
        include: [
            require('$LIB/dr/Destructible.js'),
            require('$SPRITE/events/PlatformObservable.js'),
            require('$SPRITE/events/ScrollObservable.js'),
            require('$SPRITE/events/KeyObservable.js'),
            require('$SPRITE/events/MouseObservable.js'),
            require('$SPRITE/events/FocusObservable.js'),
            require('$SPRITE/events/DropObservable.js')
        ],
        
        
        // Class Methods and Attributes ////////////////////////////////////////////
        extend: {
            CSS_USER_SELECT:sprite.platform.prefix.css + 'user-select',
            CSS_BACKFACE_VISIBILITY:sprite.platform.prefix.css + 'backface-visibility'
        },
        
        // Constructor /////////////////////////////////////////////////////////////
        /** The standard JSClass initializer function. Subclasses should not
            override this function.
            @param view:dr.View The view this sprite is backing.
            @param attrs:object A map of attribute names and values.
            @returns void */
        initialize: function(view, attrs) {
            this.view = view;
            var po = this.platformObject = this.createPlatformObject(attrs || {});
            po.model = this;
            this.styleObj = po.style;
        },
        
        
        // Life Cycle //////////////////////////////////////////////////////////////
        createPlatformObject: function(attrs) {
            var elementType = 'div';
            if (attrs.ELEMENT_TYPE) {
                elementType = attrs.ELEMENT_TYPE;
                delete attrs.ELEMENT_TYPE;
            }
            
            var document = globalScope.document,
                elem = document.createElement(elementType),
                s = elem.style;
            s.position = 'absolute';
            s.pointerEvents = s[sprite.View.CSS_USER_SELECT] = 'none';
            s.borderStyle = 'solid';
            s.borderColor = s.backgroundColor = 'transparent';
            s.padding = s.margin = s.borderWidth = '0px';
            s.boxSizing = 'border-box';
            
            // WORKAROUND: Fixes DREEM-104070749 on chrome where setting 
            // overflow to hidden during runtime can cause incomplete repainting 
            // of the sprite.
            s[sprite.View.CSS_BACKFACE_VISIBILITY] = 'hidden';
            
            // Necessary since x and y of 0 won't update deStyle so this gets
            // things initialized correctly. Without this root views will have
            // an incorrect initial position for x or y of 0.
            s.marginLeft = s.marginTop = '0px';
            // Store a reference back to the view, e.g. for mouse events
            elem.$view = this;
            
            // Root views need to be attached to an existing dom element
            if (this.view.isA(dr.RootNode)) document.getElementsByTagName('body')[0].appendChild(elem);
            
            return elem;
        },
        
        destroy: function() {
            delete this.platformObject.model;
            this.detachAllPlatformObservers();
            this.callSuper();
        },
        
        
        // Attributes //////////////////////////////////////////////////////////////
        set_x: function(v) {
            if (this.view.visible) this.styleObj.marginLeft = v + 'px';
            return v;
        },
        
        set_y: function(v) {
            if (this.view.visible) this.styleObj.marginTop = v + 'px';
            return v;
        },
        
        set_width: function(v) {
            this.styleObj.width = v + (v !== 'auto' ? 'px' : '');
            return v;
        },
        
        set_height: function(v, supressEvent) {
            this.styleObj.height = v + (v !== 'auto' ? 'px' : '');
            return v;
        },
        
        set_bgcolor: function(v) {
            this.styleObj.backgroundColor = v;
            return v;
        },
        
        set_color: function(v) {
            this.styleObj.color = v || 'inherit';
            return v;
        },
        
        set_opacity: function(v) {
            this.styleObj.opacity = v;
            return v;
        },
        
        set_visible: function(v) {
            var s = this.styleObj;
            s.visibility = v ? '' : 'hidden';
            
            // Move invisible elements to a very negative location so they won't
            // effect scrollable area. Ideally we could use display:none but we
            // can't because that makes measuring bounds not work.
            s.marginLeft = v ? this.view.x + 'px' : '-100000px';
            s.marginTop = v ? this.view.y + 'px' : '-100000px';
            return v;
        },
        
        set_cursor: function(v) {
            this.styleObj.cursor = v || 'auto';
            return v;
        },
        
        set_clickable: function(v) {
            this.__clickable = v;
            this.__updatePointerEvents();
            return v;
        },
        
        set_clip: function(v) {
            this.__clip = v;
            this.__updateOverflow();
            return v;
        },
        
        set_scrollx: function(v) {
            if (this.platformObject.scrollLeft !== v) this.platformObject.scrollLeft = v;
            return v;
        },
        
        set_scrolly: function(v) {
            if (this.platformObject.scrollTop !== v) this.platformObject.scrollTop = v;
            return v;
        },
        
        set_scrollable: function(v) {
            this.__scrollable = v;
            this.__updateOverflow();
            this.__updatePointerEvents();
            return v;
        },
        
        // Borders //
        set_bordercolor: function(v) {
            this.styleObj.borderColor = v;
            return v;
        },
        
        set_borderstyle: function(v) {
            this.styleObj.borderStyle = v;
            return v;
        },
        
        set_border: function(v) {
            this.styleObj.borderWidth = v + 'px';
            return v;
        },
        
        set_topborder: function(v) {
            this.styleObj.borderTopWidth = v + 'px';
            if (sprite.platform.prefix.dom === 'WebKit') this.__WebkitPositionHack();
            return v;
        },
        
        set_bottomborder: function(v) {
            this.styleObj.borderBottomWidth = v + 'px';
            return v;
        },
        
        set_leftborder: function(v) {
            this.styleObj.borderLeftWidth = v + 'px';
            return v;
        },
        
        set_rightborder: function(v) {
            this.styleObj.borderRightWidth = v + 'px';
            return v;
        },
        
        // Padding //
        set_padding: function(v) {
            this.styleObj.padding = v + 'px';
            return v;
        },
        
        set_toppadding: function(v) {
            this.styleObj.paddingTop = v + 'px';
            if (sprite.platform.prefix.dom === 'WebKit') this.__WebkitPositionHack();
            return v;
        },
        
        set_bottompadding: function(v) {
            this.styleObj.paddingBottom = v + 'px';
            return v;
        },
        
        set_leftpadding: function(v) {
            this.styleObj.paddingLeft = v + 'px';
            return v;
        },
        
        set_rightpadding: function(v) {
            this.styleObj.paddingRight = v + 'px';
            return v;
        },
        
        // Corner Radius
        set_cornerradius: function(v) {
            this.styleObj.borderRadius = v + 'px';
            return v;
        },
        
        set_topleftcornerradius: function(v) {
            this.styleObj.borderTopLeftRadius = v + 'px';
            return v;
        },
        
        set_toprightcornerradius: function(v) {
            this.styleObj.borderTopRightRadius = v + 'px';
            return v;
        },
        
        set_bottomleftcornerradius: function(v) {
            this.styleObj.borderBottomLeftRadius = v + 'px';
            return v;
        },
        
        set_bottomrightcornerradius: function(v) {
            this.styleObj.borderBottomRightRadius = v + 'px';
            return v;
        },
        
        // Shadows
        /** Sets the CSS boxShadow property.
            @param v:array where index 0 is the horizontal shadow offset,
                index 1 is the vertical shadow offset, index 2 is the blur amount,
                index 3 is the spread amount and index 4 is the color.
            @returns void */
        set_boxshadow: function(v) {
            this.styleObj.boxShadow = v ? (v[0] || 0) + 'px ' + (v[1] || 0) + 'px ' + (v[2] || 4) + 'px ' + (v[3] || 0) + 'px ' + (v[4] || 'rgba(0,0,0,0.5)') : 'none';
            return v;
        },
        
        // Gradients
        set_gradient: function(v) {
            var s = this.styleObj;
            
            if (v) {
                // Determine type
                var type = v[0];
                if (type === 'linear' || type === 'radial') {
                    v.shift();
                } else {
                    type = 'linear';
                }
                
                // Determine geometry of the gradient
                var geometry = v[0];
                if (type === 'radial') {
                    if (geometry) {
                        if (geometry === 'cover' || geometry === 'farthest-corner') {
                            geometry = 'farthest-corner';
                        } else {
                            geometry = 'closest-side';
                        }
                        v.shift();
                    } else {
                        geometry = 'closest-side';
                    }
                    geometry = 'circle ' + geometry;
                } else {
                    if (typeof geometry === 'number') {
                        geometry = geometry + 'deg';
                        v.shift();
                    } else if (geometry) {
                        geometry = 'to ' + geometry;
                        v.shift();
                    } else {
                        geometry = '0deg';
                    }
                }
                
                // Use colors that may have already been configured if less
                // than 2 color stops are provided
                function pushColor(color) {
                    v.push(color && color !== 'inherit' ? color : 'transparent');
                };
                if (v.length < 2) pushColor(s.color);
                if (v.length < 2) pushColor(s.backgroundColor);
                
                s.background = type + '-gradient(' + geometry + ', ' + v.join(', ') + ')';
            } else {
                s.background = 'none';
            }
            return v;
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @private */
        __WebkitPositionHack: function() {
            // WORKAROUND: Chrome and Safari (Webkit?) browsers only update position on
            // borderLeftWidth and paddingLeft change. Fix is to tweak the padding 
            // by +/- a small value to trigger a change but prevent value drift.
            // 
            // Perturb smaller since the browser appears to do a ceiling for
            // calculating the DOM element scrollLeft. This will give the expected
            // value whereas pertubing larger would give a value 1 greater than
            // expected for scrollLeft.
            var perturb = (this.__BP_TOGGLE = !this.__BP_TOGGLE) ? -0.001 : 0.001, 
                s = this.styleObj, 
                v = s.paddingLeft;
            s.paddingLeft = Number(v.substring(0, v.length - 2)) + perturb + 'px'
        },
        
        /** @private */
        __updateOverflow: function() {
            var v = '';
            if (this.__scrollable) {
                v = 'auto';
            } else if (this.__clip) {
                v = 'hidden';
            }
            this.styleObj.overflow = v;
        },
        
        /** @private */
        __updatePointerEvents: function() {
            this.styleObj.pointerEvents = this.__clickable || this.__scrollable ? 'auto' : 'none';
        },
        
        getScrollX: function() {
            return this.platformObject.scrollLeft;
        },
        
        getScrollY: function() {
            return this.platformObject.scrollTop;
        },
        
        getScrollWidth: function() {
            return this.platformObject.scrollWidth;
        },
        
        getScrollHeight: function() {
            return this.platformObject.scrollHeight;
        },
        
        appendSprite: function(sprite) {
            this.platformObject.appendChild(sprite.platformObject);
        },
        
        removeSprite: function(sprite) {
            this.platformObject.removeChild(sprite.platformObject);
        },
        
        /** Sets the inner html of the dom element backing this sprite.
            @runtime browser */
        setInnerHTML: function(html) {
            this.platformObject.innerHTML = html;
        },
        
        /** Gets the inner html of the dom element backing this sprite.
            @runtime browser */
        getInnerHTML: function() {
            return this.platformObject.innerHTML;
        },
        
        /** Gets the x and y position of the dom element relative to the 
            ancestor dom element or the page. Transforms are not supported.
            @param ancestorView:View (optional) An ancestor View
                that if encountered will halt the page position calculation
                thus giving the position relative to ancestorView.
            @returns object with 'x' and 'y' keys or null if an error has
                occurred. */
        getAbsolutePosition: function(ancestorView) {
            var elem = this.platformObject,
                ancestorElem = ancestorView ? ancestorView.sprite.platformObject : null,
                x = 0, y = 0, 
                s = sprite.__getComputedStyle(elem),
                borderMultiplier = sprite.platform.browser === 'Firefox' ? 0 : 1; // I have no idea why firefox doesn't need it, but it doesn't.
            
            // elem.nodeName !== "BODY" test prevents looking at the body
            // which causes problems when the document is scrolled on webkit.
            while (elem && elem.nodeName !== "BODY" && elem !== ancestorElem) {
                x += parseFloat(s.marginLeft);
                y += parseFloat(s.marginTop);
                
                elem = elem.offsetParent;
                if (elem && elem.nodeName !== "BODY") {
                    s = sprite.__getComputedStyle(elem);
                    x += borderMultiplier * parseInt(s.borderLeftWidth, 10) - elem.scrollLeft + parseFloat(s.paddingLeft);
                    y += borderMultiplier * parseInt(s.borderTopWidth, 10) - elem.scrollTop + parseFloat(s.paddingTop);
                }
            }
            
            return {x:x, y:y};
        },
        
        /** Gets the bounding rect object with enties: x, y, width and height. */
        getBounds: function() {
            return this.platformObject.getBoundingClientRect();
        },
        
        /** Gets an array of ancestor platform objects including the platform
            object for this sprite.
            @param ancestor (optional) The platform element to stop
                getting ancestors at.
            @returns an array of ancestor elements. */
        getAncestorArray: function(ancestor) {
            var ancestors = [],
                elem = this.platformObject
            while (elem) {
                ancestors.push(elem);
                if (elem === ancestor) break;
                elem = elem.parentNode;
            }
            return ancestors;
        },
        
        // Transforms //
        updateTransform: function(xscale, yscale, rotation, z) {
            var transform = ''
            
            // Generate scale transform configuration
            if (xscale !== 1 || yscale !== 1) transform += 'scale3d(' + xscale + ',' + yscale + ',1.0)'
            
            // Generate rotation transform configuration
            if (rotation % 360 !== 0) transform += ' rotate3d(0,0,1.0,' + rotation + 'deg)';
            
            // Generate z-order transform configuration
            if (z !== 0) transform += ' translate3d(0,0,' + z + 'px)';
            
            this.styleObj.transform = transform;
        },
        
        updateTransformOrigin: function(xanchor, yanchor, zanchor) {
            if (xanchor !== 'left' && xanchor !== 'right' && xanchor !== 'center') xanchor += 'px';
            if (yanchor !== 'top' && yanchor !== 'bottom' && yanchor !== 'center') yanchor += 'px';
            
            this.styleObj[sprite.platform.prefix.css + 'transform-origin'] = xanchor + ' ' + yanchor + ' ' + zanchor + 'px';
        },
        
        // Paint and Focus Cycle Ordering
        /** Tests if the provided view is behind this view. The view to test 
            can be anywhere in the screen.
            @param siblingView:dr.View the view to check.
            @returns boolean: true if the view is behind this view, 
                false otherwise. */
        isBehind: function(view) {
            return this.__comparePosition(view, false);
        },
        
        /** Tests if the provided view is front of this view. The view to test 
            can be anywhere in the screen.
            @param siblingView:dr.View the view to check.
            @returns boolean: true if the view is in front of this view, 
                false otherwise. */
        isInFrontOf: function(view) {
            return this.__comparePosition(view, true);
        },
        
        /** @private */
        __comparePosition: function(view, front) {
            if (view) {
                // DOCUMENT_POSITION_DISCONNECTED 1
                // DOCUMENT_POSITION_PRECEDING 2
                // DOCUMENT_POSITION_FOLLOWING 4
                // DOCUMENT_POSITION_CONTAINS 8
                // DOCUMENT_POSITION_CONTAINED_BY 16
                // DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC 32
                var rel = this.platformObject.compareDocumentPosition(view.sprite.platformObject);
                return front ? rel === 2 || rel === 10 : rel === 4 || rel === 20;
            } else {
                return false;
            }
        },
        
        /** Moves this sprite in front of all other sibling sprites.
            @returns boolean true if a lexical order change occurred. */
        moveToFront: function() {
            var po = this.platformObject,
                ppo =  po.parentNode;
            if (ppo && po !== ppo.lastChild) {
                sprite.retainFocusDuringDomUpdate(this.view, function() {ppo.appendChild(po);});
                return true;
            }
            return false;
        },
        
        /** Moves this sprite behind all other sibling sprites.
            @returns boolean true if a lexical order change occurred. */
        moveToBack: function() {
            var po = this.platformObject,
                ppo =  po.parentNode;
            if (ppo && po !== ppo.firstChild) {
                sprite.retainFocusDuringDomUpdate(this.view, function() {ppo.insertBefore(po, ppo.firstChild);});
                return true;
            }
            return false;
        },
        
        /** Moves this sprite in front of the sprite of the provided 
            sibling view.
            @returns boolean true if a lexical order change occurred. */
        moveInFrontOf: function(otherView) {
            if (this.getPrevSiblingView() !== otherView) {
                this.moveBehind(otherView);
                otherView.sprite.moveBehind(this.view);
                return true;
            }
            return false;
        },
        
        /** Moves this sprite behind the sprite of the provided sibling view.
            @returns boolean true if a lexical order change occurred. */
        moveBehind: function(otherView) {
            var po = this.platformObject,
                ppo = po.parentNode,
                opo = otherView.sprite.platformObject;
            if (ppo && opo && opo.parentNode === ppo) {
                if (this.getNextSiblingView() !== otherView) {
                    sprite.retainFocusDuringDomUpdate(this.view, function() {ppo.insertBefore(po, opo);});
                    return true;
                }
            }
            return false;
        },
        
        /** Gets the next sibling view based on lexical ordering of dom elements. */
        getNextSiblingView: function() {
            var nextPlatformObject = this.platformObject.nextElementSibling;
            if (nextPlatformObject) return nextPlatformObject.model.view;
            return null;
        },
        
        /** Gets the previous sibling view. */
        getPrevSiblingView: function() {
            var prevPlatformObject = this.platformObject.previousElementSibling;
            if (prevPlatformObject) return prevPlatformObject.model.view;
            return null;
        },
        
        /** Gets the next sibling view based on lexical ordering of dom elements. */
        getLastSiblingView: function() {
            var lastPlatformObject = this.platformObject.parentElement.lastChild;
            if (lastPlatformObject) {
                var lastView = lastPlatformObject.model.view;
                return lastView !== this.view ? lastView : null;
            }
            return null;
        },
        
        /** Gets the previous sibling view. */
        getFirstSiblingView: function() {
            var firstPlatformObject = this.platformObject.parentElement.firstChild;
            if (firstPlatformObject) {
                var firstView = firstPlatformObject.model.view;
                return firstView !== this.view ? firstView : null;
            }
            return null;
        }
    });
});
