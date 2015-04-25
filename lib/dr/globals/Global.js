/** Holds references to "global" objects. Fires events when these globals
    are registered and unregistered.
    
    Events:
        onregister<key>:object Fired when an object is stored under the key.
        onunregister<key>:object Fired when an object is removed from the key.
*/
define(function(require, exports){
    var dr = require('../dr.js');
    var JS = require('$LIB/jsclass.js');
    
    require('../events/Observer.js');
    
    dr.global = new JS.Singleton('Global', {
        include: [dr.Observable],
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** Registers the provided global under the key. Fires a register<key>
            event. If a global is already registered under the key the existing
            global is unregistered first.
            @returns void */
        register: function(key, v) {
            if (this.hasOwnProperty(key)) {
                console.log("Warning: dr.global key in use: ", key);
                this.unregister(key);
            }
            this[key] = v;
            this.sendEvent('onregister' + key, v);
        },
        
        /** Unegisters the global for the provided key. Fires an unregister<key>
            event if the key exists.
            @returns void */
        unregister: function(key) {
            if (this.hasOwnProperty(key)) {
                var v = this[key];
                delete this[key];
                this.sendEvent('onunregister' + key, v);
            } else {
                console.log("Warning: dr.global key not in use: ", key);
            }
        }
    });
});
