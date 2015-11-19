/**
  * @class dr.editor.undoable {UI Components}
  * @extends dr.eventable
  * @abstract
  * An object that encapsulates doing and undoing a change. Typically this
  * change would be on a target object of some sort, but that is really
  * up to the specific implementation.
  *
  * When an undoable is in either the "done" or "undone" state. The "done"
  * state means the change has been applied and the "undone" state means
  * that it has not been applied. An undoable always starts out in the
  * undone state when it is created.
  *
  * Typically an undoable will be added to an editor-undostack and will
  * be managed through that object.
  */
/**
    * @attribute {Boolean} [done]
    * @readonly
    * Indicates if this undoable is in the "done" or "undone" state.
    * Undoables begin in the undone state.
    */
/**
    * @attribute {String} [undodescription]
    * A human readable representation of the undoable. The description
    * should describe what will be undone when the undoable is
    * executed.
    */
/**
    * @attribute {String} [redodescription]
    * A human readable representation of the undoable. The description
    * should describe what will be done/redone when the undoable is
    * executed.
    */
/**
    * @method getUndoDescription
    * Gets a human readable description of this undoable for use when it
    * can be undone.
    * @returns {String} The human readable string.
    */
/**
    * @method getRedoDescription
    * Gets a human readable description of this undoable for use when it
    * can be done.
    * @returns {String} The human readable string.
    */
/**
    * @method undo
    * Rolls back this undoable if it is in the done state. Sets the "done"
    * attribute to false if successfull.
    * @param {Function} callback An optional function that will be executed if 
    * undo succeeds. The undoable is passed in as an argument to the callback.
    * @returns {this}
    */
/**
    * @method undo
    * Rolls forward this undoable if it is in the undone state. Sets the "done"
    * attribute to true if successfull.
    * @param {Function} callback An optional function that will be executed if 
    * redo succeeds. The undoable is passed in as an argument to the callback.
    * @returns {this}
    */
/**
    * @method serialize
    * Serializes this undoable as a JSON string. Subclasses should implement
    * this method and call super from that implementation. The obj passed in 
    * is what actually gets serialized via JSON.stringify. Subclasses should 
    * store attrs on this object as needed before calling super.
    * @param {Object} obj An object passed up from subclasses that should
    * contain the main payload for the undoable.
    * @returns {String}
    */
/**
    * @method deserialize
    * Restores the state of an undoable from serialized data. Subclasses should
    * implement this method and call super from that implementation. The obj
    * passed in is a set of attributes that will be directly assigned to this
    * undoable instance (setAttribute is not called).
    * @param {Object} data An object containing attribute values to be restored
    * via direct assignment.
    * @returns {void}
    */
