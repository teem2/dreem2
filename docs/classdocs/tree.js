/**
   * @class dr.tree {UI Components}
   * @extends dr.view
   * An visual component whose state represents a node in a tree structure.  Trees will try to interpret many different
   * data formats, but the preferred is an array of objects that have a "label" text property and optionally an "nodes"
   * property which can contain more nodes.  The simplest example, for example, might look like this:
   * `[{"label":"first node", "nodes": [{"label":"inner node"}], {"label":"second top node"}]`
   *
   *     @example
   *
   *     <tree name="simple" height="200" width="200" border="1" bordercolor="#eee"
   *      data='[{"label":"first", "items": [1, 2, 3]}]'></tree>
   *
   */
