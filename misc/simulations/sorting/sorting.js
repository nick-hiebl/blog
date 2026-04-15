class Sort {
    constructor(data) {
        this.data = data;
        this.paused = true;
        this.done = false;

        this.comparisons = 0;
        this.swaps = 0;

        this.setup();
    }

    setup() {
        //
    }

    specialColumns() {
        return [];
    }
}

const swap = (array, i, j) => {
    [array[i], array[j]] = [array[j], array[i]];
};

class Selection extends Sort {
    setup() {
        this.hi = this.data.length;
        this.walker = 0;
        this.candidate = 0;
    }

    step() {

    }
}

class Bubble extends Sort {
    setup() {
        this.sortedAfter = this.data.length;
        this.innerLoop = 0;
        this.anySwaps = false;
    }

    step() {
        if (this.innerLoop >= this.sortedAfter - 1) {
            this.innerLoop = 0;
            this.sortedAfter--;

            if (!this.anySwaps) {
                this.done = true;
                this.sortedAfter = 1;
                return;
            }

            this.anySwaps = false;

            if (this.sortedAfter === 1) {
                this.done = true;
                return;
            }

            return;
        }

        const i = this.innerLoop;

        this.comparisons++;
        if (this.data[i] > this.data[i + 1]) {
            swap(this.data, i, i + 1);
            this.swaps++;
            this.anySwaps = true;
        }

        this.innerLoop++;
    }

    specialColumns() {
        return [
            { color: 'green', index: this.sortedAfter },
            { color: 'gold', index: this.innerLoop },
        ];
    }
}

class Insertion extends Sort {
    setup() {
        this.backIndex = -1;
        this.primaryIndex = 0;
    }

    step() {
        if (this.backIndex !== -1) {
            if (this.backIndex === 0) {
                this.primaryIndex++;
                this.backIndex = -1;
                return;
            }

            this.comparisons++;
            if (this.data[this.backIndex] < this.data[this.backIndex - 1]) {
                swap(this.data, this.backIndex, this.backIndex - 1);
                this.swaps++;

                this.backIndex--;
                return;
            } else {
                this.backIndex = -1;
                this.primaryIndex++;
                return;
            }
        }

        this.comparisons++;
        if (this.data[this.primaryIndex] > this.data[this.primaryIndex + 1]) {
            swap(this.data, this.primaryIndex, this.primaryIndex + 1);
            this.swaps++;

            this.backIndex = this.primaryIndex;
        } else {
            this.primaryIndex++;
        }
    }

    specialColumns() {
        const indices = [{ color: 'skyblue', index: this.primaryIndex }];

        if (this.backIndex !== -1) {
            indices.push({ color: 'pink', index: this.backIndex });
        }

        return indices;
    }
}

class Quick extends Sort {
    setup() {
        this.stack = [this.createRange(0, this.data.length)];
    }

    createRange(lo, hi) {
        return {
            lo,
            hi,
            pivot: lo,
            loSection: lo + 1,
            hiSection: hi,
        };
    }

    step() {
        const range = this.stack[this.stack.length - 1];

        if (!range) {
            this.done = true;
            return;
        }

        if (range.lo + 1 >= range.hi) {
            this.stack.pop();
            return;
        }

        if (range.loSection === range.hiSection) {
            this.swaps++;
            swap(this.data, range.loSection - 1, range.pivot);
            range.pivot = range.loSection - 1;

            // This range is now arranged into a LEFT < pivot < RIGHT order, we don't need to continue analysing this range
            this.stack.pop();

            if (range.pivot + 1 < range.hi - 1) {
                this.stack.push(this.createRange(range.pivot + 1, range.hi));
            }
            if (range.lo < range.pivot - 1) {
                this.stack.push(this.createRange(range.lo, range.pivot));
            }
            return;
        }

        this.comparisons++;
        if (this.data[range.loSection] > this.data[range.pivot]) {
            range.hiSection--;
            swap(this.data, range.hiSection, range.loSection);
            this.swaps++;
            return;
        } else {
            range.loSection++;
            return;
        }
    }

    specialColumns() {
        const finalRange = this.stack[this.stack.length - 1];

        if (finalRange) {
            return [
                { color: 'red', index: finalRange.pivot },
                { color: 'yellow', index: finalRange.loSection },
                { color: 'green', index: finalRange.hiSection },
            ];
        }

        return [];
    }
}
