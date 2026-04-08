class DoubleEndedQueue {
    constructor() {
        this.front = [];
        this.tail = [];
    }

    empty() {
        return this.front.length === 0 && this.tail.length === 0;
    }

    push(item) {
        this.tail.push(item);
    }

    head() {
        return this.front[this.front.length - 1];
    }

    pop() {
        if (this.front.length > 0) {
            return this.front.pop();
        } else if (this.tail.length > 0) {
            this.front = this.tail;
            this.front.reverse();
            this.tail = [];

            return this.front.pop();
        } else {
            throw new Error('No items to pop!');
        }
    }
}

const TIME_TO_MOVE = 200;

const keyboardMap = {};

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

const isEdge = (grid, cell) => {
    return cell.x === 0 || cell.y === 0 || cell.x === grid[0].length - 1 || cell.y === grid.length;
};

const getNeighbours = (grid, cell) => {
    const neighbours = [];

    if (cell.x > 0) {
        neighbours.push({ x: cell.x - 1, y: cell.y });
    }
    if (cell.y > 0) {
        neighbours.push({ x: cell.x, y: cell.y - 1 });
    }
    if (cell.x < grid[0].length - 1) {
        neighbours.push({ x: cell.x + 1, y: cell.y });
    }
    if (cell.y < grid.length - 1) {
        neighbours.push({ x: cell.x, y: cell.y + 1 });
    }

    return neighbours;
};

const floodFillGridFrom = (grid, fromPos, condition) => {
    const queue = [fromPos];
    const seen = new Set([coordToInt(grid, fromPos)]);

    while (queue.length > 0) {
        const current = queue.pop();

        for (const neighbour of getNeighbours(grid, current)) {
            if (!condition(grid[neighbour.y][neighbour.x])) {
                continue;
            }

            const int = coordToInt(grid, neighbour);
            if (seen.has(int)) {
                continue;
            } else {
                seen.add(int);
                queue.push(neighbour);
            }
        }
    }

    return Array.from(seen).map(int => intToCoord(grid, int));
};

const produceFromPath = (grid, fromMap, endInt) => {
    const seen = new Set();
    const path = [];

    let current = endInt;
    while (fromMap.has(current)) {
        seen.add(current);
        path.push(current);
        current = fromMap.get(current);
        if (seen.has(current)) {
            break;
        }
    }

    path.reverse();

    return path.map(int => intToCoord(grid, int));
};

const canPathfindHome = (grid, fromPos, id) => {
    const queue = new DoubleEndedQueue();
    queue.push(fromPos);
    const from = new Map();

    while (!queue.empty()) {
        const current = queue.pop();

        const int = coordToInt(grid, current);

        for (const neighbour of getNeighbours(grid, current)) {
            const neighbourInt = coordToInt(grid, neighbour);

            if (from.has(neighbourInt)) {
                continue;
            }

            from.set(neighbourInt, int);

            const cell = grid[neighbour.y][neighbour.x];
            if (cell.claimed === id) {
                // Reached home, return
                return produceFromPath(grid, from, neighbourInt);
            } else if (cell.claiming === id) {
                // Cannot walk here as we would cut our own path
                continue;
            } else {
                queue.push(neighbour);
            }
        }
    }

    return false;
};

const fillClaiming = (grid, fromPos, id, agents) => {
    for (const pos of floodFillGridFrom(grid, fromPos, c => c.claiming === id)) {
        grid[pos.y][pos.x].claiming = null;
        grid[pos.y][pos.x].claimed = id;
    }

    findFloodRegion(grid, id, agents);
};

const clearBoardOfId = (grid, id) => {
    for (const row of grid) {
        for (const cell of row) {
            if (cell.claimed === id) {
                cell.claimed = null;
            }

            if (cell.claiming === id) {
                cell.claiming = null;
            }
        }
    }
};

const findFloodRegion = (grid, id, agents) => {
    const seen = new Set();

    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c].claimed === id) {
                continue;
            }

            const int = coordToInt(grid, { x: c, y: r });

            if (seen.has(int)) {
                continue;
            }

            const connected = floodFillGridFrom(
                grid,
                { x: c, y: r },
                c => {
                    return c.claimed !== id;
                },
            );

            connected.forEach(pos => {
                seen.add(coordToInt(grid, pos));
            });

            if (connected.some(pos => isEdge(grid, pos))) {
                // Not claiming
            } else {
                connected.forEach(pos => {
                    grid[pos.y][pos.x] = { claimed: id, claiming: null };

                    agents.forEach(agent => {
                        if (agent.id === id) {
                            return;
                        }

                        if (pos.x === agent.pos.x && pos.y === agent.pos.y) {
                            agent.dead = true;
                        }
                    })
                });
            }
        }
    }
};

