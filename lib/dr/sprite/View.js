/** Provides an interface to platform specific View functionality. */
define(function(require, exports){
    var dr = require('../dr.js');
    var JS = require('../../../../../lib/jsclass.js');
    
    require('../SpriteBacked.js');
    require('./events/MouseObservable.js');
    require('./events/ScrollObservable.js');
    require('./events/KeyObservable.js');
    require('./events/FocusObservable.js');
    
    dr.sprite.View = new JS.Class('sprite.View', {
        include: [
            dr.Destructible,
            dr.sprite.PlatformObservable,
            dr.sprite.KeyObservable,
            dr.sprite.MouseObservable,
            dr.sprite.ScrollObservable,
            dr.sprite.FocusObservable
        ],
        
        
        // Class Methods and Attributes ////////////////////////////////////////////
        extend: {
            CSS_USER_SELECT:dr.sprite.platform.prefix.css + 'user-select'
        },
        
        // Constructor /////////////////////////////////////////////////////////////
        /** The standard JSClass initializer function. Subclasses should not
            override this function.
            @param view:dr.View The view this sprite is backing.
            @param attrs:object A map of attribute names and values.
            @returns void */
        initialize: function(view, attrs) {
            this.view = view;
            this.platformObject = this.createPlatformObject(attrs || {});
            this.platformObject.model = this;
            this.styleObj = this.platformObject.style;
        },
    
    
        // Life Cycle //////////////////////////////////////////////////////////////
        createPlatformObject: function(attrs) {
            var document = global.document,
                elem = document.createElement('div'),
                s = elem.style;
            s.position = 'absolute';
            s.pointerEvents = s[dr.sprite.View.CSS_USER_SELECT] = 'none';
            s.borderStyle = 'solid';
            s.borderColor = 'transparent';
            s.padding = s.margin = s.borderWidth = '0px';
            s.boxSizing = 'border-box';
            
            // Necessary since x and y of 0 won't update deStyle so this gets
            // things initialized correctly. Without this RootViews will have
            // an incorrect initial position for x or y of 0.
            s.marginLeft = s.marginTop = '0px';
            
            // Root views need to be attached to an existing dom element
            if (this.view.isA(dr.RootView)) document.getElementsByTagName('body')[0].appendChild(elem);
            
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
            if (dr.sprite.platform.prefix.dom === 'WebKit') this.__WebkitPositionHack();
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
            if (dr.sprite.platform.prefix.dom === 'WebKit') this.__WebkitPositionHack();
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
        
        /** Gets the computed style for a dom element.
            @returns object the style object.
            @private */
        __getComputedStyle: function() {
            return dr.sprite.__getComputedStyle(this.platformObject);
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
                ancestorElem = ancestorView ? ancestorView.sprite.platformObject : null;
                x = 0, y = 0, s,
                borderMultiplier = dr.sprite.platform.browser === 'Firefox' ? 2 : 1; // I have no idea why firefox needs it twice, but it does.
            
            // elem.nodeName !== "BODY" test prevents looking at the body
            // which causes problems when the document is scrolled on webkit.
            while (elem && elem.nodeName !== "BODY" && elem !== ancestorElem) {
                x += elem.offsetLeft;
                y += elem.offsetTop;
                elem = elem.offsetParent;
                if (elem && elem.nodeName !== "BODY") {
                    s = this.getComputedStyle();
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
            
            this.styleObj[dr.sprite.platform.prefix.css + 'transform'] = transform;
        },
        
        updateTransformOrigin: function(xanchor, yanchor, zanchor) {
            if (xanchor !== 'left' && xanchor !== 'right' && xanchor !== 'center') xanchor += 'px';
            if (yanchor !== 'top' && yanchor !== 'bottom' && yanchor !== 'center') yanchor += 'px';
            
            this.styleObj[dr.sprite.platform.prefix.css + 'transform-origin'] = xanchor + ' ' + yanchor + ' ' + zanchor + 'px';
        }
    });
});
