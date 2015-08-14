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
                if (v !== this.getText(true)) {
                    var platformObject = this.platformObject, 
                        childNodes = platformObject.childNodes,
                        i = 0, len = childNodes.length, child;
                    for (; len > i;) {
                        child = childNodes[i++];
                        if (child && child.nodeType === 3) platformObject.removeChild(child);
                    }
                    platformObject.appendChild(globalScope.document.createTextNode(v));
                }
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
        
        getText: function(noTrim) {
            // Firefox doesn't support innerText and textContent gives us more than
            // we want. Instead, walk the dom children and concat all the text nodes.
            // The nodes get trimmed since line feeds and other junk whitespace will
            // show up as text nodes.
            var child = this.platformObject.firstChild,
                texts = [];
            while (child) {
                if (child.nodeType === 3) texts.push(noTrim ? child.data : child.data.trim());
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
        
        // Caret handling //
        getCharacterCount: function() {
            var fc = this.platformObject.firstChild;
            return fc ? fc.length : 0;
        },
        
        isCaretAtEnd: function() {
            return this.getCaretPosition() === this.getCharacterCount();
        },
        
        getCaretPosition: function() {
            var selection = this.getSelection();
            return selection ? selection.end : 0;
        },
        
        setCaretPosition: function(start, end) {
            if (end === undefined || start === end) {
                // Don't update if the current position already matches.
                if (this.getCaretPosition() === start) return;
                
                end = start;
            }
            this.saveSelection({
                start:start,
                startElem:this.platformObject.firstChild,
                end:end,
                endElem:this.platformObject.firstChild
            });
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
        /** @overrides myt.BaseInputText */
        getSelection: function() {
            var document = globalScope.document,
                range;
            if (globalScope.getSelection) {
                var sel = globalScope.getSelection();
                if (sel.rangeCount > 0) {
                    // Sometimes when deleting we get an unexpected node
                    if (sel.extentNode === this.platformObject) return null;
                    
                    range = sel.getRangeAt(0);
                }
            } else if (document.selection) {
                range = document.selection.createRange();
            }
            
            return {
                start:range ? range.startOffset : 0,
                startElem:range ? range.startContainer : this.platformObject.firstChild,
                end:range ? range.endOffset : 0,
                endElem:range ? range.endContainer : this.platformObject.firstChild
            };
        },
        
        getSelectedText: function() {
            var selection = this.getSelection(),
                value = this.get_value();
            return value.substring(selection.start, selection.end);
        },
        
        setSelection: function(selection) {
            if (selection) {
                var document = globalScope.document,
                    startElem = selection.startElem,
                    endElem = selection.endElem;
                if (startElem && startElem.parentNode && endElem && endElem.parentNode) {
                    var range = document.createRange();
                    range.setStart(startElem, Math.min(selection.start, startElem.length));
                    range.setEnd(endElem, Math.min(selection.end, endElem.length));
                    
                    if (globalScope.getSelection) {
                        var sel = window.getSelection();
                        if (sel.rangeCount > 0) sel.removeAllRanges();
                        sel.addRange(range);
                    } else if (document.selection) {
                        range.select();
                    }
                }
            }
        },
        
        /** Selects all the text.
            @returns void */
        selectAll: function() {
            var fc = this.platformObject.firstChild;
            this.setSelection(fc ? {start:0, startElem:fc, end:this.getCharacterCount(), endElem:fc} : null);
        },
        
        clearSelection: function() {
            this.setSelection(null);
        },
        
        saveSelection: function(selection) {
            this.__selRange = selection || this.getSelection() || this._selRange;
        },
        
        restoreSelection: function() {
            this.setSelection(this.__selRange);
        }
    });
});
