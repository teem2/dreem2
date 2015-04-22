/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

/**
 * @class RunMonitor
 * RunMonitor class executes ourselves as a subprocess, receives the dependency file names
 * from the child process and manages restart/killing when files change
 */

define(function(require, exports, module){
	module.exports = RunMonitor

	var FileWatcher = require('./filewatcher')
	var ExternalApps = require('./externalapps')
	var child_process = require('child_process')

	/**
	 * @constructor
	 * Parses the arguments
	 * @param {Array} argv Pass process.argv
	 */
	function RunMonitor(args){
		// lets process args into hash
		this.args = args
		this.restart_count = 0

		this.watcher = new FileWatcher()
		this.watcher.onChange = function(file){
			//if(args['-nodreem'] && file.indexOf('dreem.js') != -1) return
			console.color('~g~Got filechange: ~y~'+file+'~~ restarting server\n')
			// lets restart this.child
			if(this.child){
				this.child.kill('SIGHUP')
				setTimeout(function(){
					if(this.child) this.child.kill('SIGTERM')
				}.bind(this), 50)
			}
			else{
				this.start()
			}
		}.bind(this)
		this.start()
	}
	body.call(RunMonitor.prototype)

	function body(){

		/**
		 * @attribute restart_delay
		 * When in infinite restart loop, wait atleast this long (ms)
		 */
		this.restart_delay = 1000

		/* Internal. start the monitored process again*/
		this.start = function(){
			var subarg = process.argv.slice(1)

			subarg.push('-nomoni')
			subarg.push('-count')
			subarg.push(this.restart_count++)

			var stdio = [process.stdin, process.stdout,'pipe']
			this.was_exception = false
			this.watcher.watch(subarg[0])

			this.child = child_process.spawn(process.execPath, subarg, {
				stdio: stdio
			})

			this.child.stderr.on('data', function(buf){
				// we haz exception, wait for filechange
				var data = buf.toString()
				if(data.indexOf('\x0F')!= -1){
					var files = data.split('\x0F')
					for(var i = 0;i<files.length;i++){
						var file = files[i].replace(/\n/,'')
						if(file) this.watcher.watch(file)
					}
					return
				}

				this.was_exception = true
				var m = data.match(/^(\/[^\:]+)\:(\d+)\n/)
				var ln = data.split(/\n/)
				if(m){ // open error in code editor
					if(this.args['-notify']) ExternalApps.notify(ln[1]+'\n'+ln[2],ln[3])
					if(this.args['-edit']) ExternalApps.editor(m[1],m[2])
				}
				process.stdout.write(data)
			}.bind(this))

			this.child.on('close', function(code){
				// lets have a start per second
				this.child = undefined
				if(this.was_exception && !this.args['-restart']) return console.log("Exception detected, not restarting")
				if(Date.now() - this.last >= this.restart_delay){
					this.start()
				}
				else{
					setTimeout(function(){
						this.start()
					}.bind(this), this.restart_delay)
				}
			}.bind(this))		
		}
	}
})