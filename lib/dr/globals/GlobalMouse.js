/** Provides global mouse events by listening to mouse events on the 
    viewport. Registered with dr.global as 'mouse'. */
define(function(require, exports){
    var dr = require('../dr.js');
    var JS = require('../../../../../lib/jsclass.js');
    
    require('../SpriteBacked.js');
    require('./Global.js');
    require('../sprite/GlobalMouse.js');
    require('../events/Observable.js');
    
    new JS.Singleton('GlobalMouse', {
        include: [
            dr.SpriteBacked,
            dr.Observable
        ],
        
        
        // Constructor /////////////////////////////////////////////////////////////
        initialize: function() {
            this.set_sprite(this.createSprite());
            
            // Store in dr namespace for backwards compatibility with dreem
            if (dr.mouse) {
                dr.dumpStack('dr.mouse already set.');
            } else {
                dr.mouse = this;
            }
            
            dr.global.register('mouse', this);
        },
        
        createSprite: function(attrs) {
            return new dr.sprite.GlobalMouse(this);
        }
    });
});
