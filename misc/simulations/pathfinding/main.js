const TIME_TO_MOVE = 40;

const keyboardMap = {};
const mouse = { x: 0, y: 0 };

const beepChannel = new Channel('sine');

const addCoord = (a, b) => {
    return { x: a.x + b.x, y: a.y + b.y };
};

const getKeyboardMove = () => {
    if (keyboardMap['w']) {
        return { x: 0, y: -1 };
    } else if (keyboardMap['a']) {
        return { x: -1, y: 0 };
    } else if (keyboardMap['s']) {
        return { x: 0, y: 1 };
    } else if (keyboardMap['d']) {
        return { x: 1, y: 0 };
    }
};

const coordToInt = (grid, cell) => {
    return grid[0].length * cell.y + cell.x;
};

const intToCoord = (grid, int) => {
    return {
        x: int % grid[0].length,
        y: Math.floor(int / grid[0].length),
    };
};

const isEdge = (grid, pos) => {
    return getNeighbours(grid, pos).length < 4;
};

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

const clearBoardOfId = (grid, id) => {
    for (const row of grid) {
        for (const cell of row) {
            if (!cell) continue;

            if (cell.claimed === id) {
                cell.claimed = null;
                cell.deathAnim = 1;
                cell.claimAnim = 0;
            }

            if (cell.claiming === id) {
                cell.claiming = null;
                cell.deathAnim = 1;
                cell.claimAnim = 0;
            }
        }
    }
};

const manhattanDist = (pos1, pos2) => {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
};

const SHAPE = `
               XXX       XX
               X-XXX     XX
              X----X     X-X
             X-----X     X--X
          XXX-0----X     X--X
         X----------XX   X---X
        X-------------XXX----X
       X---------------------X
       X----------------------XX
      X-------------------------X
     X--------------------------X
   XX----------------------------X
  X-------------------------------X
 X---------------------------------X
X------------------V---------------X
X----------------------------------X
X-----------------------------------X
X-----------------------------------X
X----------------------------------X
 X---------------------------------X
  X------------XXX-----------------X
  X---------XXX   X---------------X
   X-------X       X-X-----------X
   X----XXX         XXX----------X
    X--X              XX---------X
    XXX                 X-------X
                        XX-----XX
                          XXXXX
                            XXX
                            X6XX
                             XXX
                             XX
`;

const SHAPE2 = `
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
X-----------------------------------X
X-----------------------------------X
X-----------------------------------X
X-----------------------------------X
X-----------------------------------X
X-----------------------------------X
X-----------------------------------X
X-----------------------------------X
X-----------------V-----------------X
XXXXXXXX---------------------XXXXXXXX
       X---------------------X
       X---------------------X
       XXXXXXXXXXX-XXXXXXXXXXX
                 X-X
             XXXXX-X
             X-----X
             X-XXXXX
             X-X
             X-XXXXX
             X-----X
             XXXXX-X
                 X-X
                XX-XX
                X---X
                X-0-X
                X---X
                XXXXX
`;

const NAMES = ['aa']; // Value doesn't matter, we just need an index of 0 in this array.

const createGridFromShape = (shape, names) => {
    const procShape = shape.split('\n').filter(v => !!v);

    const height = procShape.length;
    const width = procShape.reduce((widest, row) => {
        if (row.length > widest) {
            return row.length;
        }
        return widest;
    }, 0);

    const grid = [];
    let cells = 0;
    const spawnSpots = [];

    for (let r = 0; r < height; r++) {
        const row = [];
        grid.push(row);

        for (let c = 0; c < width; c++) {
            const letter = procShape[r][c];
            if (letter in names) {
                spawnSpots.push({ x: c, y: r, name: names[letter] });
            } else if (letter === 'V') {
                grid.endSpot = { x: c, y: r };
            }

            if (letter && letter !== ' ') {
                row.push({
                    claimed: null,
                    claiming: null,
                });
                cells++;
            } else {
                row.push(null);
            }
        }
    }

    grid.fullSize = cells;

    return { grid, spawnSpots };
};

const createGrid = (width, height) => {
    const grid = [];

    let cells = 0;

    const center = {
        x: width / 2,
        y: height / 2,
    };

    grid.endSpot = { x: Math.floor(width / 2), y: Math.floor(height / 2) };

    for (let r = 0; r < height; r++) {
        const row = [];
        grid.push(row);

        for (let c = 0; c < width; c++) {
            const d = euclideanDistance({ x: c + 0.5, y: r + 0.5 }, center);
            if (d > width * 0.5) {
                row.push(null);
            } else {
                row.push({
                    claimed: null,
                    claiming: null,
                });
                cells += 1;
            }
        }
    }

    grid.fullSize = cells;

    return { grid, spawnSpots: [] };
};

