/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


/** Provides the ability to store and retrieve data on the client. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        globalScope = require('$SPRITE/global.js'),
        sprite = require('$SPRITE/sprite.js');
    
    module.exports = sprite.GlobalClientStorage = new JS.Class('sprite.GlobalClientStorage', {
        // Constructor /////////////////////////////////////////////////////////////
        /** The standard JSClass initializer function. Subclasses should not
            override this function.
            @param attrs:object A map of attribute names and values.
            @returns void */
        initialize: function(attrs) {
            this._storage = globalScope.localStorage;
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @returns The number of data items stored in the Storage object. */
        getLength: function() {
            return this._storage.length;
        },
        
        /** @param n:integer The index of the key name to retrieve.
            @returns The name of the nth key in the storage. */
        getKey: function(n) {
            return this._storage.key(n);
        },
        
        /** @param key:string The name of the storage entry to return.
            @returns The value of the storage entry or null if not found. */
        getItem: function(key) {
            return this._storage.getItem(key);
        },
        
        /** Stores the value under the key. If a value already exists for
            the key the value will be replaced with the new value.
            @param key:string The key to store the value under.
            @param value:* The value to store.
            @returns void */
        setItem: function(key, value) {
            this._storage.setItem(key, value);
        },
        
        /** Removes the storage entry for the key.
            @param key:string The key to remove.
            @returns void */
        removeItem: function(key) {
            this._storage.removeItem(key);
        },
        
        /** Removes all storage entries.
            @returns void */
        clear: function() {
            this._storage.clear();
        }
    });
});
