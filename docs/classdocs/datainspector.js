/**
      * @class dr.datainspector {UI Components, Data}
      * @extends dr.view
      * The datainspector extracts the underlying structure from a JSON document
      * and displays it as a visual tree.  The structure tree can be manipulated
      * to extract x-paths and rename structure elements.
      *
      *     @example
      *
      *     <datainspector width="500" height="500" data="${this.people.data}">
      *       <dataset name='people'>
      *         [
      *           { "firstName":"John",  "lastName":"Upton", "address":{ "street":"123 Fake Street", "city":"Chicago", "state":"TN" } },
      *           { "firstName":"Sally", "lastName":"Upton", "address":{ "street":"123 Fake Street", "city":"Chicago", "state":"TN" } },
      *           { "firstName":"Jane",  "lastName":"Doe",   "address":{ "street":"123 Real Street", "city":"Paris",   "state":"FR" } }
      *         ]
      *       </dataset>
      *     </datainspector>
      *
      */
/**
  * @attribute {Object} data
  * The data to extract structure from.
  */
/**
  * @attribute {Object} structure
  * The structure tree extracted from the data attribute.
  *
  */
/**
  * @method inspect
  * Inspects an object and returns it's structure.
  *
  * The returned structure object contains a `__type`, which can be a simple type, which is one of
  * `u` (undefined), `s` (string), 'i' (number), 'b' (boolean).  Or it can be one of two complex types,
  * for arrays and objects.
  *
  * Array `__type` names begin with `[` and contain an alphabetized, comma seperated list of it's inner types,
  * followed by a closing `]`.  For example, an array of numbers and strings would become `[i,s]`
  *
  * Object `__type` names begin with `{` and contain sorted `key:type` pairs on all it's properties, ending with `}`.
  * For example, an object with a string `name` field and a number `age` field would become `{age:n,name:s}`
  *
  * `__type` names can be arbitrarily nested, for example `[{address:{city:s,state:s,street:s},name:{first:s,last:s}}]`
  *
  * Array structures will have a number of additional properties, one for each type of object that it contains.
  * Each of these objects will have a `__count` attribute indicating how many of that tpe the array contains.
  *
  * Object structures will have a number of additional properties, one for each of the named properties of the original
  * structure.  The value of these proprties will be an object containing the `__type` structure of the property.
  *
  * Note, objects structures with more than one type for the same property will be considered different objects, even if
  * thier property type structure otherwise matches.
  *
  */
