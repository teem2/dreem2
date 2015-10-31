/**
 * Copyright (c) 2015 Teem2 LLC
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
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
