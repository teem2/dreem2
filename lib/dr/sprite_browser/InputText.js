/* Copyright 2015 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/
/** Provides an interface to platform specific Input Text functionality. */
define(function(require, exports, module) {
  var dr = require('$LIB/dr/dr.js'),
    JS = require('$LIB/jsclass.js'),
    globalScope = require('$SPRITE/global.js'),
    sprite = require('$SPRITE/sprite.js');
  
  module.exports = sprite.InputText = new JS.Class('sprite.InputText', require('./Text.js'), {
    // Life Cycle //////////////////////////////////////////////////////////////
    createPlatformObject: function(attrs) {
      var isPass = ('' + attrs.password) === 'true',
        isMulti;
      
      if (isPass) {
        // Password fields can't be multiline
        attrs.multiline = false;
      } else {
        isMulti = ('' + attrs.multiline) === 'true';
      }
      
      attrs.ELEMENT_TYPE = isMulti ? 'textarea' : 'input';
      
      var elem = this.callSuper(attrs);
      
      if (isMulti) {
        elem.style.resize = 'none';
      } else {
        elem.setAttribute('type', isPass ? 'password' : 'text');
      }
      
      return elem;
    },
    
    
    // Attributes //////////////////////////////////////////////////////////////
    /** @overrides */
    __updateMultiline: function() {
      var whitespace, wordwrap;
      if (this.__isMultiline) {
        whitespace = this.__isAutoWidth || !this.__wrap ? 'pre' : 'pre-wrap';
        wordwrap = this.__wrap ? '' : 'normal';
      } else {
        whitespace = 'nowrap';
      }
      this.styleObj.whiteSpace = whitespace;
      this.styleObj.wordWrap = wordwrap;
    },
    
    set_wrap: function(v) {
      this.__wrap = v;
      this.__updateMultiline();
      return v;
    },
    
    set_rows: function(v) {
      this.platformObject.rows = v;
      return v;
    },
    
    set_value: function(v) {
      if (this.platformObject.value !== v) this.platformObject.value = v;
      return v;
    },
    
    get_value: function() {
      return this.platformObject.value;
    },
    
    set_maxlength: function(v) {
      if (v == null || 0 > v) {
        this.platformObject.removeAttribute('maxLength');
      } else {
        this.platformObject.maxLength = v;
      }
      return v;
    },
    
    set_disabled: function(v) {
      if (this.platformObject.disabled !== v) this.platformObject.disabled = v;
      return v;
    },
    
    
    // Methods /////////////////////////////////////////////////////////////////
    /** @overrides */
    preventDefault: function(platformEvent, eventType, preventDefault) {
      // Never prevent default behavior with input text.
      return false;
    },
    
    /** @private */
    filterInputPress: function(platformEvent) {
      var charCode = platformEvent.which;
      
      // Firefox fires events for arrow keys and backspace which should be
      // ignored completely.
      switch (charCode) {
        case 8: // backspace key
        case 0: // arrow keys have a "charCode" of 0 in firefox.
          return;
      }
      
      // Filter for allowed characters
      var allowedchars = this.view.allowedchars;
      if (allowedchars && allowedchars.indexOf(String.fromCharCode(charCode)) === -1) dr.sprite.preventDefault(platformEvent);
    },
    
    // Caret handling //
    /** @overrides dr.sprite.Text
        Gets the location of the caret.
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
    
    // Selection Management //
    /** @overrides */
    getSelection: function() {
      var po = this.platformObject;
      return {
        //startElem:po,
        //endElem:po,
        start:po.selectionStart,
        end:po.selectionEnd
      };
    },
    
    /** @overrides */
    selectAll: function() {
      this.platformObject.select();
    },
    
    /** @overrides */
    clearSelection: function() {
      this.setCaretPosition(0, 0);
    },
    
    /** @overrides */
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
    }
  });
});
