/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License. */

define(function(require, exports, module) {
  var node = require("$CLASSES/teem_node");
  var teem = require("$CLASSES/teem");
  
  // do not reload the serialport module - it has operating-system dependent things that will crash otherwise
  try {
    var serialPortModule = define.serialOnce || (define.serialOnce = require("serialport"));
    var SerialPort = serialPortModule.SerialPort;
  } catch(e) {}

  function lineConsumer (delimiter, encoding) {
    if (typeof delimiter === 'undefined' || delimiter === null) delimiter = '\r';
    if (typeof encoding  === 'undefined' || encoding  === null) encoding  = 'utf8';
    
    // Delimiter buffer saved in closure
    var data = '';
    return function (emitter, buffer) {
      data += buffer.toString(encoding);
      // Split collected data by delimiter
      var parts = data.split(delimiter);
      data = parts.pop();
      parts.forEach(function (part) {
        emitter.emit('data', part);
      });
    };
  }

  return node.extend("arduino", function() {
    this.portOpened = false;
    
    this.__attribute("init", "event")
    this.__attribute("connected", "event")
    
    this.connectedOutputs = {};
    
    this.onAttributeSet = function(key, value) {
      if (this.portOpened === true &&  this.serialPortContainer != undefined) {
        if (key in this.connectedOutputs) {
          var command = "atr " + key + " " + value.toString()+"\r\n";
          this.serialPortContainer.write(command);
        }
      }
    }
    
    this.init = function() {
      console.color('~br~Arduino~~ object started on server\n');
      this.openPort = function() {
        
        this.serialPortContainer = new SerialPort(this.port,{baudrate: 115200,  parser: lineConsumer("\n")});
        
        this.serialPortContainer.on('open', function() {
          this.portOpened = true;
          console.log('Serial Port Opened: ' + this.port);
          if (this.on_connected) this.on_connected.emit();
          
          this.serialPortContainer.on('close', function (err) {
            this.serialPortContainer = null;
            this.portOpened = false;
          });
          
          this.serialPortContainer.on('disconnect', function (err) {
            console.log('on.disconnect');
          }.bind(this));
          
          this.serialPortContainer.on('error', function (err) {
            console.error("on.error", err);
          }.bind(this));
          
          var i = 0;
          
          this.serialPortContainer.on('data', function(data) {
            try {
              var parsed = JSON.parse(data);
              if (parsed.atr) {
                this[parsed.atr] = parsed.value;
              } else if (parsed.inq) {
                for(outp in parsed.inq.digitalOutputs) {
                  this.connectedOutputs[parsed.inq.digitalOutputs[outp]] = 1;
                }
                for(outp in parsed.inq.analogOutputs) {
                  this.connectedOutputs[parsed.inq.digitalOutputs[outp]] = 1;
                }
                for(outp in parsed.inq.attributeBindings) {
                  this.connectedOutputs[parsed.inq.attributeBindings[outp]] = 1;
                }
              } else if (parsed.mtd) {
                if (parsed.mtd == "initsequencedone") {
                  this.serialPortContainer.write("inq\r\n");
                }
                try {
                  this[parsed]();
                } catch(e) {};
              } else {
                console.color("~by~Arduino~~ " + data + " \n");
              }
            } catch(e) {
              data = data.toString();
              data = data.trim();
              console.color("~br~Arduino~~ " + e.toString() + " \n");
              console.color("~by~Arduino~~ " + data + " \n");
            }
          }.bind(this));
          
          this.serialPortContainer.write("inq\r\n");
        }.bind(this));
      }.bind(this);
      
      this.scanPorts = function() {
        var RootThis = this;
        var P = this.port;
        var PS = this.portScanner;
        if (!serialPortModule) return;
        if (this.portOpened == false) {
          serialPortModule.list(function (err, ports) {
            ports.forEach(function(port) {
              if (P != undefined) {
                if (port.comName.toLowerCase() == P.toLowerCase()) {
                  RootThis.port = port.comName;
                  RootThis.openPort();
                }
              }
            });
          });
        };
      }.bind(this);
      
      this.portScanner = setInterval(this.scanPorts, 1000);
    }
    
    this.destroy = function() {
      if (this.portScanner) {
        clearInterval(this.portScanner);
      }
      if (this.serialPortContainer) {
        this.serialPortContainer.close();
      }
    }
  });
})