/**
     * @class dr.datapath {Data}
     * @extends dr.node
     * Handles data querying, filtering and transformation
     *
     * Sometimes it's necessary to have complete control and flexibility over filtering and transforming results. Adding a [@] operator to the end of your datapath causes {@link #filterfunction filterfunction} to be called for each result. This example shows bike colors for bikes with a price greater than 20, in reverse order:
     *
     *     @example
     *     <dataset name="bikeshop">
     *      {
     *        "bicycle": [
     *          {
     *           "color": "red",
     *           "price": 19.95
     *          },
     *          {
     *           "color": "green",
     *           "price": 29.95
     *          },
     *          {
     *           "color": "blue",
     *           "price": 59.95
     *          }
     *        ]
     *      }
     *     </dataset>
     *     <datapath path="$bikeshop/bicycle[*][@]">
     *       <method name="filterfunction" args="obj, accum">
     *         // add the color to the beginning of the results if the price is greater than 20
     *         if (obj.price > 20)
     *           accum.unshift(obj.color);
     *         return accum
     *       </method>
     *     </datapath>
     *
     * See [https://github.com/flitbit/json-path](https://github.com/flitbit/json-path) for more details.
     */
/**
        * @attribute {Object} data
        * A pointer to the data to be evaluated
        */
/**
        * @attribute {Array} result
        * The result of evaluating the path
        */
/**
        * @attribute {String} path
        * A jsonpath expression to be evaluated on local data if available, or data in a parent node.
        * See [https://github.com/flitbit/json-path](https://github.com/flitbit/json-path) for details.
        */
/**
        * @attribute {String} [sortpath=""]
        * A jsonpath expression used to select values for sorting.
        * See [https://github.com/flitbit/json-path](https://github.com/flitbit/json-path) for details.
        */
/**
        * @attribute {Expression} [sortasc=true]
        * If null, don't sort. Otherwise, sort ascending if true, descending if false.
        */
/**
        * @attribute {String} [filterexpression=""]
        * If defined, data will be filtered against a [regular expression](https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions).
        */
/**
        * @method filterfunction
        * @abstract
        * Called to filter data.
        * @param obj An individual item to be processed.
        * @param {Object[]} accum The array of items that have been accumulated. To keep a processed item, it must be added to the accum array.
        * @returns {Object[]} The accum array. Must be returned otherwise results will be lost.
        */
/**
        * @method refresh
        * Refreshes the results manually
        */
