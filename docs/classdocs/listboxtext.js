/**
   * @class dr.textlistbox {UI Components}
   * @extends dr.view
   * Displays a list of items, typically text.
   */
/**
      * @attribute {String} [selectcolor="white"]
      * The color of the selected element.
      */
/**
          * @attribute {Number} [maxwidth=0]
          * The largest width of any subview.
          */
/**
          * @attribute {Number} [maxheight=0]
          * The largest height of any subview.
          */
/**
          * @attribute {Number} [safewidth=0]
          * The largest width of any subview, including a scrollbar
          */
/**
          * @attribute {Number} [spacing=0]
          * The vertical spacing between elements.
          */
/**
          * @attribute {Object}
          * The currently selected dr.listboxtextitem object.
          */
/**
        * Select an item, by name. The value is ignored if missing.
        * @param {String} item to select.
        */
/**
        * @method findSize
        * Find and return the maximum [width, height] of any text field.
        */
