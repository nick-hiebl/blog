const SPELL_DURATION = 2000;

class Wizard extends Sort {
    setup() {
        this.max = Math.max(...this.data.slice(this.lo, this.hi));

        this.doneSet = new Set();
        this.spell = null;
        this.hex = null;
        this.spirits = [];

        this.thunder = new Channel('triangle');

        this.name = 'Wizard sort';
    }

    ifHasThenPaySpirits(n) {
        const availableSpirits = this.spirits.filter(s => !s.spent);

        if (availableSpirits.length < n) {
            return false;
        }

        availableSpirits.slice(0, n).forEach(spirit => {
            spirit.spent = true;
            spirit.deathTime = performance.now();
        });

        return true;
    }

    arrangeSwaps(valueAndTargets) {
        const map = new Map();
        const allValues = new Set();
        for (const { value, targetIndex } of valueAndTargets) {
            map.set(targetIndex, value);
            allValues.add(value);
            allValues.add(this.data[targetIndex]);
        }

        const leftoverIndices = [];
        for (const { index } of valueAndTargets) {
            if (map.get(index) === undefined) {
                leftoverIndices.push(index);
                // allValues.add(this.data[index]);
            }
        }

        for (const { value } of valueAndTargets) {
            allValues.delete(value);
        }

        const leftoverValues = Array.from(allValues);
        shuffle(leftoverValues);
        for (let i = 0; i < leftoverIndices.length; i++) {
            map.set(leftoverIndices[i], leftoverValues[i]);
        }

        for (const key of map.keys()) {
            this.data[key] = map.get(key);
        }
    }

    playThunder() {
        this.thunder.oscillator.frequency.setValueAtTime(60, audioContext.currentTime);
        this.thunder.oscillator.frequency.exponentialRampToValueAtTime(30, audioContext.currentTime + 2);

        this.thunder.volume.gain.setValueAtTime(0, audioContext.currentTime);
        this.thunder.volume.gain.linearRampToValueAtTime(0.1, audioContext.currentTime);
        this.thunder.volume.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 3);

