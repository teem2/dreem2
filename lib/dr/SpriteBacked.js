/** Indicates that a dr.Node is backed by a sprite. */
define(function(require, exports, module)
{
    var dr = require('./dr.js');
    var JS = require('$LIB/jsclass.js');
    var View = require('$SPRITE/View.js')
    
    dr.SpriteBacked = new JS.Module('SpriteBacked', {
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
            return new View(this, attrs);
        },
        
        /** Triggers a simulated platform event on this SpriteBacked. */
        trigger: function(platformEventName, opts) {
            dr.sprite.simulatePlatformEvent(this, platformEventName, opts);
        }
    });

    module.exports = dr.SpriteBacked;
});