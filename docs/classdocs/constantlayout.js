/**
      * @class dr.constantlayout {Layout}
      * @extends dr.layout
      * A layout that sets the target attribute name to the target value for
      * each sibling view of the layout.
      *
      * This layout is useful if you want to ensure that an attribute value is 
      * shared in common by most or all children of a view. It also makes
      * updating that value easy since you can change the value on the
      * constant layout and it will be applied to all the managed sibling views.
      *
      * This constant layout will set the y attribute to 10 for every sibling
      * view. Furthermore, since it's a layout, any new sibling view added
      * will also have its y attribute set to 10. Also, notice that the sibling
      * view with the black bgcolor has ignorelayout set to true. This means
      * that view will be ignored by the layout and will thus not have its
      * y attribute set to 10. You can change ignorelayout at runtime and the
      * view will be added to, or removed from the layout. If you do remove a 
      * view at runtime from the layout the y attribute for that view will not 
      * be changed, but subsequent changes to the layout will no longer effect
      * the view.
      *
      *     @example
      *     <constantlayout attribute="y" value="10"></constantlayout>
      *
      *     <view width="100" height="25" bgcolor="lightpink"></view>
      *     <view width="100" height="25" bgcolor="plum"></view>
      *     <view ignorelayout="true" width="100" height="25" bgcolor="black"></view>
      *     <view width="100" height="25" bgcolor="lightblue"></view>
      */
/**
    * @attribute {String} [attribute=x]
    * The name of the attribute to update on each subview.
    */
/**
    * @attribute {*} [value=0]
    * The value to set the attribute to on each subview.
    */
/**
    * @attribute {*} [value=0]
    * The speed of an animated update of the managed views. If 0 no animation
    * will be performed
    */
/**
    * @method update
    * Set the attribute to the value on every subview managed by this layout.
    */
