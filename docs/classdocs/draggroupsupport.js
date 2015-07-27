/**
   * @mixin dr.draggroupsupport {UI Behavior}
   * Adds drag group support to drag and drop related classes.
   */
/**
    * @attribute {Object} draggroups
    * The keys are the set of drag groups this view supports. By default the 
    * special drag group of '*' which accepts all drag groups is defined.
    */
/**
    * @method addDragGroup
    * Adds the provided dragGroup to the draggroups.
    * @param {String} dragGroup The drag group to add.
    * @returns {void} 
    */
/**
    * @method removeDragGroup
    * Removes the provided dragGroup from the draggroups.
    * @param {String} dragGroup The drag group to remove.
    * @returns {void} 
    */
/**
    * @method acceptAnyDragGroup
    * Determines if this drop target will accept drops from any drag group.
    * @returns {void} True if any drag group will be accepted, false otherwise.
    */
