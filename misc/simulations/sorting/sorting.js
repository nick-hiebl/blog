function quickSort(data, lo = 0, hi = data.length) {
    if (lo + 1 >= hi) return;
    // Use first item as pivot
    let i = lo + 1;
    let j = hi;
    while (i < j) {
        if (data[i] >= data[lo]) {
            j--;
            swap(data, i, j);
        } else {
            i++;
        }
    }

    // Move pivot to correct spot
    swap(data, lo, i - 1);
    quickSort(data, lo, i - 1);
    quickSort(data, i, hi);
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
    constructor(data, lo, hi) {
        this.lo = lo ?? 0;
        this.hi = hi ?? data.length;
        this.data = data;
        this.paused = true;
        this.done = false;
        this.doneWalking = false;

        this.finalWalkIndex = this.lo;

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
            if (this.finalWalkIndex >= this.hi) {
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
        this.top = this.hi;
        this.walker = this.lo + 1;
        this.candidate = this.lo;

        this.name = 'Selection sort';
    }

    step() {
        if (this.walker === this.top) {
            this.top--;
            swap(this.data, this.candidate, this.top);
            this.swaps++;

            this.candidate = this.lo;
            this.walker = this.lo + 1;

            if (this.top === this.lo) {
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
            { color: 'green', index: this.top - 1 },
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
        this.sortedAfter = this.hi;
        this.innerLoop = this.lo;
        this.anySwaps = false;

        this.name = 'Bubble sort';
    }

    step() {
        if (this.innerLoop >= this.sortedAfter - 1) {
            this.innerLoop = this.lo;
            this.sortedAfter--;

            if (!this.anySwaps) {
                this.done = true;
                this.sortedAfter = this.lo + 1;
                return;
            }

            this.anySwaps = false;

            if (this.sortedAfter === this.lo + 1) {
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
        this.primaryIndex = this.lo;

        this.name = 'Insertion sort';
    }

    step() {
        if (this.primaryIndex >= this.hi) {
            this.done = true;
        }

        if (this.backIndex !== -1) {
            if (this.backIndex === this.lo) {
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
        this.stack = [this.createRange(this.lo, this.hi)];

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

    postDraw(canvas, sliceWidth, unitHeight, min, max) {
        const current = this.stack[this.stack.length - 1];

        if (!current) return;

        const ctx = canvas.ctx;
        ctx.strokeStyle = 'pink';

        ctx.beginPath();
        ctx.moveTo(sliceWidth * current.loSection, canvas.height - TEXT_HEIGHT - min * unitHeight);
        ctx.lineTo(sliceWidth * current.loSection, canvas.height - TEXT_HEIGHT - max * unitHeight);

        ctx.moveTo(sliceWidth * current.hiSection, canvas.height - TEXT_HEIGHT - min * unitHeight);
        ctx.lineTo(sliceWidth * current.hiSection, canvas.height - TEXT_HEIGHT - max * unitHeight);

        ctx.moveTo(sliceWidth * current.loSection, canvas.height - TEXT_HEIGHT - this.data[current.pivot] * unitHeight);
        ctx.lineTo(sliceWidth * current.hiSection, canvas.height - TEXT_HEIGHT - this.data[current.pivot] * unitHeight);

        ctx.stroke();
    }
}

class Merge extends Sort {
    setup() {
        this.stack = [this.createRange(this.lo, this.hi)];

        this.name = 'Mergesort';
    }

    createRange(lo, hi) {
        if (hi - lo < 8) {
            return {
                lo,
                hi,
                sort: new Insertion(this.data, lo, hi),
            };
        }
        return {
            lo,
            hi,
            buffer: [],
            break: -1,
            left: -1,
            right: -1,
            walk: lo,
        };
    }

    step() {
        if (!this.stack[this.stack.length - 1]) {
            this.done = true;
            return;
        }

        const current = this.stack[this.stack.length - 1];

        if (current.sort) {
            if (current.sort.done) {
                this.stack.pop();
                this.comparisons += current.sort.comparisons;
                this.swaps += current.sort.swaps;
                return;
            } else {
                current.sort.step();
                return;
            }
        }

        if (current.lo + 1 >= current.hi) {
            this.stack.pop();
            return;
        }

        if (current.break === -1) {
            const mid = Math.floor((current.lo + current.hi) / 2);
            current.break = mid;
            current.left = current.lo;
            current.right = mid;

            this.stack.push(this.createRange(mid, current.hi));
            this.stack.push(this.createRange(current.lo, mid));
        } else {
            while (current.left < current.break || current.right < current.hi) {
                if (current.left === current.break) {
                    current.buffer.push(this.data[current.right]);
                    current.right++;
                    return;
                } else if (current.right === current.hi) {
                    current.buffer.push(this.data[current.left]);
                    current.left++;
                    return;
                }

                this.comparisons++;
                if (this.data[current.left] < this.data[current.right]) {
                    current.buffer.push(this.data[current.left]);
                    current.left++;
                } else {
                    current.buffer.push(this.data[current.right]);
                    current.right++;
                }
            }
            if (current.left === current.break && current.right === current.hi) {
                // Done merging into buffer
                if (current.walk < current.hi) {
                    // Copy back from buffer
                    this.data[current.walk] = current.buffer[current.walk - current.lo];
                    current.walk++;
                    return;
                } else {
                    // Done copying back from buffer
                    this.stack.pop();
                    return;
                }
            }
        }
    }

    specialColumns() {
        const current = this.stack[this.stack.length - 1];

        if (!current) {
            return [];
        }

        if (current.walk !== -1) {
            return [{ color: 'red', index: current.walk }];
        } else if (current.left !== -1 || current.right !== -1) {
            return [
                { color: 'red', index: current.left },
                { color: 'red', index: current.right },
            ];
        }

        return [];
    }

    getNoteIndex() {
        return this.specialColumns()[0].index;
    }
}

class Comb extends Sort {
    setup() {
        this.stepAmount = Math.floor((this.hi - this.lo) / 1.3);
        this.comb = this.lo;
        this.anySwaps = false;

        this.name = 'Combsort';
    }

    step() {
        if (this.comb + this.stepAmount >= this.hi) {
            if (this.stepAmount === 1) {
                if (!this.anySwaps) {
                    this.done = true;
                    return;
                } else {
                    this.anySwaps = false;
                    this.comb = this.lo;
                    return;
                }
            } else {
                this.anySwaps = false;
                this.comb = this.lo;
                this.stepAmount = Math.floor(this.stepAmount / 1.3);
                return;
            }
        }

        this.comparisons++;
        if (this.data[this.comb] > this.data[this.comb + this.stepAmount]) {
            this.anySwaps = true;
            swap(this.data, this.comb, this.comb + this.stepAmount);
            this.swaps++;
        }

        this.comb++;
    }

    specialColumns() {
        return [
            { color: 'red', index: this.comb },
            { color: 'red', index: this.comb + this.stepAmount },
        ];
    }

    getNoteIndex() {
        return this.comb;
    }
}
