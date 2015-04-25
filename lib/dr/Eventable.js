/** An object that provides accessors, events and simple lifecycle management.
    Useful as a light weight alternative to dr.Node when parent child
    relationships are not needed.
    
    Events:
        None.
    
    Attributes:
        initing:boolean Set to true during initialization and then false
            when initialization is complete.
        inited:boolean Set to true after this Eventable has completed 
            initializing.
*/
define(function(require, exports){
    var dr = require('./dr.js');
    var JS = require('../../../../lib/jsclass.js');
    
    require('./AccessorSupport.js');
    require('./Destructible.js');
    require('./events/Observer.js');
    require('./model/pool/TrackActivesPool.js');
    
    dr.Eventable = new JS.Class('Eventable', {
        include: [dr.AccessorSupport, dr.Destructible, dr.Observable, dr.Observer],
        
        
        // Constructor /////////////////////////////////////////////////////////////
        /** The standard JSClass initializer function.
            @param attrs:object (Optional) A map of attribute names and values.
            @param mixins:array (Optional) a list of mixins to be added onto
                the new instance.
            @returns void */
        initialize: function(attrs, mixins) {
            if (mixins) {
                for (var i = 0, len = mixins.length; len > i;) this.extend(mixins[i++]);
            }
            
            this.inited = false;
            this.initing = true;
            this.init(attrs || {});
        },
        
        
        // Life Cycle //////////////////////////////////////////////////////////////
        /** Called during initialization. Calls setter methods and lastly, sets 
            inited to true and initing to false. Subclasses must callSuper.
            @param attrs:object A map of attribute names and values.
            @returns void */
        init: function(attrs) {
            var CONSTRAINTS = dr.AccessorSupport.CONSTRAINTS;
            CONSTRAINTS.incrementLockCount();
            
            this.callSetters(attrs);
            
            CONSTRAINTS.decrementLockCount();
            
            this.initing = false;
            this.inited = true;
        },
        
        /** @overrides dr.Destructible. */
        destroy: function() {
            this.stopListeningToAllObservables();
            this.detachAllObservers();
            
            this.callSuper();
        }
    });
});
