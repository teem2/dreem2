/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License. */

// using the node-hue-api found here:  https://github.com/peter-murray/node-hue-api
define(function(require, exports, module) {
  var node = require("$CLASSES/teem_node");
  var teem = require("$CLASSES/teem");
  // do not reload the hue module - 
  try {
    var Hue = define.huebaseOnce || (define.huebaseOnce = require("node-hue-api"));
    var HueApi = Hue.HueApi;
    var LightState = Hue.lightState;
    var SerialPort = serialPortModule.SerialPort;
  } catch(e) {}

  var displayResult = function(result) {
    console.log("result: " + JSON.stringify(result, null, 2));
  };

  var displayError = function(err) {
    console.error("" + err);
  };

  return node.extend("huebase_old", function() {
    this.__attribute("init", "event");
    this.setLight = function(id, r,g,b) {
      if (this.apiObject == undefined) {
        return;
      }
      var state  =  LightState.create();
      this.apiObject.setLightState(id, state.on().transitiontime(0).hsl(r,g,b)).fail(displayError).done();
    }
    
    this.init = function() {
      if (!LightState) return;
      console.color('~br~Hue~~ object started on server\n');
      Hue.nupnpSearch(function(err, result) {
        for(r in result) {
          if (result[r].id == this.id) {
            console.log("found " + this.id + " at address " + result[r].ipaddress);
            if (this.username != undefined) {
              var state  =  LightState.create();
              this.apiObject =  new HueApi(result[r].ipaddress, this.username);
              this.apiObject.searchForNewLights().then(displayResult).fail(displayError).done();
              this.apiObject.lights().then(displayResult).fail(displayError).done();
            }
          }
        }
      }.bind(this));
    }
  });
})