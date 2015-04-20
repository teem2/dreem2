/*
 The MIT License (MIT) (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

define(function(require, exports, module){
	module.exports = DomRunner

	var DreemParser = require('./DreemParser.js')
	var BusClient = require('./BusClient.js')

	function DomRunner(){
		// Our always available websocket connection to the server
		this.busClient = new BusClient(location.href);

		// receive server messages, such as file changes
		this.busClient.onMessage = function(message) {
			if (message.type === 'filechange') {
				location.href = location.href; // reload on filechange
			} else if (message.type === 'close') {
				window.close(); // close the window
			} else if (message.type === 'delay') { // a delay refresh message
				console.log('Got delay refresh from server!');
				setTimeout(function() {
					location.href = location.href;
				}, 1500);
			}
		}

		// Only start processing dreem tags when the document is ready
		document.onreadystatechange = function() {
			if (document.readyState === "complete") {
				// find the first view tag
				var views = document.getElementsByTagName('view');
				if (!views || views.length === 0) return console.log('No views to process!');
				// lets pass our outerHTML to our compiler since we also want the root
				// view to be parsed.
				var rootView = views[0];
				this.compile(rootView.outerHTML, function(error, pkg) {
					if (!error) {
						//console.log(pkg);
						rootView.parentNode.removeChild(rootView);
						dreemMaker.makeFromPackage(pkg);
					}
				});
			}
		}.bind(this)
	}

	var self = DomRunner.prototype

	self.showErrors = function(error) {
		if (error) {
			if (!Array.isArray(error)) error = [error];
			error.forEach(function(err) {
				console.error(err.toString());
			});
			
			// Send all errors to the server so it can open them in the editor
			domRunner.busClient.send({
				type:'error',
				errors:error
			});
		}
	};

	// Browser side usage of Compiler
	self.compile = function(dreemhtml, callback){
		var compiler = new dreemParser.Compiler();

		compiler.onRead = function(file, callback) {
			// The current page is read from the html we pass in
			if (file === location.pathname) return callback(null, dreemhtml, file);

			// If no file extension use the default file extension
			var parts = file.split('/'), lastPart = parts[parts.length - 1];
			if (lastPart.indexOf('.') === -1) file += '.' + define.CLASS_FILE_EXTENSION;

			// load JS via script tag, just cause its cleaner in a browser.
			if (file.indexOf('.js') === file.length - 3) {
				var script = document.createElement('script');
				script.type = 'text/javascript';
				script.async = false;
				script.onload = function() {
					callback(null, '', file); // just return empty string
				};
				script.onerror = function(e){
					callback(new DreemError('File not found ' + file));
				};
				script.src = file;
				
				document.head.appendChild(script);
			} else {
				// otherwise we XHR
				var xhr = new XMLHttpRequest();
				xhr.open("GET", file, true);
				xhr.onreadystatechange = function() {
					if (xhr.readyState == 4) {
						if (xhr.status != 200) return callback(new DreemError('Error loading file ' + file + ' return ' + xhr.status));
						return callback(null, xhr.responseText, file);
					}
				};
				xhr.send();
			}
		};

		compiler.execute(location.pathname, function(error, pkg) {
			if (error) return domRunner.showErrors(error);
			callback(error, pkg);
		});
	};

})