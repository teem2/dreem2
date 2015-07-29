/**
   * @mixin dr.dropsource {UI Behavior}
   * Makes a dr.view support being a source for dr.dropable instances. Makes
   * use of dr.draggable for handling drag initiation but this view is not
   * itself, actually draggable.
   */
/**
    * @attribute {dr.view} dropparent
    * The view to make the dr.dropable instances in. Defaults to the 
    * dr.RootView that contains this drop source.
    */
/**
    * @attribute {Object} dropclass
    * The dr.dropable class that gets created in the default implementation 
    * of makeDropable.
    */
/**
    * @attribute {Object} dropclassattrs
    * The attrs to use when making the dropClass instance.
    */
/**
    * @attribute {Object} dropable
    * @readonly
    * The dropable that was most recently created. Once the dropable has been 
    * dropped this will be set to null.
    */
/**
    * @method startDrag
    * @overrides dr.draggable
    */
/**
    * @method doMouseUp
    * @overrides dr.mousedown
    */
/**
    * @method makeDropable
    * Called by startDrag to make a dropable.
    * @returns {dr.dropable} or undefined if one can't be created.
    */
