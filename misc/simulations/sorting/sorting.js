let tries = 0;
function quickSort(data, lo = 0, hi = data.length) {
    if (tries > 100) {return}
    tries++;
    const pivot = lo;
    let i = lo + 1;
    let j = hi;
    while (i < j) {
        if (data[i] >= data[pivot]) {
            j--;
            console.log(data, `[${i}] = ${data[i]}, [${j}] = ${data[j]}, ${data[pivot]}`);
            swap(data, i, j);
        } else {
            i++;
        }
    }

    console.log('PIVOT', data, `[${pivot}] = ${data[pivot]}, [${i - 1}] = ${data[i - 1]}`);
    swap(data, pivot, i - 1);
    if (lo + 1 < i) {
        console.log('RecursingL', pivot, i - 1);
        quickSort(data, pivot, i - 1);
    }
    if (lo + 1 < hi - 1) {
        console.log('RecursingR', i+1, hi);
        quickSort(data, i+1, hi);
    }
}

function bubbleSort(data) {
    for (let endOfUnsorted = data.length; endOfUnsorted > 0; endOfUnsorted--) {
        let anySwaps = false;

        for (let i = 0; i < endOfUnsorted; i++) {
            if (data[i] > data[i + 1]) {
                swap(data, i, i + 1);
                anySwaps = true;
            }
        }

        if (!anySwaps) {
            break;
        }
    }
}

class Sort {
    constructor(data) {
        this.data = data;
        this.paused = true;
        this.done = false;
        this.doneWalking = false;
        this.finalWalkIndex = 0;

        this.comparisons = 0;
        this.swaps = 0;

        this.setup();
    }

    setup() {
        //
    }

    update() {
        if (!this.done) {
            this.step();
        } else if (!this.doneWalking) {
            this.finalWalkIndex++;
            if (this.finalWalkIndex >= this.data.length) {
                this.doneWalking = true;
            }
        }
    }

    getColumns() {
        if (!this.done) {
            return this.specialColumns();
        } else if (!this.doneWalking) {
            return [{ color: 'lime', index: this.finalWalkIndex }];
        }

        return [];
    }

    noteIndex() {
        if (!this.done) {
            return this.getNoteIndex();
        } else if (!this.doneWalking) {
            return this.finalWalkIndex;
        }
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
        this.walker = 1;
        this.candidate = 0;

        this.name = 'Selection sort';
    }

    step() {
        if (this.walker === this.hi) {
            this.hi--;
            swap(this.data, this.candidate, this.hi);
            this.swaps++;

            this.candidate = 0;
            this.walker = 1;

            if (this.hi === 0) {
                this.done = true;
            }

            return;
        }

        this.comparisons++;
        if (this.data[this.walker] > this.data[this.candidate]) {
            this.candidate = this.walker;
        }

        this.walker++;
        return;
    }

    specialColumns() {
        if (this.done) {
            return [];
        }

        return [
            { color: 'green', index: this.hi - 1 },
            { color: 'yellow', index: this.walker },
            { color: 'red', index: this.candidate },
        ];
    }

    getNoteIndex() {
        return this.walker;
    }
}

class Bubble extends Sort {
    setup() {
        this.sortedAfter = this.data.length;
        this.innerLoop = 0;
        this.anySwaps = false;

        this.name = 'Bubble sort';
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
        if (this.done) {
            return [];
        }

        return [
            { color: 'green', index: this.sortedAfter },
            { color: 'gold', index: this.innerLoop },
        ];
    }

    getNoteIndex() {
        return this.innerLoop + 1;
    }
}

class Insertion extends Sort {
    setup() {
        this.backIndex = -1;
        this.primaryIndex = 0;

        this.name = 'Insertion sort';
    }

    step() {
        if (this.primaryIndex >= this.data.length) {
            this.done = true;
        }

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
        const indices = [{ color: 'red', index: this.primaryIndex }];

        if (this.backIndex !== -1) {
            indices.push({ color: 'yellow', index: this.backIndex });
        }

        return indices;
    }

    getNoteIndex() {
        if (this.backIndex !== -1) {
            return this.backIndex - 1;
        }

        return this.primaryIndex;
    }
}

class Quick extends Sort {
    setup() {
        this.stack = [this.createRange(0, this.data.length)];

        this.name = 'Quicksort';
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
            this.swaps++;
            swap(this.data, range.hiSection, range.loSection);
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

    getNoteIndex() {
        return this.stack[this.stack.length - 1]?.loSection;
    }
}
