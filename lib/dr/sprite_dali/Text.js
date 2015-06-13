/** Provides an interface to platform specific Text functionality. */
define(function(require, exports, module) {
    var JS = require('$LIB/jsclass.js'),
        global= require('$SPRITE/global.js'),
        View = require('./View.js');
    
    module.exports = new JS.Class('sprite.Text', View, {
        // Life Cycle //////////////////////////////////////////////////////////////
        createPlatformObject: function(attrs) {
            var elem = this.callSuper(attrs),
                s = elem.style;
            s.fontFamily = "font-family:mission-gothic, 'Helvetica Neue', Helvetica, Arial, sans-serif";
            s.fontSize = "20px";
            
            return elem;
        },
         
        // Attributes //////////////////////////////////////////////////////////////
        set_text: function(v) {
            if (v != null) {
                var platformObject = this.platformObject
                platformObject.setText(v)
            }
            return v;
        },
        
        set_fontsize: function(v) {
            this.styleObj.fontSize = v;
            this.platformObject.setFontSize(v)
            return v;
        },
        
        set_fontfamily: function(v) {
            this.styleObj.fontFamily = v;
            this.platformObject.setFontFamily(v)
            return v;
        },
        
        set_bold: function(v) {
            this.styleObj.fontWeight = v ? 'bold' : 'normal';
            this.platformObject.setFontStyle(v ? 'bold' : 'normal');
            
            return v;
        },
        
        set_italic: function(v) {
            this.styleObj.fontStyle = v ? 'italic' : 'normal';
            return v;
        },
        
        set_smallcaps: function(v) {
            this.styleObj.fontVariant = v ? 'small-caps' : 'normal';
            return v;
        },
        
        set_underline: function(v) {
            this.styleObj.textDecoration = v ? 'underline' : 'none';
            return v;
        },
        
        set_strike: function(v) {
            this.styleObj.textDecoration = v ? 'line-through' : 'none';
            return v;
        },
        
        set_ellipsis: function(v) {
            this.__ellipsis = v;
            this.styleObj.textOverflow = v ? 'ellipsis' : 'clip';
            this.__updateOverflow();
            return v;
        },
        
        set_multiline: function(v) {
            this.__isMultiline = v;
            this.__updateMultiline();
            return v;
        },
        
        set_width: function(v) {
            this.__isAutoWidth = v === 'auto';
            this.__updateMultiline();
            return this.callSuper(v);
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @private */
        __updateMultiline: function() {
            var whitespace;
            if (this.__isMultiline) {
                whitespace = this.__isAutoWidth ? 'pre' : 'pre-wrap';
            } else {
                whitespace = 'nowrap';
            }
            this.styleObj.whiteSpace = whitespace;
        },
        
        /** @overrides */
        __updateOverflow: function() {
            if (this.__ellipsis) {
                this.styleObj.overflow = 'hidden';
            } else {
                this.callSuper()
            }
        },
        
        getText: function() {
            // Firefox doesn't support innerText and textContent gives us more than
            // we want. Instead, walk the dom children and concat all the text nodes.
            // The nodes get trimmed since line feeds and other junk whitespace will
            // show up as text nodes.
            var child = this.platformObject.firstChild, texts = [];
            while (child) {
                if (child.nodeType === 3) texts.push(child.data.trim());
                child = child.nextSibling;
            }
            return texts.join("")
        }
    });
});
