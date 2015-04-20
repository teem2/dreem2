/*
 The MIT License (MIT) (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

define(function(require, exports, module){
	/**
	 * @method browser
	 * Opens a webbrowser on the specified url 
	 * @param {String} url Url to open
	 * @param {Bool} withdevtools Open developer tools too (gives focus on OSX)
	 */
	 exports.browser = function(url, withdevtools){
		if(process.platform == 'darwin'){
			// Spawn google chrome
			child_process.spawn(
				"/Applications/Google chrome.app/Contents/MacOS/Google Chrome",
				["--incognito",url])
			// open the devtools 
			if(withdevtools){
				setTimeout(function(){
					child_process.exec('osascript -e \'tell application "Chrome"\n\treopen\nend tell\ntell application "System Events" to keystroke "j" using {option down, command down}\'')
				},200)
			}
		}
		else{
			console.log("Sorry your platform "+process.platform+" is not supported for browser spawn")
		}
	}

	/**
	 * @method editor
	 * Opens a code editor on the file / line /columnt
	 * @param {String} file File to open
	 * @param {Int} line Line to set cursor to
	 * @param {Int} file File to open
	 */
	exports.editor = function(file, line, col){
		if(process.platform == 'darwin'){
			// Only support sublime for now
			child_process.spawn(
				"/Applications/Sublime\ Text.app/Contents/SharedSupport/bin/subl",
				[file + ':' + line + (col!==undefined?':'+col:'')])
		}
		else{
			console.log("Sorry your platform "+process.platform+" is not supported for editor spawn")
		}
	}

	/**
	 * @method notify
	 * Opens a tray notification
	 * @param {String} body Body of the notification
	 * @param {String} title Title of notification
	 * @param {String} subtitle Subtitle
	 */
	exports.notify = function(body, title, subtitle){
		if(process.platform == 'darwin'){
			child_process.spawn("osascript",
				["-e",'display notification \"'+body.replace(/"/g,'\\"')+'\" '+(title?'with title \"'+title.replace(/"/g,'\\"')+'\" ':'')+(subtitle?'subtitle \"'+subtitle.replace(/"/g,'\\"')+'\"':'')])
		}
		else{
			console.log("Sorry your platform "+process.platform+" is not supported for notify spawn")
		}
	}
})