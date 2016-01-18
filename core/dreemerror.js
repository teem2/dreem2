/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License. */

/**
 * @class DreemError {Internal}
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