const audioContext = new AudioContext();

class Channel {
    constructor(type) {
        this.oscillator = audioContext.createOscillator();
        this.oscillator.type = type;

        this.volume = audioContext.createGain();
        this.volume.gain.value = 0;

        this.oscillator.connect(this.volume);
        this.volume.connect(audioContext.destination);

        this.started = false;
    }

    playNote(frequency, duration, gain) {
        this.volume.gain.cancelScheduledValues(audioContext.currentTime);
        this.volume.gain.setTargetAtTime(gain, audioContext.currentTime, 0.02);

        const computedFrequency = 200 * Math.pow(2, frequency * 6);

        this.oscillator.frequency.setTargetAtTime(computedFrequency, audioContext.currentTime, 0.03);

        this.volume.gain.setTargetAtTime(0, audioContext.currentTime + 0.02 + duration / 1000, 0.03);

        if (!this.started) {
            this.oscillator.start();
            this.started = true;
        }
    }

    playFallingNote(f1, f2, duration, gain) {
        this.volume.gain.cancelScheduledValues(audioContext.currentTime);
        this.volume.gain.setTargetAtTime(gain, audioContext.currentTime, 0.02);
        this.oscillator.frequency.value = f1;
        this.oscillator.frequency.linearRampToValueAtTime(f2, audioContext.currentTime + duration / 1000, 0.03);

        this.volume.gain.setTargetAtTime(0, audioContext.currentTime + 0.02 + duration / 1000, 0.03);

        if (!this.started) {
            this.oscillator.start();
            this.started = true;
        }
    }
}
