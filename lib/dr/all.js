/** Provides a dependency target that pulls in all of the dr package. */
define(function(require, exports, module){
    var dr = require('./dr.js');
    
    require('./globals/GlobalError.js');
    require('./Eventable.js');
    require('./view/SizeToViewport.js');
    require('./Animator.js');
    require('./behavior/Button.js');
    require('./sprite/Text.js');
    
    module.exports = dr;
});
