/**
   * @mixin dr.button {UI Behavior}
   * Provides button functionality to a dr.View. Most of the functionality 
   * comes from the mixins included by this mixin. This mixin resolves issues 
   * that arise when the various mixins are used together.
   * 
   * By default dr.Button instances are focusable.
   */
/**
    * @method drawDisabledState
    * @abstract
    * Draw the UI when the component is in the disabled state.
    * @returns {void}
    */
/**
    * @method drawFocusedState
    * Draw the UI when the component has focus. The default implementation
    * calls drawHoverState.
    * @returns {void}
    */
/**
    * @method drawHoverState
    * @abstract
    * Draw the UI when the component is on the verge of being interacted 
    * with. For mouse interactions this corresponds to the over state.
    * @returns {void}
    */
/**
    * @method drawActiveState
    * @abstract
    * Draw the UI when the component has a pending activation. For mouse
    * interactions this corresponds to the down state.
    * @returns {void}
    */
/**
    * @method drawReadyState
    * @abstract
    * Draw the UI when the component is ready to be interacted with. For
    * mouse interactions this corresponds to the enabled state when the
    * mouse is not over the component.
    * @returns {void}
    */
