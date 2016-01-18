/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License. */

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
