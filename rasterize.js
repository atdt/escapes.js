var rasterize_font = function () {
    var canvas = document.createElement('canvas'),
        context = canvas.getContext('2d'),
        width = 100,
        height = 180,
        chars = [],
        total_width,
        i;
    console.log('ready to work!');
    context.font = height + 'px PerfectDOSVGA437Regular, monospace;';
    context.textBaseline="alphabetic"; // alphabetic, top, bottom, middle
    context. textAlign="left"; // left, right, middle, start, end
    for (i = 33; i < 256; i++) {
        chars.push(i);
    }
    chars = String.fromCharCode.apply(null, chars);
    total_width = context.measureText(chars).width;
    // var x = [];
    // for (i = 33; i < 256; i++)
    //     x.push(context.measureText(String.fromCharCode(i)));
    // console.log(x);
    canvas.height = height;
    canvas.width = total_width;

    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = width + 'px PerfectDOSVGA437Regular, monospace;';
    context.textBaseline="alphabetic"; // alphabetic, top, bottom, middle
    context. textAlign="left"; // left, right, middle, start, end
    // context.textBaseline = 'top';
    context.fillStyle = 'black';
    context.fillText(chars, 0, 0);
    document.write('<img src="' + canvas.toDataURL("image/png") + '">');
    console.log('text width: %d, num chars: %d, canvas width: %d, total / chars: %d', width, chars.length, canvas.width, (canvas.width / chars.length))
}

$(window.setTimeout(rasterize_font, 5000));
