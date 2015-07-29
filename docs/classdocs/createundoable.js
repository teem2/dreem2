/**
  * @class dr.editor.createundoable {UI Components}
  * @extends dr.editor.undoable
  * An undoable that Inserts a new node into a parent node.
  */
/**
    * @method destroy
    * @overrides
    */
/**
    * @attribute {dr.AccessorSupport} [target]
    * The new node/view to add.
    */
/**
    * @method undo
    * @overrides
    * Removes the target from its parent.
    */
/**
    * @method redo
    * @overrides
    * Inserts the target into the target parent.
    */
