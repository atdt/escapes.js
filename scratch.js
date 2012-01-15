/*jslint browser: true */
/*global ansi */
"use strict";

window.onload = window.setTimeout(function () {
    ansi.load('static/VIK.ANS', function (data) {
        console.log("hello!");
        console.log(data.length);
        ansi.acid.init(data);
    });
});
