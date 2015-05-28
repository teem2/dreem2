var fs = require('fs');
var system = require('system');

var timeout = 60;
var filter = undefined;
var exitCode = 0;

var args = system.args;
if (args[1]) {
  if (parseInt(args[1]) == args[1]) {
    timeout = parseInt(args[1]);
  } else {
    filter = args[1];
  }
}

// Get the list of tests to run
var list = fs.list("./compositions/"),
  files = [], file, i = list.length;
while (i) {
  file = list[--i]
  if (file.indexOf('smoke_') === 0) files.push(file);
}

var runTest = function(file, callback) {
  var out = [];
  var tId;
  
  // Process the console output when the testing time is up. Compares the
  // output to the expectedoutput if the test defines it.
  var processOutput = function() {
    var expectedarry = page.evaluateJavaScript(function() {
      var retarry = [],
        expectedElements = document.getElementsByTagName('expectedoutput');
      if (expectedElements) {
        for (var i = 0, len = expectedElements.length; len > i;) {
          retarry.push(expectedElements[i++].childNodes[0].nodeValue.trim());
        }
      }
      return retarry;
    });

    var gotoutput = out.join("\n")
    var expectedoutput = expectedarry.join("\n")
    if (gotoutput !== expectedoutput) {
      console.log('ERROR: unexpected output expected::::');
      console.log(expectedoutput)
      console.log('but got::::::::::::::::::::::::::::::');
      console.log(gotoutput)
      console.log("\n")
    }
    
    page.close();
    
    // Done with the test so execute the callback which will allow us to
    // proceed to the next test.
    callback();
  };
  
  // Executes processOutput after the provided time, or a time found within
  // the test itself, or lastly, a default time.
  var updateTimer = function(ms) {
    if (ms == null) {
      var pageTimeout = page.evaluateJavaScript(function () {
          var testingtimerNode = document.getElementsByTagName('testingtimer')[0];
          return testingtimerNode ? testingtimerNode.childNodes[0].nodeValue : null;
      });
      ms = pageTimeout == null ? timeout : Number(pageTimeout);
    }
    if (tId) clearTimeout(tId);
    tId = setTimeout(processOutput, ms);
  };
  
  var page = require('webpage').create();
  
  page.onError = function(msg, trace) {
    var msgStack = ['ERROR: ' + msg];
    if (trace && trace.length) {
      msgStack.push('TRACE:');
      trace.forEach(function(t) {
        msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function +')' : ''));
      });
    }
    console.error(msgStack.join('\n'));
    updateTimer(0);
    exitCode = 1;
  };
  
  page.onInitialized = function() {
    // According to the docs this is executed 'after the web page is 
    // created but before a URL is loaded. The callback may be used to 
    // change global objects.'
    page.evaluate(function() {
      window.addEventListener('dreeminit', function(e) {console.log('~~DONE~~')}, false);
    });
  };
  
  page.onResourceError = function(resourceError) {
    console.log('RESOURCE ERROR: ' + resourceError.errorString + ', URL: ' + resourceError.url + ', File: ' + file);
    updateTimer(0);
  };
  
  page.onConsoleMessage = function(msg, lineNum, sourceId) {
    if (msg === '~~DONE~~') {
      // Found the special console message that means the dreem app was 
      // initialized so we should conclude the test.
      updateTimer()
    } else {
      // Remember any other console messages encountered.
      out.push(msg)
    }
  };
  
  page.open('http://127.0.0.1:8080/' + file.substring(0, file.length - 4) + '?test'); // 4 is remove '.dre'
}

// Runs the next test if possible. This function is provided as the callback
// to runTest which is how we proceed from test to test.
var loadNext = function() {
  var file = files.pop();
  if (file) {
    if (filter !== undefined) {
      if (file.indexOf(filter) !== -1) {
        console.log("FILTERED TEST: ", file)
        runTest(file, loadNext);
      } else {
        loadNext();
      }
    } else {
      console.log("RUNNING TEST: ", file)
      runTest(file, loadNext);
    }
  } else {
    phantom.exit(exitCode);
  }
}

loadNext();