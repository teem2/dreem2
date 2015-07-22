/**
   * @class dr.labeltoggle {UI Components}
   * @extends dr.labelbutton
   * Button class consisting of text centered in a view. The state of the
   * button changes each time the button is clicked. The select property
   * holds the current state of the button. The onselected event
   * is generated when the button is the selected state.
   *
   *     @example
   *     <spacedlayout axis="y"></spacedlayout>
   *
   *     <labeltoggle id="toggle" text="Click me to toggle"></labeltoggle>
   *
   *     <text text="${toggle.selected ? 'selected' : 'not selected'}"></text>
   */
