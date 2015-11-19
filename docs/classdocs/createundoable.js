/**
  * @class dr.editor.createundoable {UI Components}
  * @extends dr.editor.undoable
  * An undoable that inserts a new node into a parent node.
  */
/**
    * @method destroy
    * @overrides
    */
/**
    * @attribute {dr.AccessorSupport} [target]
    * The new node/view to add.
    */
/** Holds attribute values needed by previewer clients to create the new 
    * node/view. In the editor new node/views are created first and then an
    * undoable is created for them. In a previewer we actually have to create
    * the object so we need to know what attrs to use during instantiation.
    * This previewinfo object is what contains that information.
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
/**
    * @method serialize
    * @overrides
    */
/**
    * @method deserialize
    * @overrides
    */
