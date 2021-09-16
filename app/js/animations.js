new RoadMap();
controlAsideDecor();

function RoadMap() {

    const mask = document.querySelector('#pathmask');
    const pathLength = 5280;

    let progress = 0;

    let time = setInterval(() => {

        const maskLength = pathLength * (1 - progress);
        mask.setAttribute('stroke-dashoffset', maskLength);
        progress += 0.001;
        if (progress >= 1) clearInterval(time);

    }, 16);

}
function controlAsideDecor() {

    const BREAKPOINT = 1280;
    const postItems = document.querySelectorAll('.post_item');

    if (window.matchMedia(`(max-width: ${BREAKPOINT}px)`).matches) {
        move('in');
    } else {
        move('out');
    }

    window.matchMedia(`(max-width: ${BREAKPOINT}px)`).onchange = condition => {
        if (condition.matches) return move('in');
        move('out');
    }

    function move(direction) {

        postItems.forEach(item => {

            const decor = item.querySelector('.img_decor');
            let textCont = item.querySelector('.text_cont');

            if (direction === 'in') return textCont.appendChild(decor);
            item.appendChild(decor);

        });

    }

}
