/**
      * @class dr.spacedlayout {Layout}
      * @extends dr.variablelayout
      * An extension of variableLayout that positions views horizontally or
      * vertically using an initial inset and spacing between each view. If
      * updateparent is true an outset is also used to leave space after
      * the last subview.
      *
      * Each view managed by a spaced layout supports two layout hints.
      *     spacingbefore {Number} Indicates custom spacing to use before the
      *         view. This value overrides spacing for the view it is defined
      *         on. If spacingafter was used on the previous view this will
      *         override that. Ignored for the first view layed out.
      *     spacingafter {Number} Indicates custom spacing to use after the
      *         view. This value overrides spacing for the view it is defined
      *         on. Ignord on the last view layed out.
      *
      * This spacedlayout will position the first view at a y of 5 and each
      * subsequent view will be 2 pixels below the bottom of the preceding one.
      * Since updateparent is true and an outset is defined the parent view
      * will be sized to 5 pixels more than the bottom of the last view. A
      * layout hint has been used on the fourth view so that it will have
      * 10 pixels of space before it and 5 pixels of space after it instead
      * of the spacing of 2 defined on the layout.
      *
      *     @example
      *     <spacedlayout axis="y" spacing="2" inset="5" outset="5" updateparent="true">
      *     </spacedlayout>
      *
      *     <view width="100" height="25" bgcolor="lightpink"></view>
      *     <view width="100" height="35" bgcolor="plum"></view>
      *     <view width="100" height="15" bgcolor="lightblue"></view>
      *     <view width="100" height="35" bgcolor="plum" layouthint='{"spacingbefore":10, "spacingafter":5}'></view>
      *     <view width="100" height="15" bgcolor="lightblue"></view>
      */
/**
    * @attribute {Number} [spacing=0]
    * The spacing between views.
    */
/**
    * @attribute {Number} [outset=0]
    * Space after the last view. Only used when updateparent is true.
    */
/**
    * @attribute {Number} [inset=0]
    * Space before the first view. This is an alias for the "value" attribute.
    * attribute.
    */
/**
    * @attribute {String} [axis='x']
    * The orientation of the layout. Supported values are 'x' and 'y'.
    * A value of 'x' will orient the views horizontally and a value of 'y'
    * will orient them vertically. This is an alias for the "attribute" 
    * attribute.
    */
/**
    * @attribute attribute
    * @private
    * The axis attribute is an alias for this attribute.
    */
