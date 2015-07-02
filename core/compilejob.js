/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
 */
/**
 * @class CompileJob {}
 * Compiles dre string provided by the client and returns javascript
 */
define(function(require, exports, module) {
    module.exports = CompileJob;

    var path = require('path'),
        fs = require('fs'),

        HTMLParser = require('./htmlparser'),
        DreemError = require('./dreemerror'),
        dreem_compiler = require('./dreemcompiler');


    /**
     * @constructor
     * @param {Object} args Process arguments
     */
    function CompileJob(args, teemserver) {
        this.teemserver = teemserver;
        this.args = args;
        this.reload();
    }

    body.call(CompileJob.prototype)

    function body() {
        /**
         * @method showErrors
         * Shows error array and responds with notifications/opening editors
         * @param {Array} errors
         * @param {String} prefix Output prefix
         */
        this.showErrors = function(errors, filepath, source) {
            var w = 0;
            if (!Array.isArray(errors)) errors = [errors];
            errors.forEach(function(err) {
                err.expand(define.expandVariables(filepath), source);
                console.color("~br~ Error ~y~" + err.path + "~bg~" + (err.line!==undefined?":"+ err.line + (err.col?":" + err.col:""):"")+"~~ "+err.message+"\n");
                if (!err.path) w++;
            });
            if (errors[w]) {
                if (this.args['-notify']) {
                    ExternalApps.notify('Exception',errors[w].message)
                }
                if (this.args['-edit']) {
                    if (fs.existsSync(errors[w].path)) {
                        ExternalApps.editor(errors[w].path, errors[w].line, errors[w].col - 1);
                    }
                }
            }
        };

        this.parseDreSync = function(drefile, errors) {
            // read our composition file
            try {
                var data = fs.readFileSync(define.expandVariables(drefile));
            } catch(e) {
                errors.push(new DreemError("Error in readFileSync: " + e.toString()));
                return;
            }

            // and then showErrors
            var htmlParser = new HTMLParser();
            var source = data.toString();
            var jsobj = htmlParser.parse(source);

            // forward the parser errors
            if (htmlParser.errors.length) {
                htmlParser.errors.map(function(e) {
                    errors.push(new DreemError("HTML Parser Error: " + e.message, e.where));
                });
            }

            jsobj.source = source;

            return jsobj;
        };

        /* Internal, compiles and writes dre .js class */
        this.compileAndWriteDreToJS = function(jsxml, filename, compname, errors) {
            var js = dreem_compiler.compileClass(jsxml, errors);
            if (js) {
                // write out our composition classes
                var out = 'define(function(require, exports, module){\n';
                out += "var dreemParser = require('$LIB/dr/dreemParser.js'), dreemMaker = require('$LIB/dr/dreemMaker.js'), compiler = new dreemParser.Compiler();";
                out += this.makeLocalDeps(js.deps, compname, '\t', errors);
                out += '\tmodule.exports = ' + js.body + '\n\tmodule.exports.dre = ' + JSON.stringify(jsxml) + '})';
                this.writeFileIfChanged(filename, out, errors);
                return js.name;
            }
        };

        this.writeFileIfChanged = function(filePath, newData, errors) {
            var expandedPath = define.expandVariables(filePath),
                data;
            try {
                data = fs.readFileSync(expandedPath);
                if (data) data = data.toString();
            } catch(e) {}

            if (!data || newData.length !== data.length || newData !== data) {
                try {
                    fs.writeFileSync(expandedPath, newData);
                } catch(e) {
                    errors.push(new DreemError("Error in writeFilSync: " + e.toString()));
                }
            }
        };

        this.lookupDep = function(classname, compname, errors) {
            if (classname in this.local_classes) {
                // lets scan the -project subdirectories
                return '$BUILD/compositions.' + compname + '.dre.' + classname + '.js';
            }
            var extpath = define.expandVariables(define.EXTLIB), paths = [];
            if (fs.existsSync(extpath)) {
                try {
                    var dir = fs.readdirSync(extpath);
                    dir.forEach(function(value) {
                        paths.push('$EXTLIB/' + value)
                        paths.push('$EXTLIB/' + value + '/classes')
                    })
                } catch(e) {}
            }

            paths.unshift('$CLASSES');

            for (var i = 0; i < paths.length; i++) {
                var drefile = paths[i] + '/' + dreem_compiler.classnameToPath(classname) + '.dre';
                var jsfile =  paths[i] + '/' + dreem_compiler.classnameToPath(classname) + '.js';
                if (fs.existsSync(define.expandVariables(drefile))) {
                    if (!this.compile_once[drefile]) {
                        // lets parse and compile this dre file
                        var local_err = [];
                        var dre = this.parseDreSync(drefile, local_err);
                        if (!dre.child) return '';
                        var root;
                        for (var j = 0; j < dre.child.length; j++) {
                            var tag = dre.child[j].tag;
                            if (tag == 'class' || tag == 'mixin') root = dre.child[j];
                        }
                        if (root) { // lets output this class
                            jsfile = "$BUILD/" + paths[i].replace(/\//g,'.').replace(/\$/g,'').toLowerCase()+'.'+ dreem_compiler.classnameToBuild(classname) + ".js";
                            this.compile_once[drefile] = jsfile;
                            this.compileAndWriteDreToJS(root, jsfile, null, local_err);
                        }
                        if (local_err.length) {
                            this.showErrors(local_err, drefile, dre.source);
                        }
                    } else {
                        jsfile = this.compile_once[drefile];
                    }
                }

                if (fs.existsSync(define.expandVariables(jsfile))) {
                    return jsfile;
                }
            }

            console.color("~br~Error~~ finding class " + classname + '\n');
        };

        this.makeLocalDeps = function(deps, compname, indent, errors) {
            var out = '';
            for (var key in deps) {
                var incpath = this.lookupDep(key, compname, errors);
                this.classmap[key] = incpath;
                if (incpath) {
                    out += indent + 'var ' + dreem_compiler.classnameToJS(key) + ' = require("' + incpath + '");\n';
                }
            }
            return out;
        };

        /* compiles dre .js class */
        this.compileDreToJS = function(jsxml, errors) {
            var js = dreem_compiler.compileInstance(jsxml.child[0], errors, '\t\t');
            if (js) {
                var out = '';
                out += 'var main_mod = define.expandVariables(define.MAIN);\n';
                out += 'var require = define.localRequire(define.filePath(main_mod));\n';
                out += "var errors = [];\n";
                out += this.makeLocalDeps(js.deps, 'anonymous', '', errors);
                out += "var jsbody = " + js.body + ';\n';
                out += 'mainView.createChild(jsbody)';
                return out;
            }
        };

        this.parseDreString = function(source, errors) {
            var htmlParser = new HTMLParser();
            var jsobj = htmlParser.parse(source);

            // forward the parser errors
            if (htmlParser.errors.length) {
                htmlParser.errors.map(function(e) {
                    errors.push(new DreemError("HTML Parser Error: " + e.message, e.where));
                });
            }

            jsobj.source = source;

            return jsobj;
        };

        this.compileToJS = function(source, errors) {
          var dre = this.parseDreString(source, errors);
          var js = this.compileDreToJS(dre, errors);
          return js;
        };

        /* Internal, reloads the composition */
        this.reload = function() {
            this.local_classes = {};
            this.compile_once = {};
            this.components = {};
            this.screens = {};
            this.modules = [];
            this.classmap = {};
        };

        /**
         * @method request
         * Handle server request for this Composition
         * @param {Request} req
         * @param {Response} res
         */
        this.request = function(req, res) {
            // ok lets serve our Composition device
            if (req.method == 'POST') {
                // lets do an RPC call
                var buf = '';
                req.on('data', function(data) { buf += data.toString();});
                req.on('end', function() {
                    var errors = [];
                    try {
                        var js = this.compileToJS(buf, errors)
                        res.writeHead(200, {"Content-Type":"text/js"});
                        res.write(js);
                        res.end();
                    } catch(e) {
                        res.writeHead(500, {"Content-Type": "text/html"});
                        res.write('FAIL', errors);
                        res.end();
                        return;
                    }
                }.bind(this));
            } else {
                res.writeHead(500, {"Content-Type":"text/plain"});
                res.write('must be a post');
                res.end();
            }
        };
    }
});