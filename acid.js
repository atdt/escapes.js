/*jslint browser: true, plusplus: true */
"use strict";


var NONE = 0,
    HIGH_INTENSITY = 1,
    UNDERLINE = 4,
    BLINK = 5,
    REVERSE = 7,
    INVISIBLE = 9;

var BLACK = 0,
    RED = 1,
    GREEN = 2,
    YELLOW = 3,
    BLUE = 4,
    MAGENTA = 5,
    CYAN = 6,
    WHITE = 7;


var COLORS = [
    [0, 0, 0],        // Black
    [170, 0, 0],      // Red
    [0, 170, 0],      // Green
    [170, 85, 0],     // Yellow
    [0, 0, 170],      // Blue
    [170, 0, 170],    // Magenta
    [0, 170, 170],    // Cyan
    [170, 170, 170]   // White
];

var ansi = ansi || {},
    acid = ansi.acid = ansi.acid || {};

var acid = function (el) {
    var self = {},
        canvas = el,
        context = canvas.getContext('2d'),
        color = {},
        flags = {},
        glyph = {},
        position = {};


    function get_cursor_location () {
        return [(glyph.width * (position.column - 1)), (glyph.height * (position.row - 1)];
    }
        glyph.height * (
    var cursor_to_px = function (column, row) {
        return [(glyph_width * (column - 1)), (glyph_height * (row - 1))];
    }

    self.reset = function () {
        color.foreground = WHITE;
        color.background = BLACK;
    };

    self.set_attribute = function (attr, value) {
        return self.flags[attr] = !!value;
    }

        value = !!value;

    color = {
        foreground: WHITE,
        background: BLACK
    };
};

acid.init = function (ans) {
    var canvas = document.getElementById('term'),
        context = canvas.getContext('2d'),
        text = [],
        escapes = [],
        i,
        max;


    var glyph_height = 18,
        glyph_width = 10;

        

    // clear to black
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = '18px PerfectDOSVGA437Regular'; // 18x10
    context.fillStyle = '#aaa';
    context.textBaseline = "top";

    window.ansi.iter_tokens(ans, {
        onLiteral: function (data) {
            text.push(data);
        },
        onEscape: function (data) {
            return;
        }
    });

    for (i = 0, max = text.length; i < max; i++) {
        text[i] = text[i].text;
    }

    var set_color = function(color) {
        context.fillStyle = rgb_to_hex(COLORS[color]);
    };

    text = text.join('');
    // context.fillText(text, 0, 0);
    // context.fillText (ans, 0, 0);
    var coord = cursor_to_px(2,2);
    set_color(RED);

    console.clear();
    var measure = context.measureText(Array(80).join('X'), 0, 0);
    console.log("measure: %d", measure.width);

    // context.fillText("12345678901234567890123456789012345678901234567890123456789012345678901234567890", 0, 0);
    // context.fillText("Hello, world!", coord[0], coord[1]);
    // context.fillText('H', coord[0], coord[1]);
    console.log('done!');
};
