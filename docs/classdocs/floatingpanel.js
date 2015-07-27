/**
   * @class dr.floatingpanel {UI Component}
   * A panel that floats above everything else.
   *
   * Configured as visible false since panels will always begin by not being
   * seen.
   * 
   * Configured as focusable true and focuscage true to ensure the focus 
   * starts and ends with the panel
   */
/**
    * @attribute {String} panelid
    * The unique ID for this panel instance.
    */
/**
    * @attribute {dr.floatingpanelanchor} owner
    * The anchor that currently "owns" this panel.
    */
/**
    * @attribute {Boolean} ignoreownerforhideonmousedown
    * If true the owner view will also be ignored for mousedown events.
    */
/**
    * @attribute {Boolean} ignoreownerforhideonblur
    * If true the owner view will also be ignored for blur events.
    */
/**
    * @attribute {Boolean} hideonmousedown
    * If true this panel will be hidden when a mousedown occurs outside the panel.
    */
/**
    * @attribute {Boolean} hideonblur
    * If true this panel will be hidden when a focus traverses outside the panel.
    */
/** @private */
/**
    * @method doMouseDownOutside
    * Called when a mousedown occurs outside the floating panel. The default
    * behavior is to hide the panel. This gives subclasses a chance to 
    * provide different behavior.
    * @returns {void}
    */
/**
    * @method focus
    * @overrides dr.view
    * Intercepts focus on this panel and refocuses to the "best" view.
    * When focus enters the panel we give focus to the first focusable
    * descendant of the panel. When leaving we ask the panel anchor
    * where to give focus.
    */
/**
    * @method getFirstFocusableDescendant
    * Gets the view to give focus to when this panel gets focus. Should be
    * a descendant of the floating panel or the panel itself. Returns this 
    * floating panel by default.
    * @returns {dr.view} The view to give focus to.
    */
/** @private */
/**
    * @method doLostFocus
    * Called when focus moves out of the floating panel. Hides the
    * floating panel by default.
    * @returns {void}
    */
/**
    * @method isShown
    * Determines if this floating panel is being "shown" or not. Typically
    * this means the floating panel is visible.
    * @returns {Boolean} True if this panel is shown, otherwise false.
    */
/**
    * @method show
    * Shows the floating panel for the provided dr.floatingpanelanchor.
    * @param {dr.floatingpanelanchor} panelAnchor The floating panel anchor 
    * to show the panel for.
    * @returns {void}
    */
/**
    * @method hide
    * Hides the floating panel for the provided dr.floatingpanelanchor.
    * @param {Boolean} ignoreRestoreFocus Optional If true the restoreFocus
    * method will not be called. Defaults to undefined which is equivalent to 
    * false.
    * @returns {void}
    */
/**
    * @method restoreFocus
    * Sends the focus back to the owner. Can be overridden to
    * send the focus elsewhere.
    * @returns {void}
    */
/**
    * @method updateLocation
    * Updates the x and y position of the floating panel for the provided 
    * floating panel anchor.
    * @param {dr.floatingpanelanchor} panelAnchor The floating panel anchor 
    * to update the location for.
    * @returns {void}
    */
