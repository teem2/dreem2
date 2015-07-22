/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/
define(function(require, exports, module) {
  module.exports = FileWatcher;

  var fs = require('fs'),
    Promisify = require('./promisify');

  fs.statPromise = Promisify(fs.stat);

  // file watching is handled by consolidating all files, from each application,
  // and only the unique files are watched. When a change is detected, an update
  // is passed to every application that includes the file.
  
  var uid = 0;
  var timeout = 500; // Frequency (msec) of checking
  var firelimit = 1000; // Maximum frequency of reloading
  var watchers = {}; // Map uid to FileWatcher objects
  var filemap = {};  // Map file names to hash of:
                     //   uids : Hash of uids using this file (forces unique)
                     //   stats: file stats (json)
                     //   lastfire: Last time file changed, or empty if never
  var itv = setTimeout(pollmaster, 0);  // Poll for changes

  // (global) Add a file to the master filemap
  function addmaster(file, uid) {
    if (!(file in filemap)) {    
      filemap[file] = {uids:{}, stats:null, lastfire:0};
    }
    filemap[file]['uids'][uid] = true;
  }

  // (global) Rebuild the filemap from the separate watcher lists
  function rebuild() {
    filemap = {};
    for (var uid in watchers) {
      for (var file in watchers[uid].files) {
	addmaster(file, uid);
      }
    }
  }

  // (global) Display stats to the console (for debugging)
  function debug() {
    var unique_files = Object.keys(filemap).length;
    var uuids = Object.keys(watchers).length;
    var total_files = 0
    for (var uid in watchers) {
      total_files += Object.keys(watchers[uid].files).length;
    }

    console.log(uuids + ' uuids. ' + unique_files + ' unique. ' + total_files + ' total files');
  }

  // (global) Scan the master filemap for changes
  function pollmaster() {
    var stats = [];
    var names = [];
    for (var file in filemap) {
      names.push(file);
      stats.push(fs.statPromise(define.expandVariables(file)));
    }

    //debug();
    
    // Compute the list of changes (map uid to array of changed files)
    var changes = {};

    Promise.all(stats).then(function(results) {
      setTimeout(pollmaster, timeout);
      // console.log('running', results.length, ' promises');
      for (var i = 0; i < results.length; i++) {
        var file = names[i];
        var res = results[i];
        res.atime = null;
        var str = JSON.stringify(res);

        // lets make sure we dont fire too often
	fileinfo = filemap[file];
	if (fileinfo['stats'] !== null && fileinfo['stats'] !== str) {
          var now = Date.now();
          if (now - fileinfo['lastfire'] > firelimit) {
            fileinfo['lastfire'] = now;
            var uids = fileinfo['uids'];
            for (var uid in uids) {
	      if (!(uid in changes)) {
		changes[uid] = [file];
	      }
	      else {
		changes[uid].push(file);
	      }
	    }
          }
        }
        fileinfo['stats'] = str;
      }

      // Notify watchers of all the changes
      for (var uid in changes) {
	var watcher = watchers[uid];
	// console.log('change', uid, watcher);
	files = changes[uid];
	for (var i=0; i<files.length; i++) {
	  watcher.onChange(files[i]);
	}
      }

    }.bind(this)).catch(function(err) {
      // TODO lets unwatch the files that errored?
      // console.log("EXCEPTION", err);
    });
  }
  



  /**
   * @constructor
   */
  function FileWatcher(args) {
    if (!args) args = {};
    this.files = {};
    this.timeout = args['timeout'] || 500;
    this.poll = this.poll.bind(this);
    this.itv = setTimeout(this.poll, 0);
    this.uid = uid++;

    // Record this object with the static scanner
    watchers[this.uid] = this;
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
      //TODO: What should the behavior of the individual polling methods be?
      return;
    };
    
    /**
     * @method watch
     * @param {String} file File to watch
     */
    this.watch = function(file) {
      file = define.expandVariables(file);
      if (!(file in this.files)) this.files[file] = null;
      addmaster(file, this.uid);
    };
  }
})
