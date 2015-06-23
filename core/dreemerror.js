/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/
/**
 * @class DreemError
 * Unified Error class that holds enough information to 
 * find the right file at the right line
 */
define(function(require, exports, module) {
  module.exports = DreemError;

  /**
   * @constructor
   * @param {String} message Message
   * @param {String} path Path of file
   * @param {Int} line Line of error
   * @param {Int} col Column of error
   */
  function DreemError(message, path, line, col) {
    this.message = message;
    if (arguments.length == 2) {
      this.where = path;
    } else {
      this.path = path;
      this.line = line;
      this.col = col;
    }
  };

  body.call(DreemError.prototype);

  function body() {
    this.expand = function(path, source) {
      if (this.where !== undefined) {
        var col = 0;
        var line = 0;
        for (var i = 0; i < source.length && i < this.where; i++, col++) {
          if (source.charCodeAt(i) == 10) line++, col = 0;
        }
        this.line = line + 1;
        this.col = col + 1;
        this.path = path;
        this.where = undefined;
      }
    };
    
    this.toString = function() {
      return 'Dreem Error: '+this.path+(this.line!==undefined?":"+this.line+(this.col?":"+this.col:""):"")+"- " + this.message;
    }
  };
})