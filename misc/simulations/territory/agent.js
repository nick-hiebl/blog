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

const notMyTrail = id => (_, cell) => cell.claiming !== id;
const isMyHome = id => (_, cell) => cell.claimed === id;

class Agent {
    constructor(grid, agents, pos, strategy) {
        this.id = Math.random().toString().slice(2, 6);

        this.grid = grid;
        this.agents = agents;
        this.pos = pos;
        this.strategy = strategy;
        
        const hue = findHue(agents);
        const saturation = randInt(50, 90);
        const lightness = randInt(40, 80);
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
                fillClaiming(this.grid, this.pos, this.id, this.agents);
                this.claimPathLength = 0;
                this.overallBound.join(this.claimBound);
                this.claimBound.reset();
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

        if (this.claimPathLength > 10) {
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
            } else {
                // Try to get to unclaimed territory
                const explorePath = findPathWithConditions(this.grid, this.pos, () => true, (_, cell) => cell.claimed !== this.id);

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

        if (timeSinceLastMove > this.timeToMove) {
            const flag = this.tryMove();

            if (flag) {
                this.lastMovedTime = performance.now();
            }
        }
    }
}