        if (!this.thunder.started) {
            console.log('starting');
            this.thunder.oscillator.start();
            this.thunder.started = true;
        }
    }

    createSpellForItems(n) {
        const availableIndices = new Array(this.hi - this.lo)
            .fill(0)
            .map((_, index) => this.lo + index)
            .filter(v => !this.doneSet.has(v));

        const spellFromValues = availableIndices.chooseRandom(n)
            .map(i => ({
                index: i,
                value: this.data[i],
                targetIndex: this.data.slice(this.lo, this.hi).filter(v => v < this.data[i]).length + this.lo,
            }));

        const spellList = new Set();
        const correctIndices = [];
        for (const v of spellFromValues) {
            // swap(this.data, v.index, v.targetIndex);
            spellList.add(v.index);
            spellList.add(v.targetIndex);
            correctIndices.push(v.targetIndex);
            this.doneSet.add(v.targetIndex);
        }

        this.arrangeSwaps(spellFromValues);
        console.log('Deciding for spell!', spellFromValues);

        this.spell = {
            indices: spellList,
            startTime: performance.now(),
        };
        this.playThunder();
    }

    createHex() {
        const availableIndices = new Array(this.hi - this.lo)
            .fill(0)
            .map((_, index) => this.lo + index);
            // .filter(v => !this.doneSet.has(v));

        const randomSpot = availableIndices.chooseRandom();
        if (randomSpot === undefined) {
            return;
        }
        this.hex = {
            spots: [randomSpot],
            complete: false,
        };
    }

    step() {
        if (this.spell) {
            if (performance.now() - this.spell.startTime > SPELL_DURATION) {
                this.spell = null;
            }
            return;
        }

        if (this.doneSet.size === this.hi - this.lo) {
            this.done = true;
            this.hex = null;
            this.spell = null;
            return;
        }

        if (!this.hex) {
            if (this.ifHasThenPaySpirits(3)) {
                this.createSpellForItems(2);
                this.hex = null;

                return;
            }

            this.createHex();
            return;
        }

        if (this.hex.complete) {
            for (let i = 0; i < this.hex.spots.length - 1; i++) {
                this.spirits.push({ x: -1, y: -1 });
            }
            this.hex = null;

            return;
        }

        const lastHexSpot = this.hex.spots[this.hex.spots.length - 1];
        if (lastHexSpot >= this.hi - 1) {
            this.hex.complete = true;
            return;
        }

        const newSpot = this.data.map((_, index) => index)
            .slice(lastHexSpot)
            .chooseRandom();

        if (newSpot === undefined) {

        }
        // const newSpot = randInt(lastHexSpot + 1, this.hi);

        this.comparisons++;
        if (this.data[lastHexSpot] > this.data[newSpot]) {
            this.hex.complete = true;
            return;
        } else {
            this.hex.spots.push(newSpot);
            return;
        }
    }

    updateSpirits(areaWidth, areaHeight) {
        const SPAWN_BUFFER = 100;
        const FLOAT_BUFFER = 50;
        const MAX_SPEED = 1;
        const VEL_STEP = 0.1;
        const DEATH_TIME = 1000;

        this.spirits = this.spirits.filter(spirit => !spirit.dead);

        const now = performance.now();

        for (const spirit of this.spirits) {
            if (now - spirit.deathTime > DEATH_TIME) {
                spirit.dead = true;
            }
            if (spirit.x === -1) {
                spirit.x = randInt(SPAWN_BUFFER, areaWidth - SPAWN_BUFFER);
                spirit.y = randInt(SPAWN_BUFFER, 2 * SPAWN_BUFFER);
                spirit.vx = 0;
                spirit.vy = 0;
            }

            if (spirit.x < FLOAT_BUFFER) {
                spirit.vx = Math.min(spirit.vx + VEL_STEP, MAX_SPEED);
            } else if (spirit.x > areaWidth - FLOAT_BUFFER) {
                spirit.vx = Math.max(spirit.vx - VEL_STEP, -MAX_SPEED);
            } else {
                spirit.vx += randInt(-10, 11) / 10 * VEL_STEP;
            }
            if (spirit.y < FLOAT_BUFFER) {
                spirit.vy = Math.min(spirit.vy + VEL_STEP, MAX_SPEED);
            } else if (spirit.y > 2 * SPAWN_BUFFER) {
                spirit.vy = Math.max(spirit.vy - VEL_STEP, -MAX_SPEED);
            } else {
                spirit.vy += randInt(-10, 11) / 10 * VEL_STEP;
            }
            spirit.x += spirit.vx;
            spirit.y += spirit.vy;
        }
    }

    draw(canvas, ctx, areaWidth, areaHeight) {
        const SPIRIT_RADIUS = 25;

        const sliceWidth = areaWidth / (this.hi - this.lo);
        const unitHeight = areaHeight / this.max;

        this.updateSpirits(areaWidth, areaHeight);

        ctx.fillStyle = 'purple';
        ctx.beginPath();
        ctx.filter = 'drop-shadow(0px 0px 25px purple)';
        for (const spirit of this.spirits.filter(s => !s.spent)) {
            ctx.moveTo(spirit.x + SPIRIT_RADIUS, spirit.y);
            ctx.ellipse(spirit.x, spirit.y, SPIRIT_RADIUS, SPIRIT_RADIUS, 0, 0, 2 * Math.PI);
        }
        ctx.fill();

        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.filter = 'drop-shadow(0px 0px 50px red)';
        for (const spirit of this.spirits.filter(s => s.spent)) {
            ctx.moveTo(spirit.x + SPIRIT_RADIUS, spirit.y);
            ctx.ellipse(spirit.x, spirit.y, SPIRIT_RADIUS, SPIRIT_RADIUS, 0, 0, 2 * Math.PI);
        }
        ctx.fill();

        ctx.filter = 'none';

        ctx.fillStyle = 'white';
        ctx.beginPath();
        const inset = 8;
        for (let i = this.lo; i < this.hi; i++) {
            if (this.doneSet.has(i) || this.spell?.indices?.has?.(i)) {
                continue;
            }

            if (this.hex) {
                if (this.hex.spots.includes(i)) {
                    continue;
                }
            }

            const x = i * sliceWidth;
            const barHeight = this.data[i] * unitHeight;
            const y = areaHeight - barHeight;

            canvas.drawRoundedRectangle(x, y, sliceWidth - inset, barHeight, { top: 8 });
        }
        ctx.fill();

        if (this.hex) {
            ctx.filter = 'drop-shadow(0px 3px 5px #50ebb4)';
            ctx.fillStyle = '#50ebb4';
            ctx.beginPath();
            for (const i of this.hex.spots) {
                // if (this.doneSet.has(i)) {
                //     continue;
                // }
                const x = i * sliceWidth;
                const barHeight = this.data[i] * unitHeight;
                const y = areaHeight - barHeight;

                canvas.drawRoundedRectangle(x, y, sliceWidth - inset, barHeight, { top: 8 });
            }
            ctx.fill();
        }

        ctx.filter = 'drop-shadow(0px 3px 5px aqua)';
        ctx.fillStyle = 'aqua';
        ctx.beginPath();
        for (const i of this.doneSet) {
            if (this.spell?.indices?.has?.(i) || this.hex?.spots?.includes?.(i)) {
                continue;
            }
            const x = i * sliceWidth;
            const barHeight = this.data[i] * unitHeight;
            const y = areaHeight - barHeight;

            canvas.drawRoundedRectangle(x, y, sliceWidth - inset, barHeight, { top: 8 });
        }
        ctx.fill();

        if (this.spell) {
            const spellFraction = Math.max(Math.min(1, (performance.now() - this.spell.startTime) / SPELL_DURATION), 0);

            ctx.filter = 'drop-shadow(0 3px 8px maroon)';
            ctx.fillStyle = 'maroon';
            ctx.beginPath();

            for (const i of Array.from(this.spell.indices)) {
                if (this.hex?.spots?.includes?.(i)) {
                    continue;
                }
                const x = i * sliceWidth;
                const fullBarHeight = this.data[i] * unitHeight;
                const barHeight = Math.min(
                    fullBarHeight,
                    this.max * unitHeight * spellFraction,
                );
                const y = areaHeight - barHeight;

                canvas.drawRoundedRectangle(x, y, sliceWidth - inset, barHeight, { top: 8 });
            }
            ctx.fill();
        }
    }

    specialColumns() {
        return [];
    }

    getNoteIndex() {
        return -1;
    }
}
