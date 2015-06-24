/**
   * @class dr.buttonbase {UI Components}
   * @extends dr.view
   * Base class for button components. Buttons share common elements,
   * including their ability to be selected, a visual element to display
   * their state, and a default and selected color.
   * The visual element is a dr.view that shows the current state of the
   * button. For example, in a labelbutton the entire button is the visual
   * element. For a checkbutton, the visual element is a square dr.view
   * that is inside the button.
   *
   * The following example shows a subclass that has a plain view as the visual 
   * element, and sets selected to true onmousedown. The selectcolor is 
   * automatically applied when selected is true.
   * 
   *     @example
   *     <class name="purplebutton" extends="buttonbase" defaultcolor="purple" selectcolor="plum" width="100" height="40" visual="${this}">
   *        <handler event="onmousedown" args="mousedown">
   *          this.setAttribute('selected', mousedown)
   *        </handler>
   *     </class>
   *     <purplebutton></purplebutton>
   */
/**
    * @attribute {String} [defaultcolor="#808080"]
    * The default color of the visual button element when not selected.
    */
/**
    * @attribute {String} [selectcolor="#a0a0a0"]
    * The selected color of the visual button element when selected.
    */
/**
    * @attribute {Boolean} [selected=false]
    * The current state of the button.
    */
/**
    * @event onselected
    * Fired when the state of the button changes.
    * @param {dr.buttonbase} view The dr.buttonbase that fired the event
    */
/**
    * @attribute {String} [text=""]
    * Button text.
    */
