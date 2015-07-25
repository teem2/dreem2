define(function (require, exports, module) {
	
	var glob = {}
	
	glob.createElement = function (elementname) {

		//console.log("creating element on headless", elementname);
		
		var elem = dalihost.CreateView(100,100,100,100);

		elem.tagname = elementname;
		elem.style = {};
			

			elem.setBackgroundColor([0,1,1,1]);
			elem.setSize(100,100);
			elem.setPosition(0,0);
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
