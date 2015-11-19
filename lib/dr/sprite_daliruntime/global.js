define(function(require, exports, module) {
    var glob = global;
    glob.fonts = {};
    glob.createTextNode = function(v) {
        //console.dir(v);
        var elem = dalihost.CreateView(0, 0, 0, 0);
        elem.nodeType = 3;
        elem.setText(v);
        return elem;
    }
    glob.attachEvent = function(name, func) {
        console.log("global event handler:", name)
    }
    glob.createElement = function(elementname) {  
        var elem = dalihost.CreateView(0, 0, 0, 0);
        elem.tagname = elementname;
        elem.style = {};
        //elem.setBackgroundColor([0,1,1,1]);
        elem.setSize(0, 0);
        elem.setPosition(0, 0);
        elem.setCornerRadius(0);
        elem.setBorderWidth(0);
        
      
        elem.style = {};

        elem.childNodes = [];
        elem.appendChild = function(child) {
            this.childNodes.push(child);
            if (elem.childNodes.size ==1 ) this.firstChild = child;
            this.addChild(child);
        }
        elem.handlers = {};
        elem.attachEvent = function(eventname, func) {
            if (elem.handlers[eventname] === undefined) {
                elem.handlers[eventname] = [];
            }
            elem.handlers[eventname].push(func);
            if (eventname.indexOf("idle") > -1) {
                console.log(" idle attached!", func);
            }
            //console.log("handler attached to elem:", eventname);
        }
        return elem;
    };
    glob.createEvent = function(name) {
        return {
            name: name,
            initEvent: function(name, bubbles, cancelable) {
                this.name = name;
                this.bubbles = bubbles;
                this.cancelable = cancelable;
            }
        };
    }
    glob.dispatchEvent = function(evt) {}
    glob.roots = []
    glob.addRoot = function(elem) {
        console.log("new root: ", elem);
        this.roots.push(elem);
    }
    glob.removeRoot = function(elem) {
        var index = this.roots.indexOf(elem);
        if (index > -1) {
            this.roots.splice(index, 1);
        }
    }
    var size = dali.stage.getSize();
    glob.innerWidth = size.x;
    glob.innerHeight = size.y;
    return glob;
});
