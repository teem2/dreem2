define(function (require, exports, module) {
	 
	var dalihost = {}
	dalihost.init = function(){
		console.log("clear!");
		dali.stage.setBackgroundColor( [0.8,0.8,1,1 ] );
		this.defaultimage = new dali.ResourceImage({url: "./lib/dr/sprite_daliruntime/1x1.png"});

		// LoadedFonts maps stylestrings to preloaded fonts. 
		// Todo: refcount after unload to free up some memory.. might be needed for font-swap-heavy apps.
		this.LoadedFonts = {};

		// Load a font to a texture. 
		this.LoadFont= function(fontoptions)
		{
			var name = fontoptions.family + "_" + fontoptions.style+"_" + fontoptions.pointSize.toString();
			if (this.LoadedFonts[name] == undefined) 
			{
				this.LoadedFonts[name] =  new dali.Font( fontoptions );	
			}
			return this.LoadedFonts[name];
		};

		// map to link GUIDs to view-container reference
		this.ActorMap = {};

		// global GUID counter
		this.GUIDCounter = 0;

		// grab a GUID string
		this.GetGUID = function ()
		{
			this.GUIDCounter++;
			return "GUID" + this.GUIDCounter;
		};

		// Create a new instance of a view-shader. 
		// Todo: currently uniforms are set on a shader, not on an instance.. so every time a new instance is spawned a new shader gets compiled... this is generally bad style.
		this.CreateShader = function(dotted)
		{
			if (dotted == undefined) dotted = false;
			var fragShader =
			"uniform lowp vec4 BorderColor; \
			uniform lowp vec4 CenterColor; \
			uniform lowp float width; \
			uniform lowp float borderwidth; \
			uniform lowp float height; \
			uniform lowp float radius; \
			\
			lowp float checker(lowp vec2 texc)\
			{\
				if (mod((mod(texc.x,15.0)>7.5?1.0:0.0) +  (mod(texc.y,15.0)>7.5?1.0:0.0),2) > 0.9)\
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
				lowp float D = (length(max(abs(p - xy - hwh) - (hwh - 2. * rad2), 0.)) - 2. * radius);\
				D-=1.0;\
				return max(min(1.0, -D*1.0), 0.0);\
			}\
			\
			void main()             \
			{                  \
				lowp vec2 pixpos = vec2(vTexCoord.x * width , vTexCoord.y * height);\
				lowp float outside =udRoundBox(pixpos, 0.0, 0.0, width, height, radius) ;\
				lowp float inside = udRoundBox(pixpos, borderwidth, borderwidth, width-borderwidth*2.0, height-borderwidth*2.0,max(1, radius-borderwidth/2.0)) ;"  

			if (dotted)
			{
				fragShader += "lowp float check = checker(pixpos);\
							   gl_FragColor = mix(CenterColor, BorderColor, (1.0-inside)*check) * outside;"
			}
			else
			{
				fragShader += "gl_FragColor = mix(CenterColor, BorderColor, (1.0-inside)) * outside;"
			}
			
			fragShader += "gl_FragColor.a *= outside;}"
		  
			var shaderOptions = 	
			{
				geometryType: "image",
				fragmentShader: fragShader
			};
		  
			var shader = new dali.ShaderEffect(shaderOptions);
		  
			shader.setUniform("BorderColor", [0.4, 0.4, 0.0, 1.0]);
			shader.setUniform("CenterColor", [1.0, 1.0, 1.0, 0.87]);
			return shader;
		};

		
		this.DeleteView = function(view)
		{
			dali.stage.remove(view.rectactor);
			dali.stage.remove(view.textactor);
			view.rectactor = null;
			view.textactor = null;
			delete this.ActorMap[view.GUID];
		};

		this.ViewRect =  function(thehost, rectactor, rectshader)
		{
			
			var R = {};
			R.daliparent = thehost;
			R.GUID = this.GetGUID();

			this.ActorMap[R.GUID] = R;
			R.fontFamily = "Arial";
			R.fontSize = 10;
			R.fontStyle = "";
			R.fontColor = [0,0,0,1];
			R.rectactor = rectactor;
			R.rectactor.name = R.GUID;
			R.rectshader = rectshader;
			
			R.children = [];
			R.parent = undefined;
			R.getBoundingClientRect = function(){
				var M = this.minimalSize();
				return {width:M.right, height: M.bottom};
			}

			R.addChild = function(c) {
				if (c.parent != undefined)
				{
					c.parent.removeChild(c);
				}
				c.parent = this;
				this.children.push(c);		
				this.rectactor.add(c.rectactor);
			}

			R.removeChild = function(c)
			{
				if (c.parent === this)
				{
					var index = this.children.indexOf(c);

					if (index > -1) 
					{
						this.children.splice(index, 1);		
						this.rectactor.remove(c.rectactor);	
					}
				}
			}
			
			R.addActorBounds = function(bounds, actor)
			{
				if (actor == undefined) return bounds;
				
				var left = actor.positionX;
				var right = left + actor.sizeWidth;
				var top = actor.positionY;
				var bottom = top + actor.sizeHeight;
				
				bounds.left = Math.min(bounds.left, left);
				bounds.right = Math.max(bounds.right, right);
				bounds.top = Math.min(bounds.top, top);
				bounds.bottom = Math.max(bounds.bottom, bottom);
				
				return bounds;
			}			
			
			R.minimalSize = function(inbounds)
			{
				var bounds  = {};
				if (inbounds != undefined)
				{
					bounds = inbounds;
				}
				else
				{
					bounds.left = 0;
					bounds.top = 0;
					bounds.right = 0;
					bounds.bottom = 0;
				}
				
				if (this.rectactor)
				{
					bounds = this.addActorBounds(bounds, this.rectactor)
				}
				
				if (this.textactor)
				{
					var S = this.textactor.size;
					console.log(this.textactor.sizeWidth);
					console.log(this.textactor.sizeHeight);
					bounds = this.addActorBounds(bounds, this.textactor)					
				}
					
				for (var a in this.children)
				{
					bounds = this.children[a].minimalSize(bounds);					
				}
				if (this.textactor)
				{
						console.log("minimal size for node containing textactor:", bounds)
				}
				return bounds;
			}
			
			R.setSize = function(width, height)
			{	
				if (width == undefined) width = 0;
				if (height == undefined) height = 0;
				
				var size = this.minimalSize();
				if (width.toString().indexOf('%')>-1){
					console.log("width is percentage of parent!");
				}
				if (height.toString().indexOf('%')>-1){
					console.log("height is percentage of parent!");
				}

				if (width == 'auto')
				{
					console.log("incoming size: ", width, height);
				//	console.log(" size: " + JSON.stringify(size));
					width = size.right - size.left;
				}
				
				if (height == 'auto')
				{
					console.log("incoming size: ", width, height);
				//	console.log(" size: " + JSON.stringify(size));
					height = size.bottom-size.top;
				}
				
				if (width == 0) width = 1; 
				if (height == 0) height = 1; 
				this.rectactor.size = [ width, height,1];
				if (this.textactor)
				{
					this.textactor.size = this.rectactor.size;
				}

				//console.log("size: ",width, height);
				this.rectshader.setUniform("width" , width);
				this.rectshader.setUniform("height" , height);	
			}

			R.setPosition = function(x,y)
			{
				if (x == undefined) x = 0;
				if (y == undefined) y = 0;				
				this.rectactor.position = [x,y,0];
			}

			R.setCornerRadius = function(radius)
			{
				this.rectshader.setUniform("radius" , radius);
			}

			R.setBackgroundColor = function(color)
			{
				this.rectshader.setUniform("CenterColor" , color);
			}

			R.setBorderColor = function(color)
			{
				this.rectshader.setUniform("BorderColor" , color);
			}	

			R.setRotation = function(angle)
			{
				this.angle = angle;
				this.rectactor.orientation = new dali.Rotation(0,0,angle * (3.1415*2)/360);
			}

			R.setBorderWidth = function(width)
			{
				this.rectshader.setUniform("borderwidth" , width);
			}
			
			R.rebuildText = function()
			{
				var fontInfo =
				{
					family: this.fontFamily,
					style: this.fontStyle,
					pointSize: this.fontSize
				}

				//var FontObj = this.daliparent.LoadFont(fontInfo);

				var textOptions =
				{
				//	font: FontObj,
					isRightToLeft: false,
					fontDetection: true       // default is true
				} 

				
				var t1 = new dali.Control("TextField");
				t1.widthResizePolicy = "USE_NATURAL_SIZE";	
				t1.heightResizePolicy = "USE_NATURAL_SIZE";
				t1.text = this.text;
				t1.textColor = this.fontColor;
				t1.anchorPoint = dali.TOP_LEFT;
				t1.parentOrigin = dali.TOP_LEFT;
				t1.positionZ = 1;
				t1.name = this.GUID;
				//t1.sizeMode = dali.USE_OWN_SIZE;
				//t1.HorizontalAlignment = "BEGIN";
			
				this.rectactor.add(t1);
				this.textactor = t1;
				
			}
			R.setFontColor = function(newcolor) {
				this.fontColor = newcolor;
				if (this.textactor){
				
					this.textactor.textColor = newcolor;

				}

			}
			R.setFontFamily = function(font)
			{
				this.fontFamily = font;
				this.rebuildText();
			}
			
			R.setFontSize = function(newsize)
			{
				this.fontsize = newsize;
				this.rebuildText();
			}
			
			R.setText = function(text)
			{	
				if (text == undefined) text = '';
				this.text = text;
				if (this.textactor == undefined)  this.rebuildText();
				this.textactor.text = text;	
			}

			R.ClickCallbackCatch = function(source, val)
			{
				log(source.name);
				var target = this.ActorMap[source.name];
				if (target === undefined)
				{
					log("click on undefined actor!\n");
					return false;
				}

				target.ClickCallback(source, val);
				return true;
			}

			R.setClickable = function(callback)
			{
				this.ClickCallback = callback;	
				this.rectactor.connect("touched", this.ClickCallbackCatch);
			}
			
			this.setMouseover = function(callback)
			{
				this.rectactor.connect("hovered",callback);
			}

			R.setTopBorderWidth = function(width){};
			R.setLeftBorderWidth = function(width){};
			R.setBottomBorderWidth = function(width){};
			R.setRightBorderWidth = function(width){};
			
			R.setBorderColorUniform = function(prefix, color){};
			R.setTopBorderColor = function(color){this.setBorderColorUniform("top", color);};
			R.setLeftBorderColor = function(color){this.setBorderColorUniform("top", color);};
			R.setBottomBorderColor = function(color){this.setBorderColorUniform("top", color);};
			R.setRightBorderColor = function(color){this.setBorderColorUniform("top", color);};
            
			R.setBorderStyleUniform = function(prefix, style){};
			R.setTopBorderStyle = function(style){this.setBorderStyleUniform("top", style);};
			R.setLeftBorderStyle = function(style){this.setBorderStyleUniform("left", style);};
			R.setBottomBorderStyle  = function(style){this.setBorderStyleUniform("bottom", style);};
			R.setRightBorderStyle   = function(style){this.setBorderStyleUniform("right", style);};
            
			R.setCornerRadiusUniform     = function(prefix, radius){};
			R.setTopLeftCornerRadius     = function(radius) {this.setCornerRadiusUniform("topleft", radius);};
			R.setBottomLeftCornerRadius  = function(radius) {this.setCornerRadiusUniform("bottomleft", radius);};
			R.setTopRightCornerRadius    = function(radius) {this.setCornerRadiusUniform("topright", radius);};
			R.setBottomRightCornerRadius = function(radius) {this.setCornerRadiusUniform("bottomright", radius);};

			// not sure if this should be handled here or by the unified view logic? probably better there... 
			R.setPadding = function(padding){};
			R.setLeftPadding   = function(padding){};
			R.setRightPadding  = function(padding){};
			R.setBottomPadding = function(padding){};
			R.setTopPadding    = function(padding){};
			
			return R;
		};

		this.CreateView = function(x,y,width,height) 
		{
			var radius = 3;
			var borderwidth = 3;
			var bordercolor = [0,0,0,0];
			var centercolor = [1,1,1,0];
			var rect = new dali.ImageActor( );
			rect.setImage(this.defaultimage );
			//rect.parentOrigin = dali.CENTER;
            //rect.anchorPoint = dali.CENTER;

            rect.anchorPoint = dali.TOP_LEFT;
			rect.parentOrigin = dali.TOP_LEFT;
				
			//rect.parentOrigin = [0,0,0.5];
			//rect.anchorPoint = [0.0, 0.0, 0.5];
			//console.log("size",width, height,"pos",x,y);
			rect.size = [ width, height,1];
			rect.position = [x,y,1];	  
			var rectshader = this.CreateShader();

			rectshader.setUniform("width", width);
			rectshader.setUniform("height", height);

			rectshader.setUniform("radius", radius);
			rectshader.setUniform("borderwidth", borderwidth);

			rectshader.setUniform("BorderColor", bordercolor );  
			rectshader.setUniform("CenterColor", centercolor );  
			  
			rect.setShaderEffect( rectshader );
			//rect.setBlendFunc(dali.BLEND_FACTOR_SRC_ALPHA, dali.BLEND_FACTOR_ONE_MINUS_SRC_ALPHA);
			rect.setBlendMode(dali.BLENDING_ON );
			
			dali.stage.add( rect );
			var R =  this.ViewRect(this, rect, rectshader);	
			//console.log(R);
			
			return R;
		};

	}



	return dalihost;
})
	