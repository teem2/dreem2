/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License. */

/**
 * Promisify turns a node-callback using function into a promise using function
 */
define(function(require, exports, module){
  module.exports = promisify;

  if (true) {//} Promise === 'undefined'){
    global.Promise = require('./promisepolyfill');
  }

  function promisify(call) {
    return function() {
      var arg = Array.prototype.slice.call(arguments);
      return new Promise(function(resolve, reject) {
        arg.push(function(err, result) {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
        call.apply(this, arg);
      }.bind(this));
    };
  };
})