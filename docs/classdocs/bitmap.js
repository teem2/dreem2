/**
    * @class dr.bitmap {UI Components}
    * @extends dr.view
    * Loads an image from a URL.
    *
    *     @example
    *     <bitmap src="../api-examples-resources/shasta.jpg" width="230" height="161"></bitmap>
    *
    * Stretch an image to fill the entire view.
    *     @example
    *     <bitmap src="../api-examples-resources/shasta.jpg" width="300" height="150" stretches="true"></bitmap>
    *
    */
/**
      * @attribute {String} [src='']
      * The URL of the bitmap file to load.
      */
/**
      * @event onload 
      * Fired when the bitmap is loaded
      * @param {Object} size An object containing the width and height
      */
/**
      * @event onerror 
      * Fired when there is an error loading the bitmap
      */
/**
      * @attribute {String} [stretches=false]
      * How the image is scaled to the size of the view.
      * Supported values are 'true', 'false', 'scale'.
      * false will scale the image to completely fill the view, but may obscure parts of the image.
      * true will stretch the image to fit the view.
      * scale will scale the image so it visible within the view, but the image may not fill the entire view.
      */
/**
      * @attribute {Boolean} [naturalsize=false]
      * If set to true the bitmap will be sized to the width/height of the
      * bitmap data in pixels.
      */
/**
    * @attribute {String} [window='']
    * A window (section) of the image is displayed by specifying four,
    * comma-separated values:
    *   x,y  The coordinates of the upper-left hand corner of the image
    *   w,h  The width and height of the window to display.
    */