const GRID_SCALE = 10;

const ZOOM = 2;

const TEXT_SPACE = 36;

class PathfindingInstance {
    constructor(strategy, worldParams) {
        this.strategy = strategy;

        const { grid, spawnSpots } = createGridFromShape(worldParams.shape, worldParams.names);
        this.grid = grid;

        this.gameWidth = grid[0].length;
        this.gameHeight = grid.length;

        this.canvas = Canvas.create(
            this.gameWidth * GRID_SCALE * ZOOM,
            this.gameHeight * GRID_SCALE * ZOOM + TEXT_SPACE * ZOOM,
        );

        this.start = worldParams.start ?? spawnSpots[0];
        this.target = worldParams.target ?? grid.endSpot;

        const isTargetSpot = pos => pos.x === this.target.x && pos.y === this.target.y;

        const search = dfsSetup(this.grid, this.start, () => true, isTargetSpot);
        search.paused = true;

        this.search = search;

        this.channel = new Channel('sine');
    }

    update() {
        if (this.search.paused) {
            return;
        }

        if (!this.search.done) {
            dfs(this.grid, this.search, this.strategy);

            if (this.search.done) {
                this.channel.playFallingNote(600, 1800, 600, 0.1);
            } else if (this.search.backtracking) {
                const head = this.search.trail[this.search.trail.length - 1];

                if (head) {
                    const distToStart = euclideanDistance(head, this.start);
                    const note = distToStart * 4 + 200;
                    this.channel.playFallingNote(note, note, 1, 0.06);
                }
            } else {
                const head = this.search.queue.head();

                if (head) {
                    const distToEnd = euclideanDistance(head, this.target);
                    const note = distToEnd * 4 + 200;
                    beepChannel.playFallingNote(note, note, 1, 0.06);
                }
            }
        }
    }

