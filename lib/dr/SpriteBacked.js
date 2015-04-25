/** Indicates that a dr.Node is backed by a sprite. */
define(function(require, exports){
    var dr = require('./dr.js');
    var JS = require('$LIB/jsclass.js');
    
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
            return new dr.sprite.View(this, attrs);
        }
    });
});
