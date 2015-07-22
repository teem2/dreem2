/**
      * @class dr.markup {UI Components}
      * @extends dr.view
      * A view that uses the sizetodom mixin. You can also put HTML inside
      * the element and it will show up in the page.
      * 
      * This example creates a view that contains some HTML text. The view
      * will be sized to fit the text.
      * 
      *     @example
      *     <markup>
      *         <b>Here is some text</b> that is really just HTML.
      *     </markup>
      * 
      * This example creates a view that contains some HTML text. The view
      * will flow the text at a width of 50 pixels and have its height
      * automatically sized to fit the flowed text. If you later want to
      * let the view size its width to the dom just call 
      * setAttribute('width', 'auto').
      * 
      *     @example
      *     <markup width="50">
      *         <b>Here is some text</b> that is really just HTML.
      *     </markup>
      */
/**
    * @attribute {String} [markup='']
    * Sets the inner HTML of this view. Since the < and > characters are
    * not typically supported in the places you'll be configuring this
    * attributes, you can use [ and ] and they will be transformed into < and >.
    * If you need to insert a literal [ character use &amp;#91;. If you need
    * to insert a literal ] character use &amp;#93;.
    */
/**
    * @method unescape
    * Used to support an alternate syntax for markup since the < and >
    * characters are restricted in most places you will want assign the
    * markup to this view. The alternte syntax uses the [ and ] characters to
    * represent < and > respectively. If you need to insert a literal [ or ]
    * character use &amp;#91; or &amp;#93; respectively.
    * @param str The string to unescape.
    * @returns {String} The unescaped string.
    * @private
    */
