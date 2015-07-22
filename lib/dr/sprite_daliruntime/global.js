define(function (require, exports, module) {
	
	var glob = {}
	
	glob.createElement = function (elementname) {
		//console.log("creating element on headless", elementname);
		return {
			tagname : elementname,
			style : {},
			children : [],
			appendChild : function (child) {
				this.children.push(child);
			},
			attachEvent : function (name, func) {}
		};
	};
	
	glob.createEvent = function (name) {
		return {
			name : name,
			initEvent : function (name, bubbles, cancelable) {
				this.name = name;
				this.bubbles = bubbles;
				this.cancelable = cancelable;
			}
		};
	}

	glob.dispatchEvent = function (evt) {}

	glob.roots = []
	glob.addRoot = function (elem) {
		this.roots.push(elem);
	}

	glob.removeRoot = function (elem) {
		var index = this.roots.indexOf(elem);
		if (index > -1) {
			this.roots.splice(index, 1);
		}
	}

	return glob;
});
