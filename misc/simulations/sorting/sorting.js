class Sort {
    constructor(data) {
        this.data = data;
        this.paused = true;
        this.done = false;

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
        if (this.data[i] > this.data[i + 1]) {
            swap(this.data, i, i + 1);
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

            if (this.data[this.backIndex] < this.data[this.backIndex - 1]) {
                swap(this.data, this.backIndex, this.backIndex - 1);
                this.backIndex--;
                return;
            } else {
                this.backIndex = -1;
                this.primaryIndex++;
                return;
            }
        }

        if (this.data[this.primaryIndex] > this.data[this.primaryIndex + 1]) {
            swap(this.data, this.primaryIndex, this.primaryIndex + 1);
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
