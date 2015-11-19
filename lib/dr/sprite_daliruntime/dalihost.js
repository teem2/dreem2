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

// dalihost.js  Wrapper for dali


define(function(require, exports, module) {
    var fs = require('fs');
    var url = require('url');
    var http = require('http');
    var path = require('path');

    var dalihost = {}

    dalihost.init = function() {
        console.log("clear!");
        dali.stage.setBackgroundColor([1, 1, 1, 1]);
        this.defaultimage = new dali.ResourceImage({
            url: "./lib/dr/sprite_daliruntime/1x1.png"
        });
        // LoadedFonts maps stylestrings to preloaded fonts. 
        // Todo: refcount after unload to free up some memory.. might be needed for font-swap-heavy apps.
        this.LoadedFonts = {};
        // Load a font to a texture. 
        this.LoadFont = function(fontoptions) {
            var name = fontoptions.family + "_" + fontoptions.style + "_" + fontoptions.pointSize.toString();
            if (this.LoadedFonts[name] == undefined) {
                this.LoadedFonts[name] = new dali.Font(fontoptions);
            }
            return this.LoadedFonts[name];
        };
        // map to link GUIDs to view-container reference
        this.ActorMap = {};
        // global GUID counter
        this.GUIDCounter = 0;
        // grab a GUID string
        this.GetGUID = function() {
            this.GUIDCounter++;
            return "GUID" + this.GUIDCounter;
        };
        // Create a new instance of a view-shader. 
        // Todo: currently uniforms are set on a shader, not on an instance.. so every time a new instance is spawned a new shader gets compiled... this is generally bad style.
        this.CreateShader = function(dotted) {
            if (dotted == undefined) dotted = false;
            var fragShader = "uniform lowp vec4 BorderColor; \
            uniform lowp vec4 CenterColor; \
            uniform lowp float width; \
            uniform lowp float borderwidth; \
            uniform lowp float height; \
            uniform lowp float radius; \
            \
            lowp float checker(lowp vec2 texc)\
            {\
                if (mod((mod(texc.x,15.0)>7.5?1.0:0.0) +  (mod(texc.y,15.0)>7.5?1.0:0.0),2.0) > 0.9)\
                    return 1.0;\
                else\
                    return 0.0;\
            }\
            \
            lowp float udRoundBox(lowp vec2 p, lowp float left, lowp float top, lowp float width, lowp float height, lowp float radius)\
            {\
                lowp vec2 rad2 = vec2(radius,radius);\
                lowp vec2 hwh = vec2(.5*width, .5*height);\
                lowp vec2 xy = vec2(left, top);\
                lowp float D = (length(max(abs(p - xy - hwh) - (hwh - 2. * rad2), 0.0)) - 2. * radius);\
                D-=1.0;\
                return max(min(1.0, -D*1.0), 0.0);\
            }\
            \
            void main()             \
            {                  \
                lowp vec2 pixpos = vec2(vTexCoord.x * width , vTexCoord.y * height);\
                lowp float outside =udRoundBox(pixpos, 0.0, 0.0, width, height, radius) ;\
                lowp float inside = udRoundBox(pixpos, borderwidth, borderwidth, (width-borderwidth*2.0  ) , height-borderwidth*2.0,max(0.0, radius-borderwidth )) ;"
            if (dotted) {
                fragShader += "lowp float check = checker(pixpos);\
                               gl_FragColor = mix(CenterColor, BorderColor, (1.0-inside)*check) * outside;"
            } else {
                fragShader += "gl_FragColor = mix(CenterColor, BorderColor, (1.0-inside)) * outside;"
            }
            fragShader += "gl_FragColor.a *= outside;}"
            var shaderOptions = {
                geometryType: "image",
                fragmentShader: fragShader
            };
            var shader = new dali.ShaderEffect(shaderOptions);
            shader.setUniform("BorderColor", [0.4, 0.4, 0.0, 1.0]);
            shader.setUniform("CenterColor", [1.0, 1.0, 1.0, 0.87]);
            return shader;
        };

        this.DeleteView = function(view) {
            dali.stage.remove(view.rectactor);
            dali.stage.remove(view.textactor);
            view.rectactor = null;
            view.textactor = null;
            delete this.ActorMap[view.GUID];
        };

        this.resolveResourceFile =  function(filename) {
            console.log(filename);
            return filename;
//            return "./compositions/" + filename;            
        };

        

        this.CreateView = function(x, y, width, height) {
            // Remove loading page if on-screen.
            if (global.loading_page) {
                global.remove_loading_page();
            }

            var radius = 3;
            var borderwidth = 3;
            var bordercolor = [0, 0, 0, 0];
            var centercolor = [1, 1, 1, 0];
            var R = {};

            // Emulate mkdirp (rather than adding a new npm reference).
            // See: http://stackoverflow.com/questions/13696148/node-js-create-folder-or-use-existing
            R.mkdirSync = function (path) {
                try {
                    fs.mkdirSync(path);
                } catch(e) {
                    if ( e.code != 'EEXIST' ) throw e;
                }
            }
            R.mkdirp = function (dirpath) {
                var parts = dirpath.split(path.sep);
                // The last part is the file name, so skip this
                for( var i = 1; i < parts.length; i++ ) {
                    var d = path.join.apply(null, parts.slice(0, i));
                    //console.log("CALLING mkdirp on ", d);
                    this.mkdirSync(d);
                }
            }
        
            // Retrieve an url and store it in the cache. Return localref
            R.retrieveUrl = function(uri, callback) {
                var localref = './img/default.png';
                var p0 = uri.indexOf('//');
                if (p0 >= 0) {
                    localref = './dalicache/resources/' + uri.slice(p0+2).replace(/\//g, '_').replace(/:/g, '_');
                    this.mkdirp(localref);
                }
        
        
                // Check the cache
                if (fs.existsSync(localref)) {
                    console.log('Returned cached resource', localref);
                    return localref;
                }
    
                // Fetch the url and store it
                try {
                    var parsed = url.parse(uri);
                    
                    // The hostname needs to be updated if the server is running
                    // localhost. Our machine will interpret localhost as the dali
                    // machine and NOT the dreem server.
                    var hostname = parsed.hostname;
                    if (hostname.indexOf('localhost') >= 0 || hostname.indexOf('127.0.0.1') >= 0) {
                        server_hostname = url.parse(define.ROOTSERVER).hostname;
                        uri = uri.replace(hostname, server_hostname);
                    }
                    
                    var fp = fs.createWriteStream(localref);
                    var req = http.get(uri, function(resp) {
                        resp.pipe(fp);
                        fp.on('finish', function() {
                            fp.close();
                            if (callback) callback(localref);
                        });
                    }).on('error', function(err) { // Handle errors
                        //console.log('ERROR DURING FETCH', err);
                        fs.unlink(localref);
                        if (callback) callback('./lib/dr/sprite_daliruntime/1x1.png');
                    });
                }
                catch (e) {
                    //console.log('EXCEPTION', e);
                }
                
                return undefined; // Signal that the file has not loaded
            }


            // Given a filename, determine if the resource is local or not.
            // If the resource is not local (ie. it does not exist), attempt
            // to retrieve the resource from an url, or the server, and store
            // it in the cache.
            R.retrieveResource = function(filename, callback) {
                var localref = filename;
                
                if (localref.indexOf('http') == 0) {
                    localref = this.retrieveUrl(localref, callback);
                    return localref;
                }
                else {
                    // Server resource. Remove any preview references
                    localref = define.ROOTSERVER + filename; // COMPOSITIONROOT + filename;
                    localref = localref.replace(/preview\//g, '');
                    localref = this.retrieveUrl(localref, callback);
                    return localref;
                }
            }
            
            R.resolveResourceFile = function(filename, callback){
                var localref = this.retrieveResource(filename, callback);
                return localref;
            }
            
            R.bitmaploaded = function(){
                console.log("loaded");
            }
            
            R.loadBitmap = function(filename){
                var callback = function(path) {this.addBitmap(path)}.bind(this);
                var resolvedimage = this.resolveResourceFile(filename, callback);
                
                if (resolvedimage) {
                    this.addBitmap(resolvedimage);
                }
            };
            
            // addBitmap was extracted from loadBitmap so it can be used as
            // a callback method.
            R.addBitmap = function(resolvedimage){
                this.unloadBitmap();
                
                this.bitmapresource = new dali.ResourceImage({
                    url: resolvedimage
                });
                //this.bitmapresource.connect("image-loading-finished", function(){ console.log("hello")});
                this.bitmapactor = new dali.ImageActor(); 
                this.bitmapactor.setImage(this.bitmapresource);            
                
                this.insideactor.add(this.bitmapactor);

                //this.bitmapactor.size = [100,100,100];
                this.bitmapactor.parentOrigin = dali.TOP_LEFT;
                this.bitmapactor.anchorPoint = dali.TOP_LEFT;
                this.updateBitmapActorScale();
            };

            R.updateBitmapActorScale  = function(){
                var h = this.bitmapresource.getHeight();
                var w = this.bitmapresource.getWidth();

                var sh = this.calculatedsize[1];
                var sw = this.calculatedsize[0];

                sh -= this.borderwidth * 2;
                sw -= this.borderwidth * 2;

                
                this.bitmapactor.scale = [sw/w,sh/h,1];

            }
            R.unloadBitmap = function() {
                if (this.bitmapactor) {
                   this.insideactor.remove(this.bitmapactor)
                }
            };


            R.daliparent = this;
            R.GUID = this.GetGUID();
            this.ActorMap[R.GUID] = R;
            R.borderwidth = 0;
            R.paddingleft = 0;
            R.paddingright = 0;
            R.paddingtop = 0;
            R.xanchor = "center";
            R.yanchor = "center";
            R.zanchor = "center";
            R.paddingbottom = 0;
            R.fontFamily = "Arial";
            R.fontSize = 20; // points
            R.fontStyle = "";
            R.fontColor = [0, 0, 0, 1];
            R.scale = [1, 1, 1];
            R.containingactor = new dali.Actor();
            R.rectshader = this.CreateShader();
            R.lastsetsize = ["auto", "auto"];
            R.children = [];
            R.parent = undefined;
            R.rectactor = new dali.ImageActor();
            R.rectactor.name = R.GUID;
            R.insideactor = new dali.Actor();
            R.insideactor.name = R.GUID;
            R.rectactor.setImage(this.defaultimage);
            R.insideactor.anchorPoint = dali.TOP_LEFT;
            R.insideactor.parentOrigin = dali.TOP_LEFT;
            R.insideactor.position = [R.paddingbottom + borderwidth, R.paddingtop + borderwidth, 0.6];
            R.insideactor.size = [width - R.paddingleft - R.paddingright - borderwidth * 2, height - R.paddingtop - R.paddingbottom - borderwidth * 2, 1];
            R.containingactor.anchorPoint = dali.TOP_LEFT;
            R.containingactor.parentOrigin = dali.TOP_LEFT;
            R.containingactor.position = [x, y, 0.6];
            R.containingactor.size = [1, 1, 1];
            R.rectshader.setUniform("width", width);
            R.rectshader.setUniform("height", height);
            R.rectshader.setUniform("radius", radius);
            R.rectshader.setUniform("borderwidth", borderwidth);
            R.rectshader.setUniform("BorderColor", bordercolor);
            R.rectshader.setUniform("CenterColor", centercolor);
            R.rectactor.setShaderEffect(R.rectshader);
            R.rectactor.setBlendMode(dali.BLENDING_ON);
            R.rectactor.add(R.insideactor);
            R.containingactor.add(R.rectactor);
            dali.stage.add(R.containingactor);
            R.rectactor.size = [width, height, 1];
            R.rectactor.anchorPoint = dali.TOP_LEFT;
            R.rectactor.parentOrigin = dali.TOP_LEFT;
            R.rectactor.position = [0, 0, 1];
            // - containingactor  (has translation anchor)
            //      - rectactor (has rotation and other transform anchor)
            //          - insideactor (has padding offset)
            //              - textactor
            //              - children
            R.insideactor.drawMode = "OVERLAY_2D";
            R.rectactor.drawMode = "OVERLAY_2D";
            R.containingactor.drawMode = "OVERLAY_2D";
            R.getBoundingClientRect = function() {
                var M = this.minimalSize();
                return {
                    width: M.right,
                    height: M.bottom
                };
            }
            R.addChild = function(c) {
                if (c.parent != undefined) {
                    c.parent.removeChild(c);
                }
                c.parent = this;
                this.children.push(c);
                this.insideactor.add(c.containingactor);
            }
            R.removeChild = function(c) {
                if (c.parent === this) {
                    var index = this.children.indexOf(c);
                    if (index > -1) {
                        this.children.splice(index, 1);
                        this.insideactor.remove(c.containingactor);
                    }
                }
            }
            R.addActorBounds = function(bounds, actor) {
                if (actor == undefined) return bounds;
                var naturalsize = actor.getNaturalSize()
                var left = actor.positionX;
                var right = left + naturalsize.x;
                var top = actor.positionY;
                var bottom = top + naturalsize.y;
                bounds.left = Math.min(bounds.left, left);
                bounds.right = Math.max(bounds.right, right);
                bounds.top = Math.min(bounds.top, top);
                bounds.bottom = Math.max(bounds.bottom, bottom);
                return bounds;
            }
            R.minimalSize = function(inbounds) {
                var bounds = {};
                if (inbounds != undefined) {
                    bounds = inbounds;
                } else {
                    bounds.left = 0;
                    bounds.top = 0;
                    bounds.right = 0;
                    bounds.bottom = 0;
                }
                if (this.rectactor) {
                    bounds = this.addActorBounds(bounds, this.rectactor)
                }
                if (this.textactor) {
                    bounds = this.addActorBounds(bounds, this.textactor)
                }
                for (var a in this.children) {
                    bounds = this.children[a].minimalSize(bounds);
                }
                return bounds;
            }
            R.setSize = function(width, height) {
                if (width == undefined) width = 0;
                if (height == undefined) height = 0;
                this.lastsetsize = [width, height];
                var size = this.minimalSize();
                if (width.toString().indexOf('%') > -1) {
                    console.log("width is percentage of parent!");
                }
                if (height.toString().indexOf('%') > -1) {
                    console.log("height is percentage of parent!");
                }
                if (width == 'auto') {
                    this.autowidth = true;
                    width = size.right - size.left;
                } else {
                    this.autowidth = false;
                }
                if (height == 'auto') {
                    this.autoheight = true;
                    height = size.bottom - size.top;
                } else {
                    this.autoheight = false;
                }
                if (width == 0) width = 1;
                if (height == 0) height = 1;
                var newrectanch = [0, 0, 0];
                var newrectpos = [0, 0, 0];
                this.rectactor.size = [width, height, 1];
                if (this.yanchor == "center") {
                    newrectpos[1] = height / 2;
                    newrectanch[1] = dali.CENTER[1];
                }
                if (this.yanchor == "top") {
                    newrectpos[1] = 0;
                    newrectanch[1] = dali.TOP_LEFT[1];
                }
                if (this.yanchor == "bottom") {
                    newrectpos[1] = height;
                    newrectanch[1] = dali.BOTTOM_RIGHT[1];
                }
                if (this.xanchor == "left") {
                    newrectpos[0] = 0;
                    newrectanch[0] = dali.TOP_LEFT[0];
                }
                if (this.xanchor == "center") {
                    newrectpos[0] = width / 2;
                    newrectanch[0] = dali.CENTER[0];
                }
                if (this.xanchor == "right") {
                    newrectpos[0] = width;
                    newrectanch[0] = dali.BOTTOM_RIGHT[0];
                }
                if (this.textactor) {
                    this.textactor.size = this.rectactor.size;
                }
                this.rectactor.position = newrectpos;
                this.rectactor.anchorPoint = newrectanch;
                this.rectshader.setUniform("width", width);
                this.rectshader.setUniform("height", height);
                this.calculatedsize = [width, height];
                if (this.bitmapactor){
                    this.updateBitmapActorScale();
                }
                this.updateInside();
            }
            R.setAnchor = function(xan, yan, zan) {
                this.xanchor = xan;
                this.yanchor = yan;
                this.zanchor = zan;
                this.setSize(this.lastsetsize[0], this.lastsetsize[1]);
            }
            R.setPadding = function(p) {
                this.paddingleft = p;
                this.paddingright = p;
                this.paddingtop = p;
                this.paddingbottom = p;
                this.setSize(this.lastsetsize[0], this.lastsetsize[1]);
            }
            R.setPaddingTop = function(p) {
                this.paddingtop = p;
                this.setSize(this.lastsetsize[0], this.lastsetsize[1]);
            }
            R.setPaddingBottom = function(p) {
                this.paddingbottom = p;
                this.setSize(this.lastsetsize[0], this.lastsetsize[1]);
            }
            R.setPaddingLeft = function(p) {
                this.paddingleft = p;
                this.setSize(this.lastsetsize[0], this.lastsetsize[1]);
            }
            R.setPaddingRight = function(p) {
                this.paddingright = p;
                this.setSize(this.lastsetsize[0], this.lastsetsize[1]);
            }
            R.updateInside = function() {
                this.insideactor.position = [this.paddingbottom + this.borderwidth, this.paddingtop + this.borderwidth, 0.6];
                var insidesize = [this.calculatedsize[0] - this.paddingleft - this.paddingright - this.borderwidth * 2, this.calculatedsize[1] - this.paddingtop - this.paddingbottom - this.borderwidth * 2, 1];;
                if (insidesize[0] < 1) insidesize[0] = 1;
                if (insidesize[1] < 1) insidesize[1] = 1;
                this.insideactor.size = insidesize;
                //      console.log(insidesize);
            }
            R.setPosition = function(x, y) {
                if (x == undefined) x = 0;
                if (y == undefined) y = 0;
                this.containingactor.position = [Math.floor(x), Math.floor(y), 0];
            }
            R.setCornerRadius = function(radius) {
                this.rectshader.setUniform("radius", radius);
            }
            R.setBackgroundColor = function(color) {
                this.rectshader.setUniform("CenterColor", color);
            }
            R.setBorderColor = function(color) {
                this.rectshader.setUniform("BorderColor", color);
            }
            R.setScale = function(xscale, yscale) {
                this.scale[0] = xscale;
                this.scale[1] = yscale;
                this.scale[2] = 1.0;
                this.rectactor.scale = this.scale;
            }
            R.setXScale = function(xscale) {
                this.scale[0] = xscale;
                this.rectactor.scale = this.scale;
            }
            R.setYScale = function(xscale) {
                this.scale[1] = xscale;
                this.rectactor.scale = this.scale;
            }
            R.setZScale = function(xscale) {
                this.scale[2] = xscale;
                this.rectactor.scale = this.scale;
            }
            R.setRotation = function(angle) {
                this.angle = angle;
                this.rectactor.orientation = new dali.Rotation(0, 0, angle);
            }
            R.setBorderWidth = function(width) {
                this.borderwidth = width;
                this.rectshader.setUniform("borderwidth", width);
                this.updateInside();
            }
            R.rebuildText = function() {
                var fontInfo = {
                        family: this.fontFamily,
                        style: this.fontStyle,
                        pointSize: this.fontSize / (dali.stage.getDpi().x / 72)
                    }
                    //var FontObj = this.daliparent.LoadFont(fontInfo);
                var textOptions = {
                    //  font: FontObj,
                    isRightToLeft: false,
                    fontDetection: true // default is true
                }
                if (!this.fontsize) this.fontsize = 20;
                var t1 = new dali.Control("TextField");
                t1.widthResizePolicy = "USE_NATURAL_SIZE";
                t1.heightResizePolicy = "USE_NATURAL_SIZE";
                t1.text = this.text? this.text:"";
                t1.textColor = this.fontColor;
                t1.pointSize = 1.0 * this.fontsize / (dali.stage.getDpi().x / 72.0);
                t1.anchorPoint = dali.TOP_LEFT;
                t1.parentOrigin = dali.TOP_LEFT;
                t1.position = [0, 0, 1];
                t1.name = this.GUID;
                t1.fontFamily = this.fontFamily;
                //t1.sizeMode = dali.USE_OWN_SIZE;
                //t1.HorizontalAlignment = "BEGIN";
                
                this.insideactor.add(t1);
                this.textactor = t1;
                this.setSize(this.lastsetsize[0], this.lastsetsize[1]);
                this.updateInside();
                
                 }
            R.setFontColor = function(newcolor) {
                this.fontColor = newcolor;
                if (this.textactor) {
                    this.textactor.textColor = newcolor;
                }
            }
            R.setFontFamily = function(font) {
                this.fontFamily = font;
                this.rebuildText();
            }
            R.setFontSize = function(newsize) {
                //console.log("new fontsize:", newsize);
                // If 'px' is found, convert to points
                this.fontsize = newsize * 1.0;
                if (typeof newsize === 'string' && newsize.indexOf('px')) {
                    this.fontsize *= 0.75; // 12 pt = 16 px;
                }

                this.rebuildText();
            }
            R.setText = function(text) {
                
                if (text == undefined) text = '';
                this.text = text;
                if (this.textactor == undefined) this.rebuildText();
                //this.textactor.text = text;
            }
            R.ClickCallbackCatch = function(source, val) {
                log(source.name);
                var target = this.ActorMap[source.name];
                if (target === undefined) {
                    log("click on undefined actor!\n");
                    return false;
                }
                target.ClickCallback(source, val);
                return true;
            }
            R.setClickable = function(callback) {
                this.ClickCallback = callback;
                this.rectactor.connect("touched", this.ClickCallbackCatch);
            }
            this.setMouseover = function(callback) {
                this.rectactor.connect("hovered", callback);
            }
            R.setTopBorderWidth = function(width) {};
            R.setLeftBorderWidth = function(width) {};
            R.setBottomBorderWidth = function(width) {};
            R.setRightBorderWidth = function(width) {};
            R.setBorderColorUniform = function(prefix, color) {};
            R.setTopBorderColor = function(color) {
                this.setBorderColorUniform("top", color);
            };
            R.setLeftBorderColor = function(color) {
                this.setBorderColorUniform("top", color);
            };
            R.setBottomBorderColor = function(color) {
                this.setBorderColorUniform("top", color);
            };
            R.setRightBorderColor = function(color) {
                this.setBorderColorUniform("top", color);
            };
            R.setBorderStyleUniform = function(prefix, style) {};
            R.setTopBorderStyle = function(style) {
                this.setBorderStyleUniform("top", style);
            };
            R.setLeftBorderStyle = function(style) {
                this.setBorderStyleUniform("left", style);
            };
            R.setBottomBorderStyle = function(style) {
                this.setBorderStyleUniform("bottom", style);
            };
            R.setRightBorderStyle = function(style) {
                this.setBorderStyleUniform("right", style);
            };
            R.setCornerRadiusUniform = function(prefix, radius) {};
            R.setTopLeftCornerRadius = function(radius) {
                this.setCornerRadiusUniform("topleft", radius);
            };
            R.setBottomLeftCornerRadius = function(radius) {
                this.setCornerRadiusUniform("bottomleft", radius);
            };
            R.setTopRightCornerRadius = function(radius) {
                this.setCornerRadiusUniform("topright", radius);
            };
            R.setBottomRightCornerRadius = function(radius) {
                this.setCornerRadiusUniform("bottomright", radius);
            };
            // not sure if this should be handled here or by the unified view logic? probably better there... 
            R.setPadding = function(padding) {};
            R.setLeftPadding = function(padding) {};
            R.setRightPadding = function(padding) {};
            R.setBottomPadding = function(padding) {};
            R.setTopPadding = function(padding) {};
            return R;
        };
    }
    return dalihost;
})
