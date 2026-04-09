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

class Bound {
    constructor() {
        this.reset();
    }

    reset() {
        this.minX = Infinity;
        this.maxX = -Infinity;
        this.minY = Infinity;
        this.maxY = -Infinity;
    }

    insert(pos) {
        this.minX = Math.min(this.minX, pos.x);
        this.maxX = Math.max(this.maxX, pos.x);
        this.minY = Math.min(this.minY, pos.y);
        this.maxY = Math.max(this.maxY, pos.y);
    }

    join(other) {
        this.insert({ x: other.minX, y: other.minY });
        this.insert({ x: other.maxX, y: other.maxY });
    }

    noX(x) {
        if (x === this.minX) {
            if (x === this.maxX) {
                this.reset();
            }

            this.minX += 1;
        } else if (x === this.maxX) {
            this.maxX -= 1;
        }
    }

    noY(y) {
        if (y === this.minY) {
            if (y === this.maxY) {
                this.reset();
            }

            this.minY += 1;
        } else if (y === this.maxY) {
            this.maxY -= 1;
        }
    }

    contains(pos) {
        return this.minX <= pos.x && pos.x <= this.maxX && this.minY <= pos.y && pos.y <= this.maxY;
    }
}

const TIME_TO_MOVE = 100;

const keyboardMap = {};
const mouse = { x: 0, y: 0 };

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

const getNeighbours = (grid, cell, doShuffle = false) => {
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

    if (doShuffle) {
        shuffle(neighbours);
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
        if (fromMap.get(current) === -1) {
            break;
        }
        seen.add(current);
        path.push(current);
        current = fromMap.get(current);
        if (seen.has(current)) {
            break;
        }
    }

    path.reverse();

    const path2 = path.map(int => intToCoord(grid, int));

    path2.forEach((coord, index) => {
        if (index === path2.length - 1) {
            return;
        }

        const next = path2[index + 1];

        if (manhattanDist(coord, next) !== 1) {
            throw new Error('These be not next to each other');
        }
    });

    return path2;
};

const findPathWithConditions = (grid, startPos, walkableCondition, endCondition) => {
    const queue = new DoubleEndedQueue();
    queue.push(startPos);
    const from = new Map();

    from.set(coordToInt(grid, startPos), -1);

    while (!queue.empty()) {
        const current = queue.pop();

        const int = coordToInt(grid, current);

        for (const neighbour of getNeighbours(grid, current, true)) {
            const neighbourInt = coordToInt(grid, neighbour);

            if (from.has(neighbourInt)) {
                continue;
            }

            if (manhattanDist(neighbour, current) !== 1) {
                throw new Error('Got crazy result');
            }

            if (manhattanDist(intToCoord(grid, neighbourInt), intToCoord(grid, int)) !== 1) {
                throw new Error('Got crazy result');
            }

            from.set(neighbourInt, int);

            const cell = grid[neighbour.y][neighbour.x];
            if (endCondition(neighbour, cell)) {
                return produceFromPath(grid, from, neighbourInt);
                // .filter(pos => pos.x !== startPos.x || pos.y !== startPos.y);
            } else if (walkableCondition(neighbour, cell)) {
                queue.push(neighbour);
            } else {
                // Not end condition or walkable, so exit
                continue;
            }
        }
    }

    return false;
};

