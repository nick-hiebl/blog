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

class SortingInstance {
    constructor(sortName, data, Sort) {
        this.sortName = sortName;
        this.data = data.slice();

        this.min = Math.min(...this.data);
        this.max = Math.max(...this.data);

        this.sort = new Sort(this.data);

        this.canvas = Canvas.create(1000, 500);
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
        const unitHeight = this.canvas.height / this.max;
        const inset = 1;

        const fillBar = i => {
            this.canvas.drawRoundedRectangle(
                i * sliceWidth + inset,
                this.canvas.height - this.data[i] * unitHeight + inset,
                sliceWidth - 2 * inset,
                this.data[i] * unitHeight - 2 * inset,
                { all: 5 },
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

        // const text = `Nodes explored: ${this.sort.visited.size}`;
        // ctx.font = '24px Segoe UI';
        // ctx.fillStyle = 'white';
        // const y = this.canvas.height - 40;
        // ctx.fillText(text, 4, y);
        // ctx.fillText(`Path length: ${this.sort.trail.length}`, 290, y);
        // const structure = this.strategy === 'dfs' ? 'Stack' : 'Queue';
        // ctx.fillText(`${structure} size: ${this.sort.queue.length}`, 550, y);
    }
}

const mainFunction = () => {
    const canvas = Canvas.fromId('canvas');
    const width = canvas.width;
    const height = canvas.height;

    const data = new Array(50).fill(0).map((_, index) => index + 5);
    shuffle(data);

    const sorts = [
        new SortingInstance('bubble', data, Bubble),
        // new SortingInstance('bubble', data, Bubble),
        // new SortingInstance('bubble', data, Bubble),
        // new SortingInstance('bubble', data, Bubble),
    ];

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
