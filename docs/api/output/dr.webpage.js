Ext.data.JsonP.dr_webpage({"tagname":"class","name":"dr.webpage","autodetected":{},"files":[{"filename":"webpage.js","href":"webpage.html#dr-webpage"}],"extends":"dr.view","members":[{"name":"src","tagname":"attribute","owner":"dr.webpage","id":"attribute-src","meta":{}}],"alternateClassNames":[],"aliases":{},"id":"class-dr.webpage","short_doc":"iframe component for embedding dreem code or html in a dreem application. ...","component":false,"superclasses":["dr.view"],"subclasses":[],"mixedInto":[],"mixins":[],"parentMixins":[],"requires":[],"uses":[],"html":"<div><pre class=\"hierarchy\"><h4>Hierarchy</h4><div class='subclass first-child'>dr.view<div class='subclass '><strong>dr.webpage</strong></div></div><h4>Files</h4><div class='dependency'><a href='source/webpage.html#dr-webpage' target='_blank'>webpage.js</a></div></pre><div class='doc-contents'><p>iframe component for embedding dreem code or html in a dreem application.\nThe size of the iframe matches the width/height of the view when the\ncomponent is created. The iframe component can show a web page by\nusing the src attribute, or to show dynamic content using the\ncontents attribute.</p>\n\n<p>This example shows how to display a web page in an iframe. The\ncontents of the iframe are not editable:</p>\n\n<pre class='inline-example '><code>&lt;webpage src=\"http://en.wikipedia.org/wiki/San_Francisco\" width=\"300\" height=\"140\"&gt;&lt;/webpage&gt;\n</code></pre>\n\n<p>To make the web page clickable, and to add scrolling set either\nclickable or scrollable to true:</p>\n\n<pre class='inline-example '><code>&lt;webpage src=\"http://en.wikipedia.org/wiki/San_Francisco\" width=\"300\" height=\"140\" scrollable=\"true\"&gt;&lt;/webpage&gt;\n&lt;webpage src=\"http://en.wikipedia.org/wiki/San_Francisco\" width=\"300\" height=\"140\" clickable=\"true\"&gt;&lt;/webpage&gt;\n</code></pre>\n</div><div class='members'><div class='members-section'><div class='definedBy'>Defined By</div><h3 class='members-title icon-attribute'>Attributes</h3><div class='subsection'><div id='attribute-src' class='member first-child not-inherited'><a href='#' class='side expandable'><span>&nbsp;</span></a><div class='title'><div class='meta'><span class='defined-in' rel='dr.webpage'>dr.webpage</span><br/><a href='source/webpage.html#dr-webpage-attribute-src' target='_blank' class='view-source'>view source</a></div><a href='#!/api/dr.webpage-attribute-src' class='name expandable'>src</a> : String<span class=\"signature\"></span></div><div class='description'><div class='short'>url to load inside the iframe. ...</div><div class='long'><p>url to load inside the iframe. By default, a file is loaded that has\nan empty body but includes the libraries needed to support Dreem code.</p>\n<p>Defaults to: <code>&quot;/iframe_stub.html&quot;</code></p></div></div></div></div></div></div></div>","meta":{}});