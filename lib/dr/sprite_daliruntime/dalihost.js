define(function (require, exports, module) {
	 
	var dalihost = {}
	dalihost.init = function(dali){
		console.log("clear!");
		global.dali = dali;
		dali.stage.setBackgroundColor( [1,1,1,1 ] );
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
	}



	return dalihost;
})
	