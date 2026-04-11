const TIME_TO_MOVE = 40;

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
    return cell.x === 0 || cell.y === 0 || cell.x === grid[0].length - 1 || cell.y === grid.length - 1;
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

const stealTerritory = (grid, killer, fromId) => {
    const { coords: stolenSpots } = floodFillWithConditions(grid, killer.pos, (_coord, cell, _int) => {
        // Allow tracking across user tail
        return cell.claiming === killer.id
            // Allow pathing through claimers own territory
            || cell.claimed === killer.id
            // Allow pathing through dead agent's territory
            // In theory we add a range limit here eventually
            || cell.claimed === fromId;
    });

    for (spot of stolenSpots) {
        const cell = grid[spot.y][spot.x];
        if (cell.claimed === fromId) {
            if (euclideanDistance(killer.pos, spot) < 20) {
                cell.claimed = killer.id;
                killer.overallBound.insert(spot);
                cell.deathAnim = 0;
                cell.claimAnim = 1;
            } else {
                cell.claimed = null;
                cell.deathAnim = 1;
                cell.claimAnim = 0;
            }
        }
    }
};

const manhattanDist = (pos1, pos2) => {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
};

const createGrid = (width, height) => {
    const grid = [];

    let cells = 0;

    for (let r = 0; r < height; r++) {
        const row = [];
        for (let c = 0; c < width; c++) {
            if (r > height * 0.8 && c > width * 0.8) {
                row.push(null);
            } else {
                row.push({
                    claimed: null,
                    claiming: null,
                });
                cells += 1;
            }
        }

        grid.push(row);
    }

    grid.fullSize = cells;

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

    const gameWidth = 32; // Math.floor(width / GRID_SCALE);
    const gameHeight = 40; // Math.floor(height / GRID_SCALE);

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

    const update = () => {
        const anyChampion = agents.some(agent => agent.owned > gameHeight * gameWidth * CHAMPION_RANGE);

        if (agents.length < 16 && !anyChampion && !spawnedThisCycle) {
            const randomX = Math.floor(Math.random() * gameWidth);
            const randomY = Math.floor(Math.random() * gameHeight);

            const cell = grid[randomY][randomX];
            if (cell && !cell.claimed && !cell.claiming && !newGrid[randomY][randomX]) {
                const newAgent = new Agent(grid, agents, { x: randomX, y: randomY });
                agents.push(newAgent);
                cell.claimed = newAgent.id;
                cell.claimAnim = 0;
                cell.deathAnim = 0;
                agentsMap[newAgent.id] = newAgent;

                spawnedThisCycle = true;
            }
        }

        function clearDead(claimerId, claimerPos) {
            const kills = eventQueue.getAllWithKey('Kill');

            for (let i = agents.length - 1; i >= 0; i--) {
                const agent = agents[i];
                if (agent.dead) {
                    const killer = kills.find(event => event.other === agent.id);
                    if (killer) {
                        killer.timer = -1;
                        stealTerritory(grid, agentsMap[killer.self], agent.id);
                    }

                    clearBoardOfId(grid, agent.id, claimerId, claimerPos);
                    delete agentsMap[agent.id];

                    agents.splice(i, 1);
                }
            }

            eventQueue.update();
        }

        let anyDead = false;

        for (const agent of agents) {
            if (agent.dead) {
                continue;
            }

            agent.update();

            const claims = eventQueue.getAllWithKey('Claim');
            claims.forEach(c => c.timer = 0);

            if (agents.some(agent => agent.dead)) {
                anyDead = true;
                clearDead(agent.id, agent.pos);
            }
        }

        if (anyDead) {
            deadChannel.playFallingNote(200, 40, 200, 0.025);
        }

        for (const agent of agents) {
            let seenTop = false, seenBottom = false;
            for (let c = agent.overallBound.minX; c <= agent.overallBound.maxX; c++) {
                if (grid[agent.overallBound.minY][c]?.claimed === agent.id) {
                    seenTop = true;
                }
                if (grid[agent.overallBound.maxY][c]?.claimed === agent.id) {
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
                if (grid[r][agent.overallBound.minX]?.claimed === agent.id) {
                    seenLeft = true;
                }
                if (grid[r][agent.overallBound.maxX]?.claimed === agent.id) {
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
                    if (!cell) continue;

                    if (cell.claimed) {
                        agentsMap[cell.claimed].owned += 1;
                    }
                }
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

        // Agent solid squares path
        for (const agent of agents) {
            ctx.beginPath();
            ctx.fillStyle = agent.color;

            for (let r = agent.overallBound.minY; r <= agent.overallBound.maxY; r++) {
                const row = grid[r];

                for (let c = agent.overallBound.minX; c <= agent.overallBound.maxX; c++) {
                    const cell = row[c];

                    if (!cell) {
                        continue;
                    }

                    if (cell.claimed === agent.id) {
                        rectInGrid(c, r);

                        if (c + 1 < row.length && row[c + 1] && row[c + 1].claimed === agent.id) {
                            ctx.rect((c + 1) * GRID_SCALE - 1, r * GRID_SCALE + 1, 2, GRID_SCALE - 2);
                        }
                        if (r + 1 < grid.length && grid[r + 1][c] && grid[r + 1][c].claimed === agent.id) {
                            ctx.rect(c * GRID_SCALE + 1, (r + 1) * GRID_SCALE - 1, GRID_SCALE - 2, 2);
                        }
                    }
                }
            }

            ctx.fill();
        }

        const FADE_RATE = 0.02;
        const DEATH_FADE_RATE = 0.01;

        // Claim and death animation draw
        for (let r = 0; r < grid.length; r++) {
            const row = grid[r];

            for (let c = 0; c < row.length; c++) {
                const cell = row[c];

                if (!cell) continue;

                if (cell.deathAnim > 0) {
                    if (cell.claimAnim > 0) {
                        // Idk what happened here
                        console.warn('Cell both claimed and deathed');
                        cell.claimAnim = Math.max(0, cell.claimAnim - FADE_RATE);
                    }

                    cell.deathAnim = Math.max(0, cell.deathAnim - DEATH_FADE_RATE);

                    ctx.fillStyle = `hsla(0, 100%, 50%, ${Math.floor(cell.deathAnim * 100)}%)`;
                    ctx.fillRect(c * GRID_SCALE, r * GRID_SCALE, GRID_SCALE, GRID_SCALE);
                } else if (cell.claimAnim > 0) {
                    cell.claimAnim = Math.max(0, cell.claimAnim - FADE_RATE);

                    ctx.fillStyle = `hsla(0, 100%, 100%, ${Math.floor(cell.claimAnim * 100)}%)`;
                    ctx.fillRect(c * GRID_SCALE, r * GRID_SCALE, GRID_SCALE, GRID_SCALE);
                }
            }
        }

        if (agents.length === 1 && agents[0].champion) {
            const now = performance.now();
            const elapsed = now - agents[0].championTime;

            for (let r = 0; r < grid.length; r++) {
                for (let c = 0; c < grid[r].length; c++) {
                    if (!grid[r][c]) continue;

                    const pos = { x: c, y: r };

                    const distance = euclideanDistance(agents[0].pos, pos);

                    const radVariation = Math.abs(distance - elapsed / 30);

                    if (radVariation < 2) {
                        let a = 58;

                        ctx.fillStyle = `hsla(0, 100%, 100%, ${a}%)`;
                        ctx.fillRect(c * GRID_SCALE, r * GRID_SCALE, GRID_SCALE, GRID_SCALE);
                    }
                }
            }
        }

        for (const agent of agents) {
            if (agent.claimPathLength > 0) {
                ctx.beginPath();
                ctx.fillStyle = agent.claimingColor;

                for (let r = agent.claimBound.minY; r <= agent.claimBound.maxY; r++) {
                    const row = grid[r];

                    for (let c = agent.claimBound.minX; c <= agent.claimBound.maxX; c++) {
                        const cell = row[c];

                        if (!cell) continue;

                        if (cell.claiming === agent.id) {
                            rectInGrid(c, r);
                        }
                    }
                }

                ctx.fill();
            }
        }

        const now = performance.now();

        const getXY = (agent) => {
            if (agent.lastPos && agent.recentMoveTime) {
                if (agent.lastMovedTime + agent.recentMoveTime < now) {
                    return agent.pos;
                } else {
                    const lerpFactor = (now - agent.lastMovedTime) / agent.recentMoveTime;

                    return {
                        x: lerpFactor * agent.pos.x + (1 - lerpFactor) * agent.lastPos.x,
                        y: lerpFactor * agent.pos.y + (1 - lerpFactor) * agent.lastPos.y,
                    };
                }
            }

            return agent.pos;
        };

        for (const agent of agents) {

            const { x, y } = getXY(agent);

            ctx.fillStyle = agent.color;
            ctx.fillRect(x * GRID_SCALE, y * GRID_SCALE, GRID_SCALE, GRID_SCALE);
            ctx.fillStyle = 'white';
            ctx.fillRect(x * GRID_SCALE + 2, y * GRID_SCALE + 2, GRID_SCALE - 4, GRID_SCALE - 4);

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

        for (const agent of agents.filter(agent => agent.champion)) {
            // Draw leader crown
            const leader = agent;

            ctx.save();
            ctx.translate((leader.pos.x + 0.5) * GRID_SCALE, leader.pos.y * GRID_SCALE);

            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;

            ctx.fillStyle = 'gold';
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
    };

    const textBoxWidth = 400;
    const textBoxHeight = 300;
    const maxItems = 8;

    const statScreenDraw = () => {
        const sortedAgents = agents.slice();
        sortedAgents.sort((a, b) => b.owned - a.owned);

        const boosts = eventQueue.getAllWithKey('Boost');

        for (let i = 0; i < sortedAgents.length && i < maxItems; i++) {
            const agent = sortedAgents[i];

            const padding = 8;
            const boxHeight = 48;
            const boxWidth = textBoxWidth / 2 - padding;
            const boxLeft = sortedAgents.length === 1
                ? textBoxWidth / 2 - boxWidth / 2
                : (i % 2 ? boxWidth + 2 * padding : 0);
            const boxTop = (boxHeight + padding * 2) * Math.floor(i / 2) + padding * 2;

            const cornerRounding = 5;

            const myBoosts = boosts.filter(b => b.self === agent.id);

            let factor = 0;

            myBoosts.forEach(boost => {
                factor = Math.max(factor, boost.timer / boost.max);
            });

            ctx.save();
            ctx.translate(boxLeft + boxWidth / 2, boxTop + boxHeight / 2);

            if (factor > 0) {
                // console.log(bestBoost);
                ctx.scale(1 + factor / 20, 1 + factor / 20);
            }

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            drawRoundedRectangle(ctx, -boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, cornerRounding);
            ctx.fill();
            // ctx.arc(boxLeft + boxWidth - cornerRounding, boxTop + boxHeight - cornerRounding)
            // ctx.fillRect(boxLeft, boxTop, boxWidth, boxHeight);

            ctx.fillStyle = agent.color;
            // ctx.fillRect(boxLeft + padding, boxTop + padding, boxHeight - 2 * padding, boxHeight - 2 * padding);
            ctx.fillRect(-boxWidth / 2 + padding, -boxHeight / 2 + padding, boxHeight - 2 * padding, boxHeight - 2 * padding);

            // ctx.fillStyle = '#ffffff88';
            // ctx.fillRect(boxLeft + boxHeight, boxTop + padding, boxWidth - padding - boxHeight, boxHeight - 2 * padding);

            ctx.font = 'bold 32px Segoe UI';
            // ctx.fillStyle = agent.color;
            ctx.fillStyle = 'black';

            const owned = Math.round(agent.owned / (gameWidth * gameHeight) * 100);

            // ctx.fillText(`${owned}%`, boxLeft + boxHeight + padding, boxTop + boxHeight - 1.5 * padding);
            ctx.fillText(`${owned}%`, -boxWidth / 2 + boxHeight + padding, -boxHeight / 2 + boxHeight - 1.5 * padding);

            ctx.restore();
        }
    };

    const innerScale = 3;

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

        const bottomOfScreen = height / 2 + innerScreenHeight / 2;

        ctx.save();
        ctx.translate(width / 2 - textBoxWidth / 2, bottomOfScreen / 2 + height / 2 - textBoxHeight / 2);
        statScreenDraw();
        ctx.restore();

        // ctx.fillStyle = 'red';
        // ctx.fillRect(width / 2 - 1 + 100, 0, 2, height);
        // ctx.fillRect(width / 2 - 1 - 100, 0, 2, height);
    };

    let lastTime = null;

    const mainLoop = () => {
        const now = performance.now();

        const elapsed = now - lastTime;

        update(elapsed);
        mainDraw(elapsed);

        requestAnimationFrame(mainLoop);

        eventQueue.update(elapsed);

        lastTime = now;
    }

    setTimeout(() => {
        lastTime = performance.now();
        requestAnimationFrame(mainLoop);
    }, 500);
};

document.addEventListener('DOMContentLoaded', mainFunction);
document.addEventListener('keydown', (event) => {
    keyboardMap[event.key] = true;
});
document.addEventListener('keyup', (event) => {
    keyboardMap[event.key] = false;
});
