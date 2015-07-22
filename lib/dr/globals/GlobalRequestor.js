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
            return new GlobalRequestorSprite(this);
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
