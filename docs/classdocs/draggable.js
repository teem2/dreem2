/**
   * @mixin dr.draggable {UI Behavior}
   * Makes an dr.View draggable via the mouse.
   * 
   * Also supresses context menus since the mouse down to open it causes bad
   * behavior since a mouseup event is not always fired.
   */
/**
    * @attribute {Boolean} isdraggable
    * Configures the view to be draggable or not.
    */
/**
    * @attribute {Boolean} isdragging
    * Indicates that this view is currently being dragged.
    */
/**
    * @attribute {Boolean} allowabort
    * Allows a drag to be aborted by the user by pressing the 'esc' key.
    */
/**
    * @attribute {Boolean} centeronmouse
    * If true this draggable will update the draginitx and draginity to keep 
    * the view centered on the mouse.
    */
/**
    * @attribute {Number} distancebeforedrag
    * The distance, in pixels, before a mouse down and drag is considered a 
    * drag action.
    */
/**
    * @attribute {String} dragaxis
    * Limits dragging to a single axis. Supported values: 'x', 'y', 'both'.
    */
/** @overrides dr.disableable */
/**
    * @method getDragViews
    * Returns an array of views that can be moused down on to start the
    * drag. Subclasses should override this to return an appropriate list
    * of views. By default this view is returned thus making the entire
    * view capable of starting a drag.
    * @returns {Array} 
    */
/** @private */
/** @private */
/** @private */
/** @private */
/**
    * @method startDrag
    * Active until stopDrag is called. The view position will be bound
    * to the mouse position. Subclasses typically call this onmousedown for
    * subviews that allow dragging the view.
    * @param {Object} event The event the mouse event when the drag started.
    * @returns {void} 
    */
/**
    * @method updateDrag
    * Called on every mousemove event while dragging.
    * @returns {void} 
    */
/** @private */
/**
    * @method updatePosition
    * Repositions the view to the provided values. The default implementation
    * is to directly set x and y. Subclasses should override this method
    * when it is necessary to constrain the position.
    * @param {Number} x the new x position.
    * @param {Number} y the new y position.
    * @returns {void} 
    */
/**
    * @method stopDrag
    * Stop the drag. (see startDrag for more details)
    * @param {Object} event The event that ended the drag.
    * @param {Boolean} isAbort Indicates if the drag ended normally or was aborted.
    * @returns {void} 
    */
/** @private */
/**
    * @method getDistanceFromOriginalLocation
    * Gets the distance dragged from the location of the start of the drag.
    * @returns {Number} 
    */
