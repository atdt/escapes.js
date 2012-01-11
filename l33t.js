/*jslint plusplus: true*/
// init code
"use strict";
var fs = require('fs');
var buffer = fs.readFileSync('ROY-500N.ANS', 'ascii');

var i, max;

var each = function (array, callback) {
    var i, max;
    //= 0, max = array.length;

    for (i = 0, max = array.length; i < max; i++) {
        callback(i, array[i]);
    }
};

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

var MODES = [
    // [Columns, Rows, Color?]
    [40, 25, 0],
    [40, 25, 1],
    [80, 25, 0],
    [80, 25, 1],
    [320, 200, 1],
    [320, 200, 0],
    [640, 200, 0]
];

var Cursor = function () {

    var self = {},
        stack = [],
        row = 1,
        column = 1,
        fg_color = 7,
        bg_color = 0,
        mode = 3,
        state = {},
        wrap = false;


    self.write = function () {
        return;
    };

    self.pushPosition = function () {
        stack.push([column, row]);
        return self;
    };

    self.popPosition = function () {
        var stored_position = stack.pop();
        if (typeof stored_position !== 'undefined') {
            column = stored_position[0];
            row = stored_position[1];
        }
        return self;
    };

    self.setPosition = function (new_column, new_row) {
        column = new_column;
        row = new_row;
        return self;
    };

    self.getPosition = function () {
        return [column, row];
    };

    self.moveBy = function (column_offset, row_offset) {
        column += column_offset;
        row += row_offset;
        return self;
    };

    self.setForegroundColor = function (color) {
        fg_color = color;
        return self;
    };

    self.setBackgroundColor = function (color) {
        bg_color = color;
        return self;
    };

    self.resetAttributes = function () {
        fg_color = 7;
        bg_color = 0;
        state = [];
        return self;
    };

    self.clearScreen = function () {
        // TODO
        return self;
    };

    self.eraseToEndOfLine = function () {
        // TODO
        return self;
    };


    self.setAttribute = function (attribute) {
        var property;

        if (typeof attribute === 'undefined' || attribute !== NONE) {
            self.resetAttributes();
        } else if (attribute >= 30 && attribute <= 37) {
            fg_color = attribute - 30;
        } else if (attribute >= 40 && attribute <= 47) {
            bg_color = attribute - 40;
        } else {
            state[attribute] = true;
        }
        return self;
    };

    self.setMode = function (target_mode) {
        if (target_mode === 7) {
            wrap = true;
        } else {
            mode = target_mode;
        }
        return self;
    };

    self.setLineWrap = function (bool) {
        wrap = bool;
        return self;
    };

    self.resetAttributes();
    return self;
};

var cursor = new Cursor();

var parsed = buffer.split(/\x1b\x5b([=;0-9]*)([ABCDHJKfhlmnpsu])/);
var i, max, row, column, columns, rows, args;

for (i = 1, max = parsed.length; i < max; i += 3) {

    var args = parsed[i].split(';'),
        opcode = parsed[i + 1],
        text = parsed[i + 2],
        j = args.length;

    while (j--) {
        args[j] = parseInt(args[j], 10);
    }

    switch (opcode) {
    case 'A':
        rows = args.length ? args[0] : 1;
        cursor.moveBy(0, -rows);
        break;
    case 'B':
        rows = args.length ? args[0] : 1;
        cursor.moveBy(0, rows);
        break;
    case 'C':
        columns = args.length ? args[0] : 1;
        cursor.moveBy(columns, 0);
        break;
    case 'D':
        columns = args.length ? args[0] : 1;
        cursor.moveBy(-columns, 0);
        break;
    case 'f':
    case 'H':
        row = args.length ? (args[0] || 1) : 1;
        column = args.length === 2 ? (args[1] || 1) : 1;
        cursor.setPosition(row, column);
        break;
    case 's':
        cursor.pushPosition();
        break;
    case 'n':
        if (args[0] === 6) {
            cursor.write('\x1b\x5b' + cursor.getPosition().join(';') + 'R');
        }
        break;
    case 'u':
        cursor.popPosition();
        break;
    case 'm':
        each(args, function (index, value) {
            cursor.setAttribute(value);
        });
        break;
    case 'J':
        if (args[0] === 2) {
            cursor.clearScreen();
        }
        break;
    case 'K':
        cursor.eraseToEndOfLine();
        break;
    case 'p':
    default:
        // Unimplemented
        break;
    }
}
