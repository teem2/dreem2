/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


/** Provides the ability to store and retrieve data on the client. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        GlobalRegistry = require('./Global.js'),
        GlobalClientStorageSprite = require('$SPRITE/GlobalClientStorage.js');
    
    module.exports = new JS.Singleton('GlobaGlobalClientStoragelRequestor', {
        include: [
            require('$LIB/dr/SpriteBacked.js')
        ],
        
        
        // Constructor /////////////////////////////////////////////////////////////
        initialize: function() {
            this.set_sprite(this.createSprite());
            GlobalRegistry.register('clientstorage', this);
        },
        
        createSprite: function(attrs) {
            return new GlobalClientStorageSprite();
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @returns The number of data items stored in the Storage object. */
        getLength: function() {
            return this.sprite.getLength();
        },
        
        /** @param n:integer The index of the key name to retrieve.
            @returns The name of the nth key in the storage. */
        getKey: function(n) {
            return this.sprite.getKey(n);
        },
        
        /** @param key:string The name of the storage entry to return.
            @returns The value of the storage entry or null if not found. */
        getItem: function(key) {
            return this.sprite.getItem(key);
        },
        
        /** Stores the value under the key. If a value already exists for
            the key the value will be replaced with the new value.
            @param key:string The key to store the value under.
            @param value:* The value to store.
            @returns void */
        setItem: function(key, value) {
            this.sprite.setItem(key, value);
        },
        
        /** Removes the storage entry for the key.
            @param key:string The key to remove.
            @returns void */
        removeItem: function(key) {
            this.sprite.removeItem(key);
        },
        
        /** Removes all storage entries.
            @returns void */
        clear: function() {
            this.sprite.clear();
        }
    });
});
