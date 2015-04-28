/** Provides a dependency target that pulls in all of the dr package. */
define(function(require, exports, module)
{
    var dr = require('./dr.js');
    
    require('./globals/GlobalError.js');
    require('./Eventable.js');
    require('./view/SizeToViewport.js');
    require('./Animator.js');
    require('./behavior/Button.js');
    require('$SPRITE/Text.js');

	if (dr.global == undefined) dr.global = require('$LIB/dr/globals/Global.js');	
	dr.global.viewportResize = require('$LIB/dr/globals/GlobalViewportResize.js');
	dr.global.roots = require('$LIB/dr/globals/GlobalRootViewRegistry.js');
    module.exports = dr;
	
	if (dr.sprite == undefined) dr.sprite = require( '$SPRITE/sprite.js');
	if (dr.sprite.Text == undefined) dr.sprite.Text = require( '$SPRITE/Text.js');
	
	
});
