// detect support for the canvas element and canvas text
var detect_canvas_support = function () {
    var canvas = document.createElement('canvas'),
        context = canvas.getContext && canvas.getContext('2d');
    return typeof context.fillText === 'function';
};

var rgb_to_hex = function (rgb) {
    var hex = '#', i = 0;
    for (i = 0; i < 3; i++) {
        hex += rgb[i].toString(16).replace(/^\w$/, '0$&');
    }
    return hex
};
