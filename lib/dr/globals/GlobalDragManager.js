/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/


/** Provides global drag and drop functionality.
    
    Events:
        dragLeave:dr.droptarget Fired when a dr.dropable is dragged out of
            the drop target.
        dragEnter:dr.droptarget Fired when a dr.dropable is dragged over
            the drop target.
        startDrag:object Fired when a drag starts. Value is the object
            being dragged.
        stopDrag:object Fired when a drag ends. Value is the object 
            that is no longer being dragged.
        drop:object Fired when a drag ends over a drop target. The value is
            an array containing the dropable at index 0 and the drop target
            at index 1.
    
    Attributes:
        dragview:dr.view The view currently being dragged.
        overview:dr.view The view currently being dragged over.
        dropTargets:array The list of dr.droptargets currently registered
            for notification when drag and drop events occur.
        autoScrollers:array The list of dr.autoscrollers currently registered
            for notification when drags start and stop.
*/
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        GlobalRegistry = require('./Global.js');
    
    module.exports = new JS.Singleton('GlobalDragManager', {
        include: [require('$LIB/dr/events/Observable.js')],
        
        
        // Constructor /////////////////////////////////////////////////////////////
        initialize: function() {
            this.dropTargets = [];
            this.autoScrollers = [];
            
            GlobalRegistry.register('dragManager', this);
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        set_dragview: function(v) {
            var cur = this.dragview;
            if (cur !== v) {
                this.dragview = v;
                
                var isStart = !!v, targets, i, dv, funcName, eventName;
                
                if (isStart) {
                    dv = v;
                    funcName = 'notifyDragStart';
                    eventName = 'onstartDrag';
                } else {
                    dv = cur;
                    funcName = 'notifyDragStop';
                    eventName = 'onstopDrag';
                }
                
                targets = this.__filterList(dv, this.dropTargets);
                i = targets.length;
                while (i) targets[--i][funcName](dv);
                
                targets = this.__filterList(dv, this.autoScrollers);
                i = targets.length;
                while (i) targets[--i][funcName](dv);
                
                this.sendEvent(eventName, v);
            }
        },
        
        set_overview: function(v) {
            var cur = this.overview;
            if (cur !== v) {
                var dv = this.dragview;
                if (cur) {
                    cur.notifyDragLeave(dv);
                    if (!dv.destroyed) dv.notifyDragLeave(cur);
                    this.sendEvent('ondragLeave', cur);
                }
                
                this.overview = v;
                
                if (v) {
                    v.notifyDragEnter(dv);
                    if (!dv.destroyed) dv.notifyDragEnter(v);
                    this.sendEvent('ondragEnter', cur);
                }
            }
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** Registers the provided auto scroller to receive notifications.
            @param autoScroller:dr.autoscroller The auto scroller to register.
            @returns void */
        registerAutoScroller: function(autoScroller) {
            this.autoScrollers.push(autoScroller);
        },
        
        /** Unregisters the provided auto scroller.
            @param autoScroller:dr.autoscroller The auto scroller to unregister.
            @returns void */
        unregisterAutoScroller: function(autoScroller) {
            var autoScrollers = this.autoScrollers, i = autoScrollers.length;
            while (i) {
                if (autoScrollers[--i] === autoScroller) {
                    autoScrollers.splice(i, 1);
                    break;
                }
            }
        },
        
        /** Registers the provided drop target to receive notifications.
            @param dropTarget:dr.droptarget The drop target to register.
            @returns void */
        registerDropTarget: function(dropTarget) {
            this.dropTargets.push(dropTarget);
        },
        
        /** Unregisters the provided drop target.
            @param dropTarget:dr.droptarget The drop target to unregister.
            @returns void */
        unregisterDropTarget: function(dropTarget) {
            var dropTargets = this.dropTargets, i = dropTargets.length;
            while (i) {
                if (dropTargets[--i] === dropTarget) {
                    dropTargets.splice(i, 1);
                    break;
                }
            }
        },
        
        /** Called by a dr.dropable when a drag starts.
            @param dropable:dr.dropable The dropable that started the drag.
            @returns void */
        startDrag: function(dropable) {
            this.set_dragview(dropable);
        },
        
        /** Called by a dr.dropable when a drag stops.
            @param event:event The mouse event that triggered the stop drag.
            @param dropable:dr.dropable The dropable that stopped being dragged.
            @returns void */
        stopDrag: function(event, dropable, isAbort) {
            var overview = this.overview;
            dropable.notifyDropped(overview, isAbort);
            if (overview && !isAbort) overview.notifyDrop(dropable);
            
            this.set_overview();
            this.set_dragview();
            
            if (overview && !isAbort) this.sendEvent('ondrop', [dropable, overview]);
        },
        
        /** Called by a dr.dropable during dragging.
            @param event:event The mousemove event for the drag update.
            @param dropable:dr.dropable The dropable that is being dragged.
            @returns void */
        updateDrag: function(event, dropable) {
            // Get the frontmost dr.DropTarget that is registered with this 
            // manager and is under the current mouse location and has a 
            // matching drag group.
            var topDropTarget,
                dropTargets = this.__filterList(dropable, this.dropTargets);
                i = dropTargets.length;
            
            if (i > 0) {
                var mouseX = event.x,
                    mouseY = event.y,
                    dropTarget;
                
                while (i) {
                    dropTarget = dropTargets[--i];
                    if (dropTarget.willAcceptDrop(dropable) &&
                        dropable.willPermitDrop(dropTarget) &&
                        dropTarget.isPointVisible(mouseX, mouseY) && 
                        (!topDropTarget || dropTarget.isInFrontOf(topDropTarget))
                    ) {
                        topDropTarget = dropTarget;
                    }
                }
            }
            
            this.set_overview(topDropTarget);
        },
        
        /** Filters the provided array of dr.draggroupsupport items for the
            provided dropable.
            @private
            @param dropable:dr.dropable The dropable to filter for.
            @returns array: An array of the matching list items. */
        __filterList: function(dropable, list) {
            var retval;
            
            if (dropable.destroyed) {
                retval = [];
            } else {
                if (dropable.acceptAnyDragGroup()) {
                    retval = list;
                } else {
                    retval = [];
                    
                    var dragGroups = dropable.draggroups,
                        i = list.length, 
                        item, targetGroups, dragGroup;
                    while (i) {
                        item = list[--i];
                        if (item.acceptAnyDragGroup()) {
                            retval.push(item);
                        } else {
                            targetGroups = item.draggroups;
                            for (dragGroup in dragGroups) {
                                if (targetGroups[dragGroup]) {
                                    retval.push(item);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            
            return retval;
        }
    });
});
