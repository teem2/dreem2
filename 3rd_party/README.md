--- Notes ---
Dreem2 uses websockets so we need to use phantomjs 2 for testing since that is the first version that supports websockets.

There is an issue getting the official version of phantomJS 2 to run correctly on OSX 10.10 so we need to use a forked version until the issue is resolved. 

The version I've checked in here was pulled from: https://github.com/eugene1g/phantomjs/releases

Another options is if you have upx you can just re-unpack the official binary (i.e. 'upx -d phantomjs-2.0.0-macosx/bin/phantomjs’) and it seems to work.

--- Installation ---
To install this version:

1) Unzip it.
2) Figure out where your phantomjs is installed
    > which phantomjs
3) Backup your existing phantomjs from /usr/local/bin/phantomjs or whereever yours was found.
4) Copy the new one to /usr/local/bin/phantomjs or whereever yours was found.
5) Verify the version by typing:
    > phantomjs -v

--- Todo ---
Once these issues are resolved we should remove this from our repo.

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

