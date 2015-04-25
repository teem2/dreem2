/** A Node that can be viewed. Instances of view are typically backed by
    an absolutely positioned div element.
    
    Events:
        onx:number
        ony:number
        onwidth:number (supressable)
        onheight:number (supressable)
        onboundswidth:number Fired when the bounds width of the view changes.
        onboundsheight:number Fired when the bounds height of the view changes.
        onbgcolor:string
        onopacity:number
        onvisible:boolean
        onsubviewAdded:dr.View Fired when a subview is added to this view.
        onsubviewRemoved:dr.View Fired when a subview is removed from this view.
        onlayoutAdded:dr.Layout Fired when a layout is added to this view.
        onlayoutRemoved:dr.Layout Fired when a layout is removed from this view.
    
    Attributes:
        Layout Related:
            ignorelayout:json Defaults to false.
                Indicates if layouts should ignore this view or not. A variety 
                of configuration mechanisms are supported. Provided true or 
                false will cause the view to be ignored or not by all layouts. 
                If instead a serialized map is provided the keys of the map 
                will target values the layouts with matching names. A special 
                key of '*' indicates a default value for all layouts not 
                specifically mentioned in the map.
            layouthint:json Default to empty
                Provides per view hinting to layouts. The specific hints 
                supported are layout specific. Hints are provided as a map. A 
                map key may be prefixied with the name of a layout followed by 
                a '/'. This will target that hint at a specific layout. If 
                the prefix is ommitted or a prefix of '*' is used the hint 
                will be targeted to all layouts.
        
        Focus Related:
            focustrap:boolean Determines if focus traversal can move above this 
                view or not. The default is undefined which is equivalent to 
                false. Can be ignored using a key modifier. The key modifier is 
                typically 'option'.
            focuscage:boolean Determines if focus traversal can move above this 
                view or not. The default is undefined which is equivalent to 
                false. This is the same as focustrap except it can't be ignored 
                using a key modifier.
            maskfocus:boolean Prevents focus from traversing into this view or 
                any of its subviews. The default is undefined which is 
                equivalent to false.
            focusable:boolean Indicates if this view can have focus or not.
                Defaults to false.
            focused:boolean Indicates if this view has focus or not.
            focusembellishment:boolean Indicates if the focus embellishment 
                should be shown for this view or not when it has focus.
        
        Visual Related:
            x:number The x-position of this view in pixels. Defaults to 0.
            y:number The y-position of this view in pixels. Defaults to 0.
            width:number The width of this view in pixels. Defaults to 0.
            height:number the height of this view in pixels. Defaults to 0.
            boundswidth:number (read only) The actual bounds of the view in the
                x-dimension. This value is in pixels relative to the RootView 
                and thus compensates for rotation and scaling.
            boundsheight:number (read only) The actual bounds of the view in 
                the y-dimension. This value is in pixels relative to the 
                RootView and thus compensates for rotation and scaling.
            bgcolor:string The background color of this view. Use a value of 
                'transparent' to make this view transparent. Defaults 
                to 'transparent'.
            opacity:number The opacity of this view. The value should be a 
                number between 0 and 1. Defaults to 1.
            visible:boolean Makes this view visible or not. The default value 
                is true which means visbility is inherited from the parent view.
            cursor:string Determines what cursor to show when moused over 
                the view. Allowed values: 'auto', 'move', 'no-drop', 
                'col-resize', 'all-scroll', 'pointer', 'not-allowed', 
                'row-resize', 'crosshair', 'progress', 'e-resize', 'ne-resize', 
                'default', 'text', 'n-resize', 'nw-resize', 'help', 
                'vertical-text', 's-resize', 'se-resize', 'inherit', 'wait', 
                'w-resize', 'sw-resize'. Defaults to undefined which is 
                equivalent to 'auto'.
    
    Private Attributes:
        subviews:array The array of child dr.Views for this view. Should 
            be accessed through the getSubviews method.
        layouts:array The array of child dr.Layouts for this view. Should
            be accessed through the getLayouts method.
*/
define(function(require, exports){
    var dr = require('../dr.js');
    var JS = require('$LIB/jsclass.js');
    
    require('../events/PlatformObserver.js');
    require('../sprite/View.js');
    require('../layout/AutoPropertyLayout.js');
    require('../model/ThresholdCounter.js');
    
    dr.View = new JS.Class('View', dr.Node, {
        include: [
            dr.SpriteBacked,
            dr.PlatformObserver
        ],
        
        
        // Life Cycle //////////////////////////////////////////////////////////////
        /** @overrides dr.Node */
        initNode: function(parent, attrs) {
            // Used in many calculations so precalculating for performance.
            this.__fullBorderPaddingWidth = this.__fullBorderPaddingHeight = 0;
            
            // Initialize default values to reduce setter calls during initialization
            // FIXME: __cfg_ values should be set too.
            this.x = this.y = this.width = this.height = 
                this.boundsx = this.boundsy = this.boundswidth = this.boundsheight = this.boundsxdiff = this.boundsydiff = 
                this.rotation = this.z = 
                this.leftborder = this.rightborder = this.topborder = this.bottomborder = this.border = 
                this.leftpadding = this.rightpadding = this.toppadding = this.bottompadding = this.padding = 
                this.scrollx = this.scrolly = 0;
            
            this.opacity = this.xscale = this.yscale = 1;
            
            this.visible = this.focusembellishment = true;
            
            this.focusable = this.clickable = this.ignorelayout = this.clip = this.scrollable = false;
            
            this.bgcolor = this.bordercolor = 'transparent';
            this.borderstyle = 'solid';
            this.cursor = 'auto';
            
            this.xanchor = this.yanchor = 'center';
            this.zanchor = 0;
            
            this.set_sprite(this.createSprite(attrs));
            
            this.callSuper(parent, attrs);
            
            this.__updateBounds();
        },
        
        /** @overrides dr.Node */
        notifyReady: function() {
            if (this.__autoLayoutwidth) this.__autoLayoutwidth.setAttribute('locked', false);
            if (this.__autoLayoutheight) this.__autoLayoutheight.setAttribute('locked', false);
            
            this.callSuper();
        },
        
        /** @overrides dr.Node */
        destroyBeforeOrphaning: function() {
            this.giveAwayFocus();
            this.callSuper();
        },
        
        /** @overrides dr.Node */
        destroyAfterOrphaning: function() {
            this.callSuper();
            
            this.stopListeningToAllPlatformSources();
            this.sprite.destroy();
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        setAttribute: function(attrName, value, isActual) {
            if (isActual) {
                this.callSuper(attrName, value, isActual);
            } else {
                var constraint;
                switch (attrName) {
                    case 'x':
                        constraint = this.__setupPercentConstraint('x', value, 'innerwidth');
                        if (!constraint) constraint = this.__setupAlignConstraint('x', value);
                        break;
                    case 'y':
                        constraint = this.__setupPercentConstraint('y', value, 'innerheight');
                        if (!constraint) constraint = this.__setupAlignConstraint('y', value);
                        break;
                    case 'width':
                        constraint = this.__setupPercentConstraint('width', value, 'innerwidth');
                        if (!constraint) constraint = this.__setupAutoConstraint('width', value, 'x');
                        break;
                    case 'height':
                        constraint = this.__setupPercentConstraint('height', value, 'innerheight');
                        if (!constraint) constraint = this.__setupAutoConstraint('height', value, 'y');
                        break;
                }
                
                if (constraint !== dr.noop) {
                    this.callSuper(attrName, constraint !== undefined ? constraint : value, isActual);
                }
            }
        },
        
    
        /** Returns a constraint string if the provided value matches an
            align special value.
            @private */
        __setupAlignConstraint: function(name, value) {
            var key = '__noAutoForAlignConstraint_' + name;
            this[key] = false;
            if (typeof value === 'string') {
                var normValue = value.toLowerCase(),
                    isX, axis, boundsdiff, boundssize, alignattr;
                
                if (name === 'x') {
                    isX = true;
                    axis = 'innerwidth';
                    boundsdiff = 'boundsxdiff';
                    boundssize = 'boundswidth';
                    alignattr = 'isaligned';
                } else {
                    isX = false;
                    axis = 'innerheight';
                    boundsdiff = 'boundsydiff';
                    boundssize = 'boundsheight';
                    alignattr = 'isvaligned';
                }
                
                if (normValue === 'begin' || (isX && normValue === 'left') || (!isX && normValue === 'top')) {
                    return "${this." + boundsdiff + "}";
                } else if (normValue === 'middle' || normValue === 'center') {
                    this[key] = true;
                    return "${((this.parent." + axis + " - this." + boundssize + ") / 2) + this." + boundsdiff + "}";
                } else if (normValue === 'end' || (isX && normValue === 'right') || (!isX && normValue === 'bottom')) {
                    this[key] = true;
                    return "${this.parent." + axis + " - this." + boundssize + " + this." + boundsdiff + "}";
                } else if (normValue === 'none') {
                    return this[name];
                }
            }
        },
        
        /** Returns a constraint string if the provided value matches a percent
            special value.
            @private */
        __setupPercentConstraint: function(name, value, axis) {
            var key = '__isPercentConstraint_' + name;
            if (typeof value === 'string' && value.endsWith('%')) {
                this[key] = true;
                var scale = parseInt(value)/100;
                // Handle root view case using dr.global.viewportResize
                if (this.isA(dr.SizeToViewport)) {
                    axis = axis.substring(5);
                    return "${Math.max(dr.global.viewportResize." + axis + " * " + scale + ", this.min" + axis + ")}";
                } else {
                    return "${this.parent." + axis + " * " + scale + "}";
                }
            } else {
                this[key] = false;
            }
        },
    
        /** @private */
        __setupAutoConstraint: function(name, value, axis) {
            var layoutKey = '__autoLayout' + name;
                oldLayout = this[layoutKey];
            if (oldLayout) {
                oldLayout.destroy();
                delete this[layoutKey];
            }
            
            if (value === 'auto') {
                this[layoutKey] = new dr.AutoPropertyLayout(this, {axis:axis, locked:this.initing === false ? 'false' : 'true'});
                this[dr.AccessorSupport.generateConfigAttrName(name)] = value;
                
                return dr.noop;
            }
        },
        
        /** Does lazy instantiation of the subviews array. */
        getSubviews: function() {
            return this.subviews || (this.subviews = []);
        },
        
        /** Gets the views that are our siblings.
            @returns array of dr.View or null if this view is orphaned. */
        getSiblingViews: function() {
            if (!this.parent) return null;
            
            // Get a copy of the subviews since we will filter it.
            var svs = this.parent.getSubviews().concat();
            
            // Filter out ourself
            dr.filterArray(svs, this);
            
            return svs;
        },
        
        // Layout Attributes //
        /** Does lazy instantiation of the layouts array. */
        getLayouts: function() {
            return this.layouts || (this.layouts = []);
        },
        
        set_ignorelayout: function(v) {this.setActual('ignorelayout', v, 'json', 'false');},
        set_layouthint: function(v) {this.setActual('layouthint', v, 'json', '');},
        
        // Focus Attributes //
        set_focustrap: function(v) {this.setActual('focustrap', v, 'boolean', false);},
        set_focuscage: function(v) {this.setActual('focuscage', v, 'boolean', false);},
        set_maskfocus: function(v) {this.setActual('maskfocus', v, 'boolean', false);},
        set_focusable: function(v) {this.setActual('focusable', v, 'boolean', false);},
        
        set_focused: function(v) {
            if (this.setActual('focused', v, 'boolean', false)) {
                if (this.initing === false) {
                    dr.global.focus[v ? 'notifyFocus' : 'notifyBlur'](this);
                }
            }
        },
        
        set_focusembellishment: function(v) {
            if (this.setActual('focusembellishment', v, 'boolean', true)) {
                if (this.focused) {
                    if (v) {
                        this.showFocusEmbellishment();
                    } else {
                        this.hideFocusEmbellishment();
                    }
                }
            }
        },
        
        // Scroll Attributes //
        set_scrollable: function(v) {
            if (this.setActual('scrollable', v, 'boolean', false)) {
                if (this.scrollable) {
                    this.listenToPlatform(this, 'onscroll', '__handleScroll');
                } else {
                    this.stopListeningToPlatform(this, 'onscroll', '__handleScroll');
                }
            }
        },
        
        set_scrollx: function(v) {
            if (isNaN(v)) {
                v = 0;
            } else {
                v = Math.max(0, Math.min(this.sprite.getScrollWidth() - this.width + this.leftborder + this.rightborder, v));
            }
            this.setActual('scrollx', v, 'number', 0);
        },
        
        set_scrolly: function(v) {
            if (isNaN(v)) {
                v = 0;
            } else {
                v = Math.max(0, Math.min(this.sprite.getScrollHeight() - this.height + this.topborder + this.bottomborder, v));
            }
            this.setActual('scrolly', v, 'number', 0);
        },
        
        /** @private */
        __handleScroll: function(platformEvent) {
            var sprite = this.sprite,
                x = sprite.getScrollX(),
                y = sprite.getScrollY();
            
            if (this.scrollx !== x) this.set_scrollx(x);
            if (this.scrolly !== y) this.set_scrolly(y);
            
            this.sendEvent('onscroll', {
                scrollx:x,
                scrolly:y,
                scrollwidth:sprite.getScrollWidth(),
                scrollheight:sprite.getScrollHeight()
            });
        },
        
        // Border Attributes //
        set_bordercolor: function(v) {this.setActual('bordercolor', v, 'color', 'transparent');},
        set_borderstyle: function(v) {this.setActual('borderstyle', v, 'string', 'solid');},
        
        set_border: function(v) {
            this.__lockBPRecalc = true;
            this.setAttribute('topborder', v);
            this.setAttribute('bottomborder', v);
            this.setAttribute('leftborder', v);
            this.setAttribute('rightborder', v);
            this.__lockBPRecalc = false;
            
            this.setActual('border', v, 'positivenumber', 0);
            
            this.__updateInnerWidth();
            this.__updateInnerHeight();
        },
    
        set_topborder: function(v) {
            if (this.setActual('topborder', v, 'positivenumber', 0) && !this.__lockBPRecalc) {
                this.__updateBorder();
                this.__updateInnerHeight();
            }
        },
    
        set_bottomborder: function(v) {
            if (this.setActual('bottomborder', v, 'positivenumber', 0) && !this.__lockBPRecalc) {
                this.__updateBorder();
                this.__updateInnerHeight();
            }
        },
    
        set_leftborder: function(v) {
            if (this.setActual('leftborder', v, 'positivenumber', 0) && !this.__lockBPRecalc) {
                this.__updateBorder();
                this.__updateInnerWidth();
            }
        },
    
        set_rightborder: function(v) {
            if (this.setActual('rightborder', v, 'positivenumber', 0) && !this.__lockBPRecalc) {
                this.__updateBorder();
                this.__updateInnerWidth();
            }
        },
    
        /** @private */
        __updateBorder: function() {
            var test = this.topborder
            if (this.bottomborder === test && this.leftborder === test && this.rightborder === test) {
                this.setSimpleActual('border', test, true);
            } else if (this.border != null) {
                this.setSimpleActual('border', undefined, true);
            }
        },
        
        // Padding Attributes //
        set_padding: function(v) {
            this.__lockBPRecalc = true;
            this.setAttribute('toppadding', v);
            this.setAttribute('bottompadding', v);
            this.setAttribute('leftpadding', v);
            this.setAttribute('rightpadding', v);
            this.__lockBPRecalc = false;
            
            this.setActual('padding', v, 'positivenumber', 0);
            
            this.__updateInnerWidth();
            this.__updateInnerHeight();
        },
    
        set_toppadding: function(v) {
            if (this.setActual('toppadding', v, 'positivenumber', 0) && !this.__lockBPRecalc) {
                this.__updatePadding();
                this.__updateInnerHeight();
            }
        },
    
        set_bottompadding: function(v) {
            if (this.setActual('bottompadding', v, 'positivenumber', 0) && !this.__lockBPRecalc) {
                this.__updatePadding();
                this.__updateInnerHeight();
            }
        },
    
        set_leftpadding: function(v) {
            if (this.setActual('leftpadding', v, 'positivenumber', 0) && !this.__lockBPRecalc) {
                this.__updatePadding();
                this.__updateInnerWidth();
            }
        },
    
        set_rightpadding: function(v) {
            if (this.setActual('rightpadding', v, 'positivenumber', 0) && !this.__lockBPRecalc) {
                this.__updatePadding();
                this.__updateInnerWidth();
            }
        },
    
        /** @private */
        __updatePadding: function() {
            var test = this.toppadding
            if (this.bottompadding === test && this.leftpadding === test && this.rightpadding === test) {
                this.setSimpleActual('padding', test, true);
            } else if (this.padding != null) {
                this.setSimpleActual('padding', undefined, true);
            }
        },
        
        // Transform Attributes //
        set_xscale: function(v) {
            var self = this;
            this.setActual('xscale', v, 'positivenumber', 1, function() {
                self.__updateTransform();
                self.__updateBounds();
            });
        },
    
        set_yscale: function(v) {
            var self = this;
            this.setActual('yscale', v, 'positivenumber', 1, function() {
                self.__updateTransform();
                self.__updateBounds();
            });
        },
    
        set_rotation: function(v) {
            var self = this;
            this.setActual('rotation', v, 'number', 0, function() {
                self.__updateTransform();
                self.__updateBounds();
            });
        },
    
        set_z: function(v) {
            this.setActual('z', v, 'number', 0, this.__updateTransform.bind(this));
        },
        
        set_xanchor: function(v) {
            if (v == null || v === '' || v === 'undefined') v = 'center';
            var self = this;
            this.setActual('xanchor', v, '*', 'center', function() {
                self.__updateTransform();
                self.__updateBounds();
            });
        },
    
        set_yanchor: function(v) {
            if (v == null || v === '' || v === 'undefined') v = 'center';
            var self = this;
            this.setActual('yanchor', v, '*', 'center', function() {
                self.__updateTransform();
                self.__updateBounds();
            });
        },
    
        set_zanchor: function(v) {
            if (v == null || v === '') v = 0;
            this.setActual('zanchor', v, '*', 0, this.__updateTransform.bind(this));
        },
    
        /** @private */
        __updateTransform: function() {
            var xscale = this.xscale == null ? 1 : this.xscale,
                yscale = this.yscale == null ? 1 : this.yscale,
                rotation = this.rotation || 0,
                z = this.z || 0;
            
            // Make it easy to determine that the bounds are different than the
            // simple x, y, width, height box
            var boundsAreDifferent = this.__boundsAreDifferent = xscale !== 1 || yscale !== 1 || rotation % 360 !== 0;
            
            // Apply to sprite
            if (boundsAreDifferent || z !== 0) {
                this.sprite.updateTransformOrigin(this.xanchor, this.yanchor, this.zanchor);
            }
            this.sprite.updateTransform(xscale, yscale, rotation, z);
        },
    
        // Text Attributes //
        set_color: function(v) {this.setActual('color', v, 'color', 'inherit');},
    
        // Visual Attributes //
        set_clickable: function(v) {this.setActual('clickable', v, 'boolean', false);},
        set_clip: function(v) {this.setActual('clip', v, 'boolean', false);},
        set_bgcolor: function(v) {this.setActual('bgcolor', v, 'color', 'transparent');},
        set_opacity: function(v) {this.setActual('opacity', v, 'number', 1);},
        set_visible: function(v) {this.setActual('visible', v, 'boolean', true);},
        set_cursor: function(v) {this.setActual('cursor', v, 'string', 'auto');},
        set_x: function(v) {this.setActual('x', v, 'number', this.x, this.__updateBounds.bind(this));},
        set_y: function(v) {this.setActual('y', v, 'number', this.y, this.__updateBounds.bind(this));},
        
        set_width: function(v) {
            // Prevent width smaller than border and padding
            v = Math.max(v, this.__fullBorderPaddingWidth);
            
            if (this.setActual('width', v, 'positivenumber', 0, this.__updateBounds.bind(this))) {
                this.setSimpleActual('innerwidth', this.width - this.__fullBorderPaddingWidth, true);
            }
        },
        
        set_height: function(v) {
            // Prevent height smaller than border and padding
            v = Math.max(v, this.__fullBorderPaddingHeight);
            
            if (this.setActual('height', v, 'positivenumber', 0, this.__updateBounds.bind(this))) {
                this.setSimpleActual('innerheight', this.height - this.__fullBorderPaddingHeight, true);
            }
        },
        
        /** @private */
        __updateInnerWidth: function() {
            var inset = this.__fullBorderPaddingWidth = this.leftborder + this.rightborder  + this.leftpadding + this.rightpadding;
            // Prevent width less than horizontal border padding
            if (inset > this.width) this.set_width(inset);
            this.setActual('innerwidth', this.width - inset, 'positivenumber', 0);
        },
        
        /** @private */
        __updateInnerHeight: function() {
            var inset = this.__fullBorderPaddingHeight = this.topborder  + this.bottomborder + this.toppadding + this.bottompadding
            // Prevent height less than vertical border padding
            if (inset > this.height) this.set_height(inset);
            this.setActual('innerheight', this.height - inset, 'positivenumber', 0);
        },
        
        /** Updates the boundswidth and boundsheight attributes.
            @private
            @returns void */
        __updateBounds: function() {
            if (this.initing === false) {
                var bounds, width, height, x, y, xdiff, ydiff;
                if (this.__boundsAreDifferent) {
                    bounds = this.getBoundsRelativeToParent();
                    width = bounds.width;
                    height = bounds.height;
                    x = bounds.x;
                    y = bounds.y;
                    xdiff = this.x - x;
                    ydiff = this.y - y;
                } else {
                    x = this.x;
                    y = this.y;
                    xdiff = ydiff = 0;
                    width = this.width;
                    height = this.height;
                }
                if (!dr.closeTo(this.boundsx, x)) this.setActual('boundsx', x, 'number', 0);
                if (!dr.closeTo(this.boundsy, y)) this.setActual('boundsy', y, 'number', 0);
                if (!dr.closeTo(this.boundswidth, width)) this.setActual('boundswidth', width, 'positivenumber', 0);
                if (!dr.closeTo(this.boundsheight, height)) this.setActual('boundsheight', height, 'positivenumber', 0);
                if (!dr.closeTo(this.boundsxdiff, xdiff)) this.setActual('boundsxdiff', xdiff, 'number', 0);
                if (!dr.closeTo(this.boundsydiff, ydiff)) this.setActual('boundsydiff', ydiff, 'number', 0);
            }
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////,
        /** Gets the x and y position of the underlying dom element relative to
            the page. Transforms are not supported.
            @returns object with 'x' and 'y' keys or null if no position could
                be determined. */
        getAbsolutePosition: function() {
            return this.sprite.getAbsolutePosition();
        },
        
        getBoundsRelativeToParent: function() {
            var xanchor = this.xanchor,
                yanchor = this.yanchor,
                w = this.width,
                h = this.height;
            
            if (xanchor === 'left') {
                xanchor = 0;
            } else if (xanchor === 'center') {
                xanchor = w / 2;
            } else if (xanchor === 'right') {
                xanchor = w;
            } else {
                xanchor = Number(xanchor);
            }
            
            if (yanchor === 'top') {
                yanchor = 0;
            } else if (yanchor === 'center') {
                yanchor = h / 2;
            } else if (yanchor === 'bottom') {
                yanchor = h;
            } else {
                yanchor = Number(yanchor);
            }
            
            // Create a path from the 4 corners of the normal view box and then apply
            // the transform to get the bounding box.
            var x1 = this.x,
                x2 = x1 + w,
                y1 = this.y,
                y2 = y1 + h;
            return (new dr.Path([x1,y1,x2,y1,x2,y2,x1,y2])).transformAroundOrigin(
                this.xscale, this.yscale, this.rotation, xanchor + x1, yanchor + y1
            ).getBoundingBox()
        },
        
        /** Checks if this view is visible and each view in the parent chain to
            the RootView is also visible. Dom elements are not explicitly
            checked. If you need to check that use dr.DomElementProxy.isDomElementVisible.
            @returns true if this view is visible, false otherwise. */
        isVisible: function() {
            return this.searchAncestorsOrSelf(function(v) {return !v.visible;}) === null;
        },
        
        /** @overrides dr.Node
            Calls this.subviewAdded if the added subnode is a dr.View. 
            @fires subviewAdded event with the provided Node if it's a View. 
            @fires layoutAdded event with the provided node if it's a Layout. */
        subnodeAdded: function(node) {
            if (node instanceof dr.View) {
                this.sprite.appendSprite(node.sprite);
                this.getSubviews().push(node);
                this.sendEvent('onsubviewAdded', node);
                this.subviewAdded(node);
            } else if (node instanceof dr.Layout) {
                this.getLayouts().push(node);
                this.sendEvent('onlayoutAdded', node);
                this.layoutAdded(node);
            }
        },
        
        /** @overrides dr.Node
            Calls this.subviewRemoved if the remove subnode is a dr.View.
            @fires subviewRemoved event with the provided Node if it's a View
                and removal succeeds. 
            @fires layoutRemoved event with the provided Node if it's a Layout
                and removal succeeds. */
        subnodeRemoved: function(node) {
            var idx;
            if (node instanceof dr.View) {
                idx = this.getSubviewIndex(node);
                if (idx !== -1) {
                    this.sendEvent('onsubviewRemoved', node);
                    this.sprite.removeSprite(node.sprite);
                    this.subviews.splice(idx, 1);
                    this.subviewRemoved(node);
                }
            } else if (node instanceof dr.Layout) {
                idx = this.getLayoutIndex(node);
                if (idx !== -1) {
                    this.sendEvent('onlayoutRemoved', node);
                    this.layouts.splice(idx, 1);
                    this.layoutRemoved(node);
                }
            }
        },
        
        // Subviews //
        /** Checks if this View has the provided View in the subviews array.
            @param sv:View the view to look for.
            @returns true if the subview is found, false otherwise. */
        hasSubview: function(sv) {
            return this.getSubviewIndex(sv) !== -1;
        },
        
        /** Gets the index of the provided View in the subviews array.
            @param sv:View the view to look for.
            @returns the index of the subview or -1 if not found. */
        getSubviewIndex: function(sv) {
            return this.getSubviews().indexOf(sv);
        },
        
        /** Called when a View is added to this View. Do not call this method to 
            add a View. Instead call addSubnode or set_parent.
            @param sv:View the view that was added.
            @returns void */
        subviewAdded: function(sv) {},
        
        /** Called when a View is removed from this View. Do not call this method 
            to remove a View. Instead call removeSubnode or set_parent.
            @param sv:View the view that was removed.
            @returns void */
        subviewRemoved: function(sv) {},
        
        // Layouts //
        /** Checks if this View has the provided Layout in the layouts array.
            @param layout:Layout the layout to look for.
            @returns true if the layout is found, false otherwise. */
        hasLayout: function(layout) {
            return this.getLayoutIndex(layout) !== -1;
        },
        
        /** Gets the index of the provided Layout in the layouts array.
            @param layout:Layout the layout to look for.
            @returns the index of the layout or -1 if not found. */
        getLayoutIndex: function(layout) {
            return this.getLayouts().indexOf(layout);
        },
        
        /** Called when a Layout is added to this View. Do not call this method to 
            add a Layout. Instead call addSubnode or set_parent.
            @param layout:Layout the layout that was added.
            @returns void */
        layoutAdded: function(layout) {},
        
        /** Called when a Layout is removed from this View. Do not call this 
            method to remove a Layout. Instead call removeSubnode or set_parent.
            @param layout:Layout the layout that was removed.
            @returns void */
        layoutRemoved: function(layout) {},
        
        /** Gets the value of a named layout hint.
            @param layoutName:string The name of the layout to match.
            @param hintName:string The name of the hint to match.
            @return * The value of the hint or undefined if not found. */
        getLayoutHint: function(layoutName, hintName) {
            var hints = this.layouthint;
            if (hints) {
                var hint = hints[layoutName + '/' + hintName];
                if (hint != null) return hint;
                
                hint = hints[hintName];
                if (hint != null) return hint;
                
                hint = hints['*/' + hintName];
                if (hint != null) return hint;
            } else {
              // No hints exist
            }
        },
        
        // Focus //
        /** Finds the youngest ancestor (or self) that is a focustrap or focuscage.
            @param ignoreFocusTrap:boolean indicates focustraps should be
                ignored.
            @returns a View with focustrap set to true or null if not found. */
        getFocusTrap: function(ignoreFocusTrap) {
            return this.searchAncestorsOrSelf(
                function(v) {
                    return v.focuscage || (v.focustrap && !ignoreFocusTrap);
                }
            );
        },
        
        /** Tests if this view is in a state where it can receive focus.
            @returns boolean True if this view is visible, enabled, focusable and
                not focus masked, false otherwise. */
        isFocusable: function() {
            return this.focusable && !this.disabled && this.isVisible() && 
                this.searchAncestorsOrSelf(function(n) {return n.maskfocus === true;}) === null;
        },
        
        /** Gives the focus to the next focusable element or, if nothing else
            is focusable, blurs away from this element.
            @returns void */
        giveAwayFocus: function() {
            if (this.focused) {
                // Try to go to next focusable element.
                dr.global.focus.next();
                
                // If focus loops around to ourself make sure we don't keep it.
                if (this.focused) this.blur();
            }
        },
        
        /** @private */
        __handleFocus: function(event) {
            if (!this.focused) {
                this.set_focused(true);
                this.doFocus();
            }
        },
        
        /** @private */
        __handleBlur: function(event) {
            if (this.focused) {
                this.doBlur();
                this.set_focused(false);
            }
        },
        
        doFocus: function() {
            if (this.focusembellishment) {
                this.showFocusEmbellishment();
            } else {
                this.hideFocusEmbellishment();
            }
        },
        
        doBlur: function() {
            if (this.focusembellishment) this.hideFocusEmbellishment();
        },
        
        showFocusEmbellishment: function() {
            this.sprite.showFocusEmbellishment();
        },
        
        hideFocusEmbellishment: function() {
            this.sprite.hideFocusEmbellishment();
        },
        
        /** Calling this method will set focus onto this view if it is focusable.
            @param noScroll:boolean (optional) if true is provided no auto-scrolling
                will occur when focus is set.
            @returns void */
        focus: function(noScroll) {
            if (this.isFocusable()) this.sprite.focus(noScroll);
        },
        
        /** Removes the focus from this view. Do not call this method directly.
            @private
            @returns void */
        blur: function() {
            this.sprite.blur();
        },
        
        /** Implement this method to return the next view that should have focus.
            If null/undefined is returned or the method is not implemented, 
            normal dom traversal will occur. */
        getNextFocus: function() {},
        
        /** Implement this method to return the previous view that should have 
            focus. If null/undefined is returned or the method is not implemented, 
            normal dom traversal will occur. */
        getPrevFocus: function() {}
    });
});
