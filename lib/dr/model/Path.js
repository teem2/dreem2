/** An ordered collection of points that can be applied to a canvas.
    
    Attributes:
        vectors:array The data is stored in a single array with the x coordinate
            first and the y coordinate second.
        _boundingBox:object the cached bounding box if it has been calculated.
*/
define(function(require, exports){
    var dr = require('../dr.js');
    var JS = require('$LIB/jsclass.js');
    
    dr.Path = new JS.Class('Path', {
        // Constructor /////////////////////////////////////////////////////////////
        /** Create a new Path. */
        initialize: function(vectors) {
            this._boundingBox = null;
            this.vectors = vectors || [];
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** Convert radians to degrees.
            @param {Number} deg The degrees to convert.
            @return {Number} The radians */
        degreesToRadians: function(deg) {
            return deg * Math.PI / 180;
        },
      
        /** Convert degrees to radians.
            @param {Number} rad The radians to convert.
            @return {Number} The radians */
        radiansToDegrees: function(rad) {
            return rad * 180 / Math.PI;
        },
        
        /** Shift this path by the provided x and y amount. */
        translate: function(dx, dy) {
            var vecs = this.vectors, i = vecs.length;
            while (i) {
                vecs[--i] += dy;
                vecs[--i] += dx;
            }
            this._boundingBox = null;
            return this;
        },
        
        /** Rotates this path around 0,0 by the provided angle in degrees.
            @param a:number The angle in degrees to rotate. */
        rotate: function(a) {
            a = this.degreesToRadians(a);
            
            var cosA = Math.cos(a), sinA = Math.sin(a),
                vecs = this.vectors, len = vecs.length,
                xNew, yNew, i = 0;
            for (; len > i;) {
                xNew = vecs[i] * cosA - vecs[i + 1] * sinA;
                yNew = vecs[i] * sinA + vecs[i + 1] * cosA;
                
                vecs[i++] = xNew;
                vecs[i++] = yNew;
            }
            this._boundingBox = null;
            return this;
        },
        
        /** Scales this path around the origin by the provided scale amount
            @param sx:number The amount to scale along the x-axis.
            @param sy:number The amount to scale along the y-axis. */
        scale: function(sx, sy) {
            var vecs = this.vectors, i = vecs.length;
            while (i) {
              vecs[--i] *= sy;
              vecs[--i] *= sx;
            }
            this._boundingBox = null;
            return this;
        },
        
        /** Rotates and scales this path around the provided origin by the angle in
            degrees, scalex and scaley.
            @param scalex:number The amount to scale along the x axis.
            @param scaley:number The amount to scale along the y axis.
            @param angle:number The amount to scale.
            @param xOrigin:number The amount to scale.
            @param yOrigin:number The amount to scale. */
        transformAroundOrigin: function(scalex, scaley, angle, xOrigin, yOrigin) {
            return this.translate(-xOrigin, -yOrigin).rotate(angle).scale(scalex, scaley).translate(xOrigin, yOrigin);
        },
        
        /** Gets the bounding box for this path.
            @return object with properties x, y, width and height or null
                if no bounding box could be calculated. */
        getBoundingBox: function() {
            if (this._boundingBox) return this._boundingBox;
            
            var vecs = this.vectors, i = vecs.length, x, y, minX, maxX, minY, maxY;
            if (i >= 2) {
                minY = maxY = vecs[--i];
                minX = maxX = vecs[--i];
                while (i) {
                    y = vecs[--i];
                    x = vecs[--i];
                    minY = Math.min(y, minY);
                    maxY = Math.max(y, maxY);
                    minX = Math.min(x, minX);
                    maxX = Math.max(x, maxX);
                }
                return this._boundingBox = {x:minX, y:minY, width:maxX - minX, height:maxY - minY};
            }
            
            return this._boundingBox = null;
        }
    });
});
