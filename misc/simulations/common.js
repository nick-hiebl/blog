Object.defineProperty(Array.prototype, 'chooseRandom', {
    value: function(numItems) {
        if (numItems === 0 || this.length === 0) {
            return undefined;
        }

        if (!numItems) {
            return this[Math.floor(Math.random() * this.length)];
        }

        let chosenSoFar = 0;
        return this.filter((item, index) => {
            if (numItems === chosenSoFar) {
                return false;
            }

            const afterThis = this.length - index - 1;
            if (afterThis < numItems - chosenSoFar) {
                chosenSoFar++;
                return true;
            }

            const willChoose = Math.random() < (numItems - chosenSoFar) / (this.length - index);
            if (willChoose) {
                chosenSoFar++;
            }
            return willChoose;
        });
    }
});
