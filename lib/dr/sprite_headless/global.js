define(function(require, exports, module) {
	
	global.createElement = function(elementname) {
		return {	
			tagname: elementname, 
			style: {}
		};
	};
	global.roots = []
	global.addRoot = function(elem){
		this.roots.push(elem);
	}
	
	global.removeRoot = function(elem){
		var index = this.roots.indexOf(elem);
		if (index > -1) {
			this.roots.splice(index, 1);
		}
	}

    return global;
});