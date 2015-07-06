/**
     * @class dr.replicator {Data}
     * @extends dr.node
     * Handles replication and data binding.
     *
     * This example shows the replicator to creating four text instances, each corresponding to an item in the data attribute:
     *
     *     @example
     *     <spacedlayout spacing="5"></spacedlayout>
     *     <replicator classname="text" data="[1,2,3,4]"></replicator>
     *
     * Changing the data attribute to a new array causes the replicator to create a new text for each item:
     *
     *     @example
     *     <spacedlayout spacing="5"></spacedlayout>
     *     <text onclick="repl.setAttribute('data', [5,6,7,8]);">Click to change data:</text>
     *     <replicator id="repl" classname="text" data="[1,2,3,4]"></replicator>
     *
     * This example uses a {@link #filterexpression filterexpression} to filter the data to only numbers. Clicking changes {@link #filterexpression filterexpression} to show only non-numbers in the data:
     *
     *     @example
     *     <spacedlayout spacing="5"></spacedlayout>
     *     <text onclick="repl.setAttribute('filterexpression', '[^\\d]');">Click to change filter:</text>
     *     <replicator id="repl" classname="text" data="['a',1,'b',2,'c',3,4,5]" filterexpression="\d"></replicator>
     *
     * Replicators can be used to look up {@link #datapath datapath} expressions to values in JSON data in a dr.dataset. This example looks up the color of the bicycle in the dr.dataset named bikeshop:
     *
     *     @example
     *     <dataset name="bikeshop">
     *      {
     *        "bicycle": {
     *          "color": "red",
     *          "price": 19.95
     *        }
     *      }
     *     </dataset>
     *     <replicator classname="text" datapath="$bikeshop/bicycle/color"></replicator>
     *
     * Matching one or more items will cause the replicator to create multiple copies:
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
     *     <spacedlayout spacing="5"></spacedlayout>
     *     <replicator classname="text" datapath="$bikeshop/bicycle[*]/color"></replicator>
     *
     * It's possible to select a single item on from the array using an array index. This selects the second item:
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
     *     <spacedlayout spacing="5"></spacedlayout>
     *     <replicator classname="text" datapath="$bikeshop/bicycle[1]/color"></replicator>
     *
     * It's also possible to replicate a range of items in the array with the [start,end,stepsize] operator. This replicates every other item:
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
     *     <spacedlayout spacing="5"></spacedlayout>
     *     <replicator classname="text" datapath="$bikeshop/bicycle[0,3,2]/color"></replicator>
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
     *     <spacedlayout spacing="5"></spacedlayout>
     *     <replicator classname="text" datapath="$bikeshop/bicycle[*][@]">
     *       <method name="filterfunction" args="obj, accum">
     *         // add the color to the beginning of the results if the price is greater than 20
     *         if (obj.price > 20)
     *           accum.unshift(obj.color);
     *         return accum
     *       </method>
     *     </replicator>
     *
     * See [https://github.com/flitbit/json-path](https://github.com/flitbit/json-path) for more details.
     */
/**
        * @attribute {Boolean} [pooling=false]
        * If true, reuse views when replicating.
        */
/**
        * @attribute {Boolean} [async=true]
        * If true, create views asynchronously
        */
/**
        * @attribute {Array} [data=[]]
        * A list of items to replicate. If {@link #path path} is set, a {@link #datapath datapath} will be used to look up the value.
        */
/**
        * @attribute {String} [path=]
        * If set, a {@link #datapath datapath} will be used to look up the value.
        */
/**
        * @attribute {String} classname (required)
        * The name of the class to be replicated.
        */
/**
        * @method refresh
        * Refreshes the dataset manually
        */
/**
        * @event onreplicated
        * Fired when the replicator is done
        * @param {dr.replicator} replicator The dr.replicator that fired the event
        */
