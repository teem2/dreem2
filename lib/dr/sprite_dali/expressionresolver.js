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