/** Provides an interface to platform specific Text functionality. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        globalScope = require('$SPRITE/global.js'),
        sprite = require('$SPRITE/sprite.js');
    
    module.exports = sprite.Text = new JS.Class('sprite.Text', require('./View.js'), {
        include: [require('$SPRITE/events/InputObservable.js')], // Needed for contenteditable.
        
        
        // Life Cycle //////////////////////////////////////////////////////////////
        /** @overrides */
        initialize: function(view, attrs) {
            this.callSuper(view, attrs);
            
            // On chrome the text objects need to be informed when the fonts on 
            // the page have finally finished loading so they can recalculate 
            // their proper size
            var fonts = globalScope.document.fonts;
            if (fonts && fonts.status !== 'loaded' && fonts.ready && fonts.ready.constructor == Promise) {
                var self = this;
                fonts.ready.then(function() {self.view.sizeToPlatform()});
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
                // Don't modify dom if nothing has actually changed.
                if (v === this.getText()) return;
                
                var platformObject = this.platformObject, 
                    childNodes = platformObject.childNodes,
                    i = 0, len = childNodes.length, child;
                for (; len > i;) {
                    child = childNodes[i++];
                    if (child && child.nodeType === 3) platformObject.removeChild(child);
                }
                platformObject.appendChild(globalScope.document.createTextNode(v))
            }
            return v;
        },
        
        set_textalign: function(v) {
            this.styleObj.textAlign = v || 'inherit';
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
        
        set_editable: function(v) {
            this.__editable = v;
            this.platformObject.contentEditable = v;
            return v;
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @overrides */
        preventDefault: function(platformEvent, eventType, preventDefault) {
            // Never prevent default behavior for contenteditable text
            if (this.__editable) return false;
            return this.callSuper();
        },
        
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
        
        cleanInput: function(platformEvent) {
            // Prevent enter key from inserting a div
            var sprite = dr.sprite;
            if (sprite.KeyObservable.getKeyCodeFromEvent(platformEvent) === sprite.GlobalKeys.KEYCODE_ENTER) {
                sprite.preventDefault(platformEvent);
                
                // Instead, insert a linefeed if wrapping is allowed.
                if (this.__isMultiline) globalScope.document.execCommand('insertHTML', false, this.isCaretAtEnd() ? '\n\n' : '\n');
            }
        },
        
        // Caret handlingk //
        getCharacterCount: function() {
            var child = this.platformObject.firstChild;
            return child ? child.length : 0;
        },
        
        isCaretAtEnd: function() {
            return this.getCaretPosition() === this.getCharacterCount();
        },
        
        /** Gets the location of the caret.
            @returns int. */
        getCaretPosition: function() {
            var document = globalScope.document;
            
            // IE Support
            if (document.selection) {
                var selection = document.selection.createRange();
                selection.moveStart('character', -this.get_value().length);
                return selection.text.length;
            }
            
            return this.platformObject.selectionStart || 0;
        },
        
        /** Sets the caret and selection.
            @param start:int the start of the selection or location of the caret
                if no end is provided.
            @param end:int (optional) the end of the selection.
            @returns void */
        setCaretPosition: function(start, end) {
            if (end === undefined || start === end) {
                // Don't update if the current position already matches.
                if (this.getCaretPosition() === start) return;
                
                end = start;
            }
            var elem = this.platformObject;
            
            if (elem.setSelectionRange) {
                elem.setSelectionRange(start, end);
            } else if (elem.createTextRange) {
                var range = elem.createTextRange();
                range.collapse(true);
                range.moveEnd('character', end);
                range.moveStart('character', start);
                range.select();
            }
        },
        
        /** Sets the caret to the start of the text input.
            @returns void */
        setCaretToStart: function() {
            this.setCaretPosition(0);
        },
        
        /** Sets the caret to the end of the text input.
            @returns void */
        setCaretToEnd: function() {
            this.setCaretPosition(this.get_value().length);
        },
        
        // Selection //
        /** Selects all the text in the input element.
            @returns void */
        selectAll: function() {
            this.platformObject.select();
        },
        
        getSelection: function() {
            var po = this.platformObject;
            return {
                //startElem:po,
                //endElem:po,
                start:po.selectionStart,
                end:po.selectionEnd
            };
        },
        
        getSelectedText: function() {
            var selection = this.getSelection(),
                value = this.get_value();
            return value.substring(selection.start, selection.end);
        },
        
        setSelection: function(selection) {
            if (typeof selection === 'number') {
                if (arguments.length === 2) {
                    this.setCaretPosition(arguments[0], arguments[1]);
                } else {
                    this.setCaretPosition(selection);
                }
            } else {
                if (selection) {
                    this.setCaretPosition(selection.start, selection.end);
                } else {
                    this.clearSelection();
                }
            }
        },
        
        clearSelection: function() {
            this.setCaretPosition(0, 0);
        },
        
        saveSelection: function(selection) {
            this.__selRange = selection || this.getSelection() || this._selRange;
        },
        
        restoreSelection: function() {
            this.setSelection(this.__selRange);
        }
    });
});
