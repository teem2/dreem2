/**
      * @class dr.sizetoplatform {UI Components}
      * Enables a view to size itself to the platform object it contains. This
      * is a reversal of the standard relationship where the "model" pushes
      * changes into the platform object.
      * 
      * If you set an explicit width or height sizing to the platform object
      * will be suspended for that axis. If later you want to restore the size 
      * to platform object behavior set the width or height to a value 
      * of 'auto'.
      *
      * If you make a modification to the platform object through a mechanism 
      * that results in a change to the size of the platform object you will 
      * need to call the sizeToPlatform method to trigger an update of 
      * the width and height of the view.
      * 
      */
/**
    * @method sizeToPlatform
    * Sizes this view to the current size of the DOM elements within it.
    * @returns {void}
    */
