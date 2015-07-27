/**
   * @mixin dr.disableable {UI Behavior}
   * Adds the capability to be "disabled" to a dr.Node. When a dr.Node is 
   * disabled the user should typically not be able to interact with it.
   *
   * When disabled becomes true an attempt will be made to give away the focus
   * using dr.View's giveAwayFocus method.
   */
/**
    * @attribute {Boolean} disabled
    * Indicates that this component is disabled.
    */
/**
    * @method doDisabled
    * Called after the disabled attribute is set. Default behavior attempts
    * to give away focus and calls the updateUI method of dr.UpdateableUI if 
    * it is defined.
    * @returns {void}
    */
