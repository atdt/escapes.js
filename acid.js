/*jslint browser: true, plusplus: true */
"use strict";
var ansi = ansi || {},
    acid = ansi.acid || {};

ansi.acid = acid;

acid.init = function (ans) {
    var elem = document.getElementById('term'),
        context = elem.getContext('2d'),
        text = [],
        escapes = [],
        i,
        max;

    console.log('loaded!');

    // clear to black
    context.fillStyle = '#000';
    context.fillRect(0, 0, 740, 480);

    context.font = '16px PerfectDOSVGA437Regular';
    context.fillStyle = '#aaa';
    context.textBaseline = "top";

    window.ansi.iter_tokens(ans, {
        onLiteral: function (data) {
            text.push(data);
        },
        onEscape: function (data) {
            console.log(data);
        }
    });

    for (i = 0, max = text.length; i < max; i++) {
        text[i] = text[i].text;
    }

    text = text.join('');
    context.fillText(text, 0, 0);
    // context.fillText (ans, 0, 0);
    // context.fillText ("12345678901234567890123456789012345678901234567890123456789012345678901234567890", 0, 0);
    console.log('done!');
};

(function () {
    var parseIntArray = function (array) {
            // Convert a string Array to an integer Array
            var i = array.length;
            while (i--) {
                array[i] = parseInt(array[i], 10);
            }
            return array;
        },
        Literal = function (text) {
            this.text = text;
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
                        options.onLiteral(new Literal(buffer.slice(pos, match.index)));
                    }
                    options.onEscape(new Escape(match));
                }
            } while (re.lastIndex !== 0);
            if (pos < buffer.length) {
                options.onLiteral(new Literal(buffer.slice(pos)));
            }
        };
    ansi.iter_tokens = iter_tokens;
}());