const createAgent = (grid, agents, pos, strategy) => {
    const id = Math.random().toString().slice(2, 6);

    const hue = Math.floor(Math.random() * 360);

    const agent = {
        pos,
        id,
        color: `hsl(${hue}, 70%, 70%)`,
        claimingColor: `hsla(${hue}, 60%, 80%, 50%)`,
        lastMovedTime: performance.now(),
        timeToMove: strategy === 'player' ? TIME_TO_MOVE / 3 : TIME_TO_MOVE,
    };

    const resolveMove = (nextPos) => {
        if (nextPos.x >= grid[0].length || nextPos.x < 0 || nextPos.y < 0 || nextPos.y >= grid.length) {
            // Must stay inside grid
            return false;
        } else if (agents.some(other => other.pos.x === nextPos.x && other.pos.y === nextPos.y)) {
            // Must not overlap another agent
            return false;
        }

        const nextCell = grid[nextPos.y][nextPos.x];

        if (nextCell.claiming) {
            agents.find(other => other.id === nextCell.claiming).dead = true;
            nextCell.claiming = agent.id;
        } else if (nextCell.claimed === agent.id) {
            fillClaiming(grid, agent.pos, agent.id, agents);
        } else {
            nextCell.claiming = agent.id;
        }

        agent.pos = nextPos;
        return true;
    };

    const tryMove = () => {
        if (strategy === 'player') {
            const move = getKeyboardMove();

            if (!move) {
                return false;
            }

            return resolveMove(addCoord(move, agent.pos));
        }

        const steps = getNeighbours(grid, agent.pos);

        const badChoices = [];

        while (steps.length > 0) {
            const chosenIndex = Math.floor(Math.random() * steps.length);
            const nextPos = steps[chosenIndex];
            steps.splice(chosenIndex, 1);

            if (grid[nextPos.y][nextPos.x].claiming === agent.id) {
                badChoices.push(nextPos);
                continue;
            }

            if (!canPathfindHome(grid, nextPos, agent.id)) {
                badChoices.push(nextPos);
                continue;
            }

            if (resolveMove(nextPos)) {
                return true;
            }
        }

        if (badChoices.length > 0) {
            return resolveMove(badChoices[0]);
        }

        return false;
    };

    const update = () => {
        const time = performance.now();
        const timeSinceLastMove = time - agent.lastMovedTime;
        if (timeSinceLastMove > agent.timeToMove) {
            const flag = tryMove();

            if (flag) {
                agent.lastMovedTime = time;
            }
        }
    };

    agent.update = update;

    return agent;
};

const createGrid = (width, height) => {
    const grid = [];

    for (let r = 0; r < height; r++) {
        const row = [];
        for (let c = 0; c < width; c++) {
            row.push({
                claimed: null,
                claiming: null,
            });
        }

        grid.push(row);
    }

    return grid;
};

const GRID_SCALE = 10;

const mainFunction = () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const gameWidth = Math.floor(width / GRID_SCALE);
    const gameHeight = Math.floor(height / GRID_SCALE);

    const grid = createGrid(gameWidth, gameHeight);

    const agents = [];

    agents.push(createAgent(grid, agents, { x: Math.floor(gameWidth / 2), y: Math.floor(gameHeight) / 2 }));
    agents.push(createAgent(grid, agents, { x: 5, y: 5 }, 'player'));

    window.agents = agents;

    const agentsMap = agents.reduce((map, agent) => {
        map[agent.id] = agent;
        grid[agent.pos.y][agent.pos.x] = { claimed: agent.id, claiming: null };
        return map;
    }, {});

    window.agentsMap = agentsMap;

    const rectInGrid = (x, y) => {
        ctx.fillRect(x * GRID_SCALE + 1, y * GRID_SCALE + 1, GRID_SCALE - 2, GRID_SCALE - 2);
    };

    const draw = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        if (agents.length < 5) {
            const randomX = Math.floor(Math.random() * gameWidth);
            const randomY = Math.floor(Math.random() * gameHeight);

            const cell = grid[randomY][randomX];
            if (!cell.claimed && !cell.claiming) {
                const newAgent = createAgent(grid, agents, { x: randomX, y: randomY });
                agents.push(newAgent);
                cell.claimed = newAgent.id;
                agentsMap[newAgent.id] = newAgent;
            }
        }

        for (const agent of agents) {
            agent.update();
        }

        for (let i = agents.length - 1; i >= 0; i--) {
            const agent = agents[i];
            if (agent.dead) {
                clearBoardOfId(grid, agent.id);
                delete agentsMap[agent.id];

                agents.splice(i, 1);
            }
        }

        for (let r = 0; r < grid.length; r++) {
            const row = grid[r];

            for (let c = 0; c < row.length; c++) {
                const cell = row[c];

                if (!cell.claimed) {
                    ctx.fillStyle = '#eee';
                    rectInGrid(c, r);
                } else {
                    ctx.fillStyle = agentsMap[cell.claimed].color;
                    rectInGrid(c, r);
                }

                if (cell.claiming) {
                    ctx.fillStyle = agentsMap[cell.claiming].claimingColor;
                    rectInGrid(c, r);
                }
            }
        }

        for (const agent of agents) {
            ctx.fillStyle = agent.color;
            ctx.fillRect(agent.pos.x * GRID_SCALE, agent.pos.y * GRID_SCALE, GRID_SCALE, GRID_SCALE);
        }

        requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);
};

document.addEventListener('DOMContentLoaded', mainFunction);
document.addEventListener('keydown', (event) => {
    keyboardMap[event.key] = true;
});
document.addEventListener('keyup', (event) => {
    keyboardMap[event.key] = false;
});
