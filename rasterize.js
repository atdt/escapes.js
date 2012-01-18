var rasterize_font = function () {
    var canvas = document.createElement('canvas'),
        context = canvas.getContext('2d'),
        width = 100,
        height = 180,
        chars = [],
        i;
    console.log('ready to work!');
    context.font = width + 'px PerfectDOSVGA437Regular';
    for (i = 33; i < 256; i++) {
        chars.push(i);
    }
    chars = String.fromCharCode.apply(null, chars);
    canvas.width = context.measureText(chars).width;

    console.log('blargh');
    console.log(context.font);
    console.log("calculated! %d", canvas.width);
    canvas.height = height;
    context.font = width + 'px PerfectDOSVGA437Regular';
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.textBaseline = 'top';
    context.fillStyle = 'black';
    context.fillText(chars, 0, 0);
    document.write('<img src="' + canvas.toDataURL("image/png") + '">');
}

$(window.setTimeout(rasterize_font, 5000));
