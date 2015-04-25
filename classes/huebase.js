/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

define(function(require, exports, module)
{
	var node = require("$CLASSES/node")
	var teem = require("$CLASSES/teem")
// do not reload the hue module - 
	try
	{
		var Hue = define.huebaseOnce || (define.huebaseOnce = require("node-hue-api"))
		var HueApi = Hue.HueApi;
		var LightState = Hue.lightState;
		var SerialPort = serialPortModule.SerialPort
	}
	catch(e){}
	
	var displayResult = function(result) 
	{
		console.log(JSON.stringify(result, null, 2));
	};

	var displayError = function(err) 
	{
		console.error(err);
	};
	return node.extend("huebase", function()
	{
		this.attribute("init", "event");
	
		this.init = function() 
		{				
			console.color('~br~Hue~~ object started on server\n')	
			console.log(this.username);
			if (this.username != undefined && this.address != undefined)
			{
			var state  =  LightState.create();
			this.apiObject =  new HueApi(this.address, this.username);
			this.apiObject.searchForNewLights().then(displayResult).done();
			this.apiObject.lights().then(displayResult).done();
			this.apiObject.setLightState(1, state.on().transitiontime(0).hue(0).sat(0)).then(displayResult).fail(displayError).done();
			}
		};
	})
})