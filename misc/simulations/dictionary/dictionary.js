const TEXT_HEIGHT = 32;
const PADDING = 4;
const ROW_HEIGHT = TEXT_HEIGHT + PADDING;

const OUTLINE_COLOR = '#112';

class Dictionary {
    constructor(words, barLength) {
        this.words = words;
        this.gradient = null;

        this.barLength = barLength;

        this.lowIndex = 0;
        this.highIndex = words.length;
    }

    getMidIndex() {
        return Math.floor((this.lowIndex + this.highIndex) / 2);
    }

    draw({ ctx }) {
        ctx.fillStyle = '#336';
        ctx.beginPath();
        drawRoundedRectangle(ctx, -PADDING, -PADDING, 200 + 2 * PADDING, ROW_HEIGHT * this.words.length + PADDING, 12 + PADDING);
        ctx.fill();

        ctx.fillStyle = '#225';
        ctx.beginPath();
        for (let i = 0; i < this.words.length; i++) {
            drawRoundedRectangle(ctx, 0, i * ROW_HEIGHT, 200, TEXT_HEIGHT, 12);
        }
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.font = `${TEXT_HEIGHT * 0.5}px 'Segoe UI'`;
        for (let i = 0; i < this.words.length; i++) {
            ctx.fillText(this.words[i], PADDING * 2, (i + 1) * ROW_HEIGHT - 2.5 * PADDING);
        }

        ctx.fillStyle = OUTLINE_COLOR;
        ctx.beginPath();
    }

    drawPeg(canvas, rel) {
        const { ctx } = canvas;

        const y = rel * this.barLength;

        ctx.translate(0, y);

        ctx.fillStyle = '#46a';
        ctx.beginPath();
        canvas.drawRoundedRectangle(-1.5 * PADDING, -1.5 * PADDING, TEXT_HEIGHT + 3 * PADDING, 3 * PADDING, { all: 1.5 * PADDING });
        ctx.fill();

        ctx.fillStyle = '#7bf';
        ctx.beginPath();
        canvas.drawRoundedRectangle(-PADDING, -PADDING, TEXT_HEIGHT + 2 * PADDING, 2 * PADDING, { all: PADDING });
        ctx.fill();

        ctx.translate(0, -y);
    }

    drawCursor(canvas, index, suffix) {
        const { ctx } = canvas;

        ctx.fillStyle = 'white';

        const y = this.barLength * index / this.words.length;

        ctx.translate(0, y);

        const CURSOR_SIZE = 24;

        ctx.beginPath();
        ctx.moveTo(TEXT_HEIGHT + 2 * PADDING, 0);
        ctx.lineTo(TEXT_HEIGHT + 2 * PADDING + CURSOR_SIZE, -CURSOR_SIZE);
        ctx.lineTo(TEXT_HEIGHT + 2 * PADDING + CURSOR_SIZE, CURSOR_SIZE);
        ctx.fill();

        ctx.font = '64px Segoe UI';
        ctx.fillText(this.words[index] + (suffix ?? ''), TEXT_HEIGHT + 6 * PADDING + CURSOR_SIZE, 16);

        ctx.translate(0, -y);
    }

    drawBar(canvas) {
        const { ctx } = canvas;

        const gradient = ctx.createLinearGradient(0, 0, TEXT_HEIGHT, this.barLength);
        gradient.addColorStop(0 / 6, 'red');
        gradient.addColorStop(1 / 6, 'orange');
        gradient.addColorStop(2 / 6, 'yellow');
        gradient.addColorStop(3 / 6, 'green');
        gradient.addColorStop(4 / 6, 'skyblue');
        gradient.addColorStop(5 / 6, 'blue');
        gradient.addColorStop(6 / 6, 'violet');

        ctx.fillStyle = '#ddf';
        ctx.beginPath();
        drawRoundedRectangle(ctx, -2 * PADDING, -2 * PADDING, 4 * PADDING + TEXT_HEIGHT, 4 * PADDING + this.barLength, 8 + 2 * PADDING);
        ctx.fill();

        ctx.fillStyle = '#112';
        ctx.beginPath();
        drawRoundedRectangle(ctx, -PADDING, -PADDING, 2 * PADDING + TEXT_HEIGHT, 2 * PADDING + this.barLength, 8 + PADDING);
        ctx.fill();

        ctx.fillStyle = gradient;
        ctx.beginPath();
        drawRoundedRectangle(ctx, 0, 0, TEXT_HEIGHT, this.barLength, 8);
        ctx.fill();

        if (this.lowIndex > 0) {
            const lo = this.lowIndex / this.words.length;

            ctx.filter = 'grayscale(100%)';
            ctx.fillStyle = gradient;
            ctx.beginPath();
            canvas.drawRoundedRectangle(0, 0, TEXT_HEIGHT, this.barLength * lo, { top: 8 });
            ctx.fill();

            ctx.filter = 'none';
            this.drawPeg(canvas, lo);
            this.drawCursor(canvas, this.lowIndex);
        }

        if (this.highIndex < this.words.length) {
            const hi = this.highIndex / this.words.length;

            ctx.filter = 'grayscale(100%)';
            ctx.fillStyle = gradient;
            ctx.beginPath();
            canvas.drawRoundedRectangle(0, this.barLength * hi, TEXT_HEIGHT, this.barLength * (1 - hi), { bottom: 8 });
            ctx.fill();

            ctx.filter = 'none';
            this.drawPeg(canvas, hi);
            this.drawCursor(canvas, this.highIndex);
        }
    }
}