Dreem2
======

Dreem with multiple screens, IOT and backwards compatibility for dre syntax.

getting started with dreem
--------------------------

It is quick and easy to get started writing your dreem application, first install [Node.js v0.10.x](http://nodejs.org/download/), and then clone the repo:

    git clone https://github.com/teem2/dreem2.git

You will need to serve the dreem files through a web server to satisfy the browser's same-origin policy.  To start the dreem server just run:

    > cd <your dreem installation root>
    > node server

This will turn that directory into a webserver and allow you to run any of the example files on localhost, such as [http://localhost:8080/example_spirallayout](http://localhost:8080/example_spirallayout)

You can open a page with all the examples here: [http://localhost:8080/examplelinks](http://localhost:8080/examplelinks)

running smoke tests
--------------------------

(Important! See the README.md file in /3rd_party for a temporary workaround for phantomjs 2. You will not want to do the npm install if you're on the latest OSX)

The smoke tests docs are run with [http://phantomjs.org/ 2.0](http://phantomjs.org/), so you'll need to install it with:

    npm install phantomjs@2.0

After you've installed it, run:

    > cd <your dreem installation root>
    > phantomjs ./bin/phantomrunner.js

Finally, you may get better performance if you utilize phantom's disk cache:

    > phantomjs ./bin/phantomrunner.js 100 --disk-cache

You can also target a specific smoke tests by naming it on the commandline. All tests that contain that name will be run.

    > phantomjs ./bin/phantomrunner.js view

other notes
--------------------------
Dreem2 introduces the concept of "compositions". These combine client and server side functionality together into a single dre file. What you would have thought of as a page in dreem1 is now a "screen" which is found within a composition.

Compositions are served out of the compositions directory under dreem root.

<!-- The MIT License (MIT)

Copyright ( c ) 2014-2015 Teem2 LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. -->

