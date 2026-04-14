const getNeighbours = (grid, cell, doShuffle = false) => {
    const neighbours = [];

    if (cell.x > 0) {
        if (grid[cell.y][cell.x - 1]) {
            neighbours.push({ x: cell.x - 1, y: cell.y });
        }
    }
    if (cell.y > 0) {
        if (grid[cell.y - 1][cell.x]) {
            neighbours.push({ x: cell.x, y: cell.y - 1 });
        }
    }
    if (cell.x < grid[0].length - 1) {
        if (grid[cell.y][cell.x + 1]) {
            neighbours.push({ x: cell.x + 1, y: cell.y });
        }
    }
    if (cell.y < grid.length - 1) {
        if (grid[cell.y + 1][cell.x]) {
            neighbours.push({ x: cell.x, y: cell.y + 1 });
        }
    }

    if (doShuffle) {
        shuffle(neighbours);
    }

    return neighbours;
};

const dfsSetup = (grid, startPos, walkable, endCondition) => {
    const queue = new DoubleEndedQueue();
    queue.push(startPos);
    const from = new Map();
    const visited = new Set();

    from.set(coordToInt(grid, startPos), -1);

    return {
        queue,
        from,
        walkable,
        endCondition,
        done: false,
        visited,
        paused: false,
    };
};

const dfs = (grid, state) => {
    if (!state.queue.empty()) {
        const current = state.queue.pop();

        const int = coordToInt(grid, current);
        state.visited.add(int);

        let someNeighbourGood = false;

        for (const neighbour of getNeighbours(grid, current, true)) {
            const neighbourInt = coordToInt(grid, neighbour);

            if (state.from.has(neighbourInt)) {
                continue;
            } else {
                state.from.set(neighbourInt, int);
                someNeighbourGood = true;
            }

            const cell = grid[neighbour.y][neighbour.x];
            if (state.endCondition(neighbour, cell)) {
                state.visited.add(neighbourInt);
                state.done = true;
            } else if (state.walkable(neighbour, cell)) {
                state.queue.pushFront(neighbour);
            } else {
                continue;
            }
        }

        if (!someNeighbourGood) {
            state.paused = true;
        }
    }
};

const euclideanDistance = (pos1, pos2) => {
    const xDiff = pos1.x - pos2.x;
    const yDiff = pos1.y - pos2.y;

    return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
};
