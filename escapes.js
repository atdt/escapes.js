/*jslint browser: true, plusplus: true */
/*global ansi */
"use strict";

ansi = ansi || {};

(function () {
    var NONE      = 0x0,
        BRIGHT    = 0x1,
        UNDERLINE = 0x4,
        BLINK     = 0x5,
        REVERSE   = 0x7,
        INVISIBLE = 0x9,

        // Colors
        BLACK   = 0,
        RED     = 1,
        GREEN   = 2,
        YELLOW  = 3,
        BLUE    = 4,
        MAGENTA = 5,
        CYAN    = 6,
        WHITE   = 7,

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

    function canvas_supported() {
        var canvas = document.createElement('canvas'),
            context = canvas.getContext && canvas.getContext('2d');
        return typeof context.fillText === 'function';
    }

    function brighten(rgb) {
        var i;
        for (i = 0; i < 3; i++) {
            rgb[i] += 85;
        }
        return rgb;
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
            array[i] = parseInt(array[i], 10);
        }
        return array;
    }

    ansi.draw = {

        //
        // STATE
        //
        flags: 0x0,

        cursor: {
            column: 1,
            row: 1,
            scrolled: 0,   // Lines that scrolled off the top
            reset: function () {
                this.column = 1;
                this.row = 1;
                this.scrolled = 0;
            },
            save: function () {
                var self = this;
                self.saved = {
                    column: self.column,
                    row: self.row
                };
            },
            load: function () {
                this.column = this.saved.column;
                this.row = this.saved.row;
                delete this.saved;
            },
            move_by: function (columns, rows) {
                var amp_a = this.column;
                var amp_b = this.row;

                this.column += columns;
                this.row += rows;

                var tmp_a = this.column;
                var tmp_b = this.row;

                // Enforce boundaries
                this.column = Math.max(this.column, 1);
                this.column = Math.min(this.column, 80);
                this.row = Math.max(this.row, 1);
                this.row = Math.min(this.row, 25);

                console.log("ROW: before: %d, requested: %d, enforced: %d", amp_b, tmp_b, this.row);
                console.log("COL: before: %d, requested: %d, enforced: %d", amp_a, tmp_a, this.column);
            }
        },

        color: {
            foreground: WHITE,
            background: BLACK,
            reset: function () {
                this.foreground = WHITE;
                this.background = BLACK;
            }
        },

        glyph: {
            width: 10,
            height: 18
        },

        //
        // METHODS
        //

        clear: function () {
            this.context.fillStyle = 'black';
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.reset();
        },

        reset: function () {
            this.flags = NONE;
            this.color.reset();
            this.cursor.reset();
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

        escape: function (opcode, args) {
            var arg, i, length;
            switch (opcode) {
            case 'A':  // Cursor Up
                arg = args[0] || 1;
                this.cursor.move_by(0, -arg)
                break;

            case 'B':  // Cursor Down
                arg = args[0] || 1;
                this.cursor.move_by(0, arg)
                break;

            case 'C':  // Cursor Forward
                arg = args[0] || 1;
                this.cursor.move_by(arg, 0)
                break;

            case 'D':  // Cursor Backward
                arg = args[0] || 1;
                this.cursor.move_by(-arg, 0)
                break;

            case 'f':  // Horizontal & Vertical Position
            case 'H':  // Cursor Position
                this.cursor.row = args[0] || 1;
                this.cursor.column = args[1] || 1;
                break;

            case 's':  // Save Cursor Position
                this.cursor.save()
                break;

            case 'u':  // Restore Cursor Position
                this.cursor.load()
                break;

            case 'm':  // Set Graphics Rendition
                for (i = 0, length = args.length; i < length; i++) {
                    arg = args[i];
                    if (arg === NONE) {
                        this.flags = NONE;
                    } else {
                        switch (Math.floor(arg / 10)) {
                        case 0:
                            this.flags |= arg;
                            break;
                        case 3:
                            this.color.foreground = arg - 30;
                            break;
                        case 4:
                            this.color.background = arg - 40;
                            break;
                        }
                    }
                }
                break;

            case 'J':  // Erase Display
                if (args[0] === 2) {
                    this.reset();
                }
                break;

            case 'K':  // Erase Line
                // del cur cursor to end of line
                break;

            case 'h':  // Set Mode
            case 'p':  // Keyboard
            default:
                // Unimplemented
                break;
            }
        },

        parse: function (buffer) {
            var re = /(?:\x1b\x5b)([=;0-9]*?)([ABCDHJKfhlmnpsu])/gm,
                pos = 0,
                opcode,
                args,
                match,
                yielded = 0;
            do {
                pos = re.lastIndex;
                match = re.exec(buffer);
                if (match !== null) {
                    // Everything from current index to match is literal
                    if (match.index > pos) {
                        this.write(buffer.slice(pos, match.index));
                        yielded += (match.index - pos);
                    } else {
                        yielded += match[0].length;
                        opcode = match[2];
                        args = to_int_array(match[1].split(';'));
                        this.escape(opcode, args);
                    }
                }
            } while (re.lastIndex !== 0);
            if (pos < buffer.length) {
                this.write(buffer.slice(pos));
                yielded += buffer.length - pos;
            }
            console.log('yielded: %d, length: %d', yielded, buffer.length);
        },

        write: function (text) {
            var x, y, i, length, fg, bg, character, cursor = this.cursor, CR = '\r', LF = '\n';

            fg = COLORS[this.color.foreground];
            if (this.flags & BRIGHT) {
                fg = brighten(fg);
            }

            bg = COLORS[this.color.background];
            if (this.flags & BLINK) {
                bg = brighten(bg);
            }

            // this.context.fillStyle = rgb_to_hex(bg);
            // draw a rectangle and fill it with the background color. it'll be
            // the size of the text, which is probably broken since it won't
            // handle linebreaks. we can either have write trim >80 and call
            // itself recursively with the remainder or do this character by
            // character after calculating position.
            // this.context.fillRect((cursor.column - 1) * this.glyph.width, (cursor.row - 1) * this.glyph.height, this.glyph.width * text.length, this.glyph.height);
            this.context.fillStyle = rgb_to_hex(fg);

            for (i = 0, length = text.length; i < length; i++) {
                character = text.charAt(i);
                switch (character) {
                case '\r':
                    cursor.column = 1;
                    break;

                case '\n':
                    cursor.row++;
                    // debugger;
                    break;

                default:
                    if (character !== ' ') {
                        x = (cursor.column - 1) * this.glyph.width;
                        y = (cursor.row + cursor.scrolled - 1) * this.glyph.height;
                        this.context.fillText('X', x, y);
                    }

                    if (cursor.column === 80) {
                        cursor.column = 1;
                        cursor.row++;
                        // debugger;
                    } else {
                        cursor.column++;
                    }
                    break;
                }

                if (cursor.row > 25) {
                    cursor.scrolled = cursor.row - 25;
                    cursor.row = 25;
                }
                if (cursor.row > 25 || cursor.column > 80) {
                    console.log('wtf!!!!');
                }
                if (cursor.row < 1 || cursor.column < 1) {
                    console.log('>:-O');
                }
            }
        }
    };
}());