const fillClaiming = (grid, fromPos, id, agents) => {
    const trail = floodFillGridFrom(grid, fromPos, c => c.claiming === id);
    for (const pos of trail) {
        grid[pos.y][pos.x].claiming = null;
        grid[pos.y][pos.x].claimed = id;
    }

    return trail.length + findFloodRegion(grid, id, agents);
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

    let total = 0;

    const myAgent = agents.find(a => a.id === id);

    if (!myAgent) {
        return;
    }

    const loX = Math.max(0, myAgent.claimBound.minX - 1);
    const hiX = Math.min(grid[0].length - 1, myAgent.claimBound.maxX + 1);
    const loY = Math.max(0, myAgent.claimBound.minY - 1);
    const hiY = Math.min(grid.length - 1, myAgent.claimBound.maxY + 1);

    for (let r = loY; r <= hiY; r++) {
        for (let c = loX; c <= hiX; c++) {
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
                total += connected.length;
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

    return total;
};

const floodToEmptySpaces = (grid, minRequiredDistance) => {
    const newGrid = [];

    for (let r = 0; r < grid.length; r++) {
        const row = [];
        newGrid.push(row);

        for (let c = 0; c < grid[r].length; c++) {
            row.push(false);
        }
    }

    const queue = new DoubleEndedQueue();
    const seen = new Set();

    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            const cell = grid[r][c];

            if (cell.claimed || cell.claiming) {
                queue.push({ pos: { x: c, y: r }, steps: 0 });
                seen.add(coordToInt(grid, { x: c, y: r }));
                newGrid[r][c] = true;
            }
        }
    }

    while (!queue.empty()) {
        const { pos, steps } = queue.pop();

        newGrid[pos.y][pos.x] = true;

        if (steps >= minRequiredDistance) {
            continue;
        }

        for (const neighbourPos of getNeighbours(grid, pos)) {
            const neighbourInt = coordToInt(grid, neighbourPos);

            if (seen.has(neighbourInt)) {
                continue;
            }

            seen.add(neighbourInt);

            queue.push({ pos: neighbourPos, steps: steps + 1 });
        }
    }

    return newGrid;
};

const manhattanDist = (pos1, pos2) => {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
};

const findHue = agents => {
    let hue = Math.floor(Math.random() * 360);

    let trials = 0;
    while (agents.some(other => Math.abs(other.hue - hue) < 10)) {
        hue = Math.floor(Math.random() * 360);
        trials++;

        if (trials > 100) {
            console.warn('HUE', hue, agents.map(a => a.hue));
            return hue;
        }
    }

    return hue;
};

const randInt = (lo, hi) => Math.floor(Math.random() * (hi - lo) + lo);

