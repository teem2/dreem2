/*
 The MIT License (MIT)

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
 SOFTWARE.

Dreem file parser and dependency resolver.
*/
define(function(require, exports){
  var dreemParser = exports

  var dreemMaker = require('./dreemMaker')
  var acorn = require('$LIB/acorn')
  var coffee = require('$LIB/coffee-script')

  var LEGACY_CLASSES = '$CLASSES/legacy'
  /**
   * @class parser.Error
   * Unified Error class that holds enough information to 
   * find the right file at the right line
   */
  dreemParser.Error = (function(){
    /**
     * @constructor
     * @param {String} message Message
     * @param {String} path Path of file
     * @param {Int} line Line of error
     * @param {Int} col Column of error
     */
    function Error(message, path, line, col){
      this.message = message
      this.path = path
      this.line = line
      this.col = col
    }

    Error.prototype.toString = function(){
      return 'Dreem Error: '+this.path+(this.line!==undefined?":"+this.line+(this.col?":"+this.col:""):"")+"- " + this.message 
    }

    return Error
  })()

  /**
   * @class parser.Compiler
   * Client and server usable dreem compiler
   * Parses and loads all dependencies starting from a particular
   * Source XML, and delivers them all compiled and bundled up 
   * Ready to be interpreted and turned into classes/instances
   * With this compiler you dont need to handle dependency loading yourself
   * It has an overloadable 'onRead'  that acts as the file loader interface
   * And this method specialized for browser or server elsewhere
   */
  dreemParser.Compiler = (function(){
    /** 
     * @constructor
     */
    function Compiler(){
      this.filehash = {} // all the dreem files by file-key
      this.origin_id = 0 // file id counter for json-map-back
    }

    /* Supported languages, these are lazily loaded */
    Compiler.prototype.languages = {
      js:{
        compile:function(string, args){
          // this returns a compiled function or an error
          try{ // we parse it just for errors
            acorn.parse('function __parsetest__('+args.join(',')+'){'+string+'}')
          }
          catch(e){
            return new dreemParser.Error(e.message, undefined, e.loc && e.loc.line - 1, e.loc && e.loc.column)
          }
          return string
        }
      },
      coffee:{
        compile:function(string, args){
          // compile coffeescript
          // compile the code
          try{
            var out = coffee.compile(string)
          }
          catch(e){ // we have an exception. throw it back
            return new dreemParser.Error(e.message, undefined, e.location && e.location.first_line, e.location && e.location.first_column)
          }
          // lets return the blob without the function headers
          return out.split('\n').slice(1,-2).join('\n')
        }
      }
    }

    /**
     * @event onRead
     * called when the compiler needs to read a file
     * @param {String} name Name of the file to read
     * @param {Function} callback Callback to call with (error, result)
     */
    Compiler.prototype.onRead = function(name, callback){ throw new Error('Abstract function') }

    /**
     * @method originError
     * Used to decode an origin, they are '0_3' like strings which mean
     * fileid_charoffset 
     * These origins are written into the XML JSON so its possible to resolve
     * a particular tag to a particular file/line when needed
     * @param {String} message Message for the error
     * @param {String} origin Origin string ('2_5') to decode
     */
    Compiler.prototype.originError = function(message, origin){
      var orig = origin.split('_')
      var id = orig[0], offset = parseInt(orig[1])
      var line = 1, col = 0
      var file
      var name 
      for(var k in this.filehash) if(this.filehash[k].id == id){
        file = this.filehash[k]
        name = k
        break
      }
      if(!file) return new Error('Cant find origin '+origin, 'unknown')
      var data = file.data
      var path = file.path
      for(var i = 0;i < data.length && i<offset; i++, col++){
        if(data.charCodeAt(i) == 10) line++, col = 1
      }
      return new dreemParser.Error(message, path, line, col)
    }

    /* Used internally, loads or caches a file*/
    Compiler.prototype.cache = function(name, callback){
      if(this.filehash[name]) return callback(null, this.filehash[name])
      this.onRead(name, function(err, data, fullpath){
        if(err) return callback(err)
        var file = this.filehash[name] = {
          name: name,
          id: this.origin_id++,
          path: fullpath,
          data: data// typeof data === 'string'?data:data.toString()
        }

        return callback(null, file)
      }.bind(this))
    }

    /* Used internally, parses a Dre file*/
    Compiler.prototype.parseDre = function(name, callback){
      this.cache(name, function(err, file){
        if(err) return callback(err)

        if(typeof file.data == 'object'){
          return callback(null, file.data)
        }// its already 

        var htmlParser = new dreemParser.HTMLParser(file.id)
        var jsobj = htmlParser.parse(file.data)

        // forward the parser errors 
        if(htmlParser.errors.length){
          var err = htmlParser.errors.map(function(e){
            return this.originError(e.message, file.id+'_'+e.where)
          }.bind(this))
          
          return callback(err)
        }

        return callback(null, jsobj)
      }.bind(this))
    }

    /* Concats all the childnodes of a jsonxml node*/
    Compiler.prototype.concatCode = function(node){
      var out = ''
      var children = node.child
      if(!children || !children.length) return ''
      for(var i = 0; i<children.length;i++){
        if(children[i].tag == '$text') out += children[i].value
      }
      
      return out
    }

    /*
     Main loader function, used internally 
     The loader just loads all dependencies and assembles all classes, and 
     gathers all compileable methods and their language types
     It does not compile any coffeescript / JS
    */
    Compiler.prototype.loader = function(node, callback){
      var deps = {} // dependency hash, stores the from-tags for error reporting
      var loading = 0 // number of in flight dependencies
      var errors = [] // the error array
      var output = {node:node, js:{}, classes:{}, methods:[]}
      var method_id = 0
      
      var loadJS = function(file, from_node){
        // loads javascript
        if(file in output.js) return
        if(!deps[file]){
          deps[file] = [from_node]
          loading++
          this.cache(file, function(err, data){
            if(err){
              errors.push(err)
              var mydep = deps[file]
              for(var i = 0;i < mydep.length; i++){
                errors.push(this.originError('JS file '+name+' used here but could not be loaded', mydep[i]._))
              }
            }
            output.js[file] = data
            if(!--loading) errors.length? callback(errors): callback(null, output)
          })
        }
        else deps[file].push(from_node)
      }.bind(this)

      var loadClass = function(name, from_node){
        if(name in dreemMaker.builtin) return
        if(name in output.classes) return
        
        output.classes[name] = 2 // mark tag as loading but not defined yet

        if(!deps[name]){
          deps[name] = [from_node]
          loading++
          // we should make the load order deterministic by force serializing the dependency order
          var path = name.split('-').join('/');
          this.parseDre(define.expandVariables(LEGACY_CLASSES) +'/' + path, function(err, jsobj){
            if(!err) walk(jsobj, null, 'js')
            else{
              if(Array.isArray(err)) errors.push.apply(errors, err)
              else errors.push(err)
              // lets push our errors in err
              var mydep = deps[name]
              for(var i = 0;i < mydep.length; i++){
                errors.push(this.originError('class '+name+' used here could not be loaded', mydep[i]._))
              }
            }
            if(!--loading) errors.length? callback(errors): callback(null, output)
          }.bind(this))
        }
        else deps[name].push(from_node)
      }.bind(this)

      var walk = function(node, parent, language){
        if(node.tag.charAt(0)!='$') loadClass(node.tag, node)
        
        var prune = false;
        
        if (node.tag == 'replicator') {
          if(node.attr && node.attr.classname){
            loadClass(node.attr.classname, node)
          }
        } else if (node.tag == 'class' || node.tag == 'mixin') {
          var nameattr = node.attr && node.attr.name
          if(!nameattr){
            errors.push(this.originError('Class has no name ', node._))
            return
          }
          if (node.attr && node.attr.type) {
            language = node.attr.type
            delete node.attr.type
          }
          
          // create a new tag
          output.classes[nameattr] = node
          
          // check extends and view
          if(node.attr && node.attr.extends){
            node.attr.extends.split(/,\s*/).forEach(function(cls){
              loadClass(cls, node)
            })
          }
          if(node.attr && node.attr.with){
            node.attr.with.split(/,\s*/).forEach(function(cls){
              loadClass(cls, node)
            })
          }
          if(node.attr && node.attr.scriptincludes){ // load the script includes
            node.attr.scriptincludes.split(/,\s*/).forEach(function(js){
              loadJS(js, node)
            })
          }
          
          // Remove from parent since classes will get looked up in the
          // output.classes map
          prune = true;
        } 
        else if (node.tag == 'method' || node.tag=='handler' || node.tag == 'getter' || node.tag == 'setter') {
          // potentially 'regexp' createTag or something here?

          if(node.attr && node.attr.type) {
            language = node.attr.type
            delete node.attr.type
          }
          
          // give the method a unique but human readable name
          var name = node.tag + '_' + (node.attr && node.attr.name) + '_' + node._ + '_' + language
          if(parent && (parent.tag == 'class' || parent.tag == 'mixin')) name = (parent.attr && parent.attr.name) + '_' + name

          node.method_id = output.methods.length
          output.methods.push({
            language: language,
            name:name,
            args: node.attr && node.attr.args ? node.attr.args.split(/,\s*/) : [],
            source: this.concatCode(node),
            origin: node._
          })
          // clear child
          node.child = undefined
        }
        
        if (node.child) {
          for (var i = 0; i < node.child.length; i++) {
            // Prune node if so indicated
            if (walk(node.child[i], node, language)) node.child.splice(i--, 1);
          }
        }
        
        return prune;
      }.bind(this)

      // Walk JSON
      walk(node, null, 'js')
      
      // the impossible case of no dependencies
      if(!loading) errors.length? callback(errors): callback(null, output)
    }

    /**
     * @method execute
     * Execute the compiler starting from a 'rootname' .dre file
     * The result in the callback is a 'package' that contains 
     * all dreem classes 
     * package: {
     *     js:{}, A key value list of js files
     *     methods:'' A string containing all methods compiled
     *     root:{} The root in JSONXML
     *     classes:{} A key value list of all classes as JSONXML 
     * }
     * @param {String} rootname Root dre file
     * @param {Callback} callback When compiler completes callback(error, result)
     */
    Compiler.prototype.execute = function(rootname, callback){
      // load the root
      this.parseDre(rootname, function(err, jsobj){
        if(err) return callback(err)

        this.loader(jsobj, function(err, output){
          if(err) return callback(err)

          // Compile all methods / getters/setters/handlers using the language it has
          var errors = []
          var methods = output.methods
          var code = ''
          for(var i = 0;i < methods.length; i++){
            var method = methods[i]
            var lang = this.languages[method.language]

            var compiled = lang.compile(method.source, output.js[lang.lib], method.args)
            
            if(compiled instanceof dreemParser.Error){ // the compiler returned an error
              var err = this.originError(compiled.message, method.origin)
              err.line += compiled.line // adjust for origin
              errors.push(err)
            }
            else{
              // lets build a nice function out of it
              code += 'methods['+i+'] = function '+method.name+'('+ method.args.join(', ') + '){\n' + 
                compiled + '\n}\n' 
            }
          }

          if(errors.length) return callback(errors)
          
          // lets package up the output
          var pkg = {
            js: output.js, // key value list of js files
            methods: code, // the methods codeblock 
            root: jsobj,   // the dreem root file passed into execute
            classes: output.classes // the key/value set of dreem classes as JSON-XML
          }

          return callback(null, pkg)
        }.bind(this))

      }.bind(this))
    }
    return Compiler
  })()

  /**
   * @class parser.HTMLParser
   * Very fast and simple XML/HTML parser
   * Modifyable to output any JS datastructure from HTML/XML you prefer
   */
  dreemParser.HTMLParser = (function(){
    /**
     * @constructor
     * @param {Int} file_id File id to write on the ._ origin properties
     */
    function HTMLParser(file_id){
      this.file_id = file_id || 0
    }

    /**
     * @method reserialize
     * Reserialize tries to turn the JS datastructure the parser outputs back into valid XML
     * Warning, lightly tested
     * @param {Object} node A node the parser outputs
     * @param {String} spacing The indentation character(s) to use
     */
    HTMLParser.prototype.reserialize = function(node, spacing, indent){
      if(spacing === undefined) spacing = '\t'
      var ret = ''
      var child = ''
      if(node.child){
        for(var i = 0, l = node.child.length; i<l; i++){
          var sub = node.child[i]
          child += this.reserialize(node.child[i], spacing, indent === undefined?'': indent + spacing)
        }
      }
      if(!node.tag) return child
      if(node.tag.charAt(0) !== '$'){
        ret += indent + '<' + node.tag
        var attr = node.attr
        if(attr) for(var k in attr){
          var val = attr[k]
          if(ret[ret.length - 1] != ' ') ret += ' '
          ret += k
          var delim = "'"
          if(val !== 1){
            if(val.indexOf(delim) !== -1) delim = '"'
            ret += '=' + delim + val + delim
          }
        }
        if(child) ret += '>\n' + child + indent + '</' + node.tag + '>\n'
        else ret += '/>\n'
      }
      else{
        if(node.tag == '$text') ret += indent + node.value + '\n' 
        else if(node.tag == '$cdata') ret += indent + '<![CDATA['+node.value+']]>\n'
        else if(node.tag == '$comment') ret += indent + '<!--'+node.value+'-->\n'
        else if(node.tag == '$root') ret += child
      }
      return ret
    }

    /* Internal append a childnode */
    HTMLParser.prototype.appendChild = function(node, value){
      var i = 0
      if(!node.child) node.child = [value]
      else node.child.push(value)
    }

    /* Internal create a node */
    HTMLParser.prototype.createNode = function(tag, charpos){
      return {tag:tag, _:this.file_id + '_' + charpos}
    } 

    /* Internal append an error message*/
    HTMLParser.prototype.onError = function(message, where){
      this.errors.push({message:message, where:where})
    }

    var isempty = /^[\r\n\s]+$/ // discard empty textnodes

    /* Internal Called when encountering a textnode*/
    HTMLParser.prototype.onText = function(value, start){
      if(!value.match(isempty)){
        var node = this.createNode('$text')
        node.value = this.processEntities(value, start)
        this.appendChild(this.node,node)
      }
    }

    /* Internal Called when encountering a comment <!-- --> node*/
    HTMLParser.prototype.onComment = function(value, start, end){
      var node = this.createNode('$comment', start)
      node.value = value
      this.appendChild(this.node, node)
    }

    /* Internal Called when encountering a CDATA <![CDATA[ ]]> node*/
    HTMLParser.prototype.onCDATA = function(value, start, end){
      var node = this.createNode('$cdata', start)
      node.value = value
      this.appendChild(this.node, node)
    }

    /* Internal Called when encountering a <? ?> process node*/
    HTMLParser.prototype.onProcess = function(value, start, end){
      var node = this.createNode('$process', start)
      node.value = value
      this.appendChild(this.node, node)
    }

    /* Internal Called when encountering a tag beginning <tag */
    HTMLParser.prototype.onTagBegin = function(name, start, end){
      var newnode = this.createNode(name, start)

      this.appendChild(this.node, newnode)

      // push the state and set it
      this.parents.push(this.node, this.tagname, this.tagstart)
      this.tagstart = start
      this.tagname = name
      this.node = newnode
      
    }

    /* Internal Called when encountering a tag ending > */
    HTMLParser.prototype.onTagEnd = function(start, end){
      this.last_attr = undefined
      if(this.self_closing_tags && this.tagname in this.self_closing_tags || this.tagname.charCodeAt(0) == 33){
        this.tagstart = this.parents.pop()
        this.tagname = this.parents.pop()
        this.node = this.parents.pop()
      }
    } 

    /* Internal Called when encountering a closing tag </tag> */
    HTMLParser.prototype.onClosingTag = function(name, start, end){
      this.last_attr = undefined
      // attempt to match closing tag
      if(this.tagname !== name){
        this.error('Tag mismatch </' + name + '> with <' + this.tagname+'>', start, this.tagstart)
      }
      // attempt to fix broken html
      //while(this.node && name !== undefined && this.tagname !== name && this.parents.length){
      // this.tagname = this.parents.pop()
      // this.node = this.parents.pop()
      //}
      if(this.parents.length){
        this.tagstart = this.parents.pop()
        this.tagname = this.parents.pop()
        this.node = this.parents.pop()
      }
      else{
        this.error('Dangling closing tag </' + name + '>', start)
      }
    } 

    /* Internal Called when encountering a closing tag </close> */
    HTMLParser.prototype.onImmediateClosingTag = function(start, end){
      this.onClosingTag(this.tagname, start)
    }

    /* Internal Called when encountering an attribute name name= */
    HTMLParser.prototype.onAttrName = function(name, start, end){
      if(name == 'tag' || name == 'child'){
        this.error('Attribute name collision with JSON structure'+name, start)
        name = '_' + name
      }
      this.last_attr = name
      if(this.last_attr in this.node){
        this.error('Duplicate attribute ' + name + ' in tag '+this.tagname, start)
      }
      if(!this.node.attr) this.node.attr = {}
      this.node.attr[this.last_attr] = null
    } 

    /* Internal Called when encountering an attribute value "value" */
    HTMLParser.prototype.onAttrValue = function(val, start, end){
      if(this.last_attr === undefined){
        this.error('Unexpected attribute value ' + val, start)
      }
      else{
        this.node.attr[this.last_attr] = this.processEntities(val, start)
      }
    } 

    // all magic HTML self closing tags. set this to undefined if you want XML behavior
    HTMLParser.prototype.self_closing_tags = {
      'area':1, 'base':1, 'br':1, 'col':1, 'embed':1, 'hr':1, 'img':1, 
      'input':1, 'keygen':1, 'link':1, 'menuitem':1, 'meta':1, 'param':1, 'source':1, 'track':1, 'wbr':1
    }

    // todo use these
    var entities = {
      "amp":38,"gt":62,"lt":60,"quot":34,"apos":39,"AElig":198,"Aacute":193,"Acirc":194,
      "Agrave":192,"Aring":197,"Atilde":195,"Auml":196,"Ccedil":199,"ETH":208,"Eacute":201,"Ecirc":202,
      "Egrave":200,"Euml":203,"Iacute":205,"Icirc":206,"Igrave":204,"Iuml":207,"Ntilde":209,"Oacute":211,
      "Ocirc":212,"Ograve":210,"Oslash":216,"Otilde":213,"Ouml":214,"THORN":222,"Uacute":218,"Ucirc":219,
      "Ugrave":217,"Uuml":220,"Yacute":221,"aacute":225,"acirc":226,"aelig":230,"agrave":224,"aring":229,
      "atilde":227,"auml":228,"ccedil":231,"eacute":233,"ecirc":234,"egrave":232,"eth":240,"euml":235,
      "iacute":237,"icirc":238,"igrave":236,"iuml":239,"ntilde":241,"oacute":243,"ocirc":244,"ograve":242,
      "oslash":248,"otilde":245,"ouml":246,"szlig":223,"thorn":254,"uacute":250,"ucirc":251,"ugrave":249,
      "uuml":252,"yacute":253,"yuml":255,"copy":169,"reg":174,"nbsp":160,"iexcl":161,"cent":162,"pound":163,
      "curren":164,"yen":165,"brvbar":166,"sect":167,"uml":168,"ordf":170,"laquo":171,"not":172,"shy":173,
      "macr":175,"deg":176,"plusmn":177,"sup1":185,"sup2":178,"sup3":179,"acute":180,"micro":181,"para":182,
      "middot":183,"cedil":184,"ordm":186,"raquo":187,"frac14":188,"frac12":189,"frac34":190,"iquest":191,
      "times":215,"divide":247,"OElig":338,"oelig":339,"Scaron":352,"scaron":353,"Yuml":376,"fnof":402,
      "circ":710,"tilde":732,"Alpha":913,"Beta":914,"Gamma":915,"Delta":916,"Epsilon":917,"Zeta":918,
      "Eta":919,"Theta":920,"Iota":921,"Kappa":922,"Lambda":923,"Mu":924,"Nu":925,"Xi":926,"Omicron":927,
      "Pi":928,"Rho":929,"Sigma":931,"Tau":932,"Upsilon":933,"Phi":934,"Chi":935,"Psi":936,"Omega":937,
      "alpha":945,"beta":946,"gamma":947,"delta":948,"epsilon":949,"zeta":950,"eta":951,"theta":952,
      "iota":953,"kappa":954,"lambda":955,"mu":956,"nu":957,"xi":958,"omicron":959,"pi":960,"rho":961,
      "sigmaf":962,"sigma":963,"tau":964,"upsilon":965,"phi":966,"chi":967,"psi":968,"omega":969,
      "thetasym":977,"upsih":978,"piv":982,"ensp":8194,"emsp":8195,"thinsp":8201,"zwnj":8204,"zwj":8205,
      "lrm":8206,"rlm":8207,"ndash":8211,"mdash":8212,"lsquo":8216,"rsquo":8217,"sbquo":8218,"ldquo":8220,
      "rdquo":8221,"bdquo":8222,"dagger":8224,"Dagger":8225,"bull":8226,"hellip":8230,"permil":8240,
      "prime":8242,"Prime":8243,"lsaquo":8249,"rsaquo":8250,"oline":8254,"frasl":8260,"euro":8364,
      "image":8465,"weierp":8472,"real":8476,"trade":8482,"alefsym":8501,"larr":8592,"uarr":8593,
      "rarr":8594,"darr":8595,"harr":8596,"crarr":8629,"lArr":8656,"uArr":8657,"rArr":8658,"dArr":8659,
      "hArr":8660,"forall":8704,"part":8706,"exist":8707,"empty":8709,"nabla":8711,"isin":8712,
      "notin":8713,"ni":8715,"prod":8719,"sum":8721,"minus":8722,"lowast":8727,"radic":8730,"prop":8733,
      "infin":8734,"ang":8736,"and":8743,"or":8744,"cap":8745,"cup":8746,"int":8747,"there4":8756,"sim":8764,
      "cong":8773,"asymp":8776,"ne":8800,"equiv":8801,"le":8804,"ge":8805,"sub":8834,"sup":8835,"nsub":8836,
      "sube":8838,"supe":8839,"oplus":8853,"otimes":8855,"perp":8869,"sdot":8901,"lceil":8968,"rceil":8969,
      "lfloor":8970,"rfloor":8971,"lang":9001,"rang":9002,"loz":9674,"spades":9824,"clubs":9827,"hearts":9829,
      "diams":9830
    }

    var entity_rx = new RegExp("&("+Object.keys(entities).join('|')+");|&#([0-9]+);|&x([0-9a-fA-F]+);","g")

    /* Internal Called when processing entities */
    HTMLParser.prototype.processEntities = function(value, start){
      if(typeof value != 'string') value = new String(value)

      return value.replace(entity_rx, function(m, name, num, hex, off){
        if(name !== undefined){
          if(!(name in entities)){
            this.error('Entity not found &'+m, start + off)
            return m
          }
          return String.fromCharCode(entities[name])
        }
        else if(num !== undefined){
          return String.fromCharCode(parseInt(num))
        }
        else if(hex !== undefined){
          return String.fromCharCode(parseInt(hex, 16))
        }
      })
    }

    /**
     * @method parse
     * Parse an XML/HTML document, returns JS object structure that looks like this
     * The implemented object serialization has one limitation: dont use attributes named
     * 'tag' and 'child' and dont use tags starting with $sign: <$tag>
     * You cant use the attribute name 'tag' and 'child'
     * each node is a JSON-stringifyable object
     * the following XML
     *
     * <tag attr='hi'>mytext</tag>
     *
     * becomes this JS object:
     * { 
     *   tag:'$root'
     *   child:[{
     *     tag:'mytag'
     *     attr:'hi'
     *     child:[{
     *       tag:'$text'
     *       value:'mytext'
     *     }]
     *   }]
     * }
     *
     * @param {String} input XML/HTML
     * @return {Object} JS output structure
     * this.errors[] is array of [errormsg,erroroffset,errormsg,erroroffset]
     * You will always get the JS object as far as it managed to parse
     * So check parserobj.errors.length after for errorhandling
     *
     */
    HTMLParser.prototype.parse = function(source){
      // lets create some state
      var root = this.node = this.createNode('$root',0)

      this.errors = []
      this.parents = []
      this.last_attr = undefined
      this.tagname = ''

      if(typeof source != 'string') source = source.toString()
      var len = source.length
      var pos = 0
      var start = pos
      while(pos < len){
        var ch = source.charCodeAt(pos++)
        if(ch == 60){ // <
          var next = source.charCodeAt(pos)
          if(next == 32 || next == 9 || next == 10 || next == 12 || next ==  37 || 
            next == 40 || next == 41 || next == 45 || 
            next == 35 || next == 36 || next == 92 || next == 94 || 
            (next >=48 && next <= 57)) continue
          // lets emit textnode since last
          if(start != pos - 1) this.onText(source.slice(start, pos - 1), start, pos - 1)
          if(next == 33){ // <!
            after = source.charCodeAt(pos+1)
            if(after == 45){ // <!- comment
              pos += 2
              while(pos < len){
                ch = source.charCodeAt(pos++)
                if(ch == 45 && source.charCodeAt(pos) == 45 &&
                    source.charCodeAt(pos + 1) == 62){
                  pos += 2
                  this.onComment(source.slice(start, pos - 3), start - 4, pos)
                  break
                }
                else if(pos == len) this.error("Unexpected end of files while reading <!--", start)
              }
              start = pos
              continue
            }
            if(after == 91){ // <![ probably followed by CDATA[ just parse to ]]>
              pos += 8
              start = pos
              while(pos < len){
                ch = source.charCodeAt(pos++)
                if(ch == 93 && source.charCodeAt(pos) == 93 &&
                    source.charCodeAt(pos + 1) == 62){
                  pos += 2
                  this.onCDATA(source.slice(start, pos - 3), start - 8, pos)
                  break
                }
                else if(pos == len) this.error("Unexpected end of file while reading <![", start)
              }
              start = pos
              continue
            }
          }
          if(next == 63){ // <? command
            pos++
            start = pos
            while(pos < len){
              ch = source.charCodeAt(pos++)
              if(ch == 63 && source.charCodeAt(pos) == 62){
                pos++
                this.onProcess(source.slice(start, pos - 2), start - 1, pos)
                break
              }
              else if(pos == len) this.error("Unexpected end of file while reading <?", start)
            }
            start = pos
            continue
          }
          if(next == 47){ // </ closing tag
            start = pos + 1
            while(pos < len){
              ch = source.charCodeAt(pos++)
              if(ch == 62){
                this.onClosingTag(source.slice(start, pos - 1), start, pos)
                break
              }
              else if(pos == len) this.error("Unexpected end of file at </"+source.slice(start, pos), start)
            }
            start = pos
            continue
          }
          
          start = pos // try to parse a tag
          var tag = true // first name encountered is tagname
          while(pos < len){
            ch = source.charCodeAt(pos++)
            // whitespace, end of tag or assign
            // if we hit a s
            if(ch == 62 || ch == 47 || ch == 10 || ch == 12 || ch ==32 || ch == 61){
              if(start != pos - 1){
                if(tag){ // lets emit the tagname
                  this.onTagBegin(source.slice(start, pos - 1), start - 1, pos)
                  tag = false
                }// emit attribute name
                else this.onAttrName(source.slice(start, pos - 1), start, pos)
              }
              start = pos
              if(ch == 62){ // >
                this.onTagEnd(pos)
                break
              }
              else if(ch == 47 && source.charCodeAt(pos) == 62){ // />
                pos++
                this.onImmediateClosingTag(pos)
                break
              }
            }
            else if(ch == 34 || ch == 39){ // " or '
              start = pos
              var end = ch
              while(pos < len){
                ch = source.charCodeAt(pos++)
                if(ch == end){
                  this.onAttrValue(source.slice(start, pos - 1), start, pos)
                  break
                }
                else if(pos == len) this.error("Unexpected end of file while reading attribute", start)
              }
              start = pos
            }
            else if(ch == 60) this.error("Unexpected < while parsing a tag", start)
          }
          start = pos
        }
      }
      if(this.parents.length) this.error("Missign closing tags at end", pos)
      return root
    }

    return HTMLParser
  })()
})