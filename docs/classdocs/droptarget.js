/**
   * @mixin dr.droptarget {UI Behavior}
   * Makes a dr.view support having dr.dropable views dropped on it.
   */
/**
    * @method willAcceptDrop
    * Called by dr.GlobalDragManager when a dropable is dragged over this
    * target. Gives this drop target a chance to reject a drop regardless
    * of drag group. The default implementation returns true if the view
    * is not disabled.
    * @param {dr.dropable} The dropable being dragged.
    * @returns {Boolean} True if the drop will be allowed, false otherwise.
    */
/**
    * @method notifyDragStart
    * @abstract
    * Called by dr.GlobalDragManager when a dropable starts being dragged
    * that has a matching drag group.
    * @param {dr.dropable} The dropable being dragged.
    * @returns {void}
    */
/**
    * @method notifyDragStop
    * @abstract
    * Called by dr.GlobalDragManager when a dropable stops being dragged
    * that has a matching drag group.
    * @param {dr.dropable} The dropable no longer being dragged.
    * @returns {void}
    */
/**
    * @method notifyDragEnter
    * @abstract
    * Called by dr.GlobalDragManager when a dropable is dragged over this
    * view and has a matching drag group.
    * @param {dr.dropable} The dropable being dragged over this view.
    * @returns {void}
    */
/**
    * @method notifyDragLeave
    * @abstract
    * Called by dr.GlobalDragManager when a dropable is dragged out of this
    * view and has a matching drag group.
    * @param {dr.dropable} The dropable being dragged out of this view.
    * @returns {void}
    */
/**
    * @method notifyDrop
    * @abstract
    * Called by dr.GlobalDragManager when a dropable is dropped onto this
    * view and has a matching drag group.
    * @param {dr.dropable} The dropable being dropped onto this view.
    * @returns {void}
    */
