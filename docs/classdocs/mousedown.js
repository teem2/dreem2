/**
   * @mixin dr.mousedown {UI Behavior}
   * Provides an 'ismousedown' attribute that tracks mouse up/down state.
   * 
   * Suggested: dr.updateableui and dr.activateable super mixins.
   */
/**
    * @attribute {Boolean} ismousedown
    * Indicates if the mouse is down or not.
    */
/**
    * @overrides dr.disableable
    */
/**
    * @method doMouseOver
    * @overrides dr.mouseover
    */
/**
    * @method doMouseOut
    * @overrides dr.mouseover
    */
/**
    * @method doMouseDown
    * Called when the mouse is down on this view. Subclasses must call call super.
    * @param {Object} event
    * @return {void}
    */
/**
    * @method doMouseUp
    * Called when the mouse is up on this view. Subclasses must call call super.
    * @param {Object} event
    * @return {void}
    */
/**
    * @method doMouseUpInside
    * Called when the mouse is up and we are still over the view. Executes
    * the 'doActivated' method by default.
    * @param {Object} event
    * @return {void}
    */
/**
    * @method doMouseUpOutside
    * Called when the mouse is up and we are not over the view. Fires
    * an 'onmouseupoutside' event.
    * @param {Object} event
    * @return {void}
    */
