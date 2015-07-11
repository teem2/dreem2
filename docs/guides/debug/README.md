# Troubleshooting and Debugging Dreem Applications
[//]: # Tips for debugging Dreem  

Logging Internals
-----------------

This example shows how to log all setAttribute() calls for a replicator to console.log():

    @example
    
    <class name="logger" extends="node">
      <method name="setAttribute" args="name, value">
        this.super();
        console.log('setAttribute', name, value, 'on', this)
      </method>
    </class>
    
    <text italic="true" fontsize="14">(please open the console to see the output of this example)</text>
    <dataset name="topmovies" url="${DREEM_ROOT + 'examples/data/top_movies.json'}"></dataset>
    <replicator datapath="$topmovies/searchResponse/results[*]/movie[take(/releaseYear,/duration,/rating)]" classname="logger"></replicator>

