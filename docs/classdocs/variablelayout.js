/**
      * @class dr.variablelayout {Layout}
      * @extends dr.constantlayout
      * This layout extends constantlayout adding the capability to control
      * what value is set on each managed view. The to set on each vies is
      * controlled by implementing the updateSubview method of this layout.
      *
      * The updateSubview method has four arguments: 'count', 'view', 
      * 'attribute' and 'value'.
      *     Count: The 1 based index of the view being updated, i.e. the 
      *         first view updated will have a count of 1, the second, a count 
      *         of 2, etc.
      *     View: The view being updated. Your updateSubview method will
      *         most likely modify this view in some way.
      *     Attribute: The name of the attribute this layout is supposedly
      *         updating. This will be set to the value of 
      *         the 'attribute' attribute of the variablelayout. You can use 
      *         this value if you wish or ignore it if you want to.
      *     Value: The suggested value to set on the view. You can use it as
      *         is or ignore it if you want. The value provided for the first 
      *         view will be the value of the 'value' attribute of the
      *         variablelayout. Subsequent values will be the return value of
      *         the updateSubview method for the previous view. This allows
      *         you to feed values forward as each view is updated.
      *
      * This variable layout will position the first view at a y value of 10
      * and each subsequent view will be positioned with a y value 1 pixel
      * below the bottom of the previous view. In addition, all views with
      * an even count will be positioned at an x of 5 and odd views at an
      * x of 10. Also, updateparent has been set to true so the
      * updateParent method will be called with the attribute and last value
      * returned from updateSubview. In this case updateParent will resize
      * the parent view to a height that fits all the subviews plus an
      * additional 10 pixels.
      *
      *     @example
      *     <variablelayout attribute="y" value="10" updateparent="true">
      *         <method name="updateSubview" args="count, view, attribute, value">
      *             view.setAttribute(attribute, value);
      *             view.setAttribute('x', count % 2 === 0 ? 5 : 10);
      *             return value + view.height + 1;
      *         </method>
      *         <method name="updateParent" args="attribute, value, count">
      *             this.parent.setAttribute('height', value + 10);
      *         </method>
      *     </variablelayout>
      *
      *     <view width="50" height="25" bgcolor="lightpink"></view>
      *     <view width="50" height="25" bgcolor="plum"></view>
      *     <view width="50" height="25" bgcolor="lightblue"></view>
      *
      * This variable layout works similar to the one above except it will
      * skip any view that has an opacity less that 0.5. To accomplish this
      * the skipSubview method has been implemented. Also, the 
      * startMonitoringSubview and stopMonitoringSubview methods have been
      * implemented so that if the opacity of a view changes the layout will
      * be updated.
      *
      *     @example
      *     <variablelayout attribute="y" value="10" updateparent="true">
      *         <method name="updateSubview" args="count, view, attribute, value">
      *             view.setAttribute(attribute, value);
      *             view.setAttribute('x', count % 2 === 0 ? 5 : 10);
      *             return value + view.height + 1;
      *         </method>
      *         <method name="updateParent" args="attribute, value, count">
      *             this.parent.setAttribute('height', value + 10);
      *         </method>
      *         <method name="startMonitoringSubview" args="view">
      *             this.super();
      *             this.listenTo(view, 'opacity', this.update)
      *         </method>
      *         <method name="stopMonitoringSubview" args="view">
      *             this.super();
      *             this.stopListening(view, 'opacity', this.update)
      *         </method>
      *         <method name="skipSubview" args="view">
      *             if (0.5 >= view.opacity) return true;
      *             return this.super();
      *         </method>
      *     </variablelayout>
      *
      *     <view width="50" height="25" bgcolor="lightpink"></view>
      *     <view width="50" height="25" bgcolor="plum"></view>
      *     <view width="50" height="25" bgcolor="black" opacity="0.25"></view>
      *     <view width="50" height="25" bgcolor="lightblue"></view>
      */
/**
    * @attribute {boolean} [updateparent=false]
    * If true the updateParent method of the variablelayout will be called. 
    * The updateParent method provides an opportunity for the layout to
    * modify the parent view in some way each time update completes. A typical
    * implementation is to resize the parent to fit the newly layed out child 
    * views.
    */
/**
    * @attribute {boolean} [reverse=false]
    * If true the layout will run through the views in the opposite order when
    * calling updateSubview. For subclasses of variablelayout this will
    * typically result in views being layed out in the opposite direction,
    * right to left instead of left to right, bottom to top instead of top to
    * bottom, etc.
    */
/**
    * @method doBeforeUpdate
    * Called by the update method before any processing is done. This method 
    * gives the variablelayout a chance to do any special setup before update is 
    * processed for each view. This is a good place to calculate any values
    * that will be needed during the calls to updateSubview.
    * @return {void}
    */
/**
    * @method doAfterUpdate
    * Called by the update method after any processing is done but before the
    * optional updateParent method is called. This method gives the variablelayout
    * a chance to do any special teardown after updateSubview has been called
    * for each managed view.
    * @param {*} value The last value calculated by the updateSubview calls.
    * @return {void}
    */
/**
    * @method startMonitoringSubview
    * Provides a default implementation that calls update when the
    * visibility of a subview changes. Monitoring the visible attribute of
    * a view is useful since most layouts will want to "reflow" as views
    * become visible or hidden.
    * @param {dr.view} view
    */
/**
    * @method stopMonitoringSubview
    * Provides a default implementation that calls update when the
    * visibility of a subview changes.
    * @param {dr.view} view
    */
/**
    * @method updateSubview
    * Called for each subview in the layout.
    * @param {Number} count The number of subviews that have been layed out
    *   including the current one. i.e. count will be 1 for the first
    *   subview layed out.
    * @param {dr.view} view The subview being layed out.
    * @param {String} attribute The name of the attribute to update.
    * @param {*} value The value to set on the subview.
    * @return {*} The value to use for the next subview.
    */
/**
    * @method skipSubview
    * Called for each subview in the layout to determine if the view should
    * be updated or not. The default implementation returns true if the
    * subview is not visible since views that can't be seen don't typically 
    * need to be positioned. You could implement your own skipSubview method
    * to use other attributes of a view to determine if a view should be
    * updated or not. An important point is that skipped views are still
    * monitored by the layout. Therefore, if you use a different attribute to
    * determine wether to skip a view or not you should probably also provide
    * custom implementations of startMonitoringSubview and stopMonitoringSubview
    * so that when the attribute changes to/from a value that would result in
    * the view being skipped the layout will update.
    * @param {dr.view} view The subview to check.
    * @return {Boolean} True if the subview should be skipped during
    *   layout updates.
    */
/**
    * @method updateParent
    * Called if the updateparent attribute is true. Subclasses should
    * implement this if they want to modify the parent view.
    * @param {String} attribute The name of the attribute to update.
    * @param {*} value The value to set on the parent.
    * @param {Number} count The number of views that were layed out.
    * @return {void}
    */
