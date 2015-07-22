/**
      * @class dr.alignlayout {Layout}
      * @extends dr.variablelayout
      * A variablelayout that aligns each view vertically or horizontally
      * relative to all the other views.
      *
      * If updateparent is true the parent will be sized to fit the
      * aligned views such that the view with the greatest extent will have
      * a position of 0. If instead updateparent is false the views will
      * be aligned within the inner extent of the parent view.
      *
      *     @example
      *     <alignlayout align="middle" updateparent="true"></alignlayout>
      *
      *     <view x="0" width="50" height="35" bgcolor="plum"></view>
      *     <view x="55" width="50" height="25" bgcolor="lightpink"></view>
      *     <view x="110" width="50" height="15" bgcolor="lightblue"></view>
      */
/**
    * @attribute {String} [align='middle']
    * Determines which way the views are aligned. Supported values are 
    * 'left', 'center', 'right' for horizontal alignment and 'top', 'middle' 
    * and 'bottom' for vertical alignment.
    */
/**
    * @attribute {boolean} [inset=0]
    * Determines if the parent will be sized to fit the aligned views such 
    * that the view with the greatest extent will have a position of 0. If 
    * instead updateparent is false the views will be aligned within the 
    * inner extent of the parent view.
    */
/**
    * @method doBeforeUpdate
    * Determine the maximum subview width/height according to the alignment.
    * This is only necessary if updateparent is true since we will need to
    * know what size to make the parent as well as what size to align the
    * subviews within.
    */
