const TIME_TO_MOVE = 10;

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

const manhattanDist = (pos1, pos2) => {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
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

    agents.push(new Agent(grid, agents, { x: Math.floor(gameWidth / 2), y: Math.floor(gameHeight) / 2 }));
    // agents.push(new Agent(grid, agents, { x: 5, y: 5 }, 'player'));

    window.agents = agents;

    const agentsMap = agents.reduce((map, agent) => {
        map[agent.id] = agent;
        grid[agent.pos.y][agent.pos.x] = { claimed: agent.id, claiming: null };
        return map;
    }, {});

    window.agentsMap = agentsMap;

    const COUNT_COOLDOWN = 500;
    const EMPTY_RANGE = 12;
    const CHAMPION_RANGE = 0.2;

    let lastCountTime = performance.now();
    let spawnedThisCycle = false;

    let newGrid = floodToEmptySpaces(grid, EMPTY_RANGE);

    const draw = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        const anyChampion = agents.some(agent => agent.owned > gameHeight * gameWidth * CHAMPION_RANGE);

        if (agents.length < 16 && !anyChampion && !spawnedThisCycle) {
            const randomX = Math.floor(Math.random() * gameWidth);
            const randomY = Math.floor(Math.random() * gameHeight);

            const cell = grid[randomY][randomX];
            if (!cell.claimed && !cell.claiming && !newGrid[randomY][randomX]) {
                const newAgent = new Agent(grid, agents, { x: randomX, y: randomY });
                agents.push(newAgent);
                cell.claimed = newAgent.id;
                agentsMap[newAgent.id] = newAgent;

                spawnedThisCycle = true;
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
            spawnedThisCycle = false;

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

        const crowns = [
            { color: 'gold', agent: sortedAgents[sortedAgents.length - 1] },
            { color: 'silver', agent: sortedAgents[sortedAgents.length - 2] },
            { color: '#cd7f32', agent: sortedAgents[sortedAgents.length - 3] },
        ];

        for (const { color: crownColor, agent } of crowns) {
            if (!agent) {
                continue;
            }

            // Draw leader crown
            const leader = agent;
            const midpoint = {
                x: Math.floor((leader.overallBound.minX + leader.overallBound.maxX) / 2) + 0.5,
                y: Math.floor((leader.overallBound.minY + leader.overallBound.maxY) / 2) + 0.5,
            };

            ctx.save();
            ctx.translate(midpoint.x * GRID_SCALE, midpoint.y * GRID_SCALE);

            ctx.fillStyle = crownColor;
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
        }


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

            if (grid[Math.floor(mouse.y / GRID_SCALE)][Math.floor(mouse.x / GRID_SCALE)].claimed === agent.id) {
                ctx.strokeStyle = 'black';
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
