/**
      * @class dr.text {UI Components}
      * @extends dr.view
      * Text component that supports single and multi-line text.
      * 
      *  The text component can be fixed size, or sized to fit the size of the text.
      * 
      *      @example
      *      <text text="Hello World!" bgcolor="red"></text>
      * 
      *  Here is a multiline text
      * 
      *      @example
      *      <text multiline="true" text="Lorem ipsum dolor sit amet, consectetur adipiscing elit"></text>
      * 
      *  You might want to set the value of a text element based on the value of other attributes via a constraint. Here we set the value by concatenating three attributes together.
      * 
      *      @example
      *      <attribute name="firstname" type="string" value="Lumpy"></attribute>
      *      <attribute name="middlename" type="string" value="Space"></attribute>
      *      <attribute name="lastname" type="string" value="Princess"></attribute>
      * 
      *      <text text="${this.parent.firstname + ' ' + this.parent.middlename + ' ' + this.parent.lastname}" color="hotpink"></text>
      * 
      *  Constraints can contain more complex JavaScript code
      * 
      *      @example
      *      <attribute name="firstname" type="string" value="Lumpy"></attribute>
      *      <attribute name="middlename" type="string" value="Space"></attribute>
      *      <attribute name="lastname" type="string" value="Princess"></attribute>
      * 
      *      <text text="${this.parent.firstname.charAt(0) + ' ' + this.parent.middlename.charAt(0) + ' ' + this.parent.lastname.charAt(0)}" color="hotpink"></text>
      * 
      *  We can simplify this by using a method to return the concatenation and constraining the text value to the return value of the method
      * 
      *      @example
      *      <attribute name="firstname" type="string" value="Lumpy"></attribute>
      *      <attribute name="middlename" type="string" value="Space"></attribute>
      *      <attribute name="lastname" type="string" value="Princess"></attribute>
      * 
      *      <method name="initials">
      *        return this.firstname.charAt(0) + ' ' + this.middlename.charAt(0) + ' ' + this.lastname.charAt(0);
      *      </method>
      * 
      *      <text text="${this.parent.initials()}" color="hotpink"></text>
      * 
      *  You can override the format method to provide custom formatting for text elements. Here is a subclass of text, timetext, with the format method overridden to convert the text given in seconds into a formatted string.
      * 
      *      @example
      *      <class name="timetext" extends="text">
      *        <method name="format" args="seconds">
      *          var minutes = Math.floor(seconds / 60);
      *          var seconds = Math.floor(seconds) - minutes * 60;
      *          if (seconds < 10) {
      *            seconds = '0' + seconds;
      *          }
      *          return minutes + ':' + seconds;
      *        </method>
      *      </class>
      * 
      *      <timetext text="240"></timetext>
      * 
      */
/**
        * @attribute {Number} [fontsize]
        * The size of the font in pixels.
        */
/**
        * @attribute {Number} [fontfamily=""]
        * The name of the font family to use, e.g. "Helvetica"  Include multiple fonts on a line, separated by commas.
        */
/**
        * @attribute {Number} [textalign=""]
        * Align text within its bounds. Supported values are 
        * 'left', 'right', 'center' and 'inherit'.
        */
/**
        * @attribute {Boolean} [bold=false]
        * Use bold text.
        */
/**
        * @attribute {Boolean} [italic=false]
        * Use italic text.
        */
/**
        * @attribute {Boolean} [smallcaps=false]
        * Use small caps style.
        */
/**
        * @attribute {Boolean} [underline=false]
        * Draw and underline under text (note, is incompatible with dr.text#strike)
        */
/**
        * @attribute {Boolean} [strike=false]
        * Draw and strike-through the text (note, is incompatible with dr.text#underline)
        */
/**
        * @attribute {Boolean} [multiline=false]
        * Determines how line breaks within the text are handled.
        */
/**
        * @attribute {Boolean} [ellipsis=false]
        * Determines if ellipsis shouls be shown or not. Only works when
        * multiline is false.
        */
/**
        * @attribute {String} [text=""]
        * The contents of this input text field
        */
/**
        * @method isLeaf
        * @overrides
        * Text views do not support subviews.
        */
/**
        * @method format
        * Format the text to be displayed. The default behavior is to
        * return the text intact. Override to change formatting. This method
        * is called whenever the text attribute is set.
        * @param {String} str The current value of the text component.
        * @return {String} The formated string to display in the component.
        */
