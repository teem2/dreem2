/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


/** Provides global error events and console logging.
    
    Events:
        Error specific events are broadcast. Here is a list of known error
        types.
            eventLoop: Fired by dr.Observable when an infinite event loop
                would occur.
    
    Attributes:
        stackTraceLimit:int Sets the size for stack traces.
        consoleLogging:boolean Turns logging to the console on and off.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        GlobalRegistry = require('./Global.js'),
        sprite = require('$SPRITE/sprite.js');
    
    module.exports = new JS.Singleton('GlobalError', {
        include: [
            require('$LIB/dr/events/Observable')
        ],
        
        
        // Constructor /////////////////////////////////////////////////////////////
        initialize: function() {
            this.set_stackTraceLimit(50);
            this.set_consoleLogging(true);
            GlobalRegistry.register('error', this);
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        set_consoleLogging: function(v) {
            this.consoleLogging = v;
        },
        
        set_stackTraceLimit: function(v) {
            this.stackTraceLimit = sprite.set_stackTraceLimit(v);
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** A wrapper on this.notify where consoleFuncName is 'error'. */
        notifyError: function(type, msg, err) {this.notify('error', type, msg, err);},
        
        /** A wrapper on this.notify where consoleFuncName is 'warn'. */
        notifyWarn: function(type, msg, err) {this.notify('warn', type, msg, err);},
        
        /** A wrapper on this.notify where consoleFuncName is 'log'. */
        notifyMsg: function(type, msg, err) {this.notify('log', type, msg, err);},
        
        /** A wrapper on this.notify where consoleFuncName is 'debug'. */
        notifyDebug: function(type, msg, err) {this.notify('debug', type, msg, err);},
        
        /** Broadcasts that an error has occurred and also logs the error to the
            console if so configured.
            @param consoleFuncName:string (optional) The name of the function to 
                call on the console. Standard values are:'error', 'warn', 'log'
                and 'debug'. If not provided no console logging will occur 
                regardless of the value of this.consoleLogging.
            @param eventType:string (optional) The type of the event that will be 
                broadcast. If not provided 'error' will be used.
            @param msg:* (optional) Usually a string, this is additional information
                that will be provided in the value object of the broadcast event.
            @param err:Error (optional) A javascript error object from which a
                stacktrace will be taken. If not provided a stacktrace will be
                automatically generated.
            @private */
        notify: function(consoleFuncName, eventType, msg, err) {
            var stacktrace = sprite.generateStacktrace(eventType, msg, err),
                event = {msg:msg, stacktrace:stacktrace};
            
            if (eventType) this.sendEvent('on' + eventType, event);
            this.sendEvent('onall', event);
            
            if (this.consoleLogging && consoleFuncName) sprite.console[consoleFuncName](stacktrace || msg);
        },
        
        logError: function(msg) {this.log('error', msg);},
        logWarn: function(msg) {this.log('warn', msg);},
        logMsg: function(msg) {this.log('log', msg);},
        logDebug: function(msg) {this.log('debug', msg);},
        
        log: function(consoleFuncName, msg) {
            if (this.consoleLogging && consoleFuncName) sprite.console[consoleFuncName](msg);
        }
    });
});
