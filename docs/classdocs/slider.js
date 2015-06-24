/**
   * @class dr.slider {UI Components}
   * @extends dr.view
   * An input component whose state is changed when the mouse is dragged.
   *
   *     @example
   *
   *     <slider name="hslide" y="5" width="250" height="10" value="50" bgcolor="#808080"></slider>
   * Slider with a label:
   *
   *     @example
   *
   *     <spacedlayout spacing="8"></spacedlayout>
   *     <slider name="hslide" y="5" width="250" height="10" value="50" bgcolor="#808080"></slider>
   *     <text text="${Math.round(this.parent.hslide.value)}" y="${this.parent.hslide.y + (this.parent.hslide.height-this.height)/2}"></text>
   */
/**
    * @attribute {Number} [minvalue=0]
    * The minimum value of the slider
    */
/**
    * @attribute {Number} [maxvalue=100]
    * The maximum value of the slider
    */
/**
    * @attribute {Number} [value=0]
    * The current value of the slider.
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
    * @attribute {String} [selectcolor="#cccccc"]
    * The selected color of the slider.
    */
/**
    * @attribute {String} [progresscolor="#999999"]
    * The color of the progress bar.
    */
