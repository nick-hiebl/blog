const myInterp = (target, current) => {
    if (Math.abs((target + 1) / (current + 1) - 1) < 0.001) {
        return target;
    }

    return target * 0.01 + current * 0.99;
};

const lerp = (current, target, factor) => {
    return current * (1 - factor) + target * factor;
}

const expInterp = (current, target, factor) => {
    if (factor <= 0) {
        return current;
    } else if (factor >= 1) {
        return target;
    }

    const t = (Math.exp(factor * factor) - 1) / (Math.E - 1);

    return lerp(current, target, t);
}

const mainFunction = (words) => {
    const button = document.getElementById('click-me');
    const canvas = Canvas.fromId('canvas');
    const ctx = canvas.ctx;

    const edgePadding = 100;


    const idealBarLength = 1920 - 2 * edgePadding;

    const dict = new Dictionary(words, idealBarLength);

    const myWord = 'tirelessly';

    let currentLow = 0;

    const ZOOM_DURATION = 1000;

    let timeLeft = 0;
    let myLow = 0;
    let myLowTarget = 0;
    let myHigh = dict.words.length;
    let myHighTarget = dict.words.length;

    const draw = (elapsedTime) => {
        if (timeLeft > 0) {
            timeLeft -= elapsedTime;

            if (timeLeft <= 0) {
                timeLeft = 0;
                myLow = myLowTarget;
                myHigh = myHighTarget;
            }
        }

        canvas.ctx.fillStyle = 'black';
        canvas.ctx.fillRect(0, 0, 1080, 1920);

        ctx.save();
        ctx.translate(edgePadding, edgePadding);

        const thisLow = expInterp(myLow, myLowTarget, (ZOOM_DURATION - timeLeft) / ZOOM_DURATION);
        const thisHigh = expInterp(myHigh, myHighTarget, (ZOOM_DURATION - timeLeft) / ZOOM_DURATION);

        const targetBarLength = dict.words.length / (thisHigh - thisLow) * idealBarLength;

        dict.barLength = targetBarLength;

        const idealLow = thisLow / dict.words.length * dict.barLength;

        currentLow = idealLow; // myInterp(idealLow, currentLow);

        ctx.translate(0, -currentLow);

        dict.drawBar(canvas);
        dict.drawCursor(canvas, dict.getMidIndex());

        ctx.restore();
    };

    let lastTime = performance.now();
    const mainLoop = () => {
        const now = performance.now();
        const elapsedTime = now - lastTime;
        lastTime = now;
        draw(elapsedTime);

        requestAnimationFrame(mainLoop);
    };

    requestAnimationFrame(mainLoop);

    button.addEventListener('click', () => {
        if (myLowTarget === dict.lowIndex && myHighTarget === dict.highIndex) {
            const midIndex = dict.getMidIndex();
            const midWord = dict.words[midIndex];
            if (myWord < midWord) {
                dict.highIndex = midIndex;
            } else if (myWord > midWord) {
                dict.lowIndex = midIndex + 1;
            } else if (myWord === midWord) {
                dict.lowIndex = midIndex;
                dict.highIndex = midIndex + 1;
            }
        } else {
            timeLeft = ZOOM_DURATION;
            myLowTarget = dict.lowIndex;
            myHighTarget = dict.highIndex;
        }
    });
};

document.addEventListener('DOMContentLoaded', async () => {
    const v = await fetch('./words_dictionary.json');

    const words = Object.keys(await v.json());
    words.sort((a, b) => a.localeCompare(b));

    console.log(words.length);
    console.log(words);

    mainFunction(words);
});
