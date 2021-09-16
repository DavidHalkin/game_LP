new RoadMap();

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