const createAgent = (grid, agents, pos, strategy) => {
    const id = Math.random().toString().slice(2, 6);

    const hue = findHue(agents);
    const saturation = randInt(50, 90);
    const lightness = randInt(40, 80);

    const agent = {
        pos,
        id,
        hue,
        color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        claimingColor: `hsla(${hue}, ${saturation}%, ${lightness}%, 50%)`,
        lastMovedTime: performance.now(),
        timeToMove: strategy === 'player' ? TIME_TO_MOVE / 3 : TIME_TO_MOVE,
        claimPathLength: 0,
        claimBound: new Bound(),
        path: null,
        owned: 1,
        overallBound: new Bound(),
    };

    agent.overallBound.insert(pos);

    const resolveMove = (nextPos) => {
        if (manhattanDist(nextPos, agent.pos) !== 1) {
            console.error('Illegal move attempted');
            // throw new Error('Attempted illegal move');
            return false;
        }

        if (nextPos.x >= grid[0].length || nextPos.x < 0 || nextPos.y < 0 || nextPos.y >= grid.length) {
            // Must stay inside grid
            console.warn('Tried to move outside of grid');
            return false;
        } else if (agents.some(other => other.pos.x === nextPos.x && other.pos.y === nextPos.y)) {
            // Must not overlap another agent
            console.warn('Tried to step onto another agent');
            return false;
        }

        const nextCell = grid[nextPos.y][nextPos.x];

        if (nextCell.claiming) {
            if (nextCell.claiming === agent.id) {
                console.log('Overlapping own tail');
            }
            agents.find(other => other.id === nextCell.claiming).dead = true;
            nextCell.claiming = agent.id;
        } else if (nextCell.claimed === agent.id) {
            if (agent.claimPathLength > 0) {
                fillClaiming(grid, agent.pos, agent.id, agents);
                agent.claimPathLength = 0;
                agent.overallBound.join(agent.claimBound);
                agent.claimBound.reset();
            }
        } else {
            nextCell.claiming = agent.id;
            agent.claimPathLength += 1;
            agent.claimBound.insert(nextPos);
        }

        agent.pos = nextPos;
        moveCount++;
        return true;
    };

    const notMyTrail = (_, cell) => cell.claiming !== agent.id;
    const isMyHome = (_, cell) => cell.claimed === agent.id;

    let moveCount = 0;

    const tryMove = () => {
        if (strategy === 'player') {
            const move = getKeyboardMove();

            if (!move) {
                return false;
            }

            return resolveMove(addCoord(move, agent.pos));
        }

        const currentCell = grid[agent.pos.y][agent.pos.x];

        if (agent.path && agent.path.length > 0) {
            const isPathOk = agent.path.some(spot => grid[spot.y][spot.x].claiming === agent.id);
            if (isPathOk) {
                agent.path = null;
                agent.pathDescription = null;
            } else {
                const firstMove = agent.path[0];
                while (agent.path.length > 0 && manhattanDist(agent.path[0], agent.pos) === 0) {
                    agent.path = agent.path.slice(1);
                }

                if (agent.path.length === 0) {
                    agent.path = null;
                    agent.pathDescription = null;
                } else {
                    if (manhattanDist(firstMove, agent.pos) !== 1) {
                        console.warn('Illegal move in path');
                    }

                    const success = resolveMove(firstMove);

                    if (success) {
                        agent.path = agent.path.slice(1);
                        return true;
                    } else {
                        agent.path = null;
                        agent.pathDescription = null;
                    }

                    console.warn('Could not follow saved path');
                }
            }
        } else {
            agent.path = null;
            agent.pathDescription = null;
        }

        const savePath = (path, pathDescription) => {
            if (manhattanDist(agent.pos, path[0]) !== 1) {
                console.warn('Given a BAD path');
            }

            const success = resolveMove(path[0]);

            if (success) {
                agent.path = path.slice(1);
                agent.pathDescription = pathDescription;
                return true;
            }

            console.warn('Did not succeed');
            return false;
        };

        if (agent.claimPathLength > 10) {
            const pathHome = findPathWithConditions(grid, agent.pos, notMyTrail, isMyHome);

            if (!pathHome) {
                console.warn('This agent could not find a path home', pathHome);
            } else {
                if (manhattanDist(pathHome[0], agent.pos) !== 1) {
                    console.warn('Path found was a bad one');
                }
                if (savePath(pathHome, 'Returning home')) {
                    return true;
                }
            }
        }

        if (isMyHome(agent.pos, currentCell)) {
            if (agent.owned === grid[0].length * grid.length) {
                // Agent owns the whole board, so skip this step
            } else {
                // Try to get to unclaimed territory
                const explorePath = findPathWithConditions(grid, agent.pos, () => true, (_, cell) => !isMyHome(_, cell));

                if (!explorePath) {
                    console.warn('This agent could not find a path to new territory', explorePath);
                } else {
                    if (savePath(explorePath, 'Exploring')) {
                        return true;
                    }
                }
            }
        }

        const steps = getNeighbours(grid, agent.pos, true);

        const badChoices = [];

        while (steps.length > 0) {
            const chosenIndex = Math.floor(Math.random() * steps.length);
            const nextPos = steps[chosenIndex];
            steps.splice(chosenIndex, 1);

            if (grid[nextPos.y][nextPos.x].claiming === agent.id) {
                badChoices.push({ ...nextPos, reason: 'my tail' });
                continue;
            }

            if (!findPathWithConditions(grid, nextPos, notMyTrail, isMyHome)) {
                badChoices.push({ ...nextPos, reason: 'no way home' });
                continue;
            }

            if (resolveMove(nextPos)) {
                return true;
            }
        }

        if (badChoices.length > 0) {
            console.log('Making bad choice');
            return resolveMove(badChoices[0]);
        }

        return false;
    };

    const update = () => {
        const time = performance.now();
        const timeSinceLastMove = time - agent.lastMovedTime;
        if (timeSinceLastMove > agent.timeToMove) {
            moveCount = 0;

            const flag = tryMove();

            if (flag) {
                agent.lastMovedTime = performance.now();
            }

            if (moveCount !== 1) {
                console.warn('Moved', moveCount, 'times in a single tryMove()');
            } else {
                if (moveCount === 1 && !flag) {
                    console.warn('Moved', agent.id, 'but flag was false');
                }
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

    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });

    const ctx = canvas.getContext('2d');

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const gameWidth = Math.floor(width / GRID_SCALE);
    const gameHeight = Math.floor(height / GRID_SCALE);

    const grid = createGrid(gameWidth, gameHeight);

    const agents = [];

    agents.push(createAgent(grid, agents, { x: Math.floor(gameWidth / 2), y: Math.floor(gameHeight) / 2 }));
    // agents.push(createAgent(grid, agents, { x: 5, y: 5 }, 'player'));

    window.agents = agents;

    const agentsMap = agents.reduce((map, agent) => {
        map[agent.id] = agent;
        grid[agent.pos.y][agent.pos.x] = { claimed: agent.id, claiming: null };
        return map;
    }, {});

    window.agentsMap = agentsMap;

    const COUNT_COOLDOWN = 1000;
    const EMPTY_RANGE = 12;
    const CHAMPION_RANGE = 0.2;

    let lastCountTime = performance.now();

    let newGrid = floodToEmptySpaces(grid, EMPTY_RANGE);

    const draw = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        const anyChampion = agents.some(agent => agent.owned > gameHeight * gameWidth * CHAMPION_RANGE);

        if (agents.length < 16 && !anyChampion) {
            const randomX = Math.floor(Math.random() * gameWidth);
            const randomY = Math.floor(Math.random() * gameHeight);

            const cell = grid[randomY][randomX];
            if (!cell.claimed && !cell.claiming && !newGrid[randomY][randomX]) {
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

        /** DRAW Phase */
        const rectInGrid = (x, y) => {
            ctx.rect(x * GRID_SCALE + 1, y * GRID_SCALE + 1, GRID_SCALE - 2, GRID_SCALE - 2);
        };

        // Empty square pass
        ctx.beginPath();
        ctx.fillStyle = '#eee';
        for (let r = 0; r < grid.length; r++) {
            const row = grid[r];

            for (let c = 0; c < row.length; c++) {
                const cell = row[c];

                if (!cell.claimed) {
                    rectInGrid(c, r);
                }
            }
        }
        ctx.fill();

        // Agent solid squares path
        for (const agent of agents) {
            ctx.beginPath();
            ctx.fillStyle = agent.color;

            for (let r = agent.overallBound.minY; r <= agent.overallBound.maxY; r++) {
                const row = grid[r];

                for (let c = agent.overallBound.minX; c <= agent.overallBound.maxX; c++) {
                    const cell = row[c];

                    if (cell.claimed === agent.id) {
                        rectInGrid(c, r);

                        if (c + 1 < row.length && row[c + 1].claimed === agent.id) {
                            ctx.rect((c + 1) * GRID_SCALE - 1, r * GRID_SCALE + 1, 2, GRID_SCALE - 2);
                        }
                        if (r + 1 < grid.length && grid[r + 1][c].claimed === agent.id) {
                            ctx.rect(c * GRID_SCALE + 1, (r + 1) * GRID_SCALE - 1, GRID_SCALE - 2, 2);
                        }
                    }
                }
            }

            let seenTop = false, seenBottom = false;
            for (let c = agent.overallBound.minX; c <= agent.overallBound.maxX; c++) {
                if (grid[agent.overallBound.minY][c].claimed === agent.id) {
                    seenTop = true;
                }
                if (grid[agent.overallBound.maxY][c].claimed === agent.id) {
                    seenBottom = true;
                }

                if (seenTop && seenBottom) {
                    break;
                }
            }

            if (!seenTop) {
                agent.overallBound.noY(agent.overallBound.minY);
            }
            if (!seenBottom) {
                agent.overallBound.noY(agent.overallBound.maxY);
            }

            let seenLeft = false, seenRight = false;
            for (let r = agent.overallBound.minY; r <= agent.overallBound.maxY; r++) {
                if (grid[r][agent.overallBound.minX].claimed === agent.id) {
                    seenLeft = true;
                }
                if (grid[r][agent.overallBound.maxX].claimed === agent.id) {
                    seenRight = true;
                }

                if (seenLeft && seenRight) {
                    break;
                }
            }

            if (!seenLeft) {
                agent.overallBound.noX(agent.overallBound.minX);
            }
            if (!seenRight) {
                agent.overallBound.noX(agent.overallBound.maxX);
            }

            ctx.fill();
        }

        for (const agent of agents) {
            if (agent.claimPathLength > 0) {
                ctx.beginPath();
                ctx.fillStyle = agent.claimingColor;

                for (let r = agent.claimBound.minY; r <= agent.claimBound.maxY; r++) {
                    const row = grid[r];

                    for (let c = agent.claimBound.minX; c <= agent.claimBound.maxX; c++) {
                        const cell = row[c];

                        if (cell.claiming === agent.id) {
                            rectInGrid(c, r);
                        }
                    }
                }

                ctx.fill();
            }
        }

        for (const agent of agents) {
            ctx.fillStyle = agent.color;
            ctx.fillRect(agent.pos.x * GRID_SCALE, agent.pos.y * GRID_SCALE, GRID_SCALE, GRID_SCALE);

            // ctx.strokeStyle = agent.color;
            // ctx.lineWidth = 2;

            // if (agent.claimPathLength > 0) {
            //     ctx.strokeRect(
            //         agent.claimBound.minX * GRID_SCALE,
            //         agent.claimBound.minY * GRID_SCALE,
            //         (agent.claimBound.maxX - agent.claimBound.minX + 1) * GRID_SCALE,
            //         (agent.claimBound.maxY - agent.claimBound.minY + 1) * GRID_SCALE,
            //     );
            // }

            // ctx.strokeRect(
            //     agent.overallBound.minX * GRID_SCALE,
            //     agent.overallBound.minY * GRID_SCALE,
            //     (agent.overallBound.maxX - agent.overallBound.minX + 1) * GRID_SCALE,
            //     (agent.overallBound.maxY - agent.overallBound.minY + 1) * GRID_SCALE,
            // );
        }

        if (performance.now() - lastCountTime > COUNT_COOLDOWN) {
            newGrid = floodToEmptySpaces(grid, EMPTY_RANGE);

            lastCountTime = performance.now();

            for (const agent of agents) {
                agent.owned = 0;
            }

            for (const row of grid) {
                for (const cell of row) {
                    if (cell.claimed) {
                        agentsMap[cell.claimed].owned += 1;
                    }
                }
            }
        }

        const sortedAgents = agents.slice();
        sortedAgents.sort((a, b) => a.owned - b.owned);

        // Draw leader crown
        const leader = sortedAgents[sortedAgents.length - 1];
        const midpoint = {
            x: Math.floor((leader.overallBound.minX + leader.overallBound.maxX) / 2) + 0.5,
            y: Math.floor((leader.overallBound.minY + leader.overallBound.maxY) / 2) + 0.5,
        };

        ctx.save();
        ctx.translate(midpoint.x * GRID_SCALE, midpoint.y * GRID_SCALE);

        ctx.fillStyle = leader.color;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const crownBottom = GRID_SCALE / 4;
        // Corners
        ctx.moveTo(GRID_SCALE, crownBottom);
        ctx.lineTo(-GRID_SCALE, crownBottom);
        ctx.lineTo(-GRID_SCALE, -GRID_SCALE);
        ctx.lineTo(-GRID_SCALE / 2, -GRID_SCALE / 2);
        ctx.lineTo(0, -GRID_SCALE);
        ctx.lineTo(GRID_SCALE / 2, -GRID_SCALE / 2);
        ctx.lineTo(GRID_SCALE, -GRID_SCALE);

        ctx.lineTo(GRID_SCALE, crownBottom);

        ctx.fill();
        ctx.stroke();

        ctx.restore();

        for (let i = 0; i < sortedAgents.length; i++) {
            const agent = sortedAgents[i];

            const boxWidth = 96;
            const padding = 4;
            const boxHeight = 32;
            const boxLeft = width - boxWidth - 2 * padding;
            const boxTop = height - (boxHeight + padding * 2) * (i + 1);

            ctx.fillStyle = '#00000055';
            ctx.fillRect(boxLeft, boxTop, boxWidth, boxHeight);

            ctx.fillStyle = agent.color;
            ctx.fillRect(boxLeft + padding, boxTop + padding, boxHeight - 2 * padding, boxHeight - 2 * padding);

            ctx.fillStyle = '#ffffff88';
            ctx.fillRect(boxLeft + boxHeight, boxTop + padding, boxWidth - padding - boxHeight, boxHeight - 2 * padding);

            ctx.font = '20px sans-serif';
            ctx.fillStyle = 'black';

            const owned = Math.round(agent.owned / (gameWidth * gameHeight) * 100);

            ctx.fillText(`${owned}%`, boxLeft + boxHeight + padding, boxTop + boxHeight - 2 * padding);

            if (agent.overallBound.contains({ x: mouse.x / GRID_SCALE, y: mouse.y / GRID_SCALE})) {
                ctx.strokeStyle = 'blue';
                ctx.lineWidth = 2;
                ctx.strokeRect(boxLeft, boxTop, boxWidth, boxHeight);
            }
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
