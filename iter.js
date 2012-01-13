/*jslint plusplus: true*/
// init code
"use strict";
var fs = require('fs');
var _ = require('underscore');
var buffer = fs.readFileSync('ROY-500N.ANS', 'ascii');

(function () {
    var root = this;


    literal.prototype.init = function (match) {
        this.text = text;
    }

    var iter_tokens = function (buffer, options) {
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
        } while(re.lastIndex !== 0);
        if (pos < buffer.length) {
             onLiteral(new Literal(buffer.slice(pos)));
        }
    };

    // Convert a string Array to an integer Array
    function parseIntArray (array) {
        var i = array.length;
        while (i--) {
            array[i] = parseInt(array[i], 10);
        }
        return array;
    };

    
    var Literal = function (text) {
        this.text = text;
    };

    var Escape = function (match) {
        this.opcode = match[2];
        this.args = toIntArray(match[1].split(';'));
    };


    global.ansi = {};
    global.ansi.tokenize = tokenize

}.call(this));

ansi.tokenize(buffer, function (esc) {
    console.log("escape sequence: %s", esc);
},

function (lit) {
    console.log("literal: %s", lit);
});
