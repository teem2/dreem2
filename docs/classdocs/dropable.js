/**
   * @mixin dr.dropable {UI Behavior}
   * Makes a dr.view drag and dropable via the mouse.
   */
/**
    * @attribute {Boolean} dropped
    * Indicates this dropable was just dropped.
    */
/**
    * @attribute {Boolean} dropfailed
    * Indicates this dropable was just dropped outside of a drop target.
    */
/**
    * @attribute {Object} droptarget
    * The drop target this dropable is currently over.
    */
/**
    * @method willPermitDrop
    * Called by dr.GlobalDragManager when a dropable is dragged over a
    * target. Gives this dropable a chance to reject a drop regardless
    * of drag group. The default implementation returns true.
    * @param {dr.droptarget} droptarget The drop target dragged over.
    * @returns {Boolean} True if the drop will be allowed, false otherwise.
    */
/**
    * @method startDrag
    * @overrides dr.draggable
    */
/**
    * @method updateDrag
    * @overrides dr.draggable
    */
/**
    * @method stopDrag
    * @overrides dr.draggable
    */
/**
    * @method notifyDragEnter
    * Called by dr.GlobalDragManager when this view is dragged over a drop
    * target.
    * @param {dr.droptarget} droptarget The target that was dragged over.
    * @returns {void}
    */
/**
    * @method notifyDragLeave
    * Called by dr.GlobalDragManager when this view is dragged out of a drop
    * target.
    * @param {dr.droptarget} droptarget The target that was dragged out of.
    * @returns {void}
    */
/**
    * @method notifyDrop
    * Called by dr.GlobalDragManager when this view is dropped.
    * @param {dr.droptarget} droptarget The target that was dropped on. Will
    *     be undefined if this dropable was dropped on no drop target.
    * @param {Boolean} isAbort Indicates if the drop was the result of an
    *     abort or a normal drop.
    * @returns {void}
    */
/**
    * @method notifyDropFailed
    * @abstract
    * Called after dragging stops and the drop failed. The default
    * implementation does nothing.
    * @returns {void}
    */
/**
    * @method notifyDropAborted
    * @abstract
    * Called after dragging stops and the drop was aborted. The default
    * implementation does nothing.
    * @returns {void}
    */
