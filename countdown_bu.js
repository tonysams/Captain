document.addEventListener('DOMContentLoaded', () => {
    const countdownDisplay = document.getElementById('countdownDisplay');
    const signalStatus = document.getElementById('signalStatus');
    const sequenceTypeSelect = document.getElementById('sequenceType');
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const soundHornButton = document.getElementById('soundHornButton');

    // Audio elements
    const warningSignal = document.getElementById('warningSignal');
    const preparatorySignal = document.getElementById('preparatorySignal');
    const oneMinuteSignal = document.getElementById('oneMinuteSignal');
    const startSignal = document.getElementById('startSignal');
    const manualHornSound = document.getElementById('manualHornSound');

    let countdownInterval;
    let timeLeft; // in seconds

    const sequences = {
        "5": { // 5 Minute Sequence (Rule 26)
            duration: 300, // 5 minutes in seconds
            signals: [
                { time: 300, sound: warningSignal, text: "Warning Signal (5 Min)" }, // 5 min
                { time: 240, sound: preparatorySignal, text: "Preparatory Signal (4 Min)" }, // 4 min
                { time: 60, sound: oneMinuteSignal, text: "One Minute Signal" },   // 1 min
                { time: 0, sound: startSignal, text: "Starting Signal" }      // Start
            ]
        },
        "3": { // 3 Minute Sequence
            duration: 180, // 3 minutes in seconds
            signals: [
                { time: 180, sound: warningSignal, text: "Warning Signal (3 Min)" },
                { time: 120, sound: preparatorySignal, text: "Preparatory Signal (2 Min)" },
                { time: 60, sound: oneMinuteSignal, text: "One Minute Signal" },
                { time: 0, sound: startSignal, text: "Starting Signal" }
            ]
        }
        // Add more sequences like ISAF 3-2-1-Go for match racing if needed
    };

    function updateDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        countdownDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    function playSignal() {
        const currentSequence = sequences[sequenceTypeSelect.value];
        if (!currentSequence) return;

        const upcomingSignals = currentSequence.signals.filter(s => s.time === timeLeft);
        upcomingSignals.forEach(signal => {
            if (signal.sound) {
                signal.sound.currentTime = 0; // Rewind if playing
                signal.sound.play().catch(e => console.error("Error playing sound:", e));
            }
            signalStatus.textContent = signal.text;
            console.log(`Signal: ${signal.text} at ${timeLeft}s`);
        });
    }

    function startCountdown() {
        clearInterval(countdownInterval); // Clear any existing interval
        const selectedSequence = sequences[sequenceTypeSelect.value];
        if (!selectedSequence) {
            alert("Please select a valid sequence.");
            return;
        }

        timeLeft = selectedSequence.duration;
        updateDisplay();
        playSignal(); // Play initial signal if any (e.g., 5 min warning)

        countdownInterval = setInterval(() => {
            timeLeft--;
            updateDisplay();
            playSignal();

            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                // Optionally, do something after the start signal
            }
        }, 1000);
        startButton.disabled = true;
        stopButton.disabled = false;
    }

    function stopCountdown() {
        clearInterval(countdownInterval);
        const selectedSequence = sequences[sequenceTypeSelect.value];
        timeLeft = selectedSequence ? selectedSequence.duration : 300; // Reset to selected or default
        updateDisplay();
        signalStatus.textContent = "Sequence Stopped/Reset.";
        startButton.disabled = false;
        stopButton.disabled = true;
    }

    startButton.addEventListener('click', startCountdown);
    stopButton.addEventListener('click', stopCountdown);
    soundHornButton.addEventListener('click', () => {
        manualHornSound.currentTime = 0;
        manualHornSound.play().catch(e => console.error("Error playing manual horn:", e));
        signalStatus.textContent = "Manual Horn Sounded";
    });

    // Initialize
    stopCountdown(); // Set to initial stopped state
    sequenceTypeSelect.addEventListener('change', stopCountdown); // Reset if sequence changes
});