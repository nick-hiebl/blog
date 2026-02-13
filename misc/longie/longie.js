const CANVAS_WIDTH = 250;
const REL_IMAGE = './longie.png';

const image = new Image(498, 128);
image.src = REL_IMAGE;

/**
 * Pseudo-random-number-generator function from:
 * https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
 */
function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
    return [h1>>>0, h2>>>0, h3>>>0, h4>>>0];
}

const getCurrentDateString = (date) => {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const getDailyConfig = (date) => {
    const [length] = cyrb128(getCurrentDateString(date));

    return {
        length: length % 100 + 50,
    };
};

const rateDistance = (difference) => {
    if (difference === 0) {
        return {
            direction: '🎉',
            distanceText: '🎉🎉🎉',
            distanceColor: 'green',
        };
    }

    const direction = difference < 0 ? '⬆️' : '⬇️';

    const absDistance = Math.abs(difference);

    let distanceText = 'Cold';
    let distanceColor = '#001083';

    if (absDistance <= 3) {
        distanceText = 'Boiling';
        distanceColor = 'orangered';
    } else if (absDistance <= 8) {
        distanceText = 'Hot';
        distanceColor = 'orange';
    } else if (absDistance <= 12) {
        distanceText = 'Warm';
        distanceColor = 'grey';
    }

    return {
        direction,
        distanceText: `${direction} ${distanceText}`,
        distanceColor,
    };
};

const FIRST_DATE = new Date('2026-02-13');
FIRST_DATE.setHours(0, 0, 0, 0);
const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

const MAX_GUESSES = 8;

const onLoad = () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const currentDate = new Date();

    const dayNumber = Math.floor((currentDate - FIRST_DATE) / DAY_MILLISECONDS) + 1;

    const { length } = getDailyConfig(currentDate);

    const midpoint = Math.floor(CANVAS_WIDTH / 2);
    const left = midpoint - Math.ceil(length / 2);

    const height = length * 128 / 498;

    ctx.drawImage(image, 0, 0, 498, 128, left, Math.floor(100 - height / 2), length, height);

    ctx.fillStyle = 'white';

    const referenceLength = 100;
    const referenceLeft = midpoint - Math.ceil(referenceLength / 2);

    ctx.fillRect(referenceLeft, 40, referenceLength, 1);
    ctx.fillRect(referenceLeft, 40, 1, 4);
    ctx.fillRect(referenceLeft + referenceLength - 1, 40, 1, 4);

    const guesses = [];

    const guessInput = document.getElementById('length-input');
    const guessButton = document.getElementById('guess-button');

    const guessList = document.getElementById('guess-list');

    const onComplete = (guesses) => {
        guessButton.disabled = true;
        guessInput.disabled = true;
        const guessCountText = `${guesses.length}/${MAX_GUESSES}`;
        const completed = guesses.some(guess => guess.amount === length);

        if (!completed) {
            const isClose = guesses.some(guess => Math.abs(guess.amount - length) <= 4);

            document.getElementById('title').textContent = isClose ? 'So close!' : 'Not quite!';
        }

        document.getElementById('post-guess-count').textContent = guessCountText;
        const postGuessList = document.getElementById('post-guess-list');

        document.getElementById('blanket').dataset.hidden = false;

        guesses.forEach((guess, index) => {
            const cell = document.createElement('li');
            cell.classList.add('post-guess');
            cell.textContent = guess.direction;
            cell.dataset.hidden = true;
            postGuessList.appendChild(cell);

            setTimeout(() => {
                cell.dataset.hidden = false;
            }, (index + 1) * 250);
        });

        const copyButton = document.getElementById('copy');

        let copyResetTimeout;
        let copiesDeep = 0;

        copyButton.addEventListener('click', () => {
            if (navigator.clipboard) {
                const outputText = `#Longie #${dayNumber} ${guessCountText}
${guesses.map(guess => guess.direction).join('')}
https://nick-hiebl.github.io/blog/misc/longie/`;

                navigator.clipboard.writeText(outputText);

                if (copyResetTimeout) {
                    clearTimeout(copyResetTimeout);
                }

                copiesDeep += 1;
                copyButton.textContent = `Copied${'!'.repeat(copiesDeep)}`;

                copyResetTimeout = setTimeout(() => {
                    copiesDeep = 0;

                    copyButton.textContent = 'Copy';
                    copyResetTimeout = undefined;
                }, 1000);
            }
        });
    };

    const onGuess = (guessAmount) => {
        if (typeof guessAmount !== 'number' || isNaN(guessAmount) || guessAmount < 0) {
            return;
        }
        
        const row = document.createElement('li');
        row.classList.add('normal-guess');
        const { distanceText, direction, distanceColor } = rateDistance(guessAmount - length);

        guesses.push({ amount: guessAmount, direction });

        row.style.backgroundColor = distanceColor;
        row.textContent = `${guessAmount}: ${distanceText}`;

        guessList.appendChild(row);

        if (guessAmount === length || guesses.length >= MAX_GUESSES) {
            onComplete(guesses);
        }
    };

    guessInput.addEventListener('keypress', event => {
        if (event.key === 'Enter') {
            onGuess(parseInt(guessInput.value, 10));
            guessInput.value = '';
        }
    });

    guessButton.addEventListener('click', () => {
        onGuess(parseInt(guessInput.value, 10));
        guessInput.value = '';
    });

    guessInput.focus();
};

document.addEventListener('DOMContentLoaded', () => {
    image.onload = () => {
        onLoad();
    };
});
