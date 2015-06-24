/**
   * @class dr.webpage {UI Components}
   * @extends dr.view
   * iframe component for embedding dreem code or html in a dreem application.
   * The size of the iframe matches the width/height of the view when the
   * component is created. The iframe component can show a web page by
   * using the src attribute, or to show dynamic content using the
   * contents attribute.
   *
   * This example shows how to display a web page in an iframe. The
   * contents of the iframe are not editable:
   *
   *     @example
   *     <webpage src="http://en.wikipedia.org/wiki/San_Francisco" width="300" height="140"></webpage>
   *
   * To make the web page clickable, and to add scrolling set either
   * clickable or scrollable to true:
   *
   *     @example
   *     <webpage src="http://en.wikipedia.org/wiki/San_Francisco" width="300" height="140" scrollable="true"></webpage>
   *     <webpage src="http://en.wikipedia.org/wiki/San_Francisco" width="300" height="140" clickable="true"></webpage>
   *
   */
/**
    * @attribute {String} [src="/iframe_stub.html"]
    * url to load inside the iframe. By default, a file is loaded that has
    * an empty body but includes the libraries needed to support Dreem code.
    */
