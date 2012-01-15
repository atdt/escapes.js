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
        ];

    function Flags() {
        this[BLINK] = false;
        this[BRIGHT] = false;
        this[INVISIBLE] = false;
        this[REVERSE] = false;
        this[UNDERLINE] = false;
    }

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

    function to_int_array (array) {
            var i = array.length;
            while (i--) {
                array[i] = parseInt(array[i], 10);
            }
            return array;
    }

    ansi.draw = {

        //
        // STATE
        //
        flags: new Flags(),

        position: {
            column: 0,
            row: 0
        },
        color: {
            foreground: WHITE,
            background: BLACK
        },
        glyph: {
            height: 18,
            width: 10
        },

        // 
        // METHODS
        //

        reset: function () {
            var flag;
            for (flag in this.flags) {
                if (this.flags.hasOwnProperty(flag)) {
                    this.flags[flag] = false;
                }
            }
            this.color = {
                foreground: WHITE,
                background: BLACK
            };
            this.canvas.width = this.canvas.width;  // forces canvas to redraw
            this.context.fillStyle = 'black';
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
                opcode = args.shift();
            console.log(opcode, args);
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
            this.color.foreground = Math.floor(Math.random()*8); //killme
            this.color.background = Math.floor(Math.random()*8); //killme
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
            this.context.fillRect(this.position.column * this.glyph.width, this.position.row * this.glyph.height, this.glyph.width * text.length, this.glyph.height);
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
