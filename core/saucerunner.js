/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
 */
/**
 * @class BusServer {}
 * Holds a set of server side sockets for broadcast
 */
define(function(require, exports, module) {
  module.exports = SauceRunner;

  var fs = require('fs'),
    path = require('path');

  function SauceRunner() {
  };

  body.call(SauceRunner.prototype);

  function body() {

    /**
     * @method getHTML
     * generates the sauce runner HTML with all of the smoke tests
     */
    this.getHTML = function(htmlTemplatePath) {
      console.log('saucerunner getHTML');
//      var filePath = path.join(define.expandVariables(define.ROOT), '/saucerunner.html');
//      var filename = dreemroot + '/saucerunner.html';
      var html = fs.readFileSync(htmlTemplatePath, "utf8");

      var smokePath = path.join(define.expandVariables(define.ROOT), '/compositions/smoke');
      var files = fs.readdirSync(smokePath);
      var str = '';
      for (var i=0, l=files.length; i<l; i++) {
        var fileName = files[i];
        if(fileName.match(/\.dre/i)){
          if(str) str += ","
          str += '"http://localhost:8080/compositions/smoke/'+fileName+'?test"'
        }
      }
      var out = html.replace(/DYNAMIC_FILES = null/,'DYNAMIC_FILES = [' + str + ']')
      return out;
    }
  }
})
