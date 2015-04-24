

define(function(require, exports, module){
	var node = require("../classes/node")
	var teem = require("../classes/teem")
	// do not reload the serialport module - it has operating-system dependent things that will crash otherwise
	try{
		var serialPortModule = define.serialOnce || (define.serialOnce = require("serialport"));
		var SerialPort = serialPortModule.SerialPort

		//var SerialPort = serialPortModule.SerialPort;

		function readline (delimiter, encoding) 
		{
			if (typeof delimiter === 'undefined' || delimiter === null) { delimiter = '\r'; }
			if (typeof encoding  === 'undefined' || encoding  === null) { encoding  = 'utf8'; }
			// Delimiter buffer saved in closure
			var data = '';
			return function (emitter, buffer) 
			{
				// Collect data
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
	  
		serialPortModule.list(function (err, ports) 
		{
			ports.forEach(function(port) 
			{
				console.log(port.comName + " " + port.pnpId + " " + port.manufacturer);
			});
		});

	}
	catch(e){

	}
	
	return node.extend("arduino", function(){
	
		this.portopened = false;
		
		
		this.attribute("testprop", "boolean")
		this.attribute("init", "event")
		this.init = function() 
		{
			console.color('~br~Arduino~~ object started on server\n')	
			console.log(this.port);
		}
		
		this.test = function(){
		console.log('test called!')
	}
	})
})