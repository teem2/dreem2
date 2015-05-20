/** Provides a dependency target that pulls in all of the dr package. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js');
    
    require('$LIB/dr/globals/GlobalError.js');
    require('$LIB/dr/Eventable.js');
    require('$LIB/dr/view/SizeToViewport.js');
    require('$LIB/dr/Animator.js');
    require('$LIB/dr/behavior/Button.js');
    require('$LIB/dr/behavior/Draggable.js');
    
    if (dr.global == null) dr.global = require('$LIB/dr/globals/Global.js');
    dr.global.viewportResize = require('$LIB/dr/globals/GlobalViewportResize.js');
    dr.global.roots = require('$LIB/dr/globals/GlobalRootViewRegistry.js');
    
    if (dr.sprite == null) dr.sprite = require('$SPRITE/sprite.js');
    if (dr.sprite.Text == null) dr.sprite.Text = require('$SPRITE/Text.js');
    if (dr.sprite.InputText == null) dr.sprite.InputText = require('$SPRITE/InputText.js');
    if (dr.sprite.Bitmap == null) dr.sprite.Bitmap = require('$SPRITE/Bitmap.js');
    
    module.exports = dr;
});
