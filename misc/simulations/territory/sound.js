const audioContext = new AudioContext();

class Channel {
    constructor(type) {
        this.oscillator = audioContext.createOscillator();
        this.oscillator.type = type;

        this.volume = audioContext.createGain();
        this.volume.gain.value = 0;

        this.oscillator.connect(this.volume);
        this.volume.connect(audioContext.destination);

        this.timeout = null;
    }

    playNote(frequency, duration, gain) {
        this.volume.gain.setTargetAtTime(gain, audioContext.currentTime, 0.02);
        this.oscillator.frequency.value = frequency;

        // this.volume.gain.setTargetAtTime(0, audioContext.currentTime + duration /)

        if (this.timeout) {
            clearTimeout(this.timeout);
        } else {
            this.oscillator.start();
        }

        this.timeout = setTimeout(() => {
            this.volume.gain.setTargetAtTime(0, audioContext.currentTime, 0.05);
        }, duration);
    }
}

const claimChannel = new Channel('sine');

// const oscillator = audioContext.createOscillator();

// oscillator.type = 'sine';

// const volume = audioContext.createGain();
// volume.gain.value = 0;

// oscillator.connect(volume);

// volume.connect(audioContext.destination);

// let timeout = null;

// const playNote = (frequency, duration, gain) => {
//     // oscillator.start();
//     volume.gain.setTargetAtTime(gain, audioContext.currentTime, 0.02);
//     oscillator.frequency.value = frequency;

//     if (timeout) {
//         clearTimeout(timeout);
//     } else {
//         oscillator.start();
//     }

//     timeout = setTimeout(() => {
//         // oscillator.stop();
//         // volume.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.05);
//         volume.gain.setTargetAtTime(0, audioContext.currentTime, 0.05);
//         // volume.gain.value = 0;
//     }, duration);

//     // setTimeout(() => {
//     //     oscillator.stop();
//     //     oscillator.disconnect();
//     // }, duration);
// };
