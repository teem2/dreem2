/**
  * @class dr.editor.compoundundoable {UI Components}
  * @extends dr.editor.undoable
  * An undoable that combines multiple undoables into a single group that can
  * be done/undone as one. Use the add method to add undoables to this
  * compoundundoable.
  *
  * The contained undoables will be done in the order they were added and
  * undone in the reverse order they were added.
  */
/**
    * @method destroy
    * @overrides
    * Destroys this undoable and all the undoables contained within it.
    */
/**
    * @method add
    * Adds an undoable to this dr.editor.compoundundoable.
    * @param {dr.editor.undoable} undoable The undoable to add.
    * @returns {this}
    */
/**
    * @method undo
    * @overrides
    * Undoes all the contained undoables.
    */
/**
    * @method undo
    * @overrides
    * Does all the contained undoables.
    */
