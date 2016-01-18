/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/
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
