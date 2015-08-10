/**
  * @class dr.view {UI Components}
  * @extends dr.node
  * @aside guide constraints
  *
  * The visual base class for everything in dreem. Views extend dr.node to add the ability to set and animate visual attributes, and interact with the mouse.
  *
  * Views are positioned inside their parent according to their x and y coordinates.
  *
  * Views can contain methods, handlers, setters, constraints, attributes and other view, node or class instances.
  *
  * Views can be easily converted to reusable classes/tags by changing their outermost &lt;view> tags to &lt;class> and adding a name attribute.
  *
  * Views support a number of builtin attributes. Setting attributes that aren't listed explicitly will pass through to the underlying Sprite implementation.
  *
  * Note that dreem apps must be contained inside a top-level &lt;view>&lt;/view> tag.
  *
  * The following example shows a pink view that contains a smaller blue view offset 10 pixels from the top and 10 from the left.
  *
  *     @example
  *     <view width="200" height="100" bgcolor="lightpink">
  *
  *       <view width="50" height="50" x="10" y="10" bgcolor="lightblue"></view>
  *
  *     </view>
  *
  * Here the blue view is wider than its parent pink view, and because the clip attribute of the parent is set to false it extends beyond the parents bounds.
  *
  *     @example
  *     <view width="200" height="100" bgcolor="lightpink" clip="false">
  *
  *       <view width="250" height="50" x="10" y="10" bgcolor="lightblue"></view>
  *
  *     </view>
  *
  * Now we set the clip attribute on the parent view to true, causing the overflowing child view to be clipped at its parent's boundary.
  *
  *     @example
  *     <view width="200" height="100" bgcolor="lightpink" clip="true">
  *
  *       <view width="250" height="50" x="10" y="10" bgcolor="lightblue"></view>
  *
  *     </view>
  *
  * Here we demonstrate how unsupported attributes are passed to the underlying sprite system. We make the child view semi-transparent by setting opacity. Although this is not in the list of supported attributes it is still applied.
  *
  *     @example
  *     <view width="200" height="100" bgcolor="lightpink">
  *
  *       <view width="250" height="50" x="10" y="10" bgcolor="lightblue" opacity=".5"></view>
  *
  *     </view>
  *
  * It is convenient to [constrain](#!/guide/constraints) a view's size and position to attributes of its parent view. Here we'll position the inner view so that its inset by 10 pixels in its parent.
  *
  *     @example
  *     <view width="200" height="100" bgcolor="lightpink">
  *
  *       <view width="${this.parent.width-this.inset*2}" height="${this.parent.height-this.inset*2}" x="${this.inset}" y="${this.inset}" bgcolor="lightblue">
  *         <attribute name="inset" type="number" value="10"></attribute>
  *       </view>
  *
  *     </view>
  *
*/

/**
 * @event onsubviewadded
 * Fired when a subview is added to this view
 * @param {dr.view} view The dr.view that was added
 */

/**
 * @event onsubviewremoved
 * Fired when a subview is removed from this view
 * @param {dr.view} view The dr.view that was removed
 */

/**
 * @event onlayoutadded
 * Fired when a layout is added to this view
 * @param {dr.Layout} layout The dr.layout that was added
 */

/**
 * @event onlayoutremoved
 * Fired when a layout is removed from this view
 * @param {dr.Layout} layout The dr.layout that was removed
 */


/**
 * @event onsubvieworderchange
 * Fired when one of the subviews of this view has its lexical order changed.
 * In particular, this is fired when moveToFront, moveToBack, moveForward,
 * moveBackward, moveInFrontOf or moveBehind actually changes the subview
 * order.
 * @param {dr.View} subview The dr.View that was reordered.
 */


 /**
 * @attribute {Boolean} focustrap
 * Determines if focus traversal can move above this
 * view or not. The default is undefined which is equivalent to
 * false. Can be ignored using a key modifier. The key modifier is
 * typically 'option'.
 */

/**
 * @attribute {Boolean} focuscage
 * Determines if focus traversal can move above this
 * view or not. The default is undefined which is equivalent to
 * false. This is the same as focustrap except it can't be ignored
 * using a key modifier.
 *
 */

/**
 * @attribute {Boolean} maskfocus
 * Prevents focus from traversing into this view or
 * any of its subviews. The default is undefined which is
 * equivalent to false.
 */

/**
 * @attribute {Boolean} focusable
 * Indicates if this view can have focus or not. Defaults to false.
 */

/**
 * @attribute {Boolean} focused
 * Indicates if this view has focus or not.
 */

/**
 * @attribute {Boolean} focusembellishment
 * Indicates if the focus embellishment
 * should be shown for this view or not when it has focus.
 */
        
 /**
  * @attribute {String} cursor
  * Determines what cursor to show when moused over the view. Allowed values: 'auto', 'move', 'no-drop', 'col-resize',
  * 'all-scroll', 'pointer', 'not-allowed', 'row-resize', 'crosshair', 'progress', 'e-resize', 'ne-resize', 'default',
  * 'text', 'n-resize', 'nw-resize', 'help', 'vertical-text', 's-resize', 'se-resize', 'inherit', 'wait', 'w-resize',
  * 'sw-resize'. Defaults to undefined which is equivalent to 'auto'.
*/

/**
 * @attribute {Array} boxshadow
 * Sets a shadow around this view. In the array, index 0 is the horizontal shadow offset, index 1 is the
 * vertical shadow offset, index 2 is the blur amount, index 3 is the spread and index 4 is the color.
 * Each entry in the array is optional and the values default to: [0, 0, 4, 0, 'rgba(0,0,0,0.5)']
 *
*/

/**
 * @attribute {Array} gradient
 * Sets a linear gradient fill on the view. The value
 * at index 0 is the gradient angle. The remaining entries are
 * the color stops. Each color stop is a color value plus an
 * optional location percentage. If no stops are provided the
 * current bgcolor and color will be used. If those do not exist
 * transparent will be used.
*/

