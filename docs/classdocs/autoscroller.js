/**
   * @mixin dr.autoscroller {UI Behavior}
   * Makes a dr.view auto scroll during drag and drop.
   */
/**
    * @attribute {Number} scrollborder
    * The thickness of the auto scroll border.
    */
/**
    * @attribute {Number} scrollfrequency
    * The time between autoscroll adjustments.
    */
/**
    * @attribute {Number} scrollamount
    * The number of pixels to adjust by each time.
    */
/**
    * @attribute {Number} scrollacceleration
    * The amount to increase scrolling by as the mouse gets closer to the 
    * edge of the view. Setting this to 0 will result in no acceleration.
    */
/**
    * @method notifyDragStart
    * Called by dr.GlobalDragManager when a dropable starts being dragged
    * that has a matching drag group.
    * @param (dr.dropable} dropable The dropable being dragged.
    * @returns {void} 
    */
/**
    * @method notifyDragStop
    * Called by dr.GlobalDragManager when a dropable stops being dragged
    * that has a matching drag group.
    * @param (dr.dropable} dropable The dropable no longer being dragged.
    * @returns {void} 
    */
/** @private */
/** @private */
/** @private */
/** @private */
/** @private */
