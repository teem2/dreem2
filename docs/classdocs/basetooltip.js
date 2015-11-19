/**
      * @class dr.basetooltip {UI Components}
      * @extends dr.view
      * A base class for tooltip instances.
      */
/**
    * @attribute {Number} tipdelay
    * The time in millis to wait before showing the tooltip.
    */
/**
    * @attribute {Number} tipdelay
    * The time in millis to wait before hiding the tooltip.
    */
/**
    * Sets the tooltip info that will be displayed. 
    * @param v:object with the following keys:
    *   tiptarget:dr.View The view to show the tip for.
    *   text:string The tip text.
    *   tipalign:string Tip alignment, 'left' or 'right'.
    *   tipvalign:string Tip vertical alignment, 'above' or 'below'. */
/**
    * If the mouse rests in the tip's tiptarget then show the tip.
    */
/**
    * Checks if the last mouse position is inside the tip's tiptarget.
    * If not inside the tip will also get hidden.
    * @private
    * @returns boolean: false if the tip got hidden, true otherwise.
    */
/**
    * Called when the tip will be hidden.
    * @returns boolean
    */
/**
    * Called when the tip will be shown.
    * @returns void
    */
