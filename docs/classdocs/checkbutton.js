/**
   * @class dr.checkbutton {UI Components}
   * @extends dr.buttonbase
   * Button class consisting of text and a visual element to show the
   * current state of the component. The state of the
   * button changes each time the button is clicked. The select property
   * holds the current state of the button. The onselected event
   * is generated when the button is the selected state.
   *
   *     @example
   *     <spacedlayout axis="y"></spacedlayout>
   *
   *     <checkbutton text="pink" selectcolor="pink"></checkbutton>
   *     <checkbutton text="blue" selectcolor="lightblue"></checkbutton>
   *     <checkbutton text="green" selectcolor="lightgreen"></checkbutton>
   *
   * Here we listen for the onselected event on a checkbox and print the value that is passed to the handler.
   *
   *     @example
   *     <spacedlayout axis="y"></spacedlayout>
   *
   *     <checkbutton text="green" selectcolor="lightgreen">
   *       <handler event="onselected" args="value">
   *         displayselected.setAttribute('text', value);
   *       </handler>
   *     </checkbutton>
   *
   *     <view>
   *       <spacedlayout></spacedlayout>
   *       <text text="Selected:"></text>
   *       <text id="displayselected"></text>
   *     </view>
   *
   */
