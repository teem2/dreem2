/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License. */

/**
 * Provides hooks for launching other apps from the server.
 */
define(function(require, exports, module){
  var child_process = require('child_process');
  
  /**
   * @method browser
   * Opens a webbrowser on the specified url 
   * @param {String} url Url to open
   * @param {Bool} withdevtools Open developer tools too (gives focus on OSX)
   */
   exports.browser = function(url, withdevtools) {
    if (process.platform == 'darwin') {
      // Spawn google chrome
      child_process.spawn(
        "/Applications/Google chrome.app/Contents/MacOS/Google Chrome", ["--incognito",url]
      );
      // open the devtools 
      if (withdevtools) {
        setTimeout(function() {
          child_process.exec('osascript -e \'tell application "Chrome"\n\treopen\nend tell\ntell application "System Events" to keystroke "j" using {option down, command down}\'')
        }, 200);
      }
    } else{
      console.log("Sorry your platform "+process.platform+" is not supported for browser spawn");
    }
  };

  /**
   * @method editor
   * Opens a code editor on the file / line /columnt
   * @param {String} file File to open
   * @param {Int} line Line to set cursor to
   * @param {Int} file File to open
   */
  exports.editor = function(file, line, col){
    if (process.platform == 'darwin') {
      // Only support sublime for now
      child_process.spawn(
        "/Applications/Sublime\ Text.app/Contents/SharedSupport/bin/subl",
        [file + ':' + line + (col!==undefined?':'+col:'')]
      );
    } else{
      console.log("Sorry your platform "+process.platform+" is not supported for editor spawn");
    }
  };

  /**
   * @method notify
   * Opens a tray notification
   * @param {String} body Body of the notification
   * @param {String} title Title of notification
   * @param {String} subtitle Subtitle
   */
  exports.notify = function(body, title, subtitle){
    if (process.platform == 'darwin') {
      child_process.spawn("osascript",
        ["-e",'display notification \"'+body.replace(/"/g,'\\"')+'\" '+(title?'with title \"'+title.replace(/"/g,'\\"')+'\" ':'')+(subtitle?'subtitle \"'+subtitle.replace(/"/g,'\\"')+'\"':'')]
      );
    } else{
      console.log("Sorry your platform "+process.platform+" is not supported for notify spawn");
    }
  };
})