/** Models a color as individual color channels.
    
    Events:
        None
   
    Attributes:
        red:int The red channel. Will be an integer between 0 and 255.
        green:int The green channel. Will be an integer between 0 and 255.
        blue:int The blue channel. Will be an integer between 0 and 255.
*/
define(function(require, exports, module){
    var dr = require('$LIB/dr/dr.js');
    var JS = require('$LIB/jsclass.js');
    
    dr.Color = new JS.Class('Color', {
        // Class Methods and Attributes ////////////////////////////////////////////
        extend: {
            /** Converts a number or string representation of a number to a 
                two character hex string.
                @param value:number/string The number or string to convert.
                @returns string: A two character hex string such as: '0c' or 'c9'. */
            toHex: function(value) {
                value = Math.round(Number(value)).toString(16);
                return value.length === 1 ? '0' + value : value;
            },
            
            /** Converts red, green, and blue color channel numbers to a six 
                character hex string.
                @param red:number The red color channel.
                @param green:number The green color channel.
                @param blue:number The blue color channel.
                @param prependHash:boolean (optional) If true a '#' character
                    will be prepended to the return value.
                @returns string: Something like: '#ff9c02' or 'ff9c02' */
            rgbToHex: function(red, green, blue, prependHash) {
                var toHex = this.toHex;
                return [prependHash ? '#' : '', toHex(red), toHex(green), toHex(blue)].join('');
            },
            
            /** Limits a channel value to integers between 0 and 255.
                @param value:number the channel value to clean up.
                @returns number */
            cleanChannelValue: function(value) {
                value = Math.round(value);
                
                if (value > 255) return 255;
                if (value < 0) return 0;
                return value;
            },
            
            /** Gets the red channel from a "color" number.
                @return number */
            getRedChannel: function(value) {
                return (0xff0000 & value) >> 16;
            },
            
            /** Gets the green channel from a "color" number.
                @returns number */
            getGreenChannel: function(value) {
                return (0x00ff00 & value) >> 8;
            },
            
            /** Gets the blue channel from a "color" number.
                @returns number */
            getBlueChannel: function(value) {
                return (0x0000ff & value);
            },
            
            /** Creates an dr.Color from a "color" number.
                @returns dr.Color */
            makeColorFromNumber: function(value) {
                return new dr.Color(
                    this.getRedChannel(value),
                    this.getGreenChannel(value),
                    this.getBlueChannel(value)
                );
            },
            
            COLORS_BY_NAME: {
                aliceblue:'#F0F8FF',
                antiquewhite:'#FAEBD7',
                aqua:'#00FFFF',
                aquamarine:'#7FFFD4',
                azure:'#F0FFFF',
                beige:'#F5F5DC',
                bisque:'#FFE4C4',
                black:'#000000',
                blanchedalmond:'#FFEBCD',
                blue:'#0000FF',
                blueviolet:'#8A2BE2',
                brown:'#A52A2A',
                burlywood:'#DEB887',
                cadetblue:'#5F9EA0',
                chartreuse:'#7FFF00',
                chocolate:'#D2691E',
                coral:'#FF7F50',
                cornflowerblue:'#6495ED',
                cornsilk:'#FFF8DC',
                crimson:'#DC143C',
                cyan:'#00FFFF',
                darkblue:'#00008B',
                darkcyan:'#008B8B',
                darkgoldenrod:'#B8860B',
                darkgray:'#A9A9A9',
                darkgreen:'#006400',
                darkgrey:'#A9A9A9',
                darkkhaki:'#BDB76B',
                darkmagenta:'#8B008B',
                darkolivegreen:'#556B2F',
                darkorange:'#FF8C00',
                darkorchid:'#9932CC',
                darkred:'#8B0000',
                darksalmon:'#E9967A',
                darkseagreen:'#8FBC8F',
                darkslateblue:'#483D8B',
                darkslategray:'#2F4F4F',
                darkslategrey:'#2F4F4F',
                darkturquoise:'#00CED1',
                darkviolet:'#9400D3',
                deeppink:'#FF1493',
                deepskyblue:'#00BFFF',
                dimgray:'#696969',
                dimgrey:'#696969',
                dodgerblue:'#1E90FF',
                firebrick:'#B22222',
                floralwhite:'#FFFAF0',
                forestgreen:'#228B22',
                fuchsia:'#FF00FF',
                gainsboro:'#DCDCDC',
                ghostwhite:'#F8F8FF',
                gold:'#FFD700',
                goldenrod:'#DAA520',
                gray:'#808080',
                green:'#008000',
                greenyellow:'#ADFF2F',
                grey:'#808080',
                honeydew:'#F0FFF0',
                hotpink:'#FF69B4',
                indianred:'#CD5C5C',
                indigo:'#4B0082',
                ivory:'#FFFFF0',
                khaki:'#F0E68C',
                lavender:'#E6E6FA',
                lavenderblush:'#FFF0F5',
                lawngreen:'#7CFC00',
                lemonchiffon:'#FFFACD',
                lightblue:'#ADD8E6',
                lightcoral:'#F08080',
                lightcyan:'#E0FFFF',
                lightgoldenrodyellow:'#FAFAD2',
                lightgray:'#D3D3D3',
                lightgreen:'#90EE90',
                lightgrey:'#D3D3D3',
                lightpink:'#FFB6C1',
                lightsalmon:'#FFA07A',
                lightseagreen:'#20B2AA',
                lightskyblue:'#87CEFA',
                lightslategray:'#778899',
                lightslategrey:'#778899',
                lightsteelblue:'#B0C4DE',
                lightyellow:'#FFFFE0',
                lime:'#00FF00',
                limegreen:'#32CD32',
                linen:'#FAF0E6',
                magenta:'#FF00FF',
                maroon:'#800000',
                mediumaquamarine:'#66CDAA',
                mediumblue:'#0000CD',
                mediumorchid:'#BA55D3',
                mediumpurple:'#9370DB',
                mediumseagreen:'#3CB371',
                mediumslateblue:'#7B68EE',
                mediumspringgreen:'#00FA9A',
                mediumturquoise:'#48D1CC',
                mediumvioletred:'#C71585',
                midnightblue:'#191970',
                mintcream:'#F5FFFA',
                mistyrose:'#FFE4E1',
                moccasin:'#FFE4B5',
                navajowhite:'#FFDEAD',
                navy:'#000080',
                oldlace:'#FDF5E6',
                olive:'#808000',
                olivedrab:'#6B8E23',
                orange:'#FFA500',
                orangered:'#FF4500',
                orchid:'#DA70D6',
                palegoldenrod:'#EEE8AA',
                palegreen:'#98FB98',
                paleturquoise:'#AFEEEE',
                palevioletred:'#DB7093',
                papayawhip:'#FFEFD5',
                peachpuff:'#FFDAB9',
                peru:'#CD853F',
                pink:'#FFC0CB',
                plum:'#DDA0DD',
                powderblue:'#B0E0E6',
                purple:'#800080',
                red:'#FF0000',
                rosybrown:'#BC8F8F',
                royalblue:'#4169E1',
                saddlebrown:'#8B4513',
                salmon:'#FA8072',
                sandybrown:'#F4A460',
                seagreen:'#2E8B57',
                seashell:'#FFF5EE',
                sienna:'#A0522D',
                silver:'#C0C0C0',
                skyblue:'#87CEEB',
                slateblue:'#6A5ACD',
                slategray:'#708090',
                slategrey:'#708090',
                snow:'#FFFAFA',
                springgreen:'#00FF7F',
                steelblue:'#4682B4',
                tan:'#D2B48C',
                teal:'#008080',
                thistle:'#D8BFD8',
                tomato:'#FF6347',
                turquoise:'#40E0D0',
                violet:'#EE82EE',
                wheat:'#F5DEB3',
                white:'#FFFFFF',
                whitesmoke:'#F5F5F5',
                yellow:'#FFFF00',
                yellowgreen:'#9ACD32'
            },
            
            makeColorFromNameString: function(value) {
                if (value) {
                    return this.makeColorFromHexString(this.COLORS_BY_NAME[value.toLowerCase()]);
                } else {
                    return null;
                }
            },
            
            /** Creates an dr.Color from an html color string.
                @param value:string A hex string representation of a color, such
                    as '#ff339b'.
                @returns dr.Color or null if no color could be parsed. */
            makeColorFromHexString: function(value) {
                if (value && value.indexOf('#') === 0) {
                    return this.makeColorFromNumber(parseInt(value.substring(1), 16));
                } else {
                    return null;
                }
            },
            
            makeColorFromHexOrNameString: function(value) {
                if (value) {
                    if (value.indexOf('#') === 0) {
                        return this.makeColorFromHexString(value);
                    } else {
                        return this.makeColorFromNameString(value);
                    }
                }
            },
            
            /** Returns the lighter of the two provided colors.
                @param a:number A color number.
                @param b:number A color number.
                @returns The number that represents the lighter color. */
            getLighterColor: function(a, b) {
                var cA = this.makeColorFromNumber(a),
                    cB = this.makeColorFromNumber(b);
                return cA.isLighterThan(cB) ? a : b;
            },
            
            /** Creates a "color" number from the provided color channels.
                @param red:number the red channel
                @param green:number the green channel
                @param blue:number the blue channel
                @returns number */
            makeColorNumberFromChannels: function(red, green, blue) {
                red = this.cleanChannelValue(red);
                green = this.cleanChannelValue(green);
                blue = this.cleanChannelValue(blue);
                return (red << 16) + (green << 8) + blue;
            }
        },
        
        
        // Constructor /////////////////////////////////////////////////////////////
        /** Create a new Color.
            @param red:number the red channel
            @param green:number the green channel
            @param blue:number the blue channel */
        initialize: function(red, green, blue) {
            this.setRed(red);
            this.setGreen(green);
            this.setBlue(blue);
        },
        
        
        // Accessors ///////////////////////////////////////////////////////////////
        /** Sets the red channel value. */
        setRed: function(red) {
            this.red = dr.Color.cleanChannelValue(red);
        },
        
        /** Sets the green channel value. */
        setGreen: function(green) {
            this.green = dr.Color.cleanChannelValue(green);
        },
        
        /** Sets the blue channel value. */
        setBlue: function(blue) {
            this.blue = dr.Color.cleanChannelValue(blue);
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** Gets the numerical representation of this color.
            @returns number: The number that represents this color. */
        getColorNumber: function() {
            return (this.red << 16) + (this.green << 8) + this.blue;
        },
        
        /** Gets the hex string representation of this color.
            @returns string: A hex color such as '#a0bbcc'. */
        getHtmlHexString: function() {
            return dr.Color.rgbToHex(this.red, this.green, this.blue, true);
        },
        
        /** Tests if this color is lighter than the provided color.
            @param c:dr.Color the color to compare to.
            @returns boolean: True if this color is lighter, false otherwise. */
        isLighterThan: function(c) {
            var diff = this.getDiffFrom(c);
            
            // Sum channel diffs to determine lightest color. A negative diff
            // means a lighter color.
            return 0 > (diff.red + diff.green + diff.blue);
        },
        
        /** Gets an object holding color channel diffs.
            @param c:dr.Color the color to diff from.
            @returns object containing the diffs for the red, green and blue
                channels. */
        getDiffFrom: function(c) {
            return {
                red: c.red - this.red,
                green: c.green - this.green,
                blue: c.blue - this.blue
            };
        },
        
        /** Applies the provided diff object to this color.
            @param diff:object the color diff to apply.
            @returns this dr.Color to facilitate method chaining. */
        applyDiff: function(diff) {
            this.setRed(this.red + diff.red);
            this.setGreen(this.green + diff.green);
            this.setBlue(this.blue + diff.blue);
            return this;
        },
        
        /** Adds the provided color to this color.
            @param c:dr.Color the color to add.
            @returns this dr.Color to facilitate method chaining. */
        add: function(c) {
            this.setRed(this.red + c.red);
            this.setGreen(this.green + c.green);
            this.setBlue(this.blue + c.blue);
            return this;
        },
        
        /** Subtracts the provided color from this color.
            @param c:dr.Color the color to subtract.
            @returns this dr.Color to facilitate method chaining. */
        subtract: function(c) {
            this.setRed(this.red - c.red);
            this.setGreen(this.green - c.green);
            this.setBlue(this.blue - c.blue);
            return this;
        },
        
        /** Multiplys this color by the provided scalar.
            @param s:number the scaler to multiply by.
            @returns this dr.Color to facilitate method chaining. */
        multiply: function(s) {
            this.setRed(this.red * s);
            this.setGreen(this.green * s);
            this.setBlue(this.blue * s);
            return this;
        },
        
        /** Divides this color by the provided scalar.
            @param s:number the scaler to divide by.
            @returns this dr.Color to facilitate method chaining. */
        divide: function(s) {
            this.setRed(this.red / s);
            this.setGreen(this.green / s);
            this.setBlue(this.blue / s);
            return this;
        },
        
        /** Clones this Color.
            @returns dr.Color A copy of this dr.Color. */
        clone: function() {
            return new dr.Color(this.red, this.green, this.blue);
        }
    });
    
    module.exports = dr.Color;
});