/**
 * @attribute {Array} subviews
 * The array of child dr.Views for this view. Should
 * be accessed through the getSubviews method.
*/

/**
 * @attribute {Array} layouts
 * The array of child dr.Layouts for this view. Should
 * be accessed through the getLayouts method.
*/

/**
 * @attribute {Number} __fullBorderPaddingWidth
 * @private
 * The sum of borderleft, borderright,
 * paddingleft and paddingright.
*/

/**
 * @attribute {Number} __fullBorderPaddingHeight
 * @private
 * The sum of bordertop, borderbottom,
 * paddingtop and paddingbottom.
*/

/**
 * @attribute {dr.AutoPropertyLayout} __autoLayoutwidth
 * @private
 * A reference to the layout
 * used for auto widths.
*/

/**
 * @attribute {dr.AutoPropertyLayout} __autoLayoutheight
 * @private
 * A reference to the layout
 * used for auto heights.
*/

/**
 * @attribute {Boolean} __isPercentConstraint_x
 * @private
 * True if a percent constraint is used
 * for the x attribute.
*/

/**
 * @attribute {Boolean} __isPercentConstraint_y
 * @private
 * True if a percent constraint is used
 * for the y attribute.
*/

/**
 * @attribute {Boolean} __isPercentConstraint_width
 * True if a percent constraint is
 * used for the width attribute.
*/

/**
 * @attribute {Boolean} __isPercentConstraint_height
 * True if a percent constraint is
 * used for the height attribute.
*/

/**
 * @attribute {Boolean} __lockRecalc
 * Used to prevent recacalcuation of border,
 * padding and corner radius when setting them via set_border,
 * set_padding or set_cornerradius.
*/

