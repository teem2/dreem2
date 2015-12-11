/**
   * @class dr.dimmer {UI Components}
   * A dimmer that can be placed on another dr.view to obscure the subviews of
   * that view.
   */
/**
    * @attribute {Boolean} restorefocus
    * Determines if focus will be sent back to the view that had focus before 
    * the dimmer was shown when the dimmer is hidden.
    */
/**
    * @attribute {dr.View} restorefocus
    * @readonly
    * The thing to set focus on when the dimmer is hidden if restorefocus 
    * is true.
    */
/**
    * @method show
    * Shows the dimmer and remembers the focus location.
    * @returns {void}
    */
/**
    * @method show
    * Hides the dimmer and restores focus if necessary.
    * @returns {void}
    */
