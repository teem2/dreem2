/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/
/**
 * @class DreemCompiler {Internal}
 * Client and server usable dreem compiler
 * Parses and loads all dependencies starting from a particular
 * Source XML, and delivers them all compiled and bundled up 
 * Ready to be interpreted and turned into classes/instances
 * With this compiler you dont need to handle dependency loading yourself
 * It has an overloadable 'onRead'  that acts as the file loader interface
 * And this method specialized for browser or server elsewhere
 */
define(function(require, exports, module) {
  var path = require('path'),
    HTMLParser = require('./htmlparser'),
    DreemError = require('./dreemerror');

  function getDefaultDeps() {
    return {teem:1};
  };
  
  function charPos(source, line, col) {
    var myline = 0, mycol = 0;
    for (var i = 0; i < source.length; i++, mycol++) {
      if (source.charCodeAt(i) == 10) myline++, mycol = 0;
      if (myline > line) return i;
      if (myline == line && col == mycol) return i;
    }
    return -1;
  };

  /* Concats all the childnodes of a jsonxml node*/
  function concatCode(node) {
    var out = '', nodeChildren = node.child;
    if (nodeChildren) {
      var i = 0, len = nodeChildren.length, child;
      for (; i < len; i++) {
        child = nodeChildren[i];
        if (child.tag === '$text' || child.tag === '$cdata') out += child.value;
      }
    }
    return out;
  };

  /* Supported languages, these are lazily loaded */
  var languages = {
    js:{
      compiler: require('$LIB/acorn'),
      compile: function(string, args) {
        // this returns a compiled function or an error
        var head = 'function __parsetest__('+args.join(',')+'){';
        var src = head + string+'}';
        try { // we parse it just for errors
          this.compiler.parse(src);
        } catch(e) {
          var at = charPos(src, e.loc && e.loc.line - 1, e.loc && e.loc.column + 1);
          return new DreemError("JS Compilation Error: " + e.message, at - head.length);
        }
        return string;
      }
    },
    coffee:{
      compiler: require('$LIB/coffee-script'),
      compile: function(string, args) {
        // compile the code
        try {
          var out = this.compiler.compile(string);
        } catch(e) { // we have an exception. throw it back
          return new DreemError("CoffeeScript compilation Error: " + e.message, charPos(string, e.location && e.location.first_line, e.location && e.location.first_column));
        }
        // lets return the blob without the function headers
        return out.split('\n').slice(1,-2).join('\n');
      }
    }
  };

  function compileMethod(node, parent, language, errors, indent) {
    // Method type overrides class or instanceof type which is what is
    // what the language arg is.
    language = language || 'js';
    if (node.attr && node.attr.type) language = node.attr.type;
    
    // lets on-demand load the language
    var langproc = languages[language];
    if (!langproc) {
      errors.push(new DreemError('Unknown language used ' + language, node.pos));
      return errors;
    }
    
    // give the method a unique but human readable name
    var name = node.tag + '_' + (node.attr && node.attr.name) + '_' + node.pos + '_' + language;
    if (parent && (parent.tag == 'class' || parent.tag == 'mixin')) name = (parent.attr && parent.attr.name) + '_' + name;
    name = exports.classnameToJS(name);
    
    //node.method_id = output.methods.length
    var lang = languages[language];
    var args = node.attr && node.attr.args ? node.attr.args.split(define.SEPARATOR_REGEX): [];
    var compiled = lang.compile(concatCode(node), args);
    
    if (compiled instanceof DreemError) { // the compiler returned an error
      compiled.where += node.child[0].pos;
      errors.push(compiled);
      return errors;
    }
    
    // lets re-indent this thing.
    var lines = compiled.split('\n');
    
    // lets scan for the shortest indentation which is not \n
    var shortest = Infinity;
    for (var i = 0; i < lines.length; i++) {
      var m = lines[i].match(/^( |\t)+/g);
      if (m && m[0].length) {
        m = m[0];
        var len = m.length;
        if (m.charCodeAt(0) == 32) {
          // replace by tabs, just because.
          if (len&1) len++; // use tabstop of 2 to fix up spaces
          len = len / 2;
          lines[i] = Array(len + 1).join('\t') + lines[i].slice(m.length);
        }
        if (len < shortest && lines[i] !== '\n') shortest = len;
      }
    }
    if (shortest != Infinity) {
      for (var i = 0; i < lines.length; i++) {
        if (i > 0 || lines[0].length !== 0) {
          lines[i] = indent + lines[i].slice(shortest).replace(/( |\t)+$/g,'');
        }
      }
      compiled = lines.join('\n');
    }
    
    return {
      name: name,
      args: args,
      comp: compiled
    };
  };

  exports.classnameToJS = function(name) {
    return name.replace(/-/g,'_');
  };

  exports.resolveFilePathStack = function(filePathStack, useRootPrefix) {
    var src, i = 0, len = filePathStack.length,
      resolvedPath = '';
    for (; len > i; i++) {
      src = filePathStack[i];
      if (define.isFullyQualifiedURL(src)) {
        return src;
      } else if (src.indexOf('/') === 0) {
        resolvedPath = define.expandVariables('$ROOT/' + src);
      } else {
        resolvedPath = (resolvedPath ? path.dirname(resolvedPath) + '/' : '') + define.expandVariables(src);
      }
    }
    resolvedPath = path.normalize(resolvedPath);
    
    if (useRootPrefix) {
      var rootPath = path.normalize(define.expandVariables('$ROOT'));
      if (resolvedPath.startsWith(rootPath)) resolvedPath = '$ROOT' + resolvedPath.substring(rootPath.length);
    }
    
    return define.cleanPath(resolvedPath);
  };

  exports.compileClass = function(node, errors, onInclude, filePathStack) {
    var body = '',
      deps = getDefaultDeps(),
      nodeAttrs = node.attr;
    
    if (node.tag !== 'class' && node.tag !== 'mixin') {
      errors.push(new DreemError('compileClass on non class', node.pos));
      return;
    }
    
    // ok lets iterate the class children
    var clsname = nodeAttrs && nodeAttrs.name;
    if (!clsname) {
      errors.push(new DreemError('Class has no name ', node.pos));
      return;
    }
    clsname = clsname.toLowerCase();
    
    var language = nodeAttrs && nodeAttrs.type ? nodeAttrs.type : 'js';
    
    // lets fetch our base class
    var baseclass = 'teem_node';
    deps['teem_node'] = 1;
    if (nodeAttrs && nodeAttrs.extends) {
      if (nodeAttrs.extends.indexOf(',') != -1) {
        errors.push(new DreemError('Cant use multiple baseclasses ', node.pos));
        return;
      }
      baseclass = nodeAttrs.extends;
      deps[baseclass] = 1;
    }
    
    body += exports.classnameToJS(baseclass) + '.extend("' + clsname + '", function(){\n';
    
    if (nodeAttrs) {
      if (nodeAttrs.with) {
        nodeAttrs.with.split(define.SEPARATOR_REGEX).forEach(function(cls) {
          if (cls) {
            deps[cls] = 1;
            body += '\t\tthis.mixin(' + exports.classnameToJS(cls)+')\n';
          }
        });
      }
      
      if (nodeAttrs.scriptincludes) {
        nodeAttrs.scriptincludes.split(define.SEPARATOR_REGEX).forEach(function(cls) {
          if (cls) {
            filePathStack.push(cls);
            deps[exports.resolveFilePathStack(filePathStack, true)] = 2;
            filePathStack.pop();
          }
        })
      }
      
      if (nodeAttrs.requires) {
        nodeAttrs.requires.split(define.SEPARATOR_REGEX).forEach(function(cls) {
          if (cls) deps[cls] = 1;
        });
      }
    }
    
    // ok lets compile a dreem class to a module
    var nodeChildren = node.child;
    if (nodeChildren) {
      var attributes = {};
      
      for (var i = 0; i < nodeChildren.length; i++) {
        var child = nodeChildren[i],
          childTagName = child.tag,
          childAttrs = child.attr;
        switch (childTagName) {
          case 'include':
            if (onInclude) {
              filePathStack.push(childAttrs.href);
              var newNodes = onInclude(errors, filePathStack);
              console.log(filePathStack.join(' | '));
              newNodes.push({tag:'$filePathStackPop'});
              nodeChildren.splice.apply(nodeChildren, [i, 1].concat(newNodes));
              i--;
            } else {
              errors.push(new DreemError('Cant support include in this location', node.pos));
            }
            break;
          case 'attribute':
            if (childAttrs) {
              attributes[childAttrs.name.toLowerCase()] = childAttrs.type.toLowerCase() || 'string';
            }
            break;
          case 'method':
          case 'handler':
          case 'getter':
          case 'setter':
            var attrnameset = childAttrs && (childAttrs.name || childAttrs.event);
            var attrnames = attrnameset.split(define.SEPARATOR_REGEX), attrname, j;
            for (j = 0; j < attrnames.length; j++) {
              attrname = attrnames[j];
              if (!attrname) {
                errors.push(new DreemError('Attribute has no name ', child.pos));
                return;
              }
              var fn = compileMethod(child, node, language, errors, '\t\t\t\t');
              if (fn === errors) continue;
              
              var args = fn.args;
              if (!args && childTagName == 'setter') args = ['value'];
              body += '\t\tthis.' + attrname +' = function(' + args.join(', ') + '){' + fn.comp + '}\n';
            }
            break;
          default:
            if (childTagName.startsWith('$')) {
              if (childTagName === '$filePathStackPop') {
                filePathStack.pop();
                nodeChildren.splice(i, 1);
                i--;
              }
            } else { // its our render-node
              var inst = this.compileInstance(child, errors, '\t\t\t', onInclude, filePathStack);
              for (var key in inst.deps) deps[key] = inst.deps[key];
              body += '\t\tthis.render = function(){\n';
              body += '\t\t\treturn ' + inst.body +'\n';
              body += '\t\t}\n';
            }
            break;
        }
      }
      
      for (var name in attributes) {
        body += '\t\tthis.__attribute("' + name + '", "' + attributes[name] + '")\n';
      }
    }
    body += '\t})';
    
    return {
      name:clsname,
      deps:deps,
      body:body
    };
  };

  exports.compileInstance = function(node, errors, indent, onLocalClass, onInclude, filePathStack) {
    var deps = getDefaultDeps();
    
    var walk = function(node, parent, indent, depth, language) {
      deps[node.tag] = 1;
      
      var myindent = indent + '\t',
        props = '',
        children = '',
        nodeAttrs = node.attr;
      
      if (nodeAttrs) {
        if (nodeAttrs.with) {
          nodeAttrs.with.split(define.SEPARATOR_REGEX).forEach(function(cls) {
            if (cls) deps[cls] = 1;
          })
        }
        
        if (nodeAttrs.scriptincludes) {
          nodeAttrs.scriptincludes.split(define.SEPARATOR_REGEX).forEach(function(cls) {
            if (cls) {
              filePathStack.push(cls);
              deps[exports.resolveFilePathStack(filePathStack, true)] = 2;
              filePathStack.pop();
            }
          })
        }
        
        if (node.tag === 'replicator' && nodeAttrs.classname) {
          var cls = nodeAttrs.classname;
          if (cls) deps[cls] = 1;
        }
        
        if (nodeAttrs.requires) {
          nodeAttrs.requires.split(define.SEPARATOR_REGEX).forEach(function(cls) {
            if (cls) deps[cls] = 1;
          });
        }
        
        for (var key in nodeAttrs) {
          var value = nodeAttrs[key];
          
          if (props) {
            props += ',\n' + myindent;
          } else {
            props = '{\n' + myindent;
          }
          if (value !== 'true' && value !== 'false' && parseFloat(value) != value) {
            value = '"' + value.split('"').join('\\"').split('\n').join('\\n') + '"';
          }
          props += key + ':' + value;
        }
        
        // screen and attribute nodes also have types so we don't want 
        // to look at them for a compiler language
        if (node.tag !== 'screen' && node.tag !== 'attribute') {
          language = nodeAttrs.type ? nodeAttrs.type : language;
        }
      }
      
      var nodeChildren = node.child;
      if (nodeChildren) {
        var attributes = {};
        var usedNames = [];

        for (var i = 0; i < nodeChildren.length; i++) {
          var child = nodeChildren[i],
            tagName = child.tag,
            attr = child.attr;
          
          switch (tagName) {
            case 'include':
              if (onInclude) {
                filePathStack.push(attr.href);
                var newNodes = onInclude(errors, filePathStack);
                newNodes.push({tag:'$filePathStackPop'});
                nodeChildren.splice.apply(nodeChildren, [i, 1].concat(newNodes));
                i--;
              } else {
                errors.push(new DreemError('Cant support include in this location', node.pos));
              }
              break;
            case 'require':
              deps[attr.name] = attr.src
              break
            case 'class':
            case 'mixin':
              if (attr.name) deps[attr.name] = 1;
              // lets output a local class 
              if (onLocalClass) {
                onLocalClass(child, errors, filePathStack);
              } else {
                errors.push(new DreemError('Cant support class in this location', node.pos));
              }
              break;
            case 'method':
            case 'handler':
            case 'getter':
            case 'setter':
              var fn = compileMethod(child, parent, language, errors, indent + '\t');
              if (fn === errors) continue;
              
              if (!attr || (!attr.name && !attr.event)) {
                //errors.push(new DreemError('code tag has no name', child.pos))
                continue;
              }
              var attrnameset = attr.name || attr.event;
              
              var attrnames = attrnameset.split(define.SEPARATOR_REGEX);
              for (var j = 0; j < attrnames.length; j++) {
                var attrname = attrnames[j];
                
                if (props) {
                  props += ',\n' + myindent;
                } else {
                  props = '{\n' + myindent;
                }
                var pre = '', post = '';
                if (tagName == 'getter') {
                  attrname = 'get_' + attrname;
                } else if (tagName == 'setter') {
                  attrname = 'set_' + attrname;
                }
                
                if (tagName == 'handler') {
                  attrname = 'handle_' + attrname;
                  while (usedNames.indexOf(attrname) != -1) {
                    attrname = 'chained_' + attrname
                  }
                  usedNames.push(attrname);
                  if (child.origin) {
                    fn.comp = 'try {' + fn.comp + '} finally { if (this.chained_' + attrname + ') { this.chained_' + attrname + '(); } }'
                  }
                }
                props += attrname + ': function(' + fn.args.join(', ') + ') {' + fn.comp + '}';
              }
              break;
            case 'attribute':
              if (attr && attr.name) {
                var value = attr.value;
                if (value !== undefined && value !== 'true' && value !== 'false' && parseFloat(value) != value) {
                  value = '"' + value.split('"').join('\\"').split('\n').join('\\n') + '"';
                }
                attributes[attr.name.toLowerCase()] = [
                  attr.type.toLowerCase() || 'string',
                  value
                ];
              } else {
                errors.push(new DreemError('attribute tag has no name', child.pos));
                continue;
              }
              break;
            default:
              if (tagName.startsWith('$')) {
                if (tagName === '$filePathStackPop') {
                  filePathStack.pop();
                  nodeChildren.splice(i, 1);
                  i--;
                }
              } else {
                if (children) {
                  children += ',\n' + myindent;
                } else {
                  children = '\n' + myindent;
                }
                children += walk(child, node, myindent, depth+1, language);
              }
              break;
          }
        }
        
        var typeAndValue;
        for (var name in attributes) {
          if (props) {
            props += ',\n' + myindent;
          } else {
            props = '{\n' + myindent;
          }
          typeAndValue = attributes[name];
          props += 'attr_' + name + ': {type:"' + typeAndValue[0] + '", value:' + typeAndValue[1] + '}';
        }
      }
      
      var out = exports.classnameToJS(node.tag) + '(';
      if (props) out += props + '\n' + (children ? myindent : indent) + '}';
      if (children) out += (props ? ',' : '') + children + '\n' + indent;
      out += ')';
      
      return out;
    }.bind(this);
    
    // Walk JSON
    var body = walk(node, null, indent || '', 0, 'js');
    
    return {
      tag: node.tag,
      name: node.attr && node.attr.name || node.tag,
      deps: deps,
      body: body
    };
  };
})