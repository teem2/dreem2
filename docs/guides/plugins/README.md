# Dreem Plugin Guide

[//]: # This introduction to building plugins in Dreem.

Plugins allow you to provide additional classes and server behavior to a composition.  The structure of a plugin is almost 
identical composition (though typically without `<screen>` tags), and is contained within the `<plugin></plugin>` tag.  
Plugins are added to the server at startup with one or more `-plugin /path/to/plugin/` command line switches, like so:

    node ./server.js -plugin ../plugins/teem-sample_component/ -plugin ../plugins/soundcloud/

## Directory Structure

    ./index.dre - the main plugin code
    ./package.json - names the plugin and provides for a dependencies
    ./node_modules/ - node modules that plugin depends on
    ./examples/*.dre - optional example compositions that use the plugin
    
The examples will automatically be mounted at `/plugins/plugin-name/examples/filename.dre`
    
## Plugin File Structure

Here is a sample index.dre (explained in more detail below):

    <plugin>
      <classes>
        <class name="webrequest">
          <attribute name="src" value="" type="string"></attribute>
          <setter name="src" args="val">
            if (val) {
              dr.teem.server.request(val).then((function (ret) {
                this.setAttribute('response', ret);
              }).bind(this));
            }
            return val;
          </setter>
          <attribute name="response" value="" type="string"></attribute>    
        </class>
      </classes>
    
      <server>
        <handler event="init">
          this.__srequest = require('$PLUGIN/sync-request');
        </handler>
        <method name="request" args="url">
          if (/^https?:.*/.test(url)) {
            try {
              var res = this.__srequest('GET', url);
              var body = res.getBody().toString();
              return body;
            } catch(err) {
              return ['[ERROR]', err.message].join(' ');
            }
          } else {
            return "Cannot parse URL:" + url;
          }
        </method>
      </server>
    </plugin>

This plugin provides a simple "webrequest" object which can be used in compositions to have the server fetch web pages
from a given URL in it's `src` attribute, which is then stored in it's `response` attribute.