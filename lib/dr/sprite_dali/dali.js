define(function(require, exports){
	var exp = 
	{
		createElement:function(type)
		{
			var elem = this.CreateView(100,100,100,100);

			elem.setText('');
			elem.setBackgroundColor([1,1,1,1]);
			elem.setSize(100,100);
			elem.setPosition(500,500);
			elem.setCornerRadius(0);
			elem.setBorderWidth(0);
			elem.style = {};
			elem.children = [];
			
			elem.appendChild = function(child)
			{
				elem.children.push(child);
				elem.addChild(child);
				
			}
			
			elem.attachEvent = function(eventname, func)
			{
			}

			return elem;
		},
		
		defaultimage: new dali.ResourceImage( { url: "StijnK.png"}),

		// LoadedFonts maps stylestrings to preloaded fonts. 
		// Todo: refcount after unload to free up some memory.. might be needed for font-swap-heavy apps.
				LoadedFonts:  {},

		// Load a font to a texture. 
		LoadFont: function(fontoptions)
		{
			var name = fontoptions.family + "_" + fontoptions.style+"_" + fontoptions.pointSize.toString();
			if (this.LoadedFonts[name] == undefined) 
			{
				log("Loading font: " + name + "\n");
				this.LoadedFonts[name] =  new dali.Font( fontoptions );	
			}
			return this.LoadedFonts[name];
		},

		
		// map to link GUIDs to view-container reference
		ActorMap:{},

		// global GUID counter
		GUIDCounter:0,

		// grab a GUID string
		GetGUID: function ()
		{
			this.GUIDCounter++;
			return "GUID" + this.GUIDCounter;
		},

		// Create a new instance of a view-shader. 
		// Todo: currently uniforms are set on a shader, not on an instance.. so every time a new instance is spawned a new shader gets compiled... this is generally bad style.
		CreateShader:function(dotted)
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
		},

		DeleteView: function(view)
		{
			dali.stage.remove(view.rectactor);
			dali.stage.remove(view.textactor);
			view.rectactor = null;
			view.textactor = null;
			delete this.ActorMap[view.GUID];
		},

		ViewRect: function(rectactor, textactor, rectshader)
		{
		
			var R = {};
			R.GUID = this.GetGUID();

			this.ActorMap[R.GUID] = R;

			R.rectactor = rectactor;
			R.rectactor.name = R.GUID;
			R.rectshader = rectshader;
			R.textactor = textactor;
			R.textactor.name = R.GUID;
			
			R.children = [];
			R.parent = undefined;

			R.addChild = function(c)
			{
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

			R.setSize = function(width, height)
			{	
				if (width == undefined) width = 0;
				if (height == undefined) height =0 ;
				if (width == 'auto')
				{
					width = 100;
				}
				if (height == 'auto')
				{
					height = 100;
				}
				this.rectactor.sizeWidth = width;
				this.rectactor.sizeHeight = height;
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

			R.setText = function(text)
			{	
				if (text == undefined) text = '';
				this.text = text;
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

			R.setTopBorderWidth    = function(width){};
			R.setLeftBorderWidth   = function(width){};
			R.setBottomBorderWidth = function(width){};
			R.setRightBorderWidth  = function(width){};
			
			R.setBorderColorUniform = function(prefix, color){};
			R.setTopBorderColor     = function(color){this.setBorderColorUniform("top", color);};
			R.setLeftBorderColor    = function(color){this.setBorderColorUniform("top", color);};
			R.setBottomBorderColor  = function(color){this.setBorderColorUniform("top", color);};
			R.setRightBorderColor   = function(color){this.setBorderColorUniform("top", color);};
            
			R.setBorderStyleUniform = function(prefix, style){};
			R.setTopBorderStyle     = function(style){this.setBorderStyleUniform("top", style);};
			R.setLeftBorderStyle    = function(style){this.setBorderStyleUniform("left", style);};
			R.setBottomBorderStyle  = function(style){this.setBorderStyleUniform("bottom", style);};
			R.setRightBorderStyle   = function(style){this.setBorderStyleUniform("right", style);};
            
			R.setCornerRadiusUniform     = function(prefix, radius){};
			R.setTopLeftCornerRadius     = function(radius) {this.setCornerRadiusUniform("topleft", radius);};
			R.setBottomLeftCornerRadius  = function(radius) {this.setCornerRadiusUniform("bottomleft", radius);};
			R.setTopRightCornerRadius    = function(radius) {this.setCornerRadiusUniform("topright", radius);};
			R.setBottomRightCornerRadius = function(radius) {this.setCornerRadiusUniform("bottomright", radius);};

			// not sure if this should be handled here or by the unified view logic? probably better there... 
			R.setPadding       = function(padding){};
			R.setLeftPadding   = function(padding){};
			R.setRightPadding  = function(padding){};
			R.setBottomPadding = function(padding){};
			R.setTopPadding    = function(padding){};
			
			return R;
		},

		CreateView: function(x,y,width,height) 
		{
			var radius = 3;
			var borderwidth = 3;
			var bordercolor = [0,0,0,0];
			var centercolor = [1,1,1,0];
			var rect = new dali.ImageActor( this.defaultimage );
			rect.parentOrigin = [0,0,0.5];
			rect.anchorPoint = [0.0, 0.0, 0.5];
			rect.sizeWidth = width;
			rect.sizeHeight = height;
			rect.position = [x,y,1];	  
			var rectshader = this.CreateShader();

			rectshader.setUniform("width", width);
			rectshader.setUniform("height", height);

			rectshader.setUniform("radius", radius);
			rectshader.setUniform("borderwidth", borderwidth);

			rectshader.setUniform("BorderColor", bordercolor );  
			rectshader.setUniform("CenterColor", centercolor );  
			  
			rect.setShaderEffect( rectshader );
			rect.setBlendFunc(dali.BLEND_FACTOR_SRC_ALPHA, dali.BLEND_FACTOR_ONE_MINUS_SRC_ALPHA);
			rect.setBlendMode(dali.BLENDING_ON );
				

			var fontInfo =
			{
				family: "Arial",
				style: "Bold",
				pointSize: 20
			}

			var arialFont = this.LoadFont(fontInfo);

			var textOptions =
			{
				font: arialFont,
				isRightToLeft: true,
				fontDetection: true       // default is true
			} 

			var t1 = new dali.TextActor("",textOptions);
			t1.color = [0,0,0,0.87];
			t1.parentOrigin = [0.5,0.5,0.5];
			t1.positionZ = 1;
			rect.add(t1);

			dali.stage.add( rect );

			var R =  this.ViewRect(rect, t1, rectshader);	
			return R;
		},

		IdleTimeout: function( animation )
		{		
			animation.play();
		},

		StartIdleTick: function()
		{
			this.idleanim = new dali.Animation( 0.03 ); 	
			this.idleanim.connect("finished", this.IdleTimeout );
			this.idleanim.play();
		}
				
	};
	return exp;
});