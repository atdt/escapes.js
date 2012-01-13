/*jslint browser: true */
/*global ansi */
"use strict";

window.onload = ansi.load('VIK.ANS', function (data) {
    console.log("hello!");
    console.log(data.length);
    ansi.acid.init(data);
});
