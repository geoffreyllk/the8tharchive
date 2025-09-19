// touchstart mobile ui
(function () {
    const docEl = document.documentElement;

    function enableTouchMode() {
        docEl.classList.remove('no-touch');
        docEl.classList.add('touch');
    }

    function enableNoTouchMode() {
        docEl.classList.remove('touch');
        docEl.classList.add('no-touch');
    }
    
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        enableTouchMode();
    } else {
        enableNoTouchMode();
    }

    let lastTouchTime = 0;

    window.addEventListener('touchstart', () => {
        lastTouchTime = Date.now();
        enableTouchMode();
    }, true);

    window.addEventListener('mousemove', () => {
        if (Date.now() - lastTouchTime > 500) {
            enableNoTouchMode();
        }
    }, true);
})();
