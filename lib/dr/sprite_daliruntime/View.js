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
        Color = require('$LIB/dr/model/Color.js'),        
        sprite = require('$SPRITE/sprite.js');
    module.exports = sprite.View = new JS.Class('sprite.View', {
        include: [
            require('$LIB/dr/Destructible.js'),
            require('$SPRITE/events/PlatformObservable.js'),
            require('$SPRITE/events/ScrollObservable.js'),
            require('$SPRITE/events/KeyObservable.js'),
            require('$SPRITE/events/MouseObservable.js'),
            require('$SPRITE/events/FocusObservable.js')
        ],
        
        
        // Class Methods and Attributes ////////////////////////////////////////////
        extend: {
            
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
            var elem = globalScope.createElement(elementType);
            var s = elem.style;
            s.position = 'absolute';
            s.pointerEvents = s[sprite.View.CSS_USER_SELECT] = 'none';
            s.borderStyle = 'solid';
            s.borderColor = 'transparent';
            s.padding = s.margin = s.borderWidth = '0px';
            s.boxSizing = 'border-box';
            
            // Necessary since x and y of 0 won't update deStyle so this gets
            // things initialized correctly. Without this RootViews will have
            // an incorrect initial position for x or y of 0.
            s.marginLeft = s.marginTop = 0;
            
            // Root views need to be attached to an existing dom element
            if (this.view.isA(dr.RootView)) globalScope.addRoot(elem);
            
            return elem;
        },
        
        destroy: function() {
            delete this.platformObject.model;
            this.detachAllPlatformObservers();
            this.callSuper();
        },
        
        
        // Attributes //////////////////////////////////////////////////////////////
        set_x: function(v) {
  //          if (this.view.visible) this.styleObj.marginLeft = v + 'px';

             this.styleObj.marginLeft = v;
            this.platformObject.setPosition(this.styleObj.marginLeft, this.styleObj.marginTop);
            return v;
        },
        
        set_y: function(v) {
            //if (this.view.visible) this.styleObj.marginTop = v + 'px';
            
             this.styleObj.marginTop = v ;
            this.platformObject.setPosition(this.styleObj.marginLeft, this.styleObj.marginTop);
            return v;
        },
        
        set_width: function(v) {
    //        this.styleObj.width = v + (v !== 'auto' ? 'px' : '');
            //console.log("width: " , v);
            this.styleObj.width = v;
            this.platformObject.setSize(this.styleObj.width,this.styleObj.height);
            
            return v;
        },
        
        set_height: function(v, supressEvent) {
        //    this.styleObj.height = v + (v !== 'auto' ? 'px' : '');
            //console.log("height: " , v);
            
            this.styleObj.height = v;
            this.platformObject.setSize(this.styleObj.width,this.styleObj.height);
        
            return v;
        },
        
        set_bgcolor: function(v) {            
            this.styleObj.backgroundColor = v;
            var colorObj = Color.makeColorFromHexOrNameString(v);
            //log(colorObj.red + '\n');
            this.platformObject.setBackgroundColor([colorObj.red/255.0, colorObj.green/255.0, colorObj.blue/255.0, 1.0]);
       

            return v;
        },
        
        set_color: function(v) {
            this.styleObj.color = v || 'inherit';
            var colorObj = Color.makeColorFromHexOrNameString(v);
            this.platformObject.setFontColor([colorObj.red/255.0, colorObj.green/255.0, colorObj.blue/255.0, 1.0]);
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
              var colorObj = Color.makeColorFromHexOrNameString(v);
          
            this.platformObject.setBorderColor([colorObj.red/255.0, colorObj.green/255.0, colorObj.blue/255.0, 1.0]);
            return v;
        },
        
        set_borderstyle: function(v) {
            this.styleObj.borderStyle = v;
            return v;
        },
        
        set_border: function(v) {
            this.styleObj.borderWidth = v + 'px';
            this.platformObject.setBorderWidth(v);
            return v;
        },
        
        set_topborder: function(v) {
            this.styleObj.borderTopWidth = v + 'px';
//            if (sprite.platform.prefix.dom === 'WebKit') this.__WebkitPositionHack();
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
            this.platformObject.setPadding(v);
            return v;
        },
        
        set_toppadding: function(v) {
            this.styleObj.paddingTop = v + 'px';
            this.platformObject.setPaddingTop(v);
            //if (sprite.platform.prefix.dom === 'WebKit') this.__WebkitPositionHack();
            return v;
        },
        
        set_bottompadding: function(v) {
            this.styleObj.paddingBottom = v + 'px';
            this.platformObject.setPaddingBottom(v);
            return v;
        },
        
        set_leftpadding: function(v) {
            this.styleObj.paddingLeft = v + 'px';
            this.platformObject.setPaddingLeft(v);
            
            return v;
        },
        
        set_rightpadding: function(v) {
            this.styleObj.paddingRight = v + 'px';
            this.platformObject.setPaddingRight(v);
            
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
                and index 3 is the color.
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
        
        /** Gets the computed style for a dom element.
            @returns object the style object.
            @private */
        __getComputedStyle: function() {
            return sprite.__getComputedStyle(this.platformObject);
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
                x = 0, y = 0, s,
                borderMultiplier = sprite.platform.browser === 'Firefox' ? 2 : 1; // I have no idea why firefox needs it twice, but it does.
            
            // elem.nodeName !== "BODY" test prevents looking at the body
            // which causes problems when the document is scrolled on webkit.
            while (elem && elem.nodeName !== "BODY" && elem !== ancestorElem) {
                x += elem.offsetLeft;
                y += elem.offsetTop;
                elem = elem.offsetParent;
                if (elem && elem.nodeName !== "BODY") {
                    s = this.__getComputedStyle();
                    x += borderMultiplier * parseInt(s.borderLeftWidth, 10) - elem.scrollLeft;
                    y += borderMultiplier * parseInt(s.borderTopWidth, 10) - elem.scrollTop;
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
            
         //   console.log("todo: set transform!");
            this.platformObject.setScale(xscale, yscale);
            this.platformObject.setRotation(rotation);
      
            //this.styleObj[sprite.platform.prefix.css + 'transform'] = transform;
        },
        
        updateTransformOrigin: function(xanchor, yanchor, zanchor) {
            var x = 0;
            if (xanchor !== 'left' && xanchor !== 'right' && xanchor !== 'center') xanchor += 'px';
            if (yanchor !== 'top' && yanchor !== 'bottom' && yanchor !== 'center') yanchor += 'px';
            //console.log("anchors:",xanchor,yanchor, zanchor);
      //      console.log("todo: set transform origin!");
            //this.styleObj[sprite.platform.prefix.css + 'transform-origin'] = xanchor + ' ' + yanchor + ' ' + zanchor + 'px';
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
        
        /** Moves this sprite in front of all other sibling sprites. */
        moveToFront: function() {
            var po = this.platformObject,
                ppo =  po.parentNode;
            if (ppo && po !== ppo.lastChild) {
                sprite.retainFocusDuringDomUpdate(this.view, function() {ppo.appendChild(po);});
            }
        },
        
        /** Moves this sprite behind all other sibling sprites. */
        moveToBack: function() {
            var po = this.platformObject,
                ppo =  po.parentNode;
            if (ppo && po !== ppo.firstChild) {
                sprite.retainFocusDuringDomUpdate(this.view, function() {ppo.insertBefore(po, ppo.firstChild);});
            }
        },
        
        /** Moves this sprite in front of the sprite of the provided 
            sibling view. */
        moveInFrontOf: function(otherView) {
            this.moveBehind(otherView);
            otherView.sprite.moveBehind(this.view);
        },
        
        /** Moves this sprite behind the sprite of the provided sibling view. */
        moveBehind: function(otherView) {
            var po = this.platformObject,
                ppo = po.parentNode,
                opo = otherView.sprite.platformObject;
            if (ppo && opo && opo.parentNode === ppo) {
                sprite.retainFocusDuringDomUpdate(this.view, function() {ppo.insertBefore(po, opo);});
            }
        }
    });
});
