/**
      * @class dr.wrappinglayout {Layout}
      * @extends dr.variablelayout
      * An extension of variableLayout similar to spaced layout but with the
      * added functionality of wrapping the views onto a new line (or column
      * if the axis is "y") whenever they would overflow the available space. 
      * This layout positions views horizontally or vertically using an initial
      * inset and spacing between each view. The outset is used in the 
      * calculation of available space so that the last view in each line will 
      * have at least "outset" space after it.
      *
      * Lines/Columns are positioned in a similar fashion to the individual views
      * using lineinset, linespacing and lineoutset. If updateparent is true
      * the lineoutset is used to leave space after the last line.
      *
      * A line break can be forced by using a "break" layouthint on a managed
      * view. The layout hint "break" will force the subview to start a new
      * line/column with that subview as the first view in the line/column.
      *
      * Since wrappinglayouts rely on the innerwidth/height of the parent view
      * to determine when to wrap auto sizing on the parent view along the same
      * axis as the wrappinglayout will result in unexpected behavior and 
      * should therefore be avoided.
      * 
      *     @example
      *     <view width="500" height="150" bgcolor="#FFF4FC">
      *       <wrappinglayout axis="y" spacing="2" inset="5" outset="5" lineinset="10" linespacing="5" lineoutset="10">
      *       </wrappinglayout>
      *
      *       <view width="120" height="35" bgcolor="lightpink"></view>
      *       <view width="120" height="45" bgcolor="plum" layouthint='{"break":true}'></view>
      *       <view width="120" height="25" bgcolor="lightblue"></view>
      *       <view width="120" height="25" bgcolor="lightblue"></view>
      *       <view width="120" height="25" bgcolor="lightblue"></view>
      *       <view width="120" height="25" bgcolor="lightblue"></view>
      *       <view width="120" height="25" bgcolor="lightblue"></view>
      *     </view>
      */
/**
    * @attribute {Number} [spacing=0]
    * The spacing between views.
    */
/**
    * @attribute {Number} [outset=0]
    * Space after the last view.
    */
/**
    * @attribute {Number} [inset=0]
    * Space before the first view. This is an alias for the "value" attribute.
    */
/**
    * @attribute {Number} [linespacing=0]
    * The spacing between each line of views.
    */
/**
    * @attribute {Number} [lineoutset=0]
    * Space after the last line of views. Only used when updateparent is true.
    */
/**
    * @attribute {Number} [lineinset=0]
    * Space before the first line of views.
    */
/**
    * @attribute {boolean} [justify=false]
    * Justifies lines/columns
    */
/**
    * @attribute {String} [align='left']
    * Aligns lines/columns left/top, right/bottom or center/middle. If
    * justification is true this has no effect except on a line or column that
    * has only one item.
    */
/**
    * @attribute {String} [linealign='none']
    * Aligns the items in a line relative to each other. Supported values are
    * top/left, bottom/right and middle/center and none. If the value is
    * none, no line alignment will be performed which means transformed views
    * may overlap preceeding lines.
    */
/**
    * @attribute {String} [axis='x']
    * The orientation of the layout. Supported values are 'x' and 'y'.
    * A value of 'x' will orient the views horizontally with lines being
    * positioned vertically below the preceding line. A value of 'y' will 
    * orient the views vertically with columns positioned horizontally to 
    * the right of the preceding column. This is an alias for the "attribute" 
    * attribute.
    */
/**
    * @attribute attribute
    * @private
    * The axis attribute is an alias for this attribute.
    */
/**
    * @method doLineStart
    * Called at the start of the laying out of each line.
    * @param {Number} lineindex The index of the line being layed out.
    * @param {*} value The value at the start of laying out the line.
    * @return {void}
    */
/**
    * @method doLineEnd
    * Called at the end of the laying out of each line.
    * @param {Number} lineindex The index of the line being layed out.
    * @param {Array} items The items layed out in the line in the order they
    * were layed out.
    * @param {*} value The value at the end of laying out the line.
    * @return {void}
    */
/**
    * @event onlinecount
    * Fired after update.
    * @param {Number} The number of lines layed out for x-axis layouts or 
    * columns for layed out for y-axis layouts.
    */
/**
    * @event onmaxsize
    * Fired after update.
    * @param {Number} The maximum width achieved by any line for x-axis layouts
    * or maximum height achieved by any column for y-axis layouts.
    */
