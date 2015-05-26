/** Makes an dr.View draggable via the mouse.
    
    Also supresses context menus since the mouse down to open it causes bad
    behavior since a mouseup event is not always fired.
    
    Attributes:
        isdraggable:boolean Configures the view to be draggable or not. The 
            default value is true.
        isdragging:boolean Indicates that this view is currently being dragged.
        allowabort:boolean Allows a drag to be aborted by the user by
            pressing the 'esc' key. Defaults to false.
        distancebeforedrag:number The distance, in pixels, before a mouse 
            down and drag is considered a drag action. Defaults to 0.
        centeronmouse:boolean If true this draggable will update the draginitx
            and draginity to keep the view centered on the mouse. Defaults
            to false.
        dragaxis:string Limits dragging to a single axis. Supported values:
            x, y, both. Defaults to both.
    
    Private Attributes:
        __initMouseX:number The initial x location of the mouse relative to the
            viewport.
        __initMouseY:number The initial y location of the mouse relative to the
            viewport.
        __initLocX:number The initial x location of this view relative to the
            parent view.
        __initLocY:number The initial y location of this view relative to the
            parent view.
        __initAbsLocX:number The initial x location of the view relative to the
            viewport.
        __initAbsLocY:number The initial x location of the view relative to the
            viewport.
*/
define(function(require, exports, module){
    var dr = require('$LIB/dr/dr.js');
    var JS = require('$LIB/jsclass.js');
    
    dr.Draggable = new JS.Module('Draggable', {
        include: [
            require('./MouseOverAndDown.js')
        ],
        
        
        // Life Cycle //////////////////////////////////////////////////////////////
        /** @overrides dr.View */
        initNode: function(parent, attrs) {
            this.isdraggable = this.isdragging = this.centeronmouse = this.allowabort = false;
            this.distancebeforedrag = 0;
            this.dragaxis = 'both';
            
            // Will be set after init since the draggable subview(s) probably
            // don't exist yet.
            var isdraggable = true;
            if (attrs.isdraggable !== undefined) {
                isdraggable = attrs.isdraggable;
                delete attrs.isdraggable;
            }
            
            this.callSuper(parent, attrs);
            
            this.setAttribute('isdraggable', isdraggable);
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        /** @overrides dr.Disableable */
        set_disabled: function(v) {
            if (this.callSuper) this.callSuper(v);
            
            // When about to disable make sure isdragging is not true. This 
            // helps prevent unwanted behavior of a disabled view.
            if (this.disabled && this.isdragging) this.stopDrag(null, false);
        },
        
        set_isdraggable: function(v) {
            if (this.setActual('isdraggable', v, 'boolean', false)) {
                var func;
                if (this.isdraggable) {
                    func = this.listenToPlatform.bind(this);
                } else if (this.initing === false) {
                    func = this.stopListeningToPlatform.bind(this);
                }
                
                if (func) {
                    var dvs = this.getDragViews();
                    if (!Array.isArray(dvs)) dvs = [dvs];
                    
                    var dragview, i = dvs.length;
                    while (i) {
                        dragview = dvs[--i];
                        func(dragview, 'onmousedown', '__doMouseDown');
                        func(dragview, 'oncontextmenu', '__doContextMenu');
                    }
                }
            }
        },
        
        set_isdragging: function(v) {this.setActual('isdragging', v, 'boolean', false);},
        set_distancebeforedrag: function(v) {this.setActual('distancebeforedrag', v, 'number', 0);},
        set_centeronmouse: function(v) {this.setActual('centeronmouse', v, 'boolean', false);},
        set_allowabort: function(v) {this.setActual('allowabort', v, 'boolean', false);},
        set_dragaxis: function(v) {this.setActual('dragaxis', v, 'string', 'both');},
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** @returns an array of views that can be moused down on to start the
            drag. Subclasses should override this to return an appropriate list
            of views. By default this view is returned thus making the entire
            view capable of starting a drag. */
        getDragViews: function() {
            return [this];
        },
        
        /** @private */
        __doContextMenu: function(event) {
            // Do nothing so the context menu event is supressed.
        },
        
        /** @private */
        __doMouseDown: function(event) {
            var pos = dr.sprite.MouseObservable.getMouseFromEvent(event),
                absPosition = this.getAbsolutePosition();
            this.__initMouseX = pos.x;
            this.__initMouseY = pos.y;
            this.__initLocX = this.x;
            this.__initLocY = this.y;
            this.__initAbsLocX = absPosition.x;
            this.__initAbsLocY = absPosition.y;
            
            var gm = dr.global.mouse;
            this.listenToPlatform(gm, 'onmouseup', '__doMouseUp', true);
            if (this.distancebeforedrag > 0) {
                this.listenToPlatform(gm, 'onmousemove', '__doDragCheck', true);
            } else {
                this.startDrag(event);
            }
            
            dr.sprite.preventDefault(event);
            
            return true; // Allow platform event bubbling
        },
        
        /** @private */
        __doMouseUp: function(event) {
            if (this.isdragging) {
                this.stopDrag(event, false);
            } else {
                var gm = dr.global.mouse;
                this.stopListeningToPlatform(gm, 'onmouseup', '__doMouseUp', true);
                this.stopListeningToPlatform(gm, 'onmousemove', '__doDragCheck', true);
            }
            return true; // Allow platform event bubbling
        },
        
        /** @private */
        __doDragCheck: function(event) {
            var pos = dr.sprite.MouseObservable.getMouseFromEvent(event),
                distance = dr.measureDistance(pos.x, pos.y, this.__initMouseX, this.__initMouseY);
            if (distance >= this.distancebeforedrag) {
                this.stopListeningToPlatform(dr.global.mouse, 'onmousemove', '__doDragCheck', true);
                this.startDrag(event);
            }
        },
        
        /** Active until stopDrag is called. The view position will be bound
            to the mouse position. Subclasses typically call this onmousedown for
            subviews that allow dragging the view.
            @param event:event The event the mouse event when the drag started.
            @returns void */
        startDrag: function(event) {
            if (!this.disabled) {
                var g = dr.global;
                if (this.allowabort) this.listenTo(g.keys, 'onkeyup', '__watchForAbort');
                
                this.setAttribute('isdragging', true);
                this.listenToPlatform(g.mouse, 'onmousemove', 'updateDrag', true);
                this.updateDrag(event);
            }
        },
        
        /** @private */
        __watchForAbort: function(event) {
            // Watch for ESC key
            if (event === 27) this.stopDrag(event, true);
        },
        
        /** Called on every mousemove event while dragging.
            @returns void */
        updateDrag: function(event) {
            this.__requestDragPosition(dr.sprite.MouseObservable.getMouseFromEvent(event));
        },
        
        /** @private */
        __requestDragPosition: function(mousePos) {
            var x = mousePos.x - this.__initMouseX + this.__initLocX,
                y = mousePos.y - this.__initMouseY + this.__initLocY;
            
            if (this.centeronmouse) {
                x -= (this.boundswidth / 2) + this.__initAbsLocX - this.__initMouseX;
                y -= (this.boundsheight / 2)  + this.__initAbsLocY - this.__initMouseY;
            }
            
            this.updatePosition(x, y);
        },
        
        /** Repositions the view to the provided values. The default implementation
            is to directly set x and y. Subclasses should override this method
            when it is necessary to constrain the position.
            @param x:number the new x position.
            @param y:number the new y position.
            @returns void */
        updatePosition: function(x, y) {
            if (!this.disabled) {
                var dragaxis = this.dragaxis;
                if (dragaxis !== 'y') this.setAttribute('x', x);
                if (dragaxis !== 'x') this.setAttribute('y', y);
            }
        },
        
        /** Stop the drag. (see startDrag for more details)
            @param event:object The event that ended the drag.
            @param isAbort:boolean Indicates if the drag ended normally or was
                aborted.
            @returns void */
        stopDrag: function(event, isAbort) {
            var g = dr.global, gm = g.mouse;
            this.stopListeningToPlatform(gm, 'onmouseup', '__doMouseUp', true);
            this.stopListeningToPlatform(gm, 'onmousemove', 'updateDrag', true);
            this.stopListening(g.keys, 'onkeyup', '__watchForAbort');
            
            this.setAttribute('isdragging', false);
        },
        
        getDistanceFromOriginalLocation: function() {
            return dr.measureDistance(this.x, this.y, this.__initLocX, this.__initLocY);
        }
    });
    
    module.exports = dr.Draggable;
});
