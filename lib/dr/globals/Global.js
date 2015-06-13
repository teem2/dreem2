/** Holds references to "global" objects and services. Fires events when 
    these globals are registered and unregistered.
    
    Events:
        onregister<key>:object Fired when an object is stored under the key.
        onunregister<key>:object Fired when an object is removed from the key.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js');
    
    module.exports = dr.global = new JS.Singleton('GlobalRegistry', {
        include: [
            require('$LIB/dr/events/Observable.js')
        ],
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** Registers the provided global under the key. Fires a register<key>
            event. If a global is already registered under the key the existing
            global is unregistered first.
            @returns void */
        register: function(key, v) {
            if (this.hasOwnProperty(key)) {
                dr.sprite.console.log("Warning: dr.global key in use: ", key);
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
                dr.sprite.console.log("Warning: dr.global key not in use: ", key);
            }
        }
    });
});
