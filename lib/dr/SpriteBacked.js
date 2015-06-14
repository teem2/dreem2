/** Indicates that a dr.Node is backed by a sprite. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        ViewSprite = require('$SPRITE/View.js');
    
    module.exports = dr.SpriteBacked = new JS.Module('SpriteBacked', {
        // Accessors ///////////////////////////////////////////////////////////////
        set_sprite: function(sprite) {
            if (this.sprite) {
                dr.dumpStack('Attempt to reset sprite.');
            } else {
                this.sprite = sprite;
            }
        },
        
        get_sprite: function() {
            return this.sprite;
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        createSprite: function(attrs) {
            // Default implementation is a View sprite.
            return new ViewSprite(this, attrs);
        },
        
        /** Triggers a simulated platform event on this SpriteBacked. */
        trigger: function(platformEventName, opts) {
            dr.sprite.simulatePlatformEvent(this, platformEventName, opts);
        }
    });
});