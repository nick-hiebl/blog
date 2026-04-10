const FIXED_COLORS = [
    { hue: 1, s: 100, v: 35 },
    { hue: 231, s: 100, v: 60 },
    { hue: 271, s: 100, v: 60 },
    { hue: 285, s: 100, v: 60 },
    { hue: 0, s: 100, v: 60 },
    { hue: 50, s: 100, v: 40 },
    { hue: 205, s: 100, v: 60 },
    { hue: 162, s: 100, v: 30 },
    { hue: 102, s: 100, v: 40 },
    { hue: 180, s: 100, v: 40 },
];

const findHue = agents => {
    const availableHues = FIXED_COLORS.filter(c => !agents.some(agent => agent.hue === c.hue));

    if (availableHues.length === 0) {
        throw new Error('No colors left');
    }

    const color = availableHues[0]; //Math.floor(Math.random() * availableHues.length)];

    return color;
};

const randInt = (lo, hi) => Math.floor(Math.random() * (hi - lo) + lo);

const notMyTrail = id => (_, cell) => cell.claiming !== id;
const isMyHome = id => (_, cell) => cell.claimed === id;
const isMyTrail = id => (_, cell) => cell.claiming === id;

class Agent {
    constructor(grid, agents, pos, strategy) {
        this.id = Math.random().toString().slice(2, 6);

        this.grid = grid;
        this.agents = agents;
        this.pos = pos;
        this.strategy = strategy;
        
        const { hue, s: saturation, v: lightness } = findHue(agents);
        this.hue = hue;
        this.color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        this.claimingColor = `hsla(${hue}, ${saturation}%, ${lightness}%, 50%)`;

        this.lastMovedTime = performance.now();
        this.timeToMove = strategy === 'player' ? TIME_TO_MOVE / 3 : TIME_TO_MOVE;

        this.claimPathLength = 0;
        this.claimBound = new Bound();

        this.path = null;
        this.owned = 1;
        this.overallBound = new Bound();
        this.overallBound.insert(pos);
    }

    resolveMove(nextPos) {
        if (manhattanDist(nextPos, this.pos) !== 1) {
            console.error('Illegal move attempted!');
            return false;
        }

        if (nextPos.x >= this.grid[0].length || nextPos.x < 0 || nextPos.y < 0 || nextPos.y >= this.grid.length) {
            // Must stay inside grid
            console.warn('Tried to move outside of grid');
            return false;
        } else if (this.agents.some(other => other.pos.x === nextPos.x && other.pos.y === nextPos.y)) {
            // Must not overlap another agent
            console.warn('Tried to step onto another agent');
            return false;
        }

        const nextCell = this.grid[nextPos.y][nextPos.x];

        if (nextCell.claiming) {
            if (nextCell.claiming === this.id) {
                console.log('Overlapping own tail');
            }
            this.agents.find(other => other.id === nextCell.claiming).dead = true;
            nextCell.claiming = this.id;
        } else if (nextCell.claimed === this.id) {
            if (this.claimPathLength > 0) {
                const claim = fillClaiming(this.grid, this.pos, this.id, this.agents);

                if (claim > 4) {
                    claimChannel.playNote(200 + claim * 5, 80, 0.15);
                }

                this.claimPathLength = 0;
                this.overallBound.join(this.claimBound);
                this.claimBound.reset();

                // Check if any agents can no longer reach their home
                for (const agent of this.agents) {
                    if (agent.claimPathLength === 0) {
                        continue;
                    }

                    if (!findPathWithConditions(this.grid, agent.pos, isMyTrail(agent.id), isMyHome(agent.id))) {
                        console.log('My path home was swallowed!');
                        agent.dead = true;
                    }
                }
            }
        } else {
            nextCell.claiming = this.id;
            this.claimPathLength += 1;
            this.claimBound.insert(nextPos);
        }

        this.pos = nextPos;
        return true;
    }

    savePath(path, description) {
        if (manhattanDist(this.pos, path[0]) !== 1) {
            console.warn('Given a BAD path');
        }

        const success = this.resolveMove(path[0]);

        if (success) {
            this.path = path.slice(1);
            this.pathDescription = description;
            return true;
        }

        console.warn('Did not succeed');
        return false;
    }

