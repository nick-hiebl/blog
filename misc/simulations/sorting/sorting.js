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

class Bubble extends Sort {    
    setup() {
        this.sortedAfter = this.data.length;
        this.innerLoop = 0;
    }

    step() {
        if (this.innerLoop >= this.sortedAfter - 1) {
            this.innerLoop = 0;
            this.sortedAfter--;

            if (this.sortedAfter === 1) {
                this.done = true;
                return;
            }

            return;
        }

        const i = this.innerLoop;
        if (this.data[i] > this.data[i + 1]) {
            const temp = this.data[i + 1];
            this.data[i + 1] = this.data[i];
            this.data[i] = temp;
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
