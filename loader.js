/*jslint browser: true */
"use strict";
var ansi = ansi || {};

ansi.load = function (url, charset, callback) {
    var req = new window.XMLHttpRequest();

    if (typeof callback === 'undefined') {
        callback = charset;
        charset = 'ibm437';
    }
    req.overrideMimeType('text/plain; charset=' + charset);
    req.onreadystatechange = function () {
        var LOADED = 4,
            OK = 200;
        if (req.readyState === LOADED) {
            if (req.status === OK) {
                callback(req.responseText);
            } else {
                throw new Error('load(): request failed.');
            }
        }
    };
    req.open('GET', url, true);
    req.send(null);
};
