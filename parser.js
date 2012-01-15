/*jslint browser: true, plusplus: true */
"use strict";
var ansi = ansi || {};

(function () {
    var parseIntArray = function (array) {
            // Convert a string Array to an integer Array
            var i = array.length;
            while (i--) {
                array[i] = parseInt(array[i], 10);
            }
            return array;
        },
        Escape = function (match) {
            this.opcode = match[2];
            this.args = parseIntArray(match[1].split(';'));
        },
        iter_tokens = function (buffer, options) {
            var re = /(?:\x1b\x5b)([=;0-9]*)([ABCDHJKfhlmnpsu])/g,
                pos = 0,
                match;
            do {
                pos = re.lastIndex;
                match = re.exec(buffer);
                if (match !== null) {
                    // Everything from current index to match is literal
                    if (match.index > pos) {
                        options.onLiteral(buffer.slice(pos, match.index));
                    }
                    options.onEscape(new Escape(match));
                }
            } while (re.lastIndex !== 0);
            if (pos < buffer.length) {
                options.onLiteral(buffer.slice(pos));
            }
        };
    ansi.iter_tokens = iter_tokens;
}());
