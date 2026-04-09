class DoubleEndedQueue {
    constructor() {
        this.front = [];
        this.tail = [];
    }

    empty() {
        return this.front.length === 0 && this.tail.length === 0;
    }

    push(item) {
        this.tail.push(item);
    }

    head() {
        return this.front[this.front.length - 1];
    }

    pop() {
        if (this.front.length > 0) {
            return this.front.pop();
        } else if (this.tail.length > 0) {
            this.front = this.tail;
            this.front.reverse();
            this.tail = [];

            return this.front.pop();
        } else {
            throw new Error('No items to pop!');
        }
    }
}
