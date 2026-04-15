function shuffle(array) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
}

const TEXT_HEIGHT = 28;

class SortingInstance {
    constructor(sortName, data, Sort) {
        this.sortName = sortName;
        this.data = data.slice();

        this.min = Math.min(...this.data);
        this.max = Math.max(...this.data);

        this.sort = new Sort(this.data);

        this.canvas = Canvas.create(1000, 400 + TEXT_HEIGHT);
    }

    update() {
        if (this.sort.paused) {
            return;
        }

        if (!this.sort.done) {
            this.sort.step();
        }
    }

    draw() {
        const ctx = this.canvas.ctx;

        ctx.fillStyle = 'black';

        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const sliceWidth = this.canvas.width / this.data.length;
        const unitHeight = (this.canvas.height - TEXT_HEIGHT) / this.max;
        const inset = 0;

        const fillBar = i => {
            // this.canvas.drawRoundedRectangle(
            //     i * sliceWidth + inset,
            //     (this.canvas.height - TEXT_HEIGHT) - this.data[i] * unitHeight + inset,
            //     sliceWidth - 2 * inset,
            //     this.data[i] * unitHeight - 2 * inset,
            //     { all: 5 },
            // );
            ctx.rect(
                i * sliceWidth,
                (this.canvas.height - TEXT_HEIGHT) - this.data[i] * unitHeight,
                sliceWidth - inset,
                this.data[i] * unitHeight,
            );
        };

        ctx.fillStyle = 'white';
        ctx.beginPath();
        for (let i = 0; i < this.data.length; i++) {
            fillBar(i);
        }
        ctx.fill();

        for (const { color, index } of this.sort.specialColumns()) {
            ctx.fillStyle = color;
            ctx.beginPath();
            fillBar(index);
            ctx.fill();
        }

        ctx.font = '20px Segoe UI';
        ctx.fillStyle = 'white';
        const y = this.canvas.height - 4;
        ctx.fillText(this.sort.name, 10, y);
        ctx.fillText(`Comparisons: ${this.sort.comparisons}`, 440, y);
        ctx.fillText(`Swaps: ${this.sort.swaps}`, 880, y);
    }
}

const mainFunction = () => {
    const canvas = Canvas.fromId('canvas');
    const width = canvas.width;
    const height = canvas.height;

    const data = new Array(500).fill(0).map((_, index) => index + 5);
    shuffle(data);

    const sorts = [
        new SortingInstance('bubble', data, Selection),
        new SortingInstance('bubble', data, Bubble),
        new SortingInstance('bubble', data, Insertion),
        new SortingInstance('bubble', data, Quick),
        // new SortingInstance('bubble', data, Bubble),
        // new SortingInstance('bubble', data, Bubble),
        // new SortingInstance('bubble', data, Bubble),
    ];

    window.sorts = sorts;

    sorts.forEach(pf => {
        document.getElementById(pf.sortName).appendChild(pf.canvas.canvas);
        pf.canvas.canvas.setAttribute('width', pf.canvas.width);
    });

    const mainDraw = () => {
        const ctx = canvas.ctx;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);

        // const bestScore = sorts.reduce((best, pf) => {
        //     if (pf.sort.done) {
        //         return Math.min(best, pf.search.trail.length);
        //     }
        //     return best;
        // }, Infinity);

        for (let i = 0; i < sorts.length; i++) {
            const pf = sorts[i];
            pf.draw();

            // if (pf.sort.done) {
            //     if (pf.sort.trail.length === bestScore) {
            //         pf.canvas.canvas.classList.add('winner');
            //     } else {
            //         pf.canvas.canvas.classList.remove('winner');
            //         pf.canvas.canvas.classList.add('loser');
            //     }
            // } else if (pf.sort.backtracking && pf.sort.trail.length > bestScore) {
            //     pf.canvas.canvas.classList.remove('winner');
            //     pf.canvas.canvas.classList.add('loser');
            // }
        }
    };

    let lastTime = null;

    let firstLoop = true;

    const mainLoop = () => {
        const now = performance.now();

        const elapsed = now - lastTime;

        mainDraw(elapsed);

        lastTime = now;

        if (firstLoop) {
            setTimeout(() => {
                firstLoop = false;
                lastTime = performance.now();

                requestAnimationFrame(mainLoop);
            }, 20);
        } else {
            requestAnimationFrame(mainLoop);
        }
    };

    setTimeout(() => {
        lastTime = performance.now();
        requestAnimationFrame(mainLoop);

        setInterval(() => {
            sorts.forEach(pf => pf.update());
        }, 50);
    }, 100);

    const button = document.getElementById('click-me');
    button.addEventListener('click', () => {
        sorts.forEach(pf => {
            pf.sort.paused = false;
        });
    });
    document.getElementById('pause-on-every').addEventListener('change', e => {
        pauseOnEvery = e.currentTarget.checked;
    });
};

document.addEventListener('DOMContentLoaded', mainFunction);
