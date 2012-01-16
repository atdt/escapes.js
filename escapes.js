/*jslint browser: true, plusplus: true */
/*global ansi */
"use strict";

ansi = ansi || {};

(function () {
    var NONE = 0,
        BRIGHT = 1,
        UNDERLINE = 4,
        BLINK = 5,
        REVERSE = 7,
        INVISIBLE = 9,

        // Colors
        BLACK = 0,
        RED = 1,
        GREEN = 2,
        YELLOW = 3,
        BLUE = 4,
        MAGENTA = 5,
        CYAN = 6,
        WHITE = 7,

        COLORS = [
            [0, 0, 0],        // Black
            [170, 0, 0],      // Red
            [0, 170, 0],      // Green
            [170, 85, 0],     // Yellow
            [0, 0, 170],      // Blue
            [170, 0, 170],    // Magenta
            [0, 170, 170],    // Cyan
            [170, 170, 170]   // White
        ],

        Flags = function () {
            this[BLINK]     = false;
            this[BRIGHT]    = false;
            this[INVISIBLE] = false;
            this[REVERSE]   = false;
            this[UNDERLINE] = false;
        },

        Color = function () {
            this.foreground = WHITE;
            this.background = BLACK;
        },

        Position = function () {
            this.column = 1;
            this.row = 1;
        };

    Flags.prototype.reset = function () {
        Flags.call(this);
    };


    Color.prototype.reset = function () {
        Color.call(this);
    };


    Position.prototype.reset = function () {
        Position.call(this);
    };

    Position.prototype.save = function () {
        this.saved = {column: this.column, row: this.row};
    };

    Position.prototype.load = function () {
        this.column = this.save.column;
        this.row = this.saved.row;
    };

    function canvas_supported() {
        var canvas = document.createElement('canvas'),
            context = canvas.getContext && canvas.getContext('2d');
        return typeof context.fillText === 'function';
    }

    function rgb_to_hex(rgb) {
        var hex = '#', i = 0;
        for (i = 0; i < 3; i++) {
            hex += rgb[i].toString(16).replace(/^\w$/, '0$&');
        }
        return hex;
    }

    function to_int_array(array) {
        var i = array.length;
        while (i--) {
            array[i] = parseInt(array[i], 10) || null;
        }
        return array;
    }

    ansi.draw = {

        //
        // STATE
        //
        flags: new Flags(),
        position: new Position(),
        color: new Color(),
        glyph: {
            height: 18,
            width: 10
        },

        //
        // METHODS
        //

        clear: function () {
            this.canvas.width = this.canvas.width;  // forces canvas to redraw
            this.context.fillStyle = 'black';
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        },

        reset: function () {
            this.flags.reset();
            this.color.reset();
        },

        init: function (id) {
            if (!canvas_supported()) {
                throw new Error('Browser does not support <canvas> element');
            }
            this.canvas = document.getElementById(id);
            this.context = this.canvas.getContext('2d');
            this.context.font = '18px PerfectDOSVGA437Regular'; // 18x10
            this.context.textBaseline = 'top';
        },

        esc: function () {
            var args = Array.prototype.slice.call(arguments),
                opcode = args.shift(),
                i = 0,
                max;
            switch (opcode) {
            case 'A':
                // Move up
                this.position.row -= args[0] || 1;
                break;
            case 'B':
                // Move down
                this.position.row += args[0] || 1;
                break;
            case 'C':
                // Move right
                this.position.column += args[0] || 1;
                break;
            case 'D':
                // Move left
                this.position.column -= args[0] || 1;
            case 'f':
            case 'H':
                this.position.row = args[0] || 1;
                this.position.column = args[1] || 1;
                break;
            case 's':
                this.position.save()
                break;
            case 'n':
                if (args[0] === 6) {
                    // this.write('\\x1b\\x5b' + cursor.getPosition().join(';') + 'R');
                    return;
                }
                break;
            case 'u':
                this.position.load()
                break;
            case 'm':
                for (i = 0, max = args.length; i < max; i++) {
                    // if (args[i] === null || args[i] === NONE) {
                        // this.flags.reset();
                    console.log('m: %d', args[i])
                    if (args[i] === NONE) {
                        this.flags.reset();
                    } else if (args[i] >= 30 && args[i] <= 37) {
                        this.color.foreground = args[i] - 30;
                    } else if (args[i] >= 40 && args[i] <= 47) {
                        this.color.background = args[i] - 40;
                    } else {
                        this.flags[args[i]] = true;
                    }
                }
                break;
            case 'J':
                if (args[0] === 2) {
                    this.reset();
                }
                break;
            case 'K':
                // del cur cursor to end of line
                break;
            case 'p':
            default:
                // Unimplemented
                break;
            }
        },

        parse: function (buffer) {
            var re = /(?:\x1b\x5b)([=;0-9]*)([ABCDHJKfhlmnpsu])/g,
                pos = 0,
                opcode,
                args,
                match;
            do {
                pos = re.lastIndex;
                match = re.exec(buffer);
                if (match !== null) {
                    // Everything from current index to match is literal
                    if (match.index > pos) {
                        this.write(buffer.slice(pos, match.index));
                    } else {
                        opcode = match[2];
                        args = to_int_array(match[1].split(':'));
                        this.esc(opcode, args);
                    }
                }
            } while (re.lastIndex !== 0);
            if (pos < buffer.length) {
                this.write(buffer.slice(pos));
            }
        },

        write: function (text) {
            // this.color.foreground = Math.floor(Math.random()*8); //killme
            // this.color.background = Math.floor(Math.random()*8); //killme
            var x, y, i, max, fg, bg, character;
            bg = COLORS[this.color.background];
            fg = COLORS[this.color.foreground];
            if (this.flags[BRIGHT]) {
                // If BRIGHT is on, increase intensity by 85
                for (i = 0; i < 3; i++) {
                    fg[i] += 85;
                }
            }
            this.context.fillStyle = rgb_to_hex(bg);
            // draw a rectangle and fill it with the background color. it'll be
            // the size of the text, which is probably broken since it won't
            // handle linebreaks. we can either have write trim >80 and call
            // itself recursively with the remainder or do this character by
            // character after calculating position.
            this.context.fillRect((this.position.column - 1) * this.glyph.width, (this.position.row - 1) * this.glyph.height, this.glyph.width * text.length, this.glyph.height);
            this.context.fillStyle = rgb_to_hex(fg);
            for (i = 0, max = text.length; i < max; i++) {
                character = text.charAt(i);
                if (character === '\n') {
                    this.position.row += 1;
                    this.position.column = 0;
                } else {
                    x = this.position.column * this.glyph.width;
                    y = this.position.row * this.glyph.height;
                    this.context.fillText(character, x, y);
                    if (this.position.column === 80) {
                        this.position.row++;
                        this.position.column = 0;
                    } else {
                        this.position.column++;
                    }
                }
            }
        }
    };
}());
