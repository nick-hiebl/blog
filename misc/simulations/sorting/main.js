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

function roughShuffle(array, maxStep) {
    for (let i = 0; i < array.length - maxStep; i++) {
        // Pick a remaining element...
        const randomIndex = Math.floor(Math.random() * maxStep + i);

        // And swap it with the current element.
        [array[i], array[randomIndex]] = [
            array[randomIndex], array[i]];
    }
}

function randInt(lo, hi) {
    return Math.floor(lo + Math.random() * (hi - lo));
}

function sortChunks(array, minChunk, maxChunk) {
    let i = 0;
    while (i + maxChunk < array.length) {
        const chunkSize = randInt(minChunk, maxChunk);

        quickSort(array, i, i + chunkSize);
        i += chunkSize;
    }

    if (i < array.length) {
        quickSort(array, i, array.length);
    }
}

const TEXT_HEIGHT = 28;
const FRAME_DUR = 250;
const WIDTH = 1200;
const HEIGHT = 700;
const NUM_ITEMS = 12;

class SortingInstance {
    constructor(sortName, data, Sort) {
        this.sortName = sortName;
        this.data = data.slice();

        this.min = Math.min(...this.data);
        this.max = Math.max(...this.data);

        this.sort = new Sort(this.data);

        this.canvas = Canvas.create(WIDTH, HEIGHT + TEXT_HEIGHT);

        this.channel = new Channel('sine');
    }

    update() {
        if (this.sort.paused) {
            return;
        }

        if (!this.sort.doneWalking) {
            this.sort.update();
            const noteIndex = this.sort.noteIndex();
            if (this.data[noteIndex]) {
                this.channel.playNote(this.data[noteIndex] / this.max, FRAME_DUR, 0.02);
            }
        }
    }

    draw() {
        const ctx = this.canvas.ctx;

        ctx.fillStyle = 'black';

        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.sort.draw) {
            this.sort.draw(this.canvas, ctx, this.canvas.width, this.canvas.height - TEXT_HEIGHT);
            return;
        }

        const sliceWidth = this.canvas.width / this.data.length;
        const unitHeight = (this.canvas.height - TEXT_HEIGHT) / this.max;
        const inset = 0;

        const fillBar = i => {
            const x = i * sliceWidth;
            const y = (this.canvas.height - TEXT_HEIGHT) - this.data[i] * unitHeight;
            /* Draw as rounded rectangles */
            // this.canvas.drawRoundedRectangle(
            //     i * sliceWidth + inset,
            //     (this.canvas.height - TEXT_HEIGHT) - this.data[i] * unitHeight + inset,
            //     sliceWidth - 2 * inset,
            //     this.data[i] * unitHeight - 2 * inset,
            //     { all: 5 },
            // );
            /* Draw as perfect rectangles */
            ctx.rect(
                x,
                y,
                sliceWidth - inset,
                this.data[i] * unitHeight,
            );
            /* Draw as circles */
            // ctx.moveTo(x, y);
            // ctx.ellipse(x, y, sliceWidth * 2, sliceWidth * 2, 0, 0, 2 * Math.PI);
        };

        ctx.fillStyle = 'white';
        ctx.beginPath();
        for (let i = 0; i < this.data.length; i++) {
            fillBar(i);
        }
        ctx.fill();

        for (const { color, index } of this.sort.getColumns()) {
            ctx.fillStyle = color;
            ctx.beginPath();
            fillBar(index);
            ctx.fill();
        }

        this.sort.postDraw?.(this.canvas, sliceWidth, unitHeight, this.min, this.max);

        ctx.font = '20px Segoe UI';
        ctx.fillStyle = 'white';
        const y = this.canvas.height - 4;
        ctx.fillText(this.sort.name, 10, y);
        ctx.fillText(`Comparisons: ${this.sort.comparisons}`, 1460, y);
        ctx.fillText(`Swaps: ${this.sort.swaps}`, 1680, y);
    }
}

const mainFunction = () => {
    const canvas = Canvas.fromId('canvas');
    const width = canvas.width;
    const height = canvas.height;

    const data = new Array(NUM_ITEMS).fill(0).map((_, index) => index + 1);
    shuffle(data);
    // data.reverse();
    // roughShuffle(data, 10);
    // sortChunks(data, 10, 20);

    const sorts = [
        // new SortingInstance('bubble', data, Bubble),
        // new SortingInstance('bubble', data, Cocktail),
        // new SortingInstance('bubble', data, OddEven),
        // new SortingInstance('bubble', data, Comb),
        // new SortingInstance('bubble', data, Selection),
        // new SortingInstance('bubble', data, Insertion),
        // new SortingInstance('bubble', data, Merge),
        // new SortingInstance('bubble', data, Quick),
        // new SortingInstance('bubble', data, Heap),
        new SortingInstance('bubble', data, Wizard),
    ];

    // sorts[1].sort.name = 'Best-of-3 Quicksort';
    // sorts[1].sort.bestOf3 = true;

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
        }, FRAME_DUR);
    }, 100);

    const unpause = () => {
        sorts.forEach(pf => {
            pf.sort.paused = false;
        });
    };

    const button = document.getElementById('click-me');
    button.addEventListener('click', () => {
        unpause();
    });
    document.addEventListener('keydown', e => {
        if (e.key === ' ') {
            unpause();
        }
    });
    document.getElementById('pause-on-every').addEventListener('change', e => {
        pauseOnEvery = e.currentTarget.checked;
    });
};

document.addEventListener('DOMContentLoaded', mainFunction);
