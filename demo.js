// Shuffle array, by Christoph of StackOverflow
// See http://stackoverflow.com/a/962890/582542
$.shuffle = function (array) {
    var tmp, current, top = array.length;

    if (top) {
        while(--top) {
            current = Math.floor(Math.random() * (top + 1));
            tmp = array[current];
            array[current] = array[top];
            array[top] = tmp;
        }
    }
    return array;
};

// Trigger a custom event ('bottomed') on document
// when user has scrolled to the bottom.
$(function () {
    var $doc = $(document),
        cooldown = false;

    function getScrollRemaining() {
        return Math.abs(window.innerHeight + $doc.scrollTop() - $doc.height());
    }

    $(window).on('scroll', function() {
        if (!(cooldown) && getScrollRemaining() < 400) {
            cooldown = true;
            $doc.trigger('bottomed');
            window.setTimeout(function () {
                cooldown = false;
            }, 750);
        }
    });
});

$(function () {
    var job = $.Deferred().resolve(),
        demo_ansi = $.ansiRender('ansis/shnya-01.ans'),
        loading = new CanvasLoader('loader');
        files = $.shuffle([
            'agt77-01',  'ans-50a',   'ans-50c',   'ansi0796',  'ar-prlx2',
            'asoap-07',  'asx-acid',  'bc-deep4',  'co-clock',  'corin-01',
            'corin-04',  'corin-07',  'gs-acid',   'gs-shad1',  'km-fifty',
            'ks-ic1',    'ky-logo3',  'logo0495',  'may-acid',  'multi-03',
            'multi-05',  'multi-08',  'multi-10',  'ns-east',   'scrup-0b',
            'sgi-03',    'tt-soh',    'txt-rz'
        ]);

    function loadAnother() {
        if (job.state() !== 'pending' && files.length !== 0) {
            loading.show();
            job = $.ansiRender('ansis/' + files.pop() + '.ans');
            job.done(appendLoaded);
        }
    }

    function appendLoaded() {
        loading.hide();
        $(this.toImageTag()).hide().addClass('ansi').insertBefore(loading.mum).fadeIn('slow');
    }

    loading.setColor('#ffffff');

    $('.tryit').one('click', function () {
        demo_ansi.done(appendLoaded);
        $(document).on('bottomed', loadAnother);
    });

});
