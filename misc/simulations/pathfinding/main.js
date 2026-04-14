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
  XXXXX                           X
  X----XXXXXX                    X-X
  X----------XXXXXXXX            X--X
  X------------------XXXXX     XX3-X
 X----0-------------------X   X---X
 X------------------------X  X-----X
X-------------------------X X-----X
X-------------------1------X--2--X
X--------------------------------X
X--------------------------------X
X--------------------------------X
 X----------------V--------------X
 X-------------------------------X
 X-4-----------------------------X
  X-----------------------------X
   X----------------------------X
    XX-------------------------X
      X-----------------------X
       XXXX-----------------6-X
           X----5-------------X
            X-X----------XXXX--X
             X X----XXXXX    X--X
               X---X          X-X
                X-X            XX
                 X
`;

const NAMES = [
    'North West',
    'Mid-West',
    'Mid-Atlantic',
    'North East',
    'West',
    'South West',
    'South East',
];

const createGridFromShape = () => {
    const procShape = SHAPE.split('\n').filter(v => !!v);

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
            if (letter in NAMES) {
                spawnSpots.push({ x: c, y: r, name: NAMES[letter] });
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

const mainFunction = () => {
    const canvas = document.getElementById('canvas');

    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    const ctx = canvas.getContext('2d');

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const { grid, spawnSpots } = createGridFromShape();

    const gameWidth = grid[0].length;
    const gameHeight = grid.length;

    // if (spawnSpots.length > 0) {
    //     spawnSpots.forEach(pos => spawnAgent(pos, pos.name));
    // } else {
    //     spawnAgent({ x: Math.floor(gameWidth / 2), y: Math.floor(gameHeight / 2) });
    // }

    const start = spawnSpots[0];

    const targetPos = { x: 11, y: 3 };
    const isTargetSpot = pos => pos.x === targetPos.x && pos.y === targetPos.y;

    const search = dfsSetup(grid, start, () => true, (pos) => isTargetSpot(pos));
    search.paused = true;

    let pauseOnEvery = false;

    const update = () => {
        if (!search.done && !search.paused) {
            dfs(grid, search);
            if (pauseOnEvery) {
                search.paused = true;
            }

            const head = search.queue.head();

            if (head) {
                const distToEnd = euclideanDistance(head, targetPos);
                const note = (distToEnd * 4 + 200);
                console.log('note', note);
                beepChannel.playFallingNote(note, note, 0.05, 0.03);
            }
        }
    };

    const draw = () => {
        const rectInGrid = (x, y) => {
            ctx.rect(x * GRID_SCALE + 1, y * GRID_SCALE + 1, GRID_SCALE - 2, GRID_SCALE - 2);
        };

        // Empty square pass
        ctx.beginPath();
        ctx.fillStyle = '#181818';
        for (let r = 0; r < grid.length; r++) {
            const row = grid[r];

            for (let c = 0; c < row.length; c++) {
                const cell = row[c];

                if (cell && !cell.claimed) {
                    rectInGrid(c, r);
                }
            }
        }
        ctx.fill();

        const gradient = ctx.createRadialGradient(
            targetPos.x * GRID_SCALE,
            targetPos.y * GRID_SCALE,
            GRID_SCALE,
            gameWidth * GRID_SCALE / 2,
            gameHeight * GRID_SCALE / 2,
            Math.hypot(gameWidth, gameHeight) * GRID_SCALE / 2,
        );
        gradient.addColorStop(0, 'red');
        gradient.addColorStop(1, 'blue');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        for (let r = 0; r < grid.length; r++) {
            const row = grid[r];

            for (let c = 0; c < row.length; c++) {
                // const cell = row[c];
                const int = coordToInt(grid, { x: c, y: r });

                if (search.visited.has(int)) {
                    rectInGrid(c, r);
                }
            }
        }
        ctx.fill();

        ctx.strokeStyle = 'hsla(0, 0%, 100%, 50%)';
        ctx.beginPath();
        for (let r = 0; r < grid.length; r++) {
            const row = grid[r];

            for (let c = 0; c < row.length; c++) {
                // const cell = row[c];
                const int = coordToInt(grid, { x: c, y: r });

                if (search.from.has(int)) {
                    const src = search.from.get(int);

                    if (src === -1) {
                        continue;
                    }
                    // const b = intToCoord(grid, src);
                    // ctx.moveTo((b.x + 0.5) * GRID_SCALE, (b.y + 0.5) * GRID_SCALE);
                    // ctx.lineTo((c + 0.5) * GRID_SCALE, (r + 0.5) * GRID_SCALE);

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

        ctx.strokeStyle = 'gold';
        ctx.beginPath();
        rectInGrid(start.x, start.y);
        rectInGrid(targetPos.x, targetPos.y);
        ctx.stroke();

        const head = search.queue.head();
        if (head && !search.done) {
            ctx.strokeStyle = 'white';
            ctx.beginPath();

            rectInGrid(head.x, head.y);
            ctx.stroke();
        }
    };

    const innerScale = 2.5;

    const innerScreenWidth = gameWidth * GRID_SCALE * innerScale;
    const innerScreenHeight = gameHeight * GRID_SCALE * innerScale;

    const mainDraw = () => {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.translate(
            width / 2 - innerScreenWidth / 2,
            height / 2 - innerScreenHeight / 2,
        );

        ctx.scale(innerScale, innerScale);

        draw();

        ctx.restore();
    };

    let lastTime = null;

    let firstLoop = true;

    const mainLoop = () => {
        const now = performance.now();

        const elapsed = now - lastTime;

        mainDraw(elapsed);

        // eventQueue.update(elapsed);

        lastTime = now;

        if (firstLoop) {
            setTimeout(() => {
                firstLoop = false;
                lastTime = performance.now();

                requestAnimationFrame(mainLoop);
                // agents.forEach(agent => {
                //     agent.lastMovedTime = performance.now();
                // });
            }, 20);
        } else {
            requestAnimationFrame(mainLoop);
        }
    };

    setTimeout(() => {
        lastTime = performance.now();
        requestAnimationFrame(mainLoop);

        setInterval(() => {
            update();
        }, 50);
    }, 100);

    const button = document.getElementById('click-me');
    button.addEventListener('click', () => {
        search.paused = false;
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
