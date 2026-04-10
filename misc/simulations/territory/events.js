class EventQueue {
    constructor() {
        this.queue = [];
    }

    add(item) {
        this.queue.push(item);
    }

    hasAny(key) {
        return this.queue.some(item => item.key === key);
    }

    getAllWithKey(key) {
        return this.queue.filter(item => item.key === key);
    }

    update(ms) {
        if (ms) {
            this.queue.forEach(event => {
                event.timer -= ms;
            });
        }

        this.queue = this.queue.filter(event => event.timer > 0);
    }
}

const eventQueue = new EventQueue();
