/*
 The MIT License (MIT) (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

define(function(require, exports, module){
	module.exports = FileWatcher

	var fs = require('fs')
	var Promisify = require('./Promisify')
	/**
	 * @constructor
	 */
	function FileWatcher(){
		this.files = {}
		this.timeout = 100
		this.poll = this.poll.bind(this)
		this.itv = setTimeout(this.poll, 0)
		this.lastfire = 0
		this.firelimit = 1000
	}

	var self = FileWatcher.prototype

	fs.statPromise = Promisify(fs.stat)

	/**
	 * @event onChange
	 * @param {String} file File that changed
	 */
	self.onChange = function(file){
	}

	/* Internal poll method */
	self.poll = function(file){
		var stats = []
		var names = []
		for(var k in this.files){
			names.push(k)
			stats.push(fs.statPromise(k))
		}
		Promise.all(stats).then(function(results){
			for(var i = 0;i<results.length;i++){
				var file = names[i]
				var res = results[i]
				res.atime = null
				var str = JSON.stringify(res)
				// lets make sure we dont fire too often

				if(this.files[file] !== null && this.files[file] !== str){
					var now = Date.now()
					if(now - this.lastfire > this.firelimit){
						this.lastfire = now
						this.onChange(file)
					}
				}
				this.files[file] = str
			}
			setTimeout(this.poll, this.timeout)
		}.bind(this)).catch(function(err){
			// TODO lets unwatch the files that errored?
		})
	}

	/**
	 * @method watch
	 * @param {String} file File to watch
	 */
	self.watch = function(file){
		if(!(file in this.files)) this.files[file] = null
	}
})