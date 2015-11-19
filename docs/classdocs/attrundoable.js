/**
  * @class dr.editor.attrundoable {UI Components}
  * @extends dr.editor.undoable
  * An undoable that updates an attribute on a target object that
  * has support for the setAttribute method as defined in dr.AccessorSupport
  * such as dr.node and dr.view.
  */
/**
    * @attribute {dr.AccessorSupport} [target]
    * The target object that will have setAttribute called on it.
    */
/**
    * @attribute {String} [attribute]
    * The name of the attribute to update.
    */
/**
    * @attribute {expression} [oldvalue]
    * The undone value of the attribute. If not provided the current value
    * of the attribute on the target object will be stored the first time
    * redo is executed.
    */
/**
    * @attribute {expression} [newvalue]
    * The done value of the attribute.
    */
/**
    * @method setAttribute
    * @overrides
    * Prevent resolution of constraints since the values we wish to store
    * for oldvalue and newvalue will often be the string value of a
    * constraint.
    */
/**
    * @method getUndoDescription
    * @overrides
    * Gets the undo description using the value of the undodescription
    * attribute as a text template which will have the this.attribute, 
    * this.oldvalue and this.newvalue injected into it. See dr.fillTextTemplate
    * for more info on how text templates work.
    */
/**
    * @method getRedoDescription
    * @overrides
    * Gets the redo description using the value of the redodescription
    * attribute as a text template which will have the this.attribute, 
    * this.oldvalue and this.newvalue injected into it. See dr.fillTextTemplate
    * for more info on how text templates work.
    */
/**
    * @method __getDescription
    * @private
    */
/**
    * @method undo
    * @overrides
    * Sets the attribute on the target object to the oldvalue.
    */
/**
    * @method redo
    * @overrides
    * Sets the attribute on the target object to the newvalue. Also stores
    * the current value of the target object as the oldvalue if this is the
    * first time redo is called successfully.
    */
/**
    * @method serialize
    * @overrides
    */
/**
    * @method deserialize
    * @overrides
    */
