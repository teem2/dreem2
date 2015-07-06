/**
   * @class dr.rangeslider {UI Components}
   * @extends dr.view
   * An input component whose upper and lower bounds are changed via mouse clicks or drags.
   *
   *     @example
   *
   *     <rangeslider name="range" width="300" height="40" x="10" y="30" lowselectcolor="#00CCFF" highselectcolor="#FFCCFF" outline="2px dashed #00CCFF"
   *                  lowvalue="30"
   *                  highvalue="70">
   *     </rangeslider>
   *
   *     <text name="rangeLabel" color="white" height="40"
   *           y="${this.parent.range.y + (this.parent.range.height / 2) - (this.height / 2)}"
   *           x="${(this.parent.range.lowvalue * 3) + (((this.parent.range.highvalue * 3) - (this.parent.range.lowvalue * 3)) / 2) - (this.width / 2)}"
   *           text="${Math.round(this.parent.range.lowvalue) + ' ~ ' + Math.round(this.parent.range.highvalue)}"></text>
   *
   *
   * A range slider highlights the inclusive values by default, however this behavior can be reversed with `exclusive="true"`.
   * The following example demonstrates an exclusive-valued, inverted (range goes from high to low) horizontal slider.
   *
   *     @example
   *
   *     <rangeslider name="range" width="400" x="10" y="30" lowselectcolor="#AACCFF" highselectcolor="#FFAACC""
   *                  height="30"
   *                  lowvalue="45"
   *                  highvalue="55"
   *                  invert="true"
   *                  exclusive="true">
   *     </rangeslider>
   *
   *     <text name="highRangeLabel" color="#666" height="20"
   *           y="${this.parent.range.y + (this.parent.range.height / 2) - (this.height / 2)}"
   *           x="${(((this.parent.range.maxvalue * 4) - (this.parent.range.highvalue * 4)) / 2) - (this.width / 2)}"
   *           text="${this.parent.range.maxvalue + ' ~ ' + Math.round(this.parent.range.highvalue)}"></text>
   *
   *     <text name="lowRangeLabel" color="#666" height="20"
   *           y="${this.parent.range.y + (this.parent.range.height / 2) - (this.height / 2)}"
   *           x="${(this.parent.range.width - (this.parent.range.lowvalue * 4)) + (((this.parent.range.lowvalue * 4) - (this.parent.range.minvalue * 4)) / 2) - (this.width / 2)}"
   *           text="${Math.round(this.parent.range.lowvalue) + ' ~ ' + this.parent.range.minvalue}"></text>
   *
   */
/**
    * @attribute {Number} [minvalue=0]
    * The minimum lower value of the slider
    */
/**
    * @attribute {Number} [maxlowvalue=0]
    * The maximum lower value of the slider
    */
/**
    * @attribute {Number} [maxvalue=100]
    * The minimum high value of the slider
    */
/**
    * @attribute {Number} [maxvalue=100]
    * The maximum value of the slider
    */
/**
    * @attribute {Number} [value=0]
    * The current lower value of the slider.
    */
/**
    * @attribute {Number} [value=0]
    * The current higher value of the slider.
    */
/**
    * @attribute {"x"/"y"} [axis=x]
    * The axis to track on
    */
/**
    * @attribute {Boolean} [invert=false]
    * Set to true to invert the direction of the slider.
    */
/**
    * @attribute {String} [selectcolor="#a0a0a0"]
    * The selected color of the slider.
    */
/**
    * @attribute {String} [lowprogresscolor="#999999"]
    * The color of the low progress bar.
    */
/**
    * @attribute {String} [highprogresscolor="#bbbbbb"]
    * The color of the high progress bar.
    */
