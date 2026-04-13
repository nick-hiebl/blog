class Canvas {
    static create() {
        const canvas = document.createElement('canvas');

        return new Canvas(canvas);
    }

    static fromId(id) {
        const canvas = document.getElementById(id);

        return new Canvas(canvas);
    }

    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    drawRoundedRectangle(x, y, width, height, radii) {
        const topLeftRadius = radii.topLeft ?? radii.top ?? radii.left ?? radii.all ?? 0;

        if (topLeftRadius === 0) {
            this.ctx.moveTo(x, y);
        } else {
            this.ctx.arc(x + topLeftRadius, y + topLeftRadius, topLeftRadius, Math.PI, Math.PI * 3 / 2);
        }

        const topRightRadius = radii.topRight ?? radii.top ?? radii.right ?? radii.all ?? 0;

        if (topRightRadius === 0) {
            this.ctx.lineTo(x + width, y);
        } else {
            this.ctx.arc(x + width - topRightRadius, y + topRightRadius, topRightRadius, Math.PI * 3 / 2, Math.PI * 2);
        }

        const bottomRightRadius = radii.bottomRight ?? radii.bottom ?? radii.right ?? radii.all ?? 0;

        if (bottomRightRadius === 0) {
            this.ctx.lineTo(x + width, y + height);
        } else {
            this.ctx.arc(x + width - bottomRightRadius, y + height - bottomRightRadius, bottomRightRadius, Math.PI * 2, Math.PI * 5 / 2);
        }

        const bottomLeftRadius = radii.bottomLeft ?? radii.bottom ?? radii.left ?? radii.all ?? 0;

        if (bottomLeftRadius === 0) {
            this.ctx.lineTo(x, y + height);
        } else {
            this.ctx.arc(x + bottomLeftRadius, y + height - bottomLeftRadius, bottomLeftRadius, Math.PI * 1 / 2, Math.PI);
        }
    }
}
