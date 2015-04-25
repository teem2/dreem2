/** Provides global keyboard events. Registered with dr.global as 'keys'.
    
    Also works with GlobalFocus to navigate the focus hierarchy when the 
    focus traversal keys are used.
    
    Events:
        keydown:number fired when a key is pressed down. The value is the
            keycode of the key pressed down.
        keypress:number fired when a key is pressed. The value is the
            keycode of the key pressed.
        keyup:number fired when a key is released up. The value is the
            keycode of the key released up.
    
    Keycodes:
        backspace          8
        tab                9
        enter             13
        shift             16
        ctrl              17
        alt               18
        pause/break       19
        caps lock         20
        escape            27
        spacebar          32
        page up           33
        page down         34
        end               35
        home              36
        left arrow        37
        up arrow          38
        right arrow       39
        down arrow        40
        insert            45
        delete            46
        0                 48
        1                 49
        2                 50
        3                 51
        4                 52
        5                 53
        6                 54
        7                 55
        8                 56
        9                 57
        a                 65
        b                 66
        c                 67
        d                 68
        e                 69
        f                 70
        g                 71
        h                 72
        i                 73
        j                 74
        k                 75
        l                 76
        m                 77
        n                 78
        o                 79
        p                 80
        q                 81
        r                 82
        s                 83
        t                 84
        u                 85
        v                 86
        w                 87
        x                 88
        y                 89
        z                 90
        left window key   91
        right window key  92
        select key        93
        numpad 0          96
        numpad 1          97
        numpad 2          98
        numpad 3          99
        numpad 4         100
        numpad 5         101
        numpad 6         102
        numpad 7         103
        numpad 8         104
        numpad 9         105
        multiply         106
        add              107
        subtract         109
        decimal point    110
        divide           111
        f1               112
        f2               113
        f3               114
        f4               115
        f5               116
        f6               117
        f7               118
        f8               119
        f9               120
        f10              121
        f11              122
        f12              123
        num lock         144
        scroll lock      145
        semi-colon       186
        equal sign       187
        comma            188
        dash             189
        period           190
        forward slash    191
        grave accent     192
        open bracket     219
        back slash       220
        close braket     221
        single quote     222
*/
define(function(require, exports){
    var dr = require('../dr.js');
    var JS = require('../../../../../lib/jsclass.js');
    
    require('../SpriteBacked.js');
    require('./GlobalFocus.js');
    require('../sprite/GlobalKeys.js');
    require('../events/Observable.js');
    
    new JS.Singleton('GlobalKeys', {
        include: [
            dr.SpriteBacked,
            dr.PlatformObserver,
            dr.Observable,
            dr.Observer
        ],
        
        
        // Constructor /////////////////////////////////////////////////////////////
        initialize: function() {
            this.set_sprite(this.createSprite());
            
            this.listenTo(dr.global.focus, 'onfocused', '__handleFocused');
            
            this.sprite.__listenToDocument();
            
            // Store in dr namespace for backwards compatibility with dreem
            if (dr.keys) {
                dr.dumpStack('dr.keys already set.');
            } else {
                dr.keys = this;
            }
            
            dr.global.register('keys', this);
        },
        
        createSprite: function(attrs) {
            return new dr.sprite.GlobalKeys(this, attrs);
        },
        
        
        // Methods /////////////////////////////////////////////////////////////////
        /** Tests if a key is currently pressed down or not.
            @param keyCode:number the key to test.
            @returns true if the key is down, false otherwise. */
        isKeyDown: function(keyCode) {
            return this.sprite.isKeyDown(keyCode);
        },
        
        /** Tests if the 'shift' key is down. */
        isShiftKeyDown: function() {
            return this.sprite.isShiftKeyDown();
        },
        
        /** Tests if the 'control' key is down. */
        isControlKeyDown: function() {
            return this.sprite.isControlKeyDown();
        },
        
        /** Tests if the 'alt' key is down. */
        isAltKeyDown: function() {
            return this.sprite.isAltKeyDown();
        },
        
        /** Tests if the 'command' key is down. */
        isCommandKeyDown: function() {
            return this.sprite.isCommandKeyDown();
        },
        
        /** Tests if the platform specific "accelerator" key is down. */
        isAcceleratorKeyDown: function() {
            return this.sprite.isAcceleratorKeyDown();
        },
        
        ignoreFocusTrap: function() {
            return this.isAltKeyDown();
        },
        
        /** @private */
        __handleKeyDown: function(platformEvent) {
            this.sprite.__handleKeyDown(platformEvent);
        },
        
        /** @private */
        __handleKeyPress: function(platformEvent) {
            this.sprite.__handleKeyPress(platformEvent);
        },
        
        /** @private */
        __handleKeyUp: function(platformEvent) {
            this.sprite.__handleKeyUp(platformEvent);
        },
        
        /** @private */
        __handleFocused: function(platformEvent) {
            this.sprite.handleFocusChange(platformEvent);
        }
    });
});
