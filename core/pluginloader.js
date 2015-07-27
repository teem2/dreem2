/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
 */
/**
 * @class PluginLoader {Internal}
 * Reads plugins and injects them into compositins when requested.
 */
define(function(require, exports, module) {
    module.exports = PluginLoader;

    var path = require('path'),
        fs = require('fs'),

        HTMLParser = require('./htmlparser'),
        DreemError = require('./dreemerror');

    function PluginLoader(args, teemserver) {
        this.teemServer = teemserver;
        this.args = args;
        this.plugins = {};

        this.__findPlugins();
    }

    body.call(PluginLoader.prototype);

    function body() {

        this.__findPlugins = function() {
            var pluginDirs = this.args['-plugin'];
            if (!Array.isArray(pluginDirs)) {
                pluginDirs = [pluginDirs]
            }

            var errors = [];
            for (var i=0;i<pluginDirs.length;i++) {
                var dir = path.resolve(pluginDirs[i]);
                if (fs.existsSync(dir + '/index.dre')) {
                    if (!define['PLUGIN']) {
                        define['PLUGIN'] = [];
                    }
                    define['PLUGIN'].push(dir + '/node_modules/');
                    this.__loadPlugin(dir, errors);
                }
            }

            this.extractedObjects = this.__extractObjects(this.plugins);
        };

        this.inject = function (composition) {
            var objects = composition.child;
            if (objects) {
                for (var i=this.extractedObjects.length - 1;i >=0;i--) {
                    var obj = this.extractedObjects[i];

                    var matchingTag = undefined;
                    for (var j=0;j<objects.length;j++) {
                        if (objects[j].tag == obj.tag) {
                            matchingTag = objects[j];
                            break;
                        }
                    }

                    if (matchingTag) {
                        var children = matchingTag.child;
                        if (!children) {
                            children = matchingTag.child = [];
                        }
                        var toCopy = obj.child;
                        for (j=0;j<toCopy.length;j++) {
                            children.unshift(toCopy[j]);
                        }
                    } else {
                        objects.unshift(obj);
                    }
                }
            }
        };

        this.__extractObjects = function (plugins) {

            var objects = [];
            for (var n in plugins) {
                var plugin = plugins[n];
                var root = plugin.child;
                if (root && root.length > 0) {
                    var children = root[0].child;
                    for (var j=0;j<children.length;j++) {
                        objects.push(children[j])
                    }
                }
            }
            return objects;
        };

        this.__originate = function (obj, name) {
            if (obj.tag) {
                obj['origin'] = name;
            }
            if (obj.child) {
                for (var i = 0;i<obj.child.length;i++) {
                    var child = obj.child[i];
                    this.__originate(child, name);
                }
            }
        };

        this.__loadPlugin = function (dir, errors) {
            console.log('Found plugin in dir:', dir);

            try {
                var drefile = dir + '/index.dre';
                var data = fs.readFileSync(drefile);

                var htmlParser = new HTMLParser();
                var source = data.toString();
                var plugin = htmlParser.parse(source);
                plugin.rootDir = dir;

                // forward the parser errors
                if (htmlParser.errors.length) {
                    htmlParser.errors.map(function(e) {
                        errors.push(new DreemError("HTML Parser Error: " + e.message, e.where));
                    });
                }

                plugin.source = source;

                if (fs.existsSync(dir + '/package.json')) {
                    plugin.pkg = require(dir + '/package.json');
                }
                if (!plugin.pkg) {
                    plugin.pkg = {}
                }
                if (!plugin.pkg.name) {
                    //if no package grab the last directory and use it as the plugin name
                    var match = /([^\/])+\/?$/.exec(dir);
                    if (match.length) {
                        plugin.pkg.name = match[0];
                    }
                }

                this.__originate(plugin, plugin.pkg.name);

                this.plugins[plugin.pkg.name] = plugin;

            } catch(e) {
                errors.push(new DreemError("Error during readFileSync in __loadPlugin: " + e.toString()));
            }

        };

    }

});