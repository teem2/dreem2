/*
 The MIT License (see LICENSE)
 Copyright (C) 2014-2015 Teem2 LLC
*/

// using the node-hue-api found here:  https://github.com/peter-murray/node-hue-api

define(function(require, exports, module)
{
	var node = require("$CLASSES/node")
	var teem = require("$CLASSES/teem")
	var RpcMulti = require("$CORE/rpcmulti")
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
		console.log("result: " + JSON.stringify(result, null, 2));
	};

	var displayError = function(err) 
	{
		console.error("" + err);
	};
	
	return node.extend("huebase_old", function()
	{
		this.attribute("init", "event");
		this.setLight = function(id, r,g,b)
		{
			if (this.apiObject == undefined) {
				return;
			}
			var state  =  LightState.create();
			this.apiObject.setLightState(id, state.on().transitiontime(0).hsl(r,g,b)).fail(displayError).done();
		}
		
		this.init = function(){
			console.log('init!')
			// lets add all huelight children as an array, this will put up the rpc interfaces

			for(var i = 0; i < this.child.length; i++){
				var child = this.child[i]
				if(!this.lights) this.lights = RpcMulti.createFromObject(child, node)
				this.lights.push(child)
			}

			if(!LightState) return
			console.color('~br~Hue~~ object started on server\n')
			Hue.nupnpSearch(function(err, result){
				for(r in result){
					if (result[r].id == this.id){
						console.log("found " + this.id + " at address " + result[r].ipaddress);
						if (this.username != undefined){
							var state = LightState.create();
							this.apiObject = new HueApi(result[r].ipaddress, this.username);
							this.apiObject.searchForNewLights().then(displayResult).fail(displayError).done();
							this.apiObject.lights().then(displayResult).fail(displayError).done();							
							// ok now we want to 'define' the set, not just create it
							// what is the api
						}
					}
				}
			}.bind(this));
		}
	})
})