/**
   * @mixin dr.mouseover {UI Behavior}
   * Provides an 'ismouseover' attribute that tracks mouse over/out state. Also
   * provides a mechanism to smoothe over/out events so only one call to
   * 'doSmoothMouseOver' occurs per onidle event.
   */
/**
    * @attribute {Boolean} ismouseover
    * Indicates if the mouse is over this view or not.
    */
/**
    * @overrides dr.disableable
    */
/** @private */
/**
    * @method doSmoothMouseOver
    * Called when ismouseover state changes. This method is called after
    * an event filtering process has reduced frequent over/out events
    * originating from the dom.
    * @param {Boolean} isOver
    * @return {void}
    */
/**
    * @method trigger
    * @overrides
    * Try to update the UI immediately if an event was triggered programatically.
    */
/**
    * @method doMouseOver
    * Called when the mouse is over this view. Subclasses must call call super.
    * @param {Object} event
    * @returns {void}
    */
/**
    * @method doMouseOut
    * Called when the mouse leaves this view. Subclasses must call call super.
    * @param {Object} event
    * @returns {void}
    */
