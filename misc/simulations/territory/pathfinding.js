
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

const floodFillWithConditions = (grid, startPos, walkableCondition) => {
    const queue = new DoubleEndedQueue();
    queue.push(startPos);
    const seen = new Set();
    const included = new Set();

    included.add(coordToInt(grid, startPos));

    while (!queue.empty()) {
        const current = queue.pop();

        const int = coordToInt(grid, current);

        for (const neighbour of getNeighbours(grid, current)) {
            const neighbourInt = coordToInt(grid, neighbour);

            if (seen.has(neighbourInt)) {
                continue;
            }

            seen.add(neighbourInt);

            const cell = grid[neighbour.y][neighbour.x];
            if (walkableCondition(neighbour, cell, neighbourInt)) {
                queue.push(neighbour);
                included.add(neighbourInt);
            }
        }
    }

    return {
        included,
        coords: Array.from(included).map(int => intToCoord(grid, int)),
    };
};

const fillClaiming = (grid, fromPos, id, agents) => {
    const myImpactedAgents = new Set();
    const trail = floodFillGridFrom(grid, fromPos, c => c.claiming === id);
    for (const pos of trail) {
        myImpactedAgents.add(grid[pos.y][pos.x].claimed);

        grid[pos.y][pos.x].claiming = null;
        grid[pos.y][pos.x].claimed = id;
        grid[pos.y][pos.x].claimAnim = 1;
        grid[pos.y][pos.x].deathAnim = 0;
    }

    myImpactedAgents.delete(null);

    const { count, impactedAgents } = findFloodRegion(grid, id, agents);

    // return trail.length + findFloodRegion(grid, id, agents);

    for (const v of Array.from(impactedAgents)) {
        myImpactedAgents.add(v);
    }

    return { count: count + trail.length, impactedAgents: myImpactedAgents };
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

    const impactedAgents = new Set();

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
                    const currentCell = grid[pos.y][pos.x];
                    if (currentCell.claiming) {
                        agents.find(a => a.id === currentCell.claiming).dead = true;
                    }

                    impactedAgents.add(currentCell.claiming);
                    impactedAgents.add(currentCell.claimed);

                    currentCell.claimed = id;
                    currentCell.claiming = null;
                    currentCell.claimAnim = 1;
                    currentCell.deathAnim = 0;

                    agents.forEach(agent => {
                        if (agent.id === id || agent.dead) {
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

    impactedAgents.delete(id);
    impactedAgents.delete(null);

    return { count: total, impactedAgents };
};

const stealAndRemoveNonContiguous = (grid, id, agents, impacted) => {
    const seen = new Set();

    const thiefAgent = agents.find(a => a.id === id);

    if (!thiefAgent) {
        return;
    }

    const loX = Math.max(0, thiefAgent.claimBound.minX - 1);
    const hiX = Math.min(grid[0].length - 1, thiefAgent.claimBound.maxX + 1);
    const loY = Math.max(0, thiefAgent.claimBound.minY - 1);
    const hiY = Math.min(grid.length - 1, thiefAgent.claimBound.maxY + 1);

    let stealing = 0;

    // for (let r = loY; r <= hiY; r++) {
    //     for (let c = loX; c <= hiX; c++) {
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            const pos = { x: c, y: r };
            const int = coordToInt(grid, pos);

            if (seen.has(int)) {
                continue;
            }

            const cell = grid[r][c];

            // Ignore unclaimed or own territory or unimpacted territory
            if (cell.claimed === null || cell.claimed === id) {
                continue;
            }

            const myAgent = agents.find(a => a.id === cell.claimed);
            const agentInt = coordToInt(grid, myAgent.pos);

            const { coords, included } = floodFillWithConditions(grid, pos, (_coord, cell, int) => {
                return cell.claiming === myAgent.id
                    || cell.claimed === myAgent.id
                    || int === agentInt;
            });

            if (included.has(agentInt)) {
                // Still connected, move on
                for (const v of Array.from(included)) {
                    seen.add(v);
                }
                continue;
            } else {
                for (const spot of coords) {
                    const cell = grid[spot.y][spot.x];

                    if (euclideanDistance(spot, thiefAgent.pos) < 11) {
                        cell.deathAnim = 0;
                        cell.claimAnim = 1;
                        cell.claimed = id;
                        cell.claiming = null;
                        thiefAgent.overallBound.insert(spot);
                        stealing += 1;
                    } else {
                        cell.deathAnim = 1;
                        cell.claimAnim = 0;
                        cell.claimed = null;
                        cell.claiming = null;
                    }
                }

                for (const v of Array.from(included)) {
                    seen.add(v);
                }
            }
        }
    }

    if (stealing > 10) {
        bigUpChannel.playFallingNote(stealing * 5, stealing * 40, 180, 0.05);
    }
}

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

const euclideanDistance = (pos1, pos2) => {
    const xDiff = pos1.x - pos2.x;
    const yDiff = pos1.y - pos2.y;

    return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
}