/**
  * @attribute {Number} [x=0]
  * This view's x-position. There are several categories of allowed values.
  *
  *   1) Fixed: If a number is provided the x-position will be a fixed
  *      pixel position relative to the parent view.
  *
  *   2) Percentage: If a number followed by a '%' sign is provided the
  *      x-position will constrained to a percent of the parent views
  *      inner width.
  *
  *   3) Aligned Left: If the string 'left' is provided the x-position will
  *      be constrained so that the view's left bound is aligned with the
  *      inner left edge of the parent view. To clarify, aligning left is
  *      different from a fixed x-position of 0 since it accounts for
  *      transformations applied to the view.
  *
  *   4) Aligned Right: If the string 'right' is provided the x-position will
  *      be constrained so that the view's right bound is aligned with the
  *      inner right edge of the parent view. Like align left, this means
  *      transformations applied to the view are accounted for.
  *
  *   5) Aligned Center: If the string 'center' or 'middle' is provided the
  *      x-position will be constrained so that the midpoint of the width
  *      bound of the view is the same as the midpoint of the inner width of
  *      the parent view. Like align left, this means transformations applied
  *      to the view are accounted for.
 */

 /**
  * @attribute {Number} [y=0]
  * This view's y-position. There are several categories of allowed values.
  *
  *   1) Fixed: If a number is provided the y-position will be a fixed
  *      pixel position relative to the parent view.
  *
  *   2) Percentage: If a number followed by a '%' sign is provided the
  *      y-position will constrained to a percent of the parent views
  *      inner height.
  *
  *   3) Aligned Top: If the string 'top' is provided the y-position will
  *      be constrained so that the view's top bound is aligned with the
  *      inner top edge of the parent view. To clarify, aligning top is
  *      different from a fixed y-position of 0 since it accounts for
  *      transformations applied to the view.
  *
  *   4) Aligned Bottom: If the string 'bottom' is provided the y-position
  *      will be constrained so that the view's bottom bound is aligned with
  *      the inner bottom edge of the parent view. Like align top, this means
  *      transformations applied to the view are accounted for.
  *
  *   5) Aligned Middle: If the string 'middle' or 'center' is provided the
  *      y-position will be constrained so that the midpoint of the height
  *      bound of the view is the same as the midpoint of the inner height of
  *      the parent view. Like align top, this means transformations applied
  *      to the view are accounted for.
 */

 /**
  * @attribute {Number} [width=0]
  * This view's width. There are several categories of allowed values.
  *
  *   1) Fixed: If a number is provided the width will be a fixed
  *      pixel size.
  *
  *   2) Percentage: If a number followed by a '%' sign is provided the
  *      width will constrained to a percent of the parent views
  *      inner width.
  *
  *   3) Auto: If the string 'auto' is provided the width will be constrained
  *      to the maximum x bounds of the view children of this view. This
  *      feature is implemented like a Layout, so you can use ignorelayout
  *      on a child view to disregard them for auto sizing. Furthermore,
  *      views with a percentage width, percentage x, or an x-position of
  *      'center' or 'right' will also be disregarded. Note that 'left' is
  *      not ignored since it does not necessarily result in a circular
  *      constraint.
 */

 /**
  * @attribute {Number} [height=0]
  * This view's height. There are several categories of allowed values.
  *   1) Fixed: If a number is provided the height will be a fixed
  *      pixel size.
  *
  *   2) Percentage: If a number followed by a '%' sign is provided the
  *      height will constrained to a percent of the parent views
  *      inner height.
  *
  *   3) Auto: If the string 'auto' is provided the height will be constrained
  *      to the maximum y bounds of the view children of this view. This
  *      feature is implemented like a Layout, so you can use ignorelayout
  *      on a child view to disregard them for auto sizing. Furthermore,
  *      views with a percentage height, percentage y, or a y-position of
  *      'center', 'middle' or 'bottom' will also be disregarded. Note that
  *      'top' is not ignored since it does not necessarily result in a
  *      circular constraint.
 */

 /**
  * @attribute {Boolean} isaligned Indicates that the x attribute is
  * set to one of the "special" alignment values.
  * @readonly
 */

 /**
  * @attribute {Boolean} isvaligned Indicates that the y attribute is
  * set to one of the "special" alignment values.
  * @readonly
 */

 /**
  * @attribute {Number} innerwidth The width of the view less padding and
  * border. This is the width child views should use if border or padding
  * is being used by the view.
  * @readonly
 */

 /**
  * @attribute {Number} innerheight The height of the view less padding and
  * border. This is the height child views should use if border or padding
  * is being used by the view.
  * @readonly
 */

 /**
  * @attribute {Number} boundsx The x position of the bounding box for the
  * view. This value accounts for rotation and scaling of the view.
  * @readonly
 */

 /**
  * @attribute {Number} boundsy The y position of the bounding box for the
  * view. This value accounts for rotation and scaling of the view.
  * @readonly
 */

 /**
  * @attribute {Number} boundsxdiff The difference between the x position
  * of the view and the boundsx of the view. Useful when you need to offset
  * a view to make it line up when it is scaled or rotated.
  * @readonly
 */

 /**
  * @attribute {Number} boundsydiff The difference between the y position
  * of the view and the boundsy of the view. Useful when you need to offset
  * a view to make it line up when it is scaled or rotated.
  * @readonly
 */

 /**
  * @attribute {Number} boundswidth The width of the bounding box for the
  * view. This value accounts for rotation and scaling of the view. This is
  * the width non-descendant views should use if the view is rotated or
  * scaled.
  * @readonly
 */

 /**
  * @attribute {Number} boundsheight The height of the bounding box for the
  * view. This value accounts for rotation and scaling of the view. This is
  * the height non-descendant views should use if the view is rotated or
  * scaled.
  * @readonly
 */

 /**
  * @attribute {Boolean} [clickable=false]
  * If true, this view recieves mouse events. Automatically set to true when an onclick/mouse* event is registered for this view.
 */

 /**
  * @attribute {Boolean} [clip=false]
  * If true, this view clips to its bounds
 */

 /**
  * @attribute {Boolean} [scrollable=false]
  * If true, this view clips to its bounds and provides scrolling to see content that overflows the bounds
 */

 /**
  * @attribute {Boolean} [scrollbars=false]
  * Controls the visibility of scrollbars if scrollable is true
 */

 /**
  * @attribute {Boolean} [visible=true]
  * If false, this view is invisible
 */

 /**
  * @attribute {String} bgcolor
  * Sets this view's background color
 */

 /**
  * @attribute {String} bordercolor
  * Sets this view's border color
 */

 /**
  * @attribute {String} borderstyle
  * Sets this view's border style (can be any css border-style value)
 */

 /**
  * @attribute {Number} border
  * Sets this view's border width
 */

 /**
  * @attribute {Number} padding
  * Sets this view's padding
 */

 /**
  * @attribute {Number} [xscale=1.0]
  * Sets this view's width scale
 */

 /**
  * @attribute {Number} [yscale=1.0]
  * Sets this view's height scale
 */

 /**
  * @attribute {Number} [z=0]
  * Sets this view's z position (higher values are on top of other views)
  *
  * *(note: setting a 'z' value for a view implicitly sets its parent's 'transform-style' to 'preserve-3d')*
 */

 /**
  * @attribute {Number} [rotation=0]
  * Sets this view's rotation in degrees.
 */

 /**
  * @attribute {String} [perspective=0]
  * Sets this view's perspective depth along the z access, values in pixels.
  * When this value is set, items further from the camera will appear smaller, and closer items will be larger.
 */

 /**
  * @attribute {Number} [opacity=1.0]
  * Sets this view's opacity, values can be a float from 0.0 to 1.0
 */

 /**
  * @attribute {Number} [scrollx=0]
  * Sets the horizontal scroll position of the view. Only relevant if
  * this.scrollable is true. Setting this value will generate both a
  * scrollx event and a scroll event.
 */

 /**
  * @attribute {Number} [scrolly=0]
  * Sets the vertical scroll position of the view. Only relevant if
  * this.scrollable is true. Setting this value will generate both a
  * scrolly event and a scroll event.
 */

 /**
  * @attribute {Number} [xanchor=0]
  * Sets the horizontal center of the view's transformations (such as
  * rotation) There are several categories of allowed values:
  *   1) Fixed: If a number is provided the x anchor will be a fixed
  *      pixel position.
  *   2) Left: If the string 'left' is provided the left edge of the view
  *      will be used. This is equivalent to a fixed value of 0.
  *   3) Right: If the string 'right' is provided the right edge of the
  *      view will be used.
  *   4) Center: If the string 'center' is provided the midpoint of the
  *      width of the view will be used.
 */

 /**
  * @attribute {Number} [yanchor=0]
  * Sets the vertical center of the view's transformations (such as
  * rotation) There are several categories of allowed values:
  *   1) Fixed: If a number is provided the y anchor will be a fixed
  *      pixel position.
  *   2) Top: If the string 'top' is provided the top edge of the view
  *      will be used. This is equivalent to a fixed value of 0.
  *   3) Bottom: If the string 'bottom' is provided the bottom edge of the
  *      view will be used.
  *   4) Center: If the string 'center' is provided the midpoint of the
  *      height of the view will be used.
 */

 /**
  * @attribute {Number} [zanchor=0]
  * Sets the z-axis center of the view's transformations (such as rotation)
 */

 /**
  * @attribute {String} [cursor='pointer']
  * Cursor that should be used when the mouse is over this view, can be any CSS cursor value. Only applies when clickable is true.
 */

 /**
  * @attribute {String} [boxshadow]
  * Drop shadow using standard CSS format (offset-x offset-y blur-radius spread-radius color). For example: "10px 10px 5px 0px  *888888".
 */

 /**
  * @attribute {String} [ignorelayout='false']
  * Indicates if layouts should ignore this view or not. A variety of
  * configuration mechanisms are supported. Provided true or false will
  * cause the view to be ignored or not by all layouts. If instead a
  * serialized map is provided the keys of the map will target values
  * the layouts with matching names. A special key of '*' indicates a
  * default value for all layouts not specifically mentioned in the map.
 */

 /**
  * @attribute {String} [layouthint='']
  * Provides per view hinting to layouts. The specific hints supported
  * are layout specific. Hints are provided as a map. A map key may
  * be prefixied with the name of a layout followed by a '/'. This will
  * target that hint at a specific layout. If the prefix is ommitted or
  * a prefix of '*' is used the hint will be targeted to all layouts.
 */

 /**
  * @event onclick
  * Fired when this view is clicked
  * @param {dr.view} view The dr.view that fired the event
 */

 /**
  * @event onmouseover
  * Fired when the mouse moves over this view
  * @param {dr.view} view The dr.view that fired the event
 */

 /**
  * @event onmouseout
  * Fired when the mouse moves off this view
  * @param {dr.view} view The dr.view that fired the event
 */

 /**
  * @event onmousedown
  * Fired when the mouse goes down on this view
  * @param {dr.view} view The dr.view that fired the event
 */

 /**
  * @event onmouseup
  * Fired when the mouse goes up on this view
  * @param {dr.view} view The dr.view that fired the event
 */

 /**
  * @event onscroll
  * Fired when the scroll position changes. Also provides information about
  * the scroll width and scroll height though it does not refire when those
  * values change since the DOM does not generate an event when they do. This
  * event is typically delayed by a few millis after setting scrollx or
  * scrolly since the underlying DOM event fires during the next DOM refresh
  * performed by the browser.
  * @param {Object} scroll The following four properties are defined:
  *     scrollx:number The horizontal scroll position.
  *     scrolly:number The vertical scroll position.
  *     scrollwidth:number The width of the scrollable area. Note this is
  *       not the maximum value for scrollx since that depends on the bounds
  *       of the scrollable view. The maximum can be calculated using this
  *       formula: scrollwidth - view.width + 2*view.border
  *     scrollheight:number The height of the scrollable area. Note this is
  *       not the maximum value for scrolly since that depends on the bounds
  *       of the scrollable view. The maximum can be calculated using this
  *       formula: scrollheight - view.height + 2*view.border
  *
  */

