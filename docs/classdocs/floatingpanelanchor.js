/**
   * @mixin dr.floatingpanelanchor {UI Behavior}
   * Enables a view to act as the anchor point for a floatingpanel.
   */
/**
    * @attribute {Object} classesbypanelid
    * A map of floatingpanel classes by panel ID.
    */
/**
    * @attribute {Object} panelsbypanelid
    * A map of FloatingPanel instances by panel ID.
    */
/**
    * @attribute {String} floatingpanelid
    * If defined this is the panel ID that will be used by default in the 
    * various methods that require a panel ID.
    */
/**
    * @attribute {String} floatingalign
    * The horizontal alignment for panels shown by this anchor. If the value 
    * is a string it is an alignment identifier relative to this anchor. If 
    * the value is a number it is an absolute position in pixels. Allowed 
    * values: 'outsideleft', 'insideleft', 'insideright', 'outsideright' or 
    * a number.
    */
/**
    * @attribute {String} floatingvalign
    * The vertical alignment for panels shown by this anchor. If the value is 
    * a string it is an alignment identifier relative to this anchor. If the 
    * value is a number it is an absolute position in pixels. Allowed values: 
    * 'outsidetop', 'insidetop', 'insidebottom', 'outsidebottom' or a number.
    */
/**
    * @attribute {Number} floatingalignoffset
    * The number of pixels to offset the panel position by horizontally.
    */
/**
    * @attribute {Number} floatingvalignoffset
    * The number of pixels to offset the panel position by vertically.
    */
/**
    * @attribute {dr.floatingpanel} lastfloatingpanelshown
    * A reference to the last floating panel shown by this anchor.
    */
/**
    * @method createFloatingPanel
    * Creats a floatingpanel for this anchor.
    * @returns {dr.floatingpanel} 
    */
/**
    * @method getFloatingPanel
    * Gets a floatingpanel for the provided panelId if it exists.
    * @param {String} panelId (optional) If provided, the panel id to get a
    * panel for, otherwise the floatingpanelid of this anchor is used.
    * @returns {dr.floatingpanel} 
    */
/**
    * @method toggleFloatingPanel
    * Shows/Hides the floatingpanel for the provided panelId.
    * @param {String} panelId (optional) If provided, the panel id to toggle,
    * otherwise the floatingpanelid of this anchor is used.
    * @returns {dr.floatingpanel} 
    */
/**
    * @method showFloatingPanel
    * Shows the floatingpanel for the provided panelId.
    * @param {String} panelId (optional) If provided, the panel id to show,
    * otherwise the floatingpanelid of this anchor is used.
    * @returns {dr.floatingpanel} 
    */
/**
    * @method hideFloatingPanel
    * Hides the floatingpanel for the provided panelId.
    * @param {String} panelId (optional) If provided, the panel id to hide,
    * otherwise the floatingpanelid of this anchor is used.
    * @returns {dr.floatingpanel} 
    */
/**
    * @method notifyPanelShown
    * @abstract
    * Called when a floating panel has been shown for this anchor.
    * @param {dr.floatingpanel} panel The panel that is now shown.
    * @returns {void} 
    */
/**
    * @method notifyPanelHidden
    * @abstract
    * Called when a floating panel has been hidden for this anchor.
    * @param {dr.floatingpanel} panel The panel that is now hidden.
    * @returns {void} 
    */
/**
    * @method getFloatingAlignForPanelId
    * Called by the floatingpanel to determine where to position itself
    * horizontally. By default this returns the floatingalign attribute. 
    * Subclasses and instances should override this if panel specific 
    * behavior is needed.
    * @param {String} panelId The ID of the panel being positioned.
    * @returns {void} 
    */
/**
    * @method getFloatingValignForPanelId
    * Called by the floatingpanel to determine where to position itself
    * vertically. By default this returns the floatingvalign attribute. 
    * Subclasses and instances should override this if panel specific 
    * behavior is needed.
    * @param {String} panelId The ID of the panel being positioned.
    * @returns {void} 
    */
/**
    * @method getFloatingAlignOffsetForPanelId
    * Called by the floatingpanel to determine where to position itself
    * horizontally. By default this returns the floatingalignoffet attribute. 
    * Subclasses and instances should override this if panel specific 
    * behavior is needed.
    * @param {String} panelId The ID of the panel being positioned.
    * @returns {void} 
    */
/**
    * @method getFloatingValignOffsetForPanelId
    * Called by the floatingpanel to determine where to position itself
    * vertically. By default this returns the floatingvalignoffet attribute. 
    * Subclasses and instances should override this if panel specific 
    * behavior is needed.
    * @param {String} panelId The ID of the panel being positioned.
    * @returns {void} 
    */
/**
    * @method getNextFocus
    * @overrides dr.view
    * Returns the last floating panel shown if it exists and can be shown.
    * Otherwise it returns the default.
    */
/**
    * @method getNextFocusAfterPanel
    * Called by the floatingpanel owned by this anchor to determine where
    * to go to next after leaving the panel in the forward direction.
    * @param {String} panelId The ID of the panel doing the focus change.
    * @returns {dr.view}
    */
/**
    * @method getPrevFocusAfterPanel
    * Called by the floatingpanel owned by this anchor to determine where
    * to go to next after leaving the panel in the backward direction.
    * @param {String} panelId The ID of the panel doing the focus change.
    * @returns {dr.view}
    */
