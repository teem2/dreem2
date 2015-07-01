/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/
define(function(require, exports, module) {
  module.exports = FileWatcher;

  var fs = require('fs'),
    Promisify = require('./promisify');

  fs.statPromise = Promisify(fs.stat);

  var uid = 0;

  /**
   * @constructor
   */
  function FileWatcher() {
    this.files = {};
    this.timeout = 100;
    this.poll = this.poll.bind(this);
    this.itv = setTimeout(this.poll, 0);
    this.lastfire = 0;
    this.firelimit = 1000;
    this.uid = uid++;
  };

  body.call(FileWatcher.prototype);

  function body() {
    /**
     * @event onChange
     * @param {String} file File that changed
     */
    this.onChange = function(file){};
    
    /* Internal poll method */
    this.poll = function(file) {
      var stats = [];
      var names = [];
      for (var k in this.files) {
        names.push(k);
        stats.push(fs.statPromise(define.expandVariables(k)));
      }
      Promise.all(stats).then(function(results) {
        setTimeout(this.poll, this.timeout);
        for (var i = 0; i < results.length; i++) {
          var file = names[i];
          var res = results[i];
          res.atime = null;
          var str = JSON.stringify(res);
          // lets make sure we dont fire too often
          if (this.files[file] !== null && this.files[file] !== str) {
            var now = Date.now();
            if (now - this.lastfire > this.firelimit) {
              this.lastfire = now;
              this.onChange(file);
            }
          }
          this.files[file] = str;
        }
      }.bind(this)).catch(function(err) {
        // TODO lets unwatch the files that errored?
      })
    };
    
    /**
     * @method watch
     * @param {String} file File to watch
     */
    this.watch = function(file) {
      file = define.expandVariables(file);
      if (!(file in this.files)) this.files[file] = null;
    };
  }
})
