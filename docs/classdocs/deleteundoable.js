/**
  * @class dr.editor.deleteundoable {UI Components}
  * @extends dr.editor.undoable
  * An undoable that removes a node from its parent node.
  */
/**
    * @method destroy
    * @overrides
    */
/**
    * @attribute {dr.AccessorSupport} [target]
    * The node/view to remove.
    */
/**
    * @method undo
    * @overrides
    * Reinserts the target.
    */
/**
    * @method redo
    * @overrides
    * Removes the target from its parent.
    */
/**
    * @method serialize
    * @overrides
    */
/**
    * @method deserialize
    * @overrides
    */
