/*jslint browser: true, plusplus: true */
"use strict";
var ansi = ansi || {},
    acid = ansi.acid || {};

ansi.acid = acid;

acid.init = function (ans) {
    window.setTimeout(function () {
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
                return;
            }
        });

        for (i = 0, max = text.length; i < max; i++) {
            text[i] = text[i].text;
        }

        text = text.join('');
        // context.fillText(text, 0, 0);
        // context.fillText (ans, 0, 0);
        context.fillText ("12345678901234567890123456789012345678901234567890123456789012345678901234567890", 0, 0);
        console.log('done!');
    }, 2500);
};
