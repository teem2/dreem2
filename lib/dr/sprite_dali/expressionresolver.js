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
/** Provides an interface to platform specific Text functionality. */
// dali version
define(function(require, exports, module) {
    var acorn = require('$LIB/acorn.js');
    var acornserializer = require('./acornserializer.js');
    var dr = require("$LIB/dr/dr.js");
    
    function parse(expression) {
            //console.log("attempting to parse expression: ");
            //console.log(expression);
            var AST = acorn.parse(expression);
            return acornserializer.serialize(AST, dr.IDdictionary);
        }
    /*

    console.log("testing resolved reserialize ");
    var asttest = "globaltest = blah('') + subglobal.globaltest(a.b)+ subglobal.a.globaltest(2)+this.globaltest.globaltest";
    var AST = acorn.parse(asttest);

    
    console.log(acornserializer.dump(AST , '' ));		
    var globaldict = {globaltest: "globalreplace", subglobal:"global['a']" };
    var reserialize = acornserializer.serialize(AST, globaldict);

    console.log(asttest);
    console.log(JSON.stringify(globaldict));
    console.log(reserialize);
    
    */
    return parse;
});