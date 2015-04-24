

define(function(require, exports, module){
	var node = require("../classes/node")
	var teem = require("../classes/teem")
	// do not reload the serialport module - it has operating-system dependent things that will crash otherwise
	try
	{
		var serialPortModule = define.serialOnce || (define.serialOnce = require("serialport"));
		var SerialPort = serialPortModule.SerialPort
	}
	catch(e){

	}

	function lineConsumer (delimiter, encoding) 
	{
		if (typeof delimiter === 'undefined' || delimiter === null) { delimiter = '\r'; }
		if (typeof encoding  === 'undefined' || encoding  === null) { encoding  = 'utf8'; }
		// Delimiter buffer saved in closure
		var data = '';
		return function (emitter, buffer) 
		{
			data += buffer.toString(encoding);
			// Split collected data by delimiter
			var parts = data.split(delimiter);
			data = parts.pop();
			parts.forEach(function (part) 
			{
				emitter.emit('data', part);
			});
		};
	}  

	return node.extend("arduino", function()
	{
		this.portOpened = false;
			
		this.attribute("testprop", "boolean")
		this.attribute("init", "event")
		
		this.onAttributeSet = function(key, value)
		{
			
		}

		this.init = function() 
		{
			console.color('~br~Arduino~~ object started on server\n')	
			console.log("my port: " + this.port);
			this.openPort = function()
			{
				console.log(this.portOpened);
				console.log("opening port using handle "  + this.port);
				
				this.serialPortContainer = new SerialPort(this.port,{baudrate: 115200,  parser: lineConsumer("\n")});
				
				this.serialPortContainer.on('open', function()		
				{
					this.portOpened = true;
					console.log('Serial Port Opened');
					this.serialPortContainer.on('close', function (err) 
					{
						this.serialPortContainer = null;
						this.portOpened = false;
					});

					this.serialPortContainer.on('disconnect', function (err) 
					{
						console.log('on.disconnect');
					}.bind(this));

					this.serialPortContainer.on('error', function (err) 
					{
						console.error("on.error", err);
					}.bind(this));
	
					var i = 0;
	
					//setInterval(function(){this.serialPortContainer.write("mtd countdown\r\n");i=(i+1)%10}.bind(this), 4000);
	
					this.serialPortContainer.on('data', function(data)
					{
						//	console.log(data);
						try
						{
							var parsed = JSON.parse(data);
							if (parsed.atr)
							{	
								console.log("incoming attribute: "+ parsed.atr + " " + parsed.type + " " + parsed.value);
								this[parsed.atr] = parsed.value;			
							}
							else if (parsed.inq)
							{	
								console.log("incoming inquiry set: ");
								console.dir(parsed.inq);
							}	
							else if (parsed.mtd)
							{	
								console.log("incoming method call: "+ parsed.mtd);
								try
								{
									this[parsed]();
								}
								catch(e){};
							}		
						}
						catch(e){}
					}.bind(this));
	
					this.serialPortContainer.write("inq\r\n");
				}.bind(this));
			}.bind(this);
			
			this.scanPorts = function()
			{
				var RootThis = this;
				var P = this.port;
				var PS = this.portScanner;
				if(!serialPortModule) return
				if (this.portOpened == false)
				{
					serialPortModule.list(function (err, ports) 
					{
						ports.forEach(function(port) 
						{
							//	console.log("available com port: " + port.comName + " " + port.pnpId + " " + port.manufacturer);
							if (P != undefined)
							{
								if (port.comName.toLowerCase() == P.toLowerCase())
								{
									RootThis.port = port.comName;
									console.log("found "+ P + "! Connecting!");
									RootThis.openPort();										
								}
							}
						})
					})
				};
			}.bind(this);
	
			this.portScanner = setInterval(this.scanPorts, 1000);
		}
		
		this.destroy = function()
		{
			if (this.portScanner)
			{
				clearInterval(this.portScanner);
			}				
			if (this.serialPortContainer)
			{
				this.serialPortContainer.close();
			}
		}
	})
})