/** A single node within a tree data structure. A node has zero or one parent 
    node and zero or more child nodes. If a node has no parent it is a 'root' 
    node. If a node has no child nodes it is a 'leaf' node. Parent nodes and 
    parent of parents, etc. are referred to as ancestors. Child nodes and 
    children of children, etc. are referred to as descendants.
    
    Lifecycle management is also provided via the 'initNode', 'doBeforeAdoption',
    'doAfterAdoption', 'destroy', 'destroyBeforeOrphaning' and
    'destroyAfterOrphaning' methods.
    
    Events:
        parent:dr.Node Fired when the parent is set.
    
    Attributes:
        parent:dr.Node The parent of this Node.
        name:string The name of this node. Used to reference this Node from
            its parent Node.
        id:string The unique ID of this node in the global namespace.
        $textcontent:string The text found within the tags of an instance. Set
            when an instances children are being constructed.
        
        Lifecycle Related:
            initing:boolean Set to true during initialization and then false
                when initialization is complete.
            inited:boolean Set to true after this Node has completed 
                initializing.
            isBeingDestroyed:boolean (read only) Indicates that this node is in 
                the process of being destroyed. Set to true at the beginning of 
                the destroy lifecycle phase. Undefined before that.
        
        Placement Related:
            placement:string The name of the subnode of this Node to add nodes 
                to when set_parent is called on the subnode. Placement can be 
                nested using '.' For example 'foo.bar'. The special value of 
                '*' means use the default placement. For example 'foo.*' means 
                place in the foo subnode and then in the default placement 
                for foo.
            defaultplacement:string The name of the subnode to add nodes to when 
                no placement is specified. Defaults to undefined which means add
                subnodes directly to this node.
            ignoreplacement:boolean If set to true placement will not be 
                processed for this Node when it is added to a parent Node.
    
    Private Attributes:
        __animPool:array An dr.TrackActivesPool used by the 'animate' method.
        subnodes:array The array of child nodes for this node. Should be
            accessed through the getSubnodes method.
*/
define(function(require, exports){
    var dr = require('./dr.js');
    var JS = require('$LIB/jsclass.js');
    
    require('./AccessorSupport.js');
    require('./Destructible.js');
    require('./events/Observer.js');
    require('./model/pool/TrackActivesPool.js');
    
    dr.Node = new JS.Class('Node', {
        include: [
            dr.AccessorSupport,
            dr.Destructible,
            dr.Observable,
            dr.Observer
        ],
        
        
        // Class Methods and Attributes ////////////////////////////////////////////
        extend: {
            /** Get the closest ancestor of the provided Node or the Node itself for 
                which the matcher function returns true.
                @param n:dr.Node the Node to start searching from.
                @param matcher:function the function to test for matching Nodes with.
                @returns Node or null if no match is found. */
            getMatchingAncestorOrSelf: function(n, matcherFunc) {
                if (n && matcherFunc) {
                    while (n) {
                        if (matcherFunc(n)) return n;
                        n = n.parent;
                    }
                }
                return null;
            },
            
            /** Get the youngest ancestor of the provided Node for which the 
                matcher function returns true.
                @param n:dr.Node the Node to start searching from. This Node is not
                    tested, but its parent is.
                @param matcher:function the function to test for matching Nodes with.
                @returns Node or null if no match is found. */
            getMatchingAncestor: function(n, matcherFunc) {
                return this.getMatchingAncestorOrSelf(n ? n.parent : null, matcherFunc);
            }
        },
        
        
        // Constructor /////////////////////////////////////////////////////////////
        /** The standard JSClass initializer function. Subclasses should not
            override this function.
            @param parent:Node (or dom element for RootViews) (Optional) the parent 
                of this Node.
            @param attrs:object (Optional) A map of attribute names and values.
            @param mixins:array (Optional) a list of mixins to be added onto
                the new instance.
            @returns void */
        initialize: function(parent, attrs, mixins) {
            if (mixins) {
                var i = 0, len = mixins.length, mixin;
                for (; len > i;) {
                    mixin = mixins[i++];
                    if (mixin) {
                        this.extend(mixin);
                    } else {
                        console.warn("Undefined mixin in initialization of: " + this.klass.__displayName);
                    }
                }
            }
            
            this.inited = false;
            this.initing = true;
            this.$textcontent = '';
            
            var defaultKlassAttrValues = this.klass.defaultAttrValues;
            if (defaultKlassAttrValues) attrs = dr.extend({}, defaultKlassAttrValues, attrs);
            
            this.initNode(parent, attrs || {});
        },
        
        
        // Life Cycle //////////////////////////////////////////////////////////////
        /** Called during initialization. Sets initial state for life cycle attrs,
            calls setter methods, sets parent and lastly, sets inited to true if
            the root view that contains this node is ready. Sets initing to false.
            Subclasses must callSuper.
            @param parent:Node (or dom element for RootViews) the parent of 
                this Node.
            @param attrs:object A map of attribute names and values.
            @returns void */
        initNode: function(parent, attrs) {
            var CONSTRAINTS = dr.AccessorSupport.CONSTRAINTS;
            CONSTRAINTS.incrementLockCount();
            
            // Assign directly since this isn't a real attribute.
            if (attrs.$tagname) {
                this.$tagname = attrs.$tagname;
                delete attrs.$tagname;
            }
            
            this.callSetters(attrs);
            this.doBeforeAdoption();
            this.set_parent(parent);
            this.doAfterAdoption();
            this.__makeChildren(dr);
            this.__registerHandlers(dr);
            
            CONSTRAINTS.decrementLockCount();
            
            this.initing = false;
            
            // oninit event will be fired by dr.RootView once the root view
            // is ready. We only fire it here if the root is already ready.
            if (this.getRoot().ready) this.notifyReady();
        },
        
        /** Called by dr.RootView once the root view is ready. */
        notifyReady: function() {
            this.inited = true;
            this.sendEvent('oninit', this);
        },
        
        /** Provides a hook for subclasses to do things before this Node has its
            parent assigned. This would be the ideal place to create subviews
            so as to avoid unnecessary dom reflows. However, text size can't
            be measured until insertion into the DOM so you may want to use
            doAfterAdoption for creating subviews since it will give you less
            trouble though it will be slower.
            @returns void */
        doBeforeAdoption: function() {},
        
        /** Provides a hook for subclasses to do things after this Node has its
            parent assigned.
            @returns void */
        doAfterAdoption: function() {},
        
        /** @private */
        __makeChildren: function(dr) {},
        
        /** @private */
        __registerHandlers: function(dr) {},
        
        /** @overrides dr.Destructible. */
        destroy: function() {
            // Allows descendants to know destruction is in process
            this.isBeingDestroyed = true;
            
            // Destroy subnodes depth first
            var subs = this.subnodes;
            if (subs) {
                var i = subs.length;
                while (i) subs[--i].destroy();
            }
            
            if (this.__animPool) {
                this.stopActiveAnimators();
                this.__animPool.destroy();
            }
            
            this.destroyBeforeOrphaning();
            if (this.parent) this.set_parent(null);
            this.destroyAfterOrphaning();
            
            // Remove from global namespace if necessary
            if (this.id) this.set_id();
            
            this.callSuper();
        },
        
        /** Provides a hook for subclasses to do destruction of their internals.
            This method is called after subnodes have been destroyed but before
            the parent has been unset.
            Subclasses should call callSuper.
            @returns void */
        destroyBeforeOrphaning: function() {},
        
        /** Provides a hook for subclasses to do destruction of their internals.
            This method is called after the parent has been unset.
            Subclasses must call callSuper.
            @returns void */
        destroyAfterOrphaning: function() {
            this.stopListeningToAllObservables();
            this.detachAllObservers();
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        /** Sets the provided Node as the new parent of this Node. This is the
            most direct method to do reparenting. You can also use the addSubnode
            method but it's just a wrapper around this setter. */
        set_parent: function(newParent) {
            // Use placement if indicated
            if (newParent && !this.ignoreplacement) {
                var placement = this.placement || newParent.defaultplacement;
                if (placement) newParent = newParent.determinePlacement(placement, this);
            }
            
            if (this.parent !== newParent) {
                // Abort if the new parent is in the destroyed life-cycle state.
                if (newParent && newParent.destroyed) return;
                
                // Remove ourselves from our existing parent if we have one.
                var curParent = this.parent;
                if (curParent) {
                    var idx = curParent.getSubnodeIndex(this);
                    if (idx !== -1) {
                        if (this.name) curParent.__removeNameRef(this);
                        curParent.subnodes.splice(idx, 1);
                        curParent.subnodeRemoved(this);
                    }
                }
                
                this.parent = newParent;
                
                // Add ourselves to our new parent
                if (newParent) {
                    newParent.getSubnodes().push(this);
                    if (this.name) newParent.__addNameRef(this);
                    newParent.subnodeAdded(this);
                }
                
                // Fire an event
                if (this.initing === false) this.sendEvent('onparent', newParent);
            }
        },
        
        /** The 'name' of a Node allows it to be referenced by name from its
            parent node. For example a Node named 'foo' that is a child of a
            Node stored in the var 'bar' would be referenced like this: bar.foo or
            bar['foo']. */
        set_name: function(name) {
            if (this.name !== name) {
                // Remove "name" reference from parent.
                var p = this.parent;
                if (p && this.name) p.__removeNameRef(this);
                
                this.name = name;
                
                // Add "name" reference to parent.
                if (p && name) p.__addNameRef(this);
            }
        },
        
        /** Stores this instance in the global scope under the provided id. */
        set_id: function(v) {
            var existing = this.id;
            if (v !== existing) {
                delete global[existing];
                this.id = v;
                if (v) global[v] = this;
                if (this.initing === false) this.sendEvent('onid', v);
            }
        },
        
        set_$textcontent: function(v) {this.setSimpleActual('$textcontent', v);},
        
        /** Gets the subnodes for this Node and does lazy instantiation of the 
            subnodes array if no child Nodes exist.
            @returns array of subnodes. */
        getSubnodes: function() {
            return this.subnodes || (this.subnodes = []);
        },
        
        // Placement Accessors /////////////////////////////////////////////////////
        set_placement: function(v) {this.setSimpleActual('placement', v);},
        set_defaultplacement: function(v) {this.setSimpleActual('defaultplacement', v);},
        set_ignoreplacement: function(v) {this.setSimpleActual('ignoreplacement', v);},
        
        
        // Methods /////////////////////////////////////////////////////////////////
        createChild: function(attrs, mixins) {
            var classname = 'node', parent = this, klass;
            
            if (attrs) {
                if (attrs.class) {
                    classname = attrs.class;
                    delete attrs.class;
                }
                
                if (attrs.parent) {
                    parent = attrs.parent;
                    delete attrs.parent;
                }
            }
            
            klass = dr[classname];
            if (typeof klass === 'function') {
                return new klass(parent, attrs, mixins);
            } else {
                dr.dumpStack("Unrecognized class in createChild", classname);
            }
        },
        
        /** Called from set_parent to determine where to insert a subnode in the node
            hierarchy. Subclasses will not typically override this method, but if
            they do, they probably won't need to call callSuper.
            @param placement:string the placement path to use.
            @param subnode:dr.Node the subnode being placed.
            @returns the Node to place a subnode into. */
        determinePlacement: function(placement, subnode) {
            // Parse "active" placement and remaining placement.
            var idx = placement.indexOf('.'), remainder, loc;
            if (idx !== -1) {
                remainder = placement.substring(idx + 1);
                placement = placement.substring(0, idx);
            }
            
            // Evaluate placement of '*' as defaultplacement.
            if (placement === '*') {
                placement = this.defaultplacement;
                
                // Default placement may be compound and thus require splitting
                if (placement) {
                    idx = placement.indexOf('.');
                    if (idx !== -1) {
                        remainder = placement.substring(idx + 1) + (remainder ? '.' + remainder : '');
                        placement = placement.substring(0, idx);
                    }
                }
                
                // It's possible that a placement of '*' comes out here if a
                // Node has its defaultplacement set to '*'. This should result
                // in a null loc when the code below runs which will end up
                // returning 'this'.
            }
            
            loc = this[placement];
            return loc ? (remainder ? loc.determinePlacement(remainder, subnode) : loc) : this;
        },
        
        /** Adds a named reference to a subnode.
            @param node:Node the node to add the name reference for.
            @returns void */
        __addNameRef: function(node) {
            var name = node.name;
            if (this[name] === undefined) {
                this[name] = node;
            } else {
                console.log("Name in use:" + name);
            }
        },
        
        /** Removes a named reference to a subnode.
            @param node:Node the node to remove the name reference for.
            @returns void */
        __removeNameRef: function(node) {
            var name = node.name;
            if (this[name] === node) {
                delete this[name];
            } else {
                console.log("Name not in use:" + name);
            }
        },
        
        // Tree Methods //
        /** Gets the root Node for this Node. The root Node is the oldest
            ancestor or self that has no parent.
            @returns Node */
        getRoot: function() {
            return this.parent ? this.parent.getRoot() : this;
        },
        
        /** Checks if this Node is a root Node.
            @returns boolean */
        isRoot: function() {
            return this.parent == null;
        },
        
        /** Tests if this Node is a descendant of the provided Node or is the
            node itself.
            @returns boolean */
        isDescendantOf: function(node) {
            if (node) {
                if (node === this) return true;
                if (this.parent) return this.parent.isDescendantOf(node);
            }
            return false;
        },
        
        /** Tests if this Node is an ancestor of the provided Node or is the
            node itself.
            @param node:Node the node to check for.
            @returns boolean */
        isAncestorOf: function(node) {
            return node ? node.isDescendantOf(this) : false;
        },
        
        /** Gets the youngest common ancestor of this node and the provided node.
            @param node:dr.Node The node to look for a common ancestor with.
            @returns The youngest common Node or null if none exists. */
        getLeastCommonAncestor: function(node) {
            while (node) {
                if (this.isDescendantOf(node)) return node;
                node = node.parent;
            }
            return null;
        },
        
        /** Find the youngest ancestor Node that is an instance of the class.
            @param klass the Class to search for.
            @returns Node or null if no klass is provided or match found. */
        searchAncestorsForClass: function(klass) {
            return klass ? this.searchAncestors(function(n) {return n instanceof klass;}) : null;
        },
        
        /** Find the youngest ancestor Node that has a defined value for the
            property.
            @returns Node or undefined if no propertyName is provided or match found. */
        getAncestorWithProperty: function(propertyName, propertyValue) {
            if (propertyName) {
                var func;
                if (propertyValue !== undefined) {
                    func = function(n) {return n[propertyName] === propertyValue;};
                } else {
                    func = function(n) {return n[propertyName] != null;};
                }
                return this.searchAncestors(func);
            } else {
                return null;
            }
        },
        
        /** Get the youngest ancestor of this Node for which the matcher function 
            returns true. This is a simple wrapper around 
            dr.Node.getMatchingAncestor(this, matcherFunc).
            @param matcherFunc:function the function to test for matching 
                Nodes with.
            @returns Node or null if no match is found. */
        searchAncestors: function(matcherFunc) {
            return dr.Node.getMatchingAncestor(this, matcherFunc);
        },
        
        /** Get the youngest ancestor of this Node or the Node itself for which 
            the matcher function returns true. This is a simple wrapper around 
            dr.Node.getMatchingAncestorOrSelf(this, matcherFunc).
            @param matcherFunc:function the function to test for matching 
                Nodes with.
            @returns Node or null if no match is found. */
        searchAncestorsOrSelf: function(matcherFunc) {
            return dr.Node.getMatchingAncestorOrSelf(this, matcherFunc);
        },
        
        /** Gets an array of ancestor nodes including the node itself.
            @returns array: The array of ancestor nodes. */
        getAncestors: function() {
            var ancestors = [], node = this;
            while (node) {
                ancestors.push(node);
                node = node.parent;
            }
            return ancestors;
        },
        
        walk: function(processBeforeFunc, processAfterFunc) {
            if (processBeforeFunc) processBeforeFunc(this);
            var subnodes = this.getSubnodes(), len = subnodes.length, i = 0;
            for (; len > i;) subnodes[i++].walk(processBeforeFunc, processAfterFunc);
            if (processAfterFunc) processAfterFunc(this);
        },
        
        // Subnode Methods //
        /** Checks if this Node has the provided Node in the subnodes array.
            @param node:Node the subnode to check for.
            @returns true if the subnode is found, false otherwise. */
        hasSubnode: function(node) {
            return this.getSubnodeIndex(node) !== -1;
        },
        
        /** Gets the index of the provided Node in the subnodes array.
            @param node:Node the subnode to get the index for.
            @returns the index of the subnode or -1 if not found. */
        getSubnodeIndex: function(node) {
            return this.getSubnodes().indexOf(node);
        },
        
        /** A convienence method to make a Node a child of this Node. The
            standard way to do this is to call the set_parent method on the
            prospective child Node.
            @param node:Node the subnode to add.
            @returns void */
        addSubnode: function(node) {
            node.set_parent(this);
        },
        
        /** A convienence method to make a Node no longer a child of this Node. The
            standard way to do this is to call the set_parent method with a value
            of null on the child Node.
            @param node:Node the subnode to remove.
            @returns the removed Node or null if removal failed. */
        removeSubnode: function(node) {
            if (node.parent !== this) return null;
            node.set_parent(null);
            return node;
        },
        
        /** Called when a subnode is added to this node. Provides a hook for
            subclasses. No need for subclasses to call callSuper. Do not call this
            method to add a subnode. Instead call addSubnode or set_parent.
            @param node:Node the subnode that was added.
            @returns void */
        subnodeAdded: function(node) {},
        
        /** Called when a subnode is removed from this node. Provides a hook for
            subclasses. No need for subclasses to call callSuper. Do not call this
            method to remove a subnode. Instead call removeSubnode or set_parent.
            @param node:Node the subnode that was removed.
            @returns void */
        subnodeRemoved: function(node) {},
        
        // Animation
        /** Animates an attribute using the provided parameters.
            @param attribute:string/object the name of the attribute to animate. If
                an object is provided it should be the only argument and its keys
                should be the params of this method. This provides a more concise
                way of passing in sparse optional parameters.
            @param to:number the target value to animate to.
            @param from:number the target value to animate from. (optional)
            @param relative:boolean (optional)
            @param callback:function (optional)
            @param duration:number (optional)
            @param reverse:boolean (optional)
            @param repeat:number (optional)
            @param easingFunction:function (optional)
            @returns The Animator being run. */
        animate: function(attribute, to, from, relative, callback, duration, reverse, repeat, easingFunction) {
            var animPool = this.__getAnimPool();
            
            // ignoreplacement ensures the animator is directly attached to this node
            var anim = animPool.getInstance({ignoreplacement:true});
            
            if (typeof attribute === 'object') {
                // Handle a single map argument if provided
                callback = attribute.callback;
                delete attribute.callback;
                anim.callSetters(attribute);
            } else {
                // Handle individual arguments
                anim.attribute = attribute;
                anim.set_to(to);
                anim.set_from(from);
                if (duration != null) anim.duration = duration;
                if (relative != null) anim.relative = relative;
                if (repeat != null) anim.repeat = repeat;
                if (reverse != null) anim.set_reverse(reverse);
                if (easingFunction != null) anim.set_easingfunction(easingFunction);
            }
            
            // Release the animation when it completes.
            anim.next(function(success) {animPool.putInstance(anim);});
            if (callback) anim.next(callback);
            
            anim.set_running(true);
            return anim;
        },
        
        /** Gets an array of the currently running animators that were created
            by calls to the animate method.
            @param filterFunc:function/string a function that filters which 
                animations get stopped. The filter should return true for 
                functions to be included. If the provided values is a string it will
                be used as a matching attribute name.
            @returns an array of active animators. */
        getActiveAnimators: function(filterFunc) {
            if (typeof filterFunc === 'string') {
                var attrName = filterFunc;
                filterFunc = function(anim) {return anim.attribute === attrName;};
            }
            return this.__getAnimPool().getActives(filterFunc);
        },
        
        /** Stops all active animations.
            @param filterFunc:function/string a function that filters which 
                animations get stopped. The filter should return true for 
                functions to be stopped. If the provided values is a string it will
                be used as a matching attribute name.
            @returns void */
        stopActiveAnimators: function(filterFunc) {
            var activeAnims = this.getActiveAnimators(filterFunc), i = activeAnims.length, anim;
            if (i > 0) {
                var animPool = this.__getAnimPool();
                while (i) {
                    anim = activeAnims[--i];
                    anim.reset(false);
                    animPool.putInstance(anim);
                }
            }
        },
        
        /** Gets the animation pool if it exists, or lazy instantiates it first
            if necessary.
            @private
            @returns dr.TrackActivesPool */
        __getAnimPool: function() {
            return this.__animPool || (this.__animPool = new dr.TrackActivesPool(dr.Animator, this));
        }
    });
});
