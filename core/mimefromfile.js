/*
 The MIT License (MIT) (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC

 MimeType lookup table
*/

define(function(require, exports, module){
	module.exports = mimeFromFile

	var mimeTypes = {
		htm: "text/html",
		html: "text/html",
		js: "application/javascript",
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		txt: "text/plain",
		css: "text/css",
		ico:  "image/x-icon",
		png: "image/png",
		gif: "image/gif"
	}

	var regex = RegExp("\\.(" + Object.keys(mimeTypes).join("|") + ")$")

	function mimeFromFile(name){
		var ext = name.match(regex)
		return ext && mimeTypes[ ext[1] ] || "text/plain"
	}
})
