/** Provides an interface to platform specific Text functionality. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        globalScope = require('$SPRITE/global.js'),
        Color = require('$LIB/dr/model/Color.js'),
        sprite = require('$SPRITE/sprite.js');
    module.exports = sprite.Text = new JS.Class('sprite.Text', require('./View.js'), {
        // Life Cycle //////////////////////////////////////////////////////////////
        /** @overrides */
        initialize: function(view, attrs) {
            this.callSuper(view, attrs);
            this.styleObj.color = "black";
            // On chrome the text objects need to be informed when the fonts on 
            // the page have finally finished loading so they can recalculate 
            // their proper size
            var fonts = globalScope.fonts;
            if (fonts && fonts.status !== 'loaded' && fonts.ready && fonts.ready.constructor == Promise) {
                var self = this;
                fonts.ready.then(function() {
                    self.view.sizeToPlatform()
                });
            }
        },
        createPlatformObject: function(attrs) {
            var elem = this.callSuper(attrs),
                s = elem.style;
            s.fontFamily = "font-family:mission-gothic, 'Helvetica Neue', Helvetica, Arial, sans-serif";
            s.fontSize = "20px";
            // The following two properties make text look more alike 
            // between chrome and firefox.
            s.lineHeight = '120%';
            s.fontKerning = 'normal';
            return elem;
        },
        // Attributes //////////////////////////////////////////////////////////////
        set_text: function(v) {
            if (v != null) {
                var platformObject = this.platformObject,
                    childNodes = platformObject.childNodes,
                    i = 0,
                    len = childNodes.length,
                    child;
                for (; len > i;) {
                    child = childNodes[i++];
                    if (child && child.nodeType === 3) platformObject.removeChild(child);
                }
                var newchild = globalScope.createTextNode(v);
                platformObject.appendChild(newchild);
                this.set_color(this.styleObj.color);
            }
            return v;
        },
        set_fontsize: function(v) {
            this.styleObj.fontSize = v;
            return v;
        },
        set_fontfamily: function(v) {
            this.styleObj.fontFamily = v;
            return v;
        },
        set_bold: function(v) {
            this.styleObj.fontWeight = v ? 'bold' : 'normal';
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
        set_color: function(c) {
            this.styleObj.color = c;
            var colorObj = Color.makeColorFromHexOrNameString(c);
            this.performFuncOnAllChildren(function(child) {
                child.setFontColor([colorObj.red / 255.0, colorObj.green / 255.0, colorObj.blue / 255.0, 1.0])
            }.bind(this));
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
            var child = this.platformObject.firstChild,
                texts = [];
            while (child) {
                if (child.nodeType === 3) texts.push(child.data.trim());
                child = child.nextSibling;
            }
            return texts.join("")
        },
        performFuncOnAllChildren: function(f) {

            for (i in  this.platformObject.childNodes) {
                var child = this.platformObject.childNodes[i];
                if (child.nodeType === 3) {
                    f(child);
                } 
                child = child.nextSibling;
            }
        }
    });
});