/**
  * @attribute {dr.view[]} subviews
  * @readonly
  * An array of this views's child views
  */

/**
  * @attribute {dr.layout[]} layouts
  * @readonly
  * An array of this views's layouts. Only defined when needed.
  */

define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js');
    require('$SPRITE/View.js');
    require('$LIB/dr/layout/AutoPropertyLayout.js');
    require('../model/Path.js');
    
    module.exports = dr.View = new JS.Class('View', dr.Node, {
        include: [
            require('$LIB/dr/SpriteBacked.js'),
            require('$LIB/dr/events/PlatformObserver.js')
        ],
        
        
        // Class Methods and Attributes ////////////////////////////////////////////
        extend: {
            ATTR_TYPES: {
                ignorelayout:'boolean',
                layouthint:'json',
                
                focustrap:'boolean',
                focuscage:'boolean',
                maskfocus:'boolean',
                focusable:'boolean',
                focused:'boolean',
                focusembellishment:'boolean',
                
                scrollable:'boolean',
                scrollx:'number',
                scrolly:'number',
                
                bordercolor:'color',
                borderstyle:'string',
                border:'positivenumber',
                padding:'positivenumber',
                topborder:'positivenumber',
                bottomborder:'positivenumber',
                leftborder:'positivenumber',
                rightborder:'positivenumber',
                toppadding:'positivenumber',
                bottompadding:'positivenumber',
                leftpadding:'positivenumber',
                rightpadding:'positivenumber',
                
                cornerradius:'positivenumber',
                topleftcornerradius:'positivenumber',
                toprightcornerradius:'positivenumber',
                bottomleftcornerradius:'positivenumber',
                bottomrightcornerradius:'positivenumber',
                
                xscale:'positivenumber',
                yscale:'positivenumber',
                rotation:'number',
                z:'number',
                xanchor:'*',
                yanchor:'*',
                zanchor:'*',
                
                clickable:'boolean',
                clip:'boolean',
                bgcolor:'color',
                boxshadow:'expression',
                gradient:'expression',
                opacity:'number',
                visible:'boolean',
                cursor:'string',
                x:'number',
                y:'number',
                width:'positivenumber',
                height:'positivenumber'
            },
            
            // Attribute descriptions used in the editor
            attributes: {
              x: {
                type: 'number',
                value: 0,
                importance: 10,
              },
              y: {
                type: 'number',
                value: 0,
                importance: 11,
              },
              width: {
                type: 'number',
                value: 0,
                importance: 12,
              },
              height: {
                type: 'number',
                value: 0,
                importance: 13,
              },
              
              bgcolor: {
                type: 'color',
                value: 'transparent',
                importance: 20,
              },
              
              visible: {
                type: 'boolean',
                value: false,
                importance: 21,
              },
              opacity: {
                type: 'number',
                value: 1,
                importance: 22,
              },
              
              clip: {
                type: 'boolean',
                value: 'false',
                importance: 30,
              },
              scrollable: {
                type: 'boolean',
                value: 'false',
                importance: 30,
              },
              ignorelayout: {
                type: 'boolean',
                value: 'false',
                importance: 40,
              }
            }
        },
        
        
        // Life Cycle //////////////////////////////////////////////////////////////
        /** @overrides dr.Node */
        initNode: function(parent, attrs) {
            this.subviews = [];
            if (attrs.$tagname === undefined) {
              attrs.$tagname = 'view';
            }
            
            // Used in many calculations so precalculating for performance.
            this.__fullBorderPaddingWidth = this.__fullBorderPaddingHeight = 0;
            
            // Initialize default values to reduce setter calls during initialization
            this.x = this.y = this.width = this.height = this.innerwidth = this.innerheight =
                this.boundsx = this.boundsy = this.boundswidth = this.boundsheight = this.boundsxdiff = this.boundsydiff = 
                this.rotation = this.z = 
                this.leftborder = this.rightborder = this.topborder = this.bottomborder = this.border = 
                this.leftpadding = this.rightpadding = this.toppadding = this.bottompadding = this.padding = 
                this.topleftcornerradius = this.toprightcornerradius = this.bottomleftcornerradius = this.bottomrightcornerradius = this.cornerradius = 
                this.scrollx = this.scrolly = 0;
            this.opacity = this.xscale = this.yscale = 1;
            this.visible = this.focusembellishment = true;
            this.focusable = this.clickable = this.ignorelayout = this.clip = this.scrollable = this.isaligned = this.isvaligned = false;
            this.bgcolor = this.bordercolor = 'transparent';
            this.borderstyle = 'solid';
            this.cursor = 'auto';
            this.xanchor = this.yanchor = 'center';
            this.zanchor = 0;
            
            // Initialize __cfg_ values too
            this.__cfg_x = this.__cfg_y = this.__cfg_width = this.__cfg_height = this.__cfg_innerwidth = this.__cfg_innerheight =
                this.__cfg_boundsx = this.__cfg_boundsy = this.__cfg_boundswidth = this.__cfg_boundsheight = this.__cfg_boundsxdiff = this.__cfg_boundsydiff = 
                this.__cfg_rotation = this.__cfg_z = 
                this.__cfg_leftborder = this.__cfg_rightborder = this.__cfg_topborder = this.__cfg_bottomborder = this.__cfg_border = 
                this.__cfg_leftpadding = this.__cfg_rightpadding = this.__cfg_toppadding = this.__cfg_bottompadding = this.__cfg_padding = 
                this.__cfg_topleftcornerradius = this.__cfg_toprightcornerradius = this.__cfg_bottomleftcornerradius = this.__cfg_bottomrightcornerradius = this.__cfg_cornerradius = 
                this.__cfg_scrollx = this.__cfg_scrolly = 0;
            this.__cfg_opacity = this.__cfg_xscale = this.__cfg_yscale = 1;
            this.__cfg_visible = this.__cfg_focusembellishment = true;
            this.__cfg_focusable = this.__cfg_clickable = this.__cfg_ignorelayout = this.__cfg_clip = this.__cfg_scrollable = this.__cfg_isaligned = this.__cfg_isvaligned = false;
            this.__cfg_bgcolor = this.__cfg_bordercolor = 'transparent';
            this.__cfg_borderstyle = 'solid';
            this.__cfg_cursor = 'auto';
            this.__cfg_xanchor = this.__cfg_yanchor = 'center';
            this.__cfg_zanchor = 0;
            
            this.set_sprite(this.createSprite(attrs));
            
            var clickableWasDisabled = attrs.clickable === 'false';
            this.callSuper(parent, attrs);
            if (clickableWasDisabled) return;
            
            var clickableEvents = ['onmousedown', 'onmouseup', 'onmouseover', 'onmouseout', 'onclick']; 
            for (var i = 0; i < clickableEvents.length; i++) {
                if (this.hasObservers(clickableEvents[i])) {
                    this.setAttribute('clickable', true);
                    break;
                }
            }
        },
        
        doBeforeAdoption: function() {
            this.__updateBounds(true);
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
        setAttribute: function(attrName, value) {
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
                return this.callSuper(attrName, constraint !== undefined ? constraint : value);
            } else {
                return this;
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
                    this.setSimpleActual(alignattr, true, true);
                    return this.constraintify("this." + boundsdiff);
                } else if (normValue === 'middle' || normValue === 'center') {
                    this.setSimpleActual(alignattr, true, true);
                    this[key] = true;
                    return this.constraintify("((this.parent." + axis + " - this." + boundssize + ") / 2) + this." + boundsdiff);
                } else if (normValue === 'end' || (isX && normValue === 'right') || (!isX && normValue === 'bottom')) {
                    this.setSimpleActual(alignattr, true, true);
                    this[key] = true;
                    return this.constraintify("this.parent." + axis + " - this." + boundssize + " + this." + boundsdiff);
                } else if (normValue === 'none') {
                    this.setSimpleActual(alignattr, false, true);
                    return dr.noop;
                }
            } else {
                this.setSimpleActual(name === 'x' ? 'isaligned' : 'isvaligned', false, true);
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
                    return this.constraintify("Math.max(dr.global.viewportResize." + axis + " * " + scale + ", this.min" + axis + ")");
                } else {
                    return this.constraintify("this.parent." + axis + " * " + scale);
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
        
        getSubviews: function() {
            return this.subviews;
        },
        
        /** Gets the views that are our siblings.
            @returns array of dr.View or null if this view is orphaned. */
        getSiblingViews: function() {
            if (!this.parent) return null;
            var self = this;
            return this.parent.getSubviews().filter(function(v) {return v !== self;});
        },
        
        // Layout Attributes //
        /** Does lazy instantiation of the layouts array.
            @param noAuto:boolan (Optional) If provided any "auto" layouts
                will be filtered out.
            @returns array The list of layouts. */
        getLayouts: function(noAuto) {
            var retval = this.layouts || (this.layouts = []);
            
            if (noAuto) {
                var i = retval.length;
                if (i) {
                    var filtered = [], layout;
                    while (i) {
                        layout = retval[--i];
                        if (!layout.isA(dr.AutoPropertyLayout)) filtered.push(layout);
                    }
                    retval = filtered;
                }
            }
            
            return retval;
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
                    dr.global.focus[this.focused ? 'notifyFocus' : 'notifyBlur'](this);
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
            v = isNaN(v) ? 0 : Math.max(0, Math.min(this.sprite.getScrollWidth() - this.width + this.leftborder + this.rightborder, v));
            this.setActual('scrollx', v, 'number', 0);
        },
        
        set_scrolly: function(v) {
            v = isNaN(v) ? 0 : Math.max(0, Math.min(this.sprite.getScrollHeight() - this.height + this.topborder + this.bottomborder, v));
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
        
        // Border and Padding Attributes //
        set_bordercolor: function(v) {this.setActual('bordercolor', v, 'color', 'transparent');},
        set_borderstyle: function(v) {this.setActual('borderstyle', v, 'string', 'solid');},
        
        set_border: function(v) {this.__setBP('border', v);},
        set_padding: function(v) {this.__setBP('padding', v);},
        
        /** @private */
        __setBP: function(type, v) {
            this.__lockRecalc = true;
            this.setAttribute('top' + type, v);
            this.setAttribute('bottom' + type, v);
            this.setAttribute('left' + type, v);
            this.setAttribute('right' + type, v);
            this.__lockRecalc = false;
            
            this.__fullBorderPaddingWidth = this.leftborder + this.rightborder + this.leftpadding + this.rightpadding;
            this.__fullBorderPaddingHeight = this.topborder + this.bottomborder + this.toppadding + this.bottompadding;
            
            this.setActual(type, v, 'positivenumber', 0);
            
            this.__updateInnerWidth();
            this.__updateInnerHeight();
        },
        
        set_topborder: function(v) {this.__updateBP('topborder', v, true, true);},
        set_bottomborder: function(v) {this.__updateBP('bottomborder', v, true, true);},
        set_leftborder: function(v) {this.__updateBP('leftborder', v, false, true);},
        set_rightborder: function(v) {this.__updateBP('rightborder', v, false, true);},
        
        set_toppadding: function(v) {this.__updateBP('toppadding', v, true, false);},
        set_bottompadding: function(v) {this.__updateBP('bottompadding', v, true, false);},
        set_leftpadding: function(v) {this.__updateBP('leftpadding', v, false, false);},
        set_rightpadding: function(v) {this.__updateBP('rightpadding', v, false, false);},
        
        /** @private */
        __updateBP: function(attrName, v, vertical, isBorder) {
            if (this.setActual(attrName, v, 'positivenumber', 0) && !this.__lockRecalc) {
                if (vertical) {
                    this.__fullBorderPaddingHeight = this.topborder + this.bottomborder + this.toppadding + this.bottompadding;
                } else {
                    this.__fullBorderPaddingWidth = this.leftborder + this.rightborder + this.leftpadding + this.rightpadding;
                }
                
                var test;
                if (isBorder) {
                    test = this.topborder;
                    if (this.bottomborder === test && this.leftborder === test && this.rightborder === test) {
                        this.setSimpleActual('border', test, true);
                    } else if (this.border != null) {
                        this.setSimpleActual('border', undefined, true);
                    }
                } else {
                    test = this.toppadding;
                    if (this.bottompadding === test && this.leftpadding === test && this.rightpadding === test) {
                        this.setSimpleActual('padding', test, true);
                    } else if (this.padding != null) {
                        this.setSimpleActual('padding', undefined, true);
                    }
                }
                
                if (vertical) {
                    this.__updateInnerHeight();
                } else {
                    this.__updateInnerWidth();
                }
            }
        },
        
        /** @private */
        __updateInnerWidth: function() {
            var inset = this.__fullBorderPaddingWidth;
            // Prevent width less than horizontal border padding
            if (inset > this.width) this.set_width(inset);
            this.setActual('innerwidth', this.width - inset, 'positivenumber', 0);
        },
        
        /** @private */
        __updateInnerHeight: function() {
            var inset = this.__fullBorderPaddingHeight;
            // Prevent height less than vertical border padding
            if (inset > this.height) this.set_height(inset);
            this.setActual('innerheight', this.height - inset, 'positivenumber', 0);
        },
        
        // Corner Attributes //
        set_cornerradius: function(v) {
            this.__lockRecalc = true;
            this.setAttribute('topleftcornerradius', v);
            this.setAttribute('toprightcornerradius', v);
            this.setAttribute('bottomleftcornerradius', v);
            this.setAttribute('bottomrightcornerradius', v);
            this.__lockRecalc = false;
            
            this.setActual('cornerradius', v, 'positivenumber', 0);
        },
        
        set_topleftcornerradius: function(v) {this.__updateCornerRadius('topleftcornerradius', v);},
        set_toprightcornerradius: function(v) {this.__updateCornerRadius('toprightcornerradius', v);},
        set_bottomleftcornerradius: function(v) {this.__updateCornerRadius('bottomleftcornerradius', v);},
        set_bottomrightcornerradius: function(v) {this.__updateCornerRadius('bottomrightcornerradius', v);},
        
        /** @private */
        __updateCornerRadius: function(attrName, v) {
            if (this.setActual(attrName, v, 'positivenumber', 0) && !this.__lockRecalc) {
                var test = this.topleftcornerradius;
                if (this.toprightcornerradius === test && this.bottomleftcornerradius === test && this.bottomrightcornerradius === test) {
                    this.setSimpleActual('cornerradius', test, true);
                } else if (this.cornerradius != null) {
                    this.setSimpleActual('cornerradius', undefined, true);
                }
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
        set_boxshadow: function(v) {this.setActual('boxshadow', v, 'expression');},
        set_gradient: function(v) {this.setActual('gradient', v, 'expression');},
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
        
        /** Updates the boundswidth and boundsheight attributes.
            @private
            @returns void */
        __updateBounds: function(forceUpdate) {
            if (forceUpdate || this.initing === false) {
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
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @overrides */
        getTypeForAttrName: function(attrName) {
            var retval = dr.View.ATTR_TYPES[attrName];
            return retval ? retval : this.callSuper();
        },
        
        /** Gets the x and y position of the underlying dom element relative to
            the page. Transforms are not supported.
            @returns object with 'x' and 'y' keys or null if no position could
                be determined. */
        getAbsolutePosition: function(ancestorView) {
            return this.sprite.getAbsolutePosition(ancestorView);
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
            the root view is also visible. Dom elements are not explicitly
            checked. If you need to check that use dr.DomElementProxy.isDomElementVisible.
            @returns true if this view is visible, false otherwise. */
        isVisible: function() {
            return this.searchAncestorsOrSelf(function(v) {return !v.visible;}) === null;
        },
        
        /** @overrides dr.Node
            Calls this.doSubviewAdded if the added subnode is a dr.View. 
            @fires subviewAdded event with the provided Node if it's a View. 
            @fires layoutAdded event with the provided node if it's a Layout. */
        doSubnodeAdded: function(node) {
            if (node instanceof dr.View) {
                this.sprite.appendSprite(node.sprite);
                this.getSubviews().push(node);
                this.sendEvent('onsubviewAdded', node);
                this.doSubviewAdded(node);
            } else if (node instanceof dr.Layout) {
                this.getLayouts().push(node);
                this.sendEvent('onlayoutAdded', node);
                this.doLayoutAdded(node);
            }
        },
        
        /** @overrides dr.Node
            Calls this.doSubviewRemoved if the remove subnode is a dr.View.
            @fires subviewRemoved event with the provided Node if it's a View
                and removal succeeds. 
            @fires layoutRemoved event with the provided Node if it's a Layout
                and removal succeeds. */
        doSubnodeRemoved: function(node) {
            var idx;
            if (node instanceof dr.View) {
                idx = this.getSubviewIndex(node);
                if (idx !== -1) {
                    this.sendEvent('onsubviewRemoved', node);
                    this.sprite.removeSprite(node.sprite);
                    this.subviews.splice(idx, 1);
                    this.doSubviewRemoved(node);
                }
            } else if (node instanceof dr.Layout) {
                idx = this.getLayoutIndex(node);
                if (idx !== -1) {
                    this.sendEvent('onlayoutRemoved', node);
                    this.layouts.splice(idx, 1);
                    this.doLayoutRemoved(node);
                }
            }
        },
        
        // Siblings //
        /** Gets the next sibling view of this view. */
        getNextSiblingView: function() {
            return this.sprite.getNextSiblingView();
        },
        
        /** Gets the last sibling view. */
        getLastSiblingView: function() {
            return this.sprite.getLastSiblingView();
        },
        
        /** Gets the previous sibling view. */
        getPrevSiblingView: function() {
            return this.sprite.getPrevSiblingView();
        },
        
        /** Gets the first sibling view. */
        getFirstSiblingView: function() {
            return this.sprite.getFirstSiblingView();
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
        
        /** Gets the subview at the provided index. */
        getSubviewAtIndex: function(index) {
            var subviews = this.getSubviews();
            if (subviews.length > index) return subviews[index];
            return null;
        },
        
        /** Called when a View is added to this View. Do not call this method to 
            add a View. Instead call addSubnode or set_parent.
            @param sv:View the view that was added.
            @returns void */
        doSubviewAdded: function(sv) {},
        
        /** Called when a View is removed from this View. Do not call this method 
            to remove a View. Instead call removeSubnode or set_parent.
            @param sv:View the view that was removed.
            @returns void */
        doSubviewRemoved: function(sv) {},
        
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
        doLayoutAdded: function(layout) {},
        
        /** Called when a Layout is removed from this View. Do not call this 
            method to remove a Layout. Instead call removeSubnode or set_parent.
            @param layout:Layout the layout that was removed.
            @returns void */
        doLayoutRemoved: function(layout) {},
        
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
        getPrevFocus: function() {},
        
        // Paint and Focus Cycle Ordering
        /** Tests if the provided view is behind this view. The view to test 
            can be anywhere in the screen.
            @param view:dr.View the view to check.
            @returns boolean: true if the view is behind this view, 
                false otherwise. */
        isBehind: function(view) {
            return view && view.isA(dr.View) ? this.sprite.isBehind(view) : false;
        },
        
        /** Tests if the provided view is front of this view. The view to test 
            can be anywhere in the screen.
            @param view:dr.View the view to check.
            @returns boolean: true if the view is in front of this view, 
                false otherwise. */
        isInFrontOf: function(view) {
            return view && view.isA(dr.View) ? this.sprite.isInFrontOf(view) : false;
        },
        
        /** Moves this view in front of all other sibling views.
            @returns This object for chainability. */
        moveToFront: function() {
            if (this.sprite.moveToFront()) {
                // Reorder parent subviews
                var parent = this.parent, svs = parent.subviews, i = svs.length;
                while (i) {
                    if (svs[--i] === this) {
                        svs.splice(i, 1);
                        svs.push(this);
                        break;
                    }
                }
                parent.sendEvent('onsubvieworderchange', this);
            }
            return this;
        },
        
        /** Moves this view behind all other sibling views.
            @returns This object for chainability. */
        moveToBack: function() {
            if (this.sprite.moveToBack()) {
                // Reorder parent subviews
                var parent = this.parent, svs = parent.subviews, i = svs.length;
                while (i) {
                    if (svs[--i] === this) {
                        svs.splice(i, 1);
                        svs.unshift(this);
                        break;
                    }
                }
                parent.sendEvent('onsubvieworderchange', this);
            }
            return this;
        },
        
        moveForward: function() {
            var nextSibling = this.getNextSiblingView();
            if (nextSibling) this.moveInFrontOf(nextSibling);
        },
        
        moveBackward: function() {
            var prevSibling = this.getPrevSiblingView();
            if (prevSibling) this.moveBehind(prevSibling);
        },
        
        /** Moves this view in front of the provided sibling view.
            @param {dr.view} The view to move in front of.
            @returns This object for chainability. */
        moveInFrontOf: function(siblingView) {
            var parent = this.parent;
            if (siblingView && siblingView.isA(dr.View) && siblingView.parent === parent) {
                if (this.sprite.moveInFrontOf(siblingView)) {
                    // Reorder parent subviews
                    var svs = parent.subviews, i = svs.length, sv;
                    while (i) {
                        if (svs[--i] === this) {
                            svs.splice(i, 1);
                            break;
                        }
                    }
                    i = svs.length
                    while (i) {
                        if (svs[--i] === siblingView) {
                            svs.splice(i + 1, 0, this);
                            break;
                        }
                    }
                    
                    parent.sendEvent('onsubvieworderchange', this);
                }
            }
            return this;
        },
        
        /** Moves this view behind the provided sibling view.
            @param {dr.view} The view to move behind.
            @returns This object for chainability. */
        moveBehind: function(siblingView) {
            var parent = this.parent;
            if (siblingView && siblingView.isA(dr.View) && siblingView.parent === parent) {
                if (this.sprite.moveBehind(siblingView)) {
                    // Reorder parent subviews
                    var svs = parent.subviews, i = svs.length, sv;
                    while (i) {
                        if (svs[--i] === this) {
                            svs.splice(i, 1);
                            break;
                        }
                    }
                    i = svs.length
                    while (i) {
                        if (svs[--i] === siblingView) {
                            svs.splice(i, 0, this);
                            break;
                        }
                    }
                    parent.sendEvent('onsubvieworderchange', this);
                }
            }
            return this;
        },
        
        // Hit Testing //
        /** Checks if the provided location is inside this view or not.
            @param locX:number the x position to test.
            @param locY:number the y position to test.
            @param referenceFrameView:dr.view (optional) The view
                the locX and locY are relative to. If not provided the page is
                assumed.
            @returns boolean True if the location is inside this view, false 
                if not. */
        containsPoint: function(locX, locY, referenceFrameView) {
            if (this.destroyed) return false;
            var pos = this.getAbsolutePosition(referenceFrameView);
            return this.rectContainsPoint(locX, locY, pos.x, pos.y, this.width, this.height);
        },
        
        /** Checks if the provided point is inside or on the edge of the provided 
            rectangle.
            @param pX:number the x coordinate of the point to test.
            @param pY:number the y coordinate of the point to test.
            @param rX:number the x coordinate of the rectangle.
            @param rY:number the y coordinate of the rectangle.
            @param rW:number the width of the rectangle.
            @param rH:number the height of the rectangle.
            
            Alternate Params:
            @param pX:object a point object with properties x and y.
            @param rX:object a rect object with properties x, y, width and height.
            
            @returns boolean True if the point is inside or on the rectangle. */
        rectContainsPoint: function(pX, pY, rX, rY, rW, rH) {
            if (typeof pX === 'object') {
                rH = rW;
                rW = rY;
                rY = rX;
                rX = pY;
                pY = pX.y;
                pX = pX.x;
            }
            
            if (typeof rX === 'object') {
                rH = rX.height;
                rW = rX.width;
                rY = rX.y;
                rX = rX.x;
            }
            
            return pX >= rX && pY >= rY && pX <= rX + rW && pY <= rY + rH;
        },
        
        /** Checks if the provided location is visible on this view and is not
            masked by the bounding box of the view or any of its ancestor views.
            @returns boolean: true if visible, false otherwise. */
        isPointVisible: function(locX, locY) {
            var pos = this.getAbsolutePosition();
            this.calculateEffectiveScale();
            return this.__isPointVisible(locX - pos.x, locY - pos.y);
        },
        
        /** @private */
        __isPointVisible: function(x, y) {
            var effectiveScale = this.__effectiveScale;
            
            if (this.rectContainsPoint(x, y, 0, 0, this.width * effectiveScale, this.height * effectiveScale)) {
                var p = this.parent;
                if (p) {
                    var parentSprite = p.sprite, pScale = p.__effectiveScale;
                    return p.__isPointVisible(x + (this.x - parentSprite.getScrollX()) * pScale, y + (this.y - parentSprite.getScrollY()) * pScale);
                }
                return true;
            }
            return false;
        },
        
        calculateEffectiveScale: function() {
            var ancestors = this.getAncestors(), i = ancestors.length, ancestor,
                effectiveScale = 1;
            while (i) {
                ancestor = ancestors[--i];
                effectiveScale *= ancestor.xscale || 1;
                ancestor.__effectiveScale = effectiveScale;
            }
        },
        
        getEffectiveScale: function() {
            this.calculateEffectiveScale();
            return this.__effectiveScale;
        },
        
        // Editor Support //
        __layoutDomainInUseForView: function(domain) {
            // Check for management by parent layouts
            var parent = this.parent,
                layouts = parent.getLayouts(),
                i = layouts.length, layout;
            while (i) {
                layout = layouts[--i];
                if (layout.hasSubview(this) && layout.__getLayoutDomains()[domain]) return true;
            }
            
            // Checked for management by child layouts
            layouts = this.getLayouts();
            i = layouts.length;
            while (i) {
                layout = layouts[--i];
                if (layout.updateparent && layout.__getLayoutParentDomains()[domain]) return true;
            }
            
            return false;
        }
    });
});
