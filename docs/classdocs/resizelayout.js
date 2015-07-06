/**
      * @class dr.resizelayout {Layout}
      * @extends dr.spacedlayout
      * An extension of spaced layout that allows one or more "stretchy" views 
      * to fill in any remaining space.
      *
      * A view can be made stretchy by giving it a layouthint with a numerical
      * value, typically 1. Extra space is divided proportionally between all
      * sretchy views based on that views percentage of the sum of the
      * "stretchiness" of all stretchy views. For example, a view with a
      * layouthint of 2 will get twice as much space as another view with
      * a layouthint of 1.
      *
      * Since resizelayouts rely on the presence of extra space, the
      * updateparent and updateparent attributes are not applicable to a 
      * resizelayout. Similarly, using auto sizing on the parent view along 
      * the same axis as the resizelayout will result in unexpected behavior 
      * and should therefore be avoided.
      *
      *     @example
      *     <resizelayout spacing="2" inset="5" outset="5">
      *     </resizelayout>
      *
      *     <view height="25" bgcolor="lightpink"></view>
      *     <view height="35" bgcolor="plum" layouthint='{"weight":1}'></view>
      *     <view height="15" bgcolor="lightblue"></view>
      */
