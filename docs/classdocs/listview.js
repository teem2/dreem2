/**
   * @class dr.listview {UI Component}
   * A floating panel that contains a list of items.
   */
/**
    * @attribute {Number} maxheight
    * The maximum height of the list view in pixels. If set to -1 no max 
    * height will be used.
    */
/**
    * @attribute {Number} minwidth
    * The minimum width for the list. The list will size itself to fit the 
    * maximum width of the items in the list or this value whichever is larger.
    */
/**
    * @attribute {Class} defaultitemclass
    * The class to use for list items if one is not provided in the config.
    */
/**
    * @attribute {Array} itemconfig
    * An array of configuration information for the items in the list.
    */
/**
    * @attribute {Array} itemconfig
    * @readonly
    * The array of items in the list.
    */
/** @overrides */
/**
    * @method getContentView
    * Get the view that will contain list content.
    * @returns {dr.view}
    */
/**
    * @method doItemActivated
    * The listviewitems of this listview should call this method when they are 
    * activated. The default implementation invokes doItemActivated on the
    * listviewanchor.
    * @param {dr.view} itemView
    */
/** @overrides */
/**
    * @method getLastFocusableItem
    * Gets the last focusable item in this list.
    */
/** @private */