    tryMove() {
        if (this.strategy === 'player') {
            const move = getKeyboardMove();

            if (!move) {
                return false;
            }

            return this.resolveMove(addCoord(move, this.pos));
        }

        if (this.path && this.path.length > 0) {
            const isPathBad = this.path.some(spot => this.grid[spot.y][spot.x].claiming === this.id);
            if (isPathBad) {
                this.path = null;
                this.pathDescription = null;
            } else {
                const firstMove = this.path[0];
                
                if (manhattanDist(firstMove, this.pos) !== 1) {
                    console.warn('Illegal move in path!');
                }

                const success = this.resolveMove(firstMove);

                if (success) {
                    this.path = this.path.slice(1);
                    return true;
                } else {
                    this.path = null;
                    this.pathDescription = null;
                }

                console.warn('Could not follow saved path');
            }
        } else {
            this.path = null;
            this.pathDescription = null;
        }

        let closestDist = Infinity;

        if (this.claimPathLength > 0) {
            for (const agent of this.agents) {
                if (agent.id === this.id) {
                    continue;
                }

                const distance = this.claimBound.distance(agent.pos);
                if (distance < closestDist) {
                    closestDist = distance;
                }
            }
        }

        if (this.claimPathLength > 10 || (this.claimPathLength > 0 && this.claimPathLength >= closestDist)) {
            if (this.claimPathLength >= closestDist) {
                console.log('Will try to return home as enemy is close!');
            }
            const pathHome = findPathWithConditions(this.grid, this.pos, notMyTrail(this.id), isMyHome(this.id));

            if (!pathHome) {
                console.warn('This agent could not find a path home', pathHome);
            } else {
                if (this.savePath(pathHome, 'Returning home')) {
                    return true;
                }
            }
        }

        const currentCell = this.grid[this.pos.y][this.pos.x];

        if (isMyHome(this.id)(this.pos, currentCell)) {
            if (this.owned === this.grid[0].length * this.grid.length) {
                // Agent owns the whole board, so skip this step
                const center = {
                    x: this.grid[0].length / 2,
                    y: this.grid.length / 2,
                };

                const distToCenter = {
                    x: center.x - this.pos.x,
                    y: center.y - this.pos.y,
                };

                if (Math.abs(distToCenter.x) > Math.abs(distToCenter.y)) {
                    if (this.resolveMove({ x: this.pos.x + (distToCenter.x > 0 ? 1 : -1), y: this.pos.y })) {
                        return true;
                    }
                } else {
                    if (distToCenter.y === 0) {
                        if (!successChannel.started) {
                            successChannel.playFallingNote(440, 440 * 4, 640, 0.1);
                        }
                        return false;
                    }

                    if (this.resolveMove({ x: this.pos.x, y: this.pos.y + (distToCenter.y > 0 ? 1 : -1) })) {
                        return true;
                    }
                }
            } else {
                // Try to get to unclaimed territory
                const explorePath = findPathWithConditions(
                    this.grid,
                    this.pos,
                    () => true,
                    (pos, cell) => {
                        if (cell.claimed === this.id) {
                            return false;
                        }

                        // Check that the spot is not too close to an enemy
                        return !this.agents.some(agent => {
                            if (agent.id === this.id) {
                                return false;
                            }

                            return manhattanDist(pos, agent.pos) < 5;
                        });
                    },
                );

                if (!explorePath) {
                    console.warn('This agent could not find a path to new territory', explorePath);
                } else {
                    if (this.savePath(explorePath, 'Exploring')) {
                        return true;
                    }
                }
            }
        }

        const steps = getNeighbours(this.grid, this.pos, true);

        const badChoices = [];

        for (const nextPos of steps) {
            if (this.grid[nextPos.y][nextPos.x].claiming === this.id) {
                badChoices.push({ ...nextPos, reason: 'my tail' });
                continue;
            }

            if (!findPathWithConditions(this.grid, nextPos, notMyTrail(this.id), isMyHome(this.id))) {
                badChoices.push({ ...nextPos, reason: 'no way home' });
                continue;
            }

            if (this.resolveMove(nextPos)) {
                return true;
            }
        }

        if (badChoices.length > 0) {
            console.log('Making bad choice');
            return this.resolveMove(badChoices[0]);
        }

        return false;
    }

    update() {
        const time = performance.now();
        const timeSinceLastMove = time - this.lastMovedTime;

        const moveTime = this.timeToMove * (keyboardMap[' '] ? 0.2 : 1);

        const countMultiplier = this.agents.length === 3
            ? 0.8
            : this.agents.length === 2
                ? manhattanDist(this.agents[0].pos, this.agents[1].pos) < 6
                    ? 1
                    : 0.5
                : this.agents.length === 1
                    ? 0.3
                    : 1;

        if (timeSinceLastMove > moveTime * countMultiplier) {
            const flag = this.tryMove();

            if (flag) {
                this.lastMovedTime += moveTime * countMultiplier;
                return true;
            }
        }
    }
}
