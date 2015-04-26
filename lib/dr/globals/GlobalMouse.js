/** Provides global mouse events by listening to mouse events on the 
    viewport. Registered with dr.global as 'mouse'. */
define(function(require, exports){
    var dr = require('$LIB/dr/dr.js');
    var JS = require('$LIB/jsclass.js');
    
    ;
   var Global = require('./Global.js');
    var GlobalMouse = require('$SPRITE/GlobalMouse.js');
    require('$LIB/dr/events/Observable.js');
    
    new JS.Singleton('GlobalMouse', {
        include: [
			require('$LIB/dr/SpriteBacked.js'),
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
            
            Global.register('mouse', this);
        },
        
        createSprite: function(attrs) {
            return new GlobalMouse(this);
        }
    });
});
