/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


/** Provides the ability to send and receive data over the network. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        GlobalRegistry = require('./Global.js'),
        GlobalRequestorSprite = require('$SPRITE/GlobalRequestor.js');
    
    module.exports = new JS.Singleton('GlobalRequestor', {
        include: [
            require('$LIB/dr/SpriteBacked.js')
        ],
        
        
        // Constructor /////////////////////////////////////////////////////////////
        initialize: function() {
            this.set_sprite(this.createSprite());
            GlobalRegistry.register('requestor', this);
        },
        
        createSprite: function(attrs) {
            return new GlobalRequestorSprite();
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        fetch: function(url) {
            return this.sprite.fetch(url);
        },
        
        send: function(url, data) {
            return this.sprite.send(url, data);
        }
    });
});
