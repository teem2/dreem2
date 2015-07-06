/**
  * @class dr.dataset {Data}
  * @extends dr.node
  * Datasets hold onto a set of JSON data, either inline or loaded from a URL.
  * They are used with lz.replicator for data binding.
  *
  * This example shows how to create a dataset with inline JSON data, and use a replicator to show values inside. Inline datasets are useful for prototyping, especially when your backend server isn't ready yet:
  *
  *     @example wide
  *     <dataset name="example">
  *      {
  *        "store": {
  *          "book": [
  *            {
  *              "category": "reference",
  *              "author": "Nigel Rees",
  *              "title": "Sayings of the Century",
  *              "price": 8.95
  *            },
  *            {
  *              "category": "fiction",
  *              "author": "Evelyn Waugh",
  *              "title": "Sword of Honour",
  *              "price": 12.99
  *            },
  *            {
  *              "category": "fiction",
  *              "author": "Herman Melville",
  *              "title": "Moby Dick",
  *              "isbn": "0-553-21311-3",
  *              "price": 8.99
  *            },
  *            {
  *              "category": "fiction",
  *              "author": "J. R. R. Tolkien",
  *              "title": "The Lord of the Rings",
  *              "isbn": "0-395-19395-8",
  *              "price": 22.99
  *            }
  *          ],
  *          "bicycle": {
  *            "color": "red",
  *            "price": 19.95
  *          }
  *        }
  *      }
  *     </dataset>
  *     <spacedlayout axis="y" spacing="5"></spacedlayout>
  *     <replicator classname="text" datapath="$example/store/book[*]/title"></replicator>
  *
  * Data can be loaded from a URL when your backend server is ready, or reloaded to show changes over time:
  *
  *     @example wide
  *     <dataset name="example" url="/examples/data/example.json"></dataset>
  *     <spacedlayout axis="y" spacing="5"></spacedlayout>
  *     <replicator classname="text" datapath="$example/store/book[*]/title"></replicator>
  */
/**
    * @attribute {String} name (required)
    * The name of the dataset
    */
/**
    * @attribute {Object} data
    * The data inside the dataset
    */
/**
    * @attribute {String} url
    * The url to load JSON data from.
    */
/**
    * @attribute {Boolean} [async=true]
    * If true, parse json in a worker thread
    */
/**
    * @private
    */