    draw() {
        const ctx = this.canvas.ctx;

        ctx.fillStyle = 'black';

        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.save();
        ctx.scale(ZOOM, ZOOM);

        const rectInGrid = (x, y) => {
            ctx.rect(x * GRID_SCALE + 1, y * GRID_SCALE + 1, GRID_SCALE - 2, GRID_SCALE - 2);
        };

        // Empty square pass
        ctx.beginPath();
        ctx.fillStyle = '#181818';
        for (let r = 0; r < this.grid.length; r++) {
            const row = this.grid[r];

            for (let c = 0; c < row.length; c++) {
                const cell = row[c];

                if (cell && !cell.claimed) {
                    rectInGrid(c, r);
                }
            }
        }
        ctx.fill();

        const gradient = ctx.createRadialGradient(
            this.target.x * GRID_SCALE,
            this.target.y * GRID_SCALE,
            GRID_SCALE,
            this.canvas.width / ZOOM / 2,
            this.canvas.height / ZOOM / 2,
            Math.hypot(this.canvas.width / ZOOM, this.canvas.height / ZOOM) / 2,
        );

        gradient.addColorStop(0, 'red');
        gradient.addColorStop(1, 'blue');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        for (let r = 0; r < this.grid.length; r++) {
            const row = this.grid[r];

            for (let c = 0; c < row.length; c++) {
                const int = coordToInt(this.grid, { x: c, y: r });

                if (this.search.visited.has(int)) {
                    rectInGrid(c, r);
                }
            }
        }
        ctx.fill();

        ctx.strokeStyle = 'hsla(0, 0%, 100%, 50%)';
        ctx.beginPath();
        for (let r = 0; r < this.grid.length; r++) {
            const row = this.grid[r];

            for (let c = 0; c < row.length; c++) {
                // const cell = row[c];
                const int = coordToInt(this.grid, { x: c, y: r });

                if (this.search.from.has(int)) {
                    const src = this.search.from.get(int);

                    if (src === -1) {
                        continue;
                    }

                    if (src === int - 1) {
                        ctx.moveTo((c + 0.7) * GRID_SCALE, (r + 0.25) * GRID_SCALE);
                        ctx.lineTo((c + 0.3) * GRID_SCALE, (r + 0.5) * GRID_SCALE);
                        ctx.lineTo((c + 0.7) * GRID_SCALE, (r + 0.75) * GRID_SCALE);
                    } else if (src === int + 1) {
                        ctx.moveTo((c + 0.3) * GRID_SCALE, (r + 0.25) * GRID_SCALE);
                        ctx.lineTo((c + 0.7) * GRID_SCALE, (r + 0.5) * GRID_SCALE);
                        ctx.lineTo((c + 0.3) * GRID_SCALE, (r + 0.75) * GRID_SCALE);
                    } else if (src > int) {
                        ctx.moveTo((c + 0.25) * GRID_SCALE, (r + 0.3) * GRID_SCALE);
                        ctx.lineTo((c + 0.5) * GRID_SCALE, (r + 0.7) * GRID_SCALE);
                        ctx.lineTo((c + 0.75) * GRID_SCALE, (r + 0.3) * GRID_SCALE);
                    } else {
                        ctx.moveTo((c + 0.25) * GRID_SCALE, (r + 0.7) * GRID_SCALE);
                        ctx.lineTo((c + 0.5) * GRID_SCALE, (r + 0.3) * GRID_SCALE);
                        ctx.lineTo((c + 0.75) * GRID_SCALE, (r + 0.7) * GRID_SCALE);
                    }
                }
            }
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = 'white';
        for (const pos of this.search.trail) {
            rectInGrid(pos.x, pos.y);
        }
        ctx.fill();

        ctx.strokeStyle = 'gold';
        ctx.beginPath();
        rectInGrid(this.start.x, this.start.y);
        rectInGrid(this.target.x, this.target.y);
        ctx.stroke();

        const head = this.search.queue.head();
        if (head && !this.search.done && !this.search.backtracking) {
            ctx.strokeStyle = 'white';
            ctx.beginPath();

            rectInGrid(head.x, head.y);
            ctx.stroke();
        }

        ctx.restore();
        
        const text = `Nodes explored: ${this.search.visited.size}`;
        ctx.font = '24px Segoe UI';
        ctx.fillStyle = 'white';
        const y = this.canvas.height - 40;
        ctx.fillText(text, 4, y);
        ctx.fillText(`Path length: ${this.search.trail.length}`, 290, y);
        const structure = this.strategy === 'dfs' ? 'Stack' : 'Queue';
        ctx.fillText(`${structure} size: ${this.search.queue.length}`, 550, y);
    }
}

const mainFunction = () => {
    const canvas = Canvas.fromId('canvas');
    const width = canvas.width;
    const height = canvas.height;

    const pfs = [
        new PathfindingInstance('bfs', { shape: SHAPE, names: NAMES, start: { x: 34, y: 13 }, target: { x: 31, y: 30 } }),
        new PathfindingInstance('bfs', { shape: SHAPE, names: NAMES, start: { x: 31, y: 30 }, target: { x: 34, y: 13 } }),
        new PathfindingInstance('bfs', { shape: SHAPE2, names: NAMES, start: { x: 18, y: 9 }, target: { x: 18, y: 25 }}),
        new PathfindingInstance('bfs', { shape: SHAPE2, names: NAMES }),
        // new PathfindingInstance('bfs', { shape: SHAPE, names: NAMES }),
    ];

    pfs.forEach(pf => {
        document.getElementById(pf.strategy).appendChild(pf.canvas.canvas);
        pf.canvas.canvas.setAttribute('width', pf.canvas.width);
        // pf.canvas.canvas.style = `width: ${pf.canvas.width}px`;
    });

    const innerScale = 2.5;

    const { grid } = createGridFromShape(SHAPE, NAMES);
    const gameWidth = grid[0].length;
    const gameHeight = grid.length;

    const mainDraw = () => {
        const ctx = canvas.ctx;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);

        const bestScore = pfs.reduce((best, pf) => {
            if (pf.search.done) {
                return Math.min(best, pf.search.trail.length);
            }
            return best;
        }, Infinity);

        for (let i = 0; i < pfs.length; i++) {
            const pf = pfs[i];
            pf.draw();

            if (pf.search.done) {
                if (pf.search.trail.length === bestScore) {
                    pf.canvas.canvas.classList.add('winner');
                } else {
                    pf.canvas.canvas.classList.remove('winner');
                    pf.canvas.canvas.classList.add('loser');
                }
            } else if (pf.search.backtracking && pf.search.trail.length > bestScore) {
                pf.canvas.canvas.classList.remove('winner');
                pf.canvas.canvas.classList.add('loser');
            }
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
            pfs.forEach(pf => pf.update());
        }, 50);
    }, 100);

    const button = document.getElementById('click-me');
    button.addEventListener('click', () => {
        pfs.forEach(pf => {
            pf.search.paused = false;
        });
    });
    document.getElementById('pause-on-every').addEventListener('change', e => {
        pauseOnEvery = e.currentTarget.checked;
    });
};

document.addEventListener('DOMContentLoaded', mainFunction);
document.addEventListener('keydown', (event) => {
    keyboardMap[event.key] = true;
});
document.addEventListener('keyup', (event) => {
    keyboardMap[event.key] = false;
});
