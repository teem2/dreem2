/** Provides a dependency target that pulls in all of the dr package. */
define(function(require, exports, module) {
    module.exports = require('$LIB/dr/dr.js');
    
    require('$LIB/dr/globals/GlobalError.js');
    require('$LIB/dr/Eventable.js');
    require('$LIB/dr/view/SizeToViewport.js');
    require('$LIB/dr/animation/Animator.js');
    require('$LIB/dr/animation/AnimGroup.js');
    require('$LIB/dr/behavior/Button.js');
    require('$LIB/dr/behavior/Draggable.js');
    
    require('$SPRITE/Text.js');
    require('$SPRITE/InputText.js');
    require('$SPRITE/Bitmap.js');
    require('$SPRITE/Webview.js');
    require('$SPRITE/VideoPlayer.js');
});
