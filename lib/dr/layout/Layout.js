/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


/** @class dr.layout {Layout}
    @extends dr.baselayout
    When a new layout is added, it will automatically create and add itself 
    to a layouts array in its parent. In addition, an onlayouts event is 
    fired in the parent when the layouts array changes. This allows the 
    parent to access the layout(s) later.
    
    Here is a view that contains a spacedlayout.
    
        @example
        <spacedlayout axis="y"></spacedlayout>
        
        <view bgcolor="oldlace" width="auto" height="auto">
          <spacedlayout>
            <method name="startMonitoringSubview" args="view">
              output.setAttribute('text', output.text + "View Added: " + view.$tagname + ":" + view.bgcolor + "\n");
              this.super();
            </method>
          </spacedlayout>
          <view width="50" height="50" bgcolor="lightpink" opacity=".3"></view>
          <view width="50" height="50" bgcolor="plum" opacity=".3"></view>
          <view width="50" height="50" bgcolor="lightblue" opacity=".3"></view>
        </view>
        
        <text id="output" multiline="true" width="300"></text>
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js');
    
    module.exports = dr.Layout = new JS.Class('Layout', require('$LIB/dr/Node.js'), {
        // Life Cycle //////////////////////////////////////////////////////////////
        initNode: function(parent, attrs) {
            // Remember initial lock state so we can restore it after initialization
            // is complete. We will always lock a layout during initialization to
            // prevent extraneous updates
            var attrLocked;
            if (attrs.locked != null) attrLocked = (attrs.locked === 'true' || attrs.locked === true);
            this.locked = true;
            
            // Holds the views managed by the layout in the order they will be
            // layed out.
            this.subviews = [];
            
            this.listenTo(this, 'oninit', '__notifyReady');
            
            this.callSuper(parent, attrs);
            
            // Listen to the parent for added/removed views. Bind needed because the
            // callback scope is the monitored object not the monitoring object.
            parent = this.parent;
            this.listenTo(parent, 'onsubviewAdded', 'addSubview');
            this.listenTo(parent, 'onsubviewRemoved', 'removeSubview');
            this.listenTo(parent, 'oninit', 'update');
            this.listenTo(parent, 'onsubvieworderchange', '__subviewOrderChange');
            
            parent.sendEvent('onlayouts', parent.getLayouts());
            
            // Start monitoring existing subviews
            if (dr.ready) {
                var subviews = parent.getSubviews(), len = subviews.length, i = 0;
                for (; len > i;) this.addSubview(subviews[i++]);
            }
            
            // Restore initial lock state or unlock now that initialization is done.
            this.locked = attrLocked != null ? attrLocked : false;
            
            // Finally, update the layout once
            this.update();
        },
        
        destroy: function() {
            this.locked = true;
            this.callSuper();
        },
        
        
        // Attributes //////////////////////////////////////////////////////////////
        set_locked: function(v) {
            // Update the layout immediately if changing to false
            if (this.setActual('locked', v, 'boolean', false)) {
                if (this.inited && !this.locked) this.update();
            }
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @private */
        __notifyReady: function() {
            // The layout isn't ready until the oninit event fires. This
            // prevents a huge number of updates that would occur during the
            // pendingEvent firing stage of initialization.
            this.__ready = true;
        },
        
        /** @private
            Called whenever the parent subview order changes. The default
            implementation syncs the subview order.*/
        __subviewOrderChange: function(event) {
            this.syncSubviewOrder();
        },
        
        /** Syncs the order if the Layout's subviews array to the lexical
            order of the parent subviews array. */
        syncSubviewOrder: function() {
            if (this.parent) {
                var alreadyLocked = this.locked === true;
                if (!alreadyLocked) this.setAttribute('locked', true);
                
                // Mark all parent subviews with an __LAY_ORD property. Since the
                // parent subviews are in lexical order which is what we want
                // to mimic in the layout
                var svs = this.parent.getSubviews(), i = svs.length;
                while (i) svs[--i].__LAY_ORD = i;
                
                // Sort the layouts subviews by __LAY_ORD
                this.getSubviews().sort(function(a,b) {return a.__LAY_ORD - b.__LAY_ORD;});
                
                // OK to leave __LAY_ORD since the next refresh will rewrite it.
                
                if (!alreadyLocked) this.setAttribute('locked', false);
            }
            return this;
        },
        
        getSubviews: function() {
            return this.subviews;
        },
        
        /** Checks if this View has the provided View in the subviews array.
            @param sv:View the view to look for.
            @returns true if the subview is found, false otherwise. */
        hasSubview: function(sv) {
            return this.getSubviewIndex(sv) !== -1;
        },
        
        /** Gets the index of the provided View in the subviews array.
            @param sv:View the view to look for.
            @returns the index of the subview or -1 if not found. */
        getSubviewIndex: function(sv) {
            return this.getSubviews().indexOf(sv);
        },
        
        /** Gets the subview at the provided index. */
        getSubviewAtIndex: function(index) {
            var subviews = this.getSubviews();
            if (subviews.length > index) return subviews[index];
            return null;
        },
        
        /** Adds the provided view to the subviews array of this layout, starts
            monitoring the view for changes and updates the layout.
            @param {dr.view} view The view to add to this layout.
            @return {void} */
        addSubview: function(view) {
            var self = this,
                func = this.__ignoreFunc = function(ignorelayout) {
                    var svs = self.getSubviews(), initialLen = svs.length;
                    self.__removeSubview(view);
                    self.__addSubview(view);
                    // Only need to resync if the subview become unignored.
                    if (svs.length > initialLen) self.syncSubviewOrder();
                };
            this.startMonitoringSubviewForIgnore(view, func);
            this.__addSubview(view);
        },
    
        /** @private */
        __addSubview: function(view) {
            if (!this.ignore(view)) {
                this.getSubviews().push(view);
                this.startMonitoringSubview(view);
                if (!this.locked) this.update();
            }
        },
      
        /** Removes the provided View from the subviews array of this Layout,
            stops monitoring the view for changes and updates the layout.
            @param {dr.view} view The view to remove from this layout.
            @return {number} the index of the removed subview or -1 if not removed. */
        removeSubview: function(view) {
            this.stopMonitoringSubviewForIgnore(view, this.__ignoreFunc);
            return this.ignore(view) ? -1 : this.__removeSubview(view);
        },
    
        /** @private */
        __removeSubview: function(view) {
            var idx = this.getSubviewIndex(view);
            if (idx !== -1) {
                this.stopMonitoringSubview(view);
                this.getSubviews().splice(idx, 1);
                if (!this.locked) this.update();
            }
            return idx;
        },
    
        /** Use this method to add listeners for any properties that need to be
            monitored on a subview that determine if it will be ignored by the layout.
            Each listenTo should look like: this.listenTo(view, propname, func)
            The default implementation monitors ignorelayout.
            @param {dr.view} view The view to monitor.
            @return {void} */
        startMonitoringSubviewForIgnore: function(view, func) {
            this.listenTo(view, 'onignorelayout', func);
        },
    
        /** Use this method to remove listeners for any properties that need to be
            monitored on a subview that determine if it will be ignored by the layout.
            Each stopListening should look like: this.stopListening(view, propname, func)
            The default implementation monitors ignorelayout.
            @param {dr.view} view The view to monitor.
            @return {void} */
        stopMonitoringSubviewForIgnore: function(view, func) {
            this.stopListening(view, 'onignorelayout', func);
        },
    
        /** Checks if a subview can be added to this Layout or not. The default
            implementation checks the 'ignorelayout' attributes of the subview.
            @param {dr.view} view The view to check.
            @return {boolean} True means the subview will be skipped, false otherwise. */
        ignore: function(view) {
            var ignore = view.ignorelayout;
            if (typeof ignore === 'object') {
                var name = this.name;
                if (name) {
                    var v = ignore[name];
                    if (v != null) return v;
                }
                return ignore['*'];
            }
            return ignore;
        },
    
        /** Subclasses should implement this method to start listening to
            events from the subview that should update the layout. The default
            implementation does nothing.
            @param {dr.view} view The view to start monitoring for changes.
            @return {void} */
        startMonitoringSubview: function(view) {
            // Empty implementation by default
        },
    
        /** Calls startMonitoringSubview for all views. Used by layout
            implementations when a change occurs to the layout that requires
            refreshing all the subview monitoring.
            @return {void} */
        startMonitoringAllSubviews: function() {
            var svs = this.getSubviews(), i = svs.length;
            while (i) this.startMonitoringSubview(svs[--i]);
        },
    
        /** Subclasses should implement this method to stop listening to
            events from the subview that should update the layout. This
            should remove all listeners that were setup in startMonitoringSubview.
            The default implementation does nothing.
            @param {dr.view} view The view to stop monitoring for changes.
            @return {void} */
        stopMonitoringSubview: function(view) {
            // Empty implementation by default
        },
    
        /** Calls stopMonitoringSubview for all views. Used by Layout
            implementations when a change occurs to the layout that requires
            refreshing all the subview monitoring.
            @return {void} */
        stopMonitoringAllSubviews: function() {
            var svs = this.getSubviews(), i = svs.length;
            while (i) this.stopMonitoringSubview(svs[--i]);
        },
    
        /** Checks if the layout can be updated right now or not. Should be called
            by the "update" method of the layout to check if it is OK to do the
            update. The default implementation checks if the layout is locked and
            the parent is inited.
            @return {boolean} true if not locked, false otherwise. */
        canUpdate: function() {
            return this.__ready && !this.locked && this.parent && this.parent.inited && !this.parent.isBeingDestroyed;
        },
    
        /** @method update
            Updates the layout. Subclasses should call canUpdate to check if it is
            OK to update or not. The defualt implementation does nothing.
            @return {void} */
        update: function() {
            // Empty implementation by default
        },
        
        // Editor Support //
        /** @private
            Gets a map of attributes this layout modifies. The editor will
            not allow a new layout to be created if a layout already exists
            that uses a common domain. */
        __getLayoutDomains: function() {
            return {};
        },
        
        /** @private
            Gets a map of attributes this layout modifies on its parent. The 
            editor will not allow a new layout to be created if a layout 
            already exists that uses a common parent domain. */
        __getLayoutParentDomains: function() {
            return {};
        },
        
        /** @private
            Determines if this layout and the provided one have any layout
            domains in common. */
        __hasCommonLayoutDomain: function(layout) {
            var selfDomains = this.__getLayoutDomains(),
                otherDomains = layout.__getLayoutDomains();
            for (var domain in selfDomains) if (otherDomains[domain]) return true;
            return false;
        },
        
        /** @private
            Determines if this layout and the provided one have any layout
            parent domains in common. */
        __hasCommonLayoutParentDomain: function(layout) {
            var selfDomains = this.__getLayoutParentDomains(),
                otherDomains = layout.__getLayoutParentDomains();
            for (var domain in selfDomains) if (otherDomains[domain]) return true;
            return false;
        },
        
        /** @private
            Determines if the domain is in use by this layout for the provided
            view.
            @returns {boolean} true if in use, false otherwise. */
        __layoutDomainInUseForView: function(domain, view) {
            return this.hasSubview(view) && (this.__getLayoutDomains()[domain] || this.__layoutDomainUsedByHintForView(domain, view));
        },
        
        /** @private
            Determines if the domain is in use by this layout for the provided
            view because of a layouthint on the view. Returns false by default.
            Layouts that make use of hints should override this method as 
            necessary.
            @returns {boolean} true if in use, false otherwise. */
        __layoutDomainUsedByHintForView: function(domain, view) {
            return false;
        },
        
        __shouldRestoreForLayoutHint: function(domain, from, to) {
            return false;
        }
    });
});
