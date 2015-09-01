/**
 * Copyright (c) 2015 Teem2 LLC
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
window.assert = {};
window.assert.testCaseLabel = '';

window.DREEM_TESTS = {};
window.DREEM_TESTS.test_timeout = 1000; //millis
window.DREEM_TESTS.test_results_buffer = [];
window.DREEM_TESTS.success_count = 0;
window.DREEM_TESTS.resultsTimeoutID = null;

window.DREEM_TESTS.start_time = new Date();

window.addEventListener('dreeminit', function() {
  var timeToInit = new Date();
  window.DREEM_TESTS.init_time = (timeToInit - window.DREEM_TESTS.start_time)/1000;
  
  startTestTimer();
});

function reportFailure(e, name, msg) {
  if (!name) name = window.location.href;
  console.error('failed spec:', name, (msg ? (':' + msg) : ''), e.message);

  var duration = (new Date() - window.DREEM_TESTS.start_time)/1000;

  window.DREEM_TESTS.test_results_buffer.push(
    {
      "name": name + (msg ? (':' + msg) : ''),
      "result": false,
      "message": e.message,
      "duration": duration
    }
  );
}

function startTestTimer() {
  if (window.DREEM_TESTS.resultsTimeoutID) return;
  
  var timeout = window.DREEM_TESTS.test_timeout;
  var pageTimeout = document.getElementsByTagName('testingtimer')[0];
  timeout = pageTimeout == null ? timeout : Number(pageTimeout.childNodes[0].nodeValue);

  window.DREEM_TESTS.resultsTimeoutID = window.setTimeout(reportResults, timeout);
}

function reportResults() {
  var tests;
  if (window.DREEM_TESTS.test_results_buffer.length) {
    tests = window.DREEM_TESTS.test_results_buffer;
  } else {
    tests = [
      {
        "name": window.location.href,
        "result": true,
        "message": 'all passed!',
        "duration": 0
      }
    ];
  }

  var duration = (new Date() - window.DREEM_TESTS.start_time)/1000;
  
  window.global_test_results = {
    "passed": window.DREEM_TESTS.success_count,
    "failed": window.DREEM_TESTS.test_results_buffer.length,
    "total": window.DREEM_TESTS.success_count + window.DREEM_TESTS.test_results_buffer.length,
    "duration": duration,
    "tests": tests
  }
}

function proxyFunc(origFunc) {
  var pFunc = function() {
    
    if (origFunc.length == arguments.length) {
      var msg = arguments[arguments.length-1];
      arguments[arguments.length-1] = window.assert.testCaseLabel + ": " + msg;
    }
    try {
      origFunc.apply(this, arguments);
      window.DREEM_TESTS.success_count++;
    } catch(e) {
      reportFailure(e, window.assert.testCaseLabel, msg)
      //throw e
    }
  }
  return pFunc;
}

for (var funcName in chai.assert) {
  window.assert[funcName] = proxyFunc(chai.assert[funcName]);
}
