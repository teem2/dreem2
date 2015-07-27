/**
  * @class dr.editor.undostack {UI Components}
  * @extends dr.node
  * Provides a stack of undoables that can be done/undone. As undoables
  * are done/undone a position in the stack is maintained.
  *
  * This object should be used to form the foundation of an undo/redo system
  * for an editor.
  */
/**
    * @method initNode
    * @overrides
    * Initializes the undostack by calling reset.
    */
/**
    * @method reset
    * Clears out this undostack and destroys any undoables contained within
    * the undostack at the time of this method call.
    * @returns {this}
    */
/**
    * @method __syncUndoabilityAttrs
    * @private
    */
/**
    * @method canUndo
    * Determines if there is anything to undo based on the current location
    * within the undo stack. If the current stack location is at the start
    * then there is nothing to be undone.
    * @returns {Boolean}
    */
/**
    * @method canRedo
    * Determines if there is anything to redo based on the current location
    * within the undo stack. If the current stack location is at the end
    * then there is nothing to be done.
    * @returns {Boolean}
    */
/**
    * @method getUndoDescription
    * Gets the human readable undo description of the undoable that will be
    * executed if the undo method of this undostack is called.
    * @returns {String}
    */
/**
    * @method getRedoDescription
    * Gets the human readable redo description of the undoable that will be
    * executed if the redo method of this undostack is called.
    * @returns {String}
    */
/**
    * @method do
    * Adds the undoable to this stack at the current location and immediately
    * does that undoable. Also removes and destroys any undoables that exist
    * at or after this location in the undo stack.
    *
    * If the attempt to do the undoable triggers an error the undoable will
    * have its undo method called and the undoable will not be added to the
    * undostack.
    *
    * Undoables already in the done state will be rejected and the errorHandler
    * (if provided) will be executed.
    *
    * @param {dr.editor.undoable} undoable The undoable to add.
    * @param {Function} callback An optional argument that if provided will
    * be called when the provided undoable is succesfully done. The callback
    * is executed only once, not every time the undoable is redone. The
    * undoable is provided as an argument to the callback.
    * @param {Function} errorHandler An optional argument that if provided will
    * be called if an error occurs trying to do add or do the undoable. An
    * error object is provided to the callback which may consist of a msg and
    * stacktrace, or a native error object.
    * @returns {Boolean} Indicates if the undoable was added succesfully or
    * not.
    */
/**
    * @method undo
    * Executes the undo method of the undoable at the current undo stack 
    * location.
    *
    * If the attempt to undo the undoable triggers an error the errorHandler
    * (if provided) will be executed.
    *
    * @param {Function} callback An optional argument that if provided will
    * be called when the current undoable is succesfully undone. The callback
    * is executed only once, not every time the undoable is undone. The
    * undoable is provided as an argument to the callback.
    * @param {Function} errorHandler An optional argument that if provided will
    * be called if an error occurs trying undo the undoable. An error object is 
    * provided to the callback which may consist of a msg and stacktrace, or 
    * a native error object.
    * @returns {Boolean} Indicates if the undoable was successfully 
    * undone or not.
    */
/**
    * @method redo
    * Executes the redo method of the undoable at the current undo stack 
    * location.
    *
    * If the attempt to redo the undoable triggers an error the errorHandler
    * (if provided) will be executed.
    *
    * @param {Function} callback An optional argument that if provided will
    * be called when the current undoable is succesfully done. The callback
    * is executed only once, not every time the undoable is done. The
    * undoable is provided as an argument to the callback.
    * @param {Function} errorHandler An optional argument that if provided will
    * be called if an error occurs trying redo the undoable. An error object is 
    * provided to the callback which may consist of a msg and stacktrace, or 
    * a native error object.
    * @returns {Boolean} Indicates if the undoable was successfully done or not.
    */
/**
    * @method __executeUndoable
    * @private
    * Executes the undoable and returns an error if one occured.
    */
