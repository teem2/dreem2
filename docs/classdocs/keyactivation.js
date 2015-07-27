/**
   * @mixin dr.keyactivation {UI Behavior}
   * Provides keyboard handling to "activate" the component when a key is 
   * pressed down or released up. By default, when a keyup event occurs for
   * an activation key and this view is not disabled, the 'doActivated' method
   * will get called.
   */
/**
    * @attribute {Array} activationkeys
    * An array of chars The keys that when keyed down will activate this 
    * component. Note: The value is not copied so modification of the array 
    * outside the scope of this object will effect behavior.
    * The default activation keys are enter (13) and spacebar (32).
    */
/**
    * @attribute {Number} activatekeydown
    * @readonly
    * The keycode of the activation key that is currently down. This will 
    * be -1 when no key is down.
    */
/**
    * @attribute {Boolean} repeatkeydown
    * Indicates if doActivationKeyDown will be called for repeated keydown 
    * events or not.
    */
/** @private */
/** @private */
/** @private */
/**
    * @method doBlur
    * @overrides dr.view
    * @returns {void} 
    */
/**
    * @method doActivationKeyDown
    * @abstract
    * Called when an activation key is pressed down.
    * @param {Number} key the keycode that is down.
    * @param {Boolean} isRepeat Indicates if this is a key repeat event or not.
    * @returns {void} 
    */
/**
    * @method doActivationKeyUp
    * Called when an activation key is release up. This executes the 
    * 'doActivated' method by default. 
    * @param {Number} key the keycode that is up.
    * @returns {void} 
    */
/**
    * @method doActivationKeyAborted
    * @abstract
    * Called when focus is lost while an activation key is down.
    * @param {Number} key the keycode that is down.
    * @returns {void} 
    */
