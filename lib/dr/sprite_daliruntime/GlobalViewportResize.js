/* Copyright 2015-2016 Teem2 LLC. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 either express or implied. See the License for the specific language governing permissions and limitations under the License.*/

/** Provides an interface to platform specific viewport resize functionality. */
define(function(require, exports, module) {
    var dr = require('$LIB/dr/dr.js'),
        JS = require('$LIB/jsclass.js'),
        globalScope = require('$SPRITE/global.js'),
        sprite = require('$SPRITE/sprite.js');
    
    module.exports = GlobalViewportResize = new JS.Class('sprite.GlobalViewportResize', {
        // Constructor /////////////////////////////////////////////////////////////
        /** The standard JSClass initializer function. Subclasses should not
            override this function.
            @param attrs:object A map of attribute names and values.
            @returns void */
        initialize: function(view, attrs) {
            this.view = view;
            
            var self = this;
            //sprite.addEventListener(globalScope, 'resize', function(domEvent) {
            //    view.__handleResizeEvent(self.getViewportWidth(), self.getViewportHeight());
          //  });
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        getViewportWidth: function() {
            return globalScope.innerWidth;
        },
        
        getViewportHeight: function() {
            return globalScope.innerHeight;
        }
    });
});
