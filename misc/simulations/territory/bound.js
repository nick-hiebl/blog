class Bound {
    constructor() {
        this.reset();
    }

    reset() {
        this.minX = Infinity;
        this.maxX = -Infinity;
        this.minY = Infinity;
        this.maxY = -Infinity;
    }

    insert(pos) {
        this.minX = Math.min(this.minX, pos.x);
        this.maxX = Math.max(this.maxX, pos.x);
        this.minY = Math.min(this.minY, pos.y);
        this.maxY = Math.max(this.maxY, pos.y);
    }

    join(other) {
        this.insert({ x: other.minX, y: other.minY });
        this.insert({ x: other.maxX, y: other.maxY });
    }

    noX(x) {
        if (x === this.minX) {
            if (x === this.maxX) {
                this.reset();
            }

            this.minX += 1;
        } else if (x === this.maxX) {
            this.maxX -= 1;
        }
    }

    noY(y) {
        if (y === this.minY) {
            if (y === this.maxY) {
                this.reset();
            }

            this.minY += 1;
        } else if (y === this.maxY) {
            this.maxY -= 1;
        }
    }

    contains(pos) {
        return this.minX <= pos.x && pos.x <= this.maxX && this.minY <= pos.y && pos.y <= this.maxY;
    }
}
