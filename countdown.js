document.addEventListener('DOMContentLoaded', () => {
    // --- Countdown Timer Elements ---
    const countdownDisplay = document.getElementById('countdownDisplay');
    const signalStatus = document.getElementById('signalStatus');
    const sequenceTypeSelect = document.getElementById('sequenceType');
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const soundHornButton = document.getElementById('soundHornButton');

    // Audio elements
    const warningSignal = document.getElementById('warningSignal');
    const preparatorySignal = document.getElementById('preparatorySignal');
    const startSignal = document.getElementById('startSignal');
    const manualHornSound = document.getElementById('manualHornSound');

    let countdownInterval;
    let timeLeft; // in seconds

    const sequences = {
        "5": {
            duration: 300,
            signals: [
                { time: 300, sound: warningSignal, text: "Warning Signal (5 Min)" },
                { time: 240, sound: preparatorySignal, text: "Preparatory Signal (4 Min)" },
                { time: 180, sound: preparatorySignal, text: "3 Minutes to Start" },
                { time: 120, sound: preparatorySignal, text: "2 Minutes to Start" },
                { time: 60,  sound: preparatorySignal, text: "1 Minute to Start" },
                { time: 30,  sound: preparatorySignal, text: "30 Seconds" },
                { time: 20,  sound: preparatorySignal, text: "20 Seconds" },
                { time: 10,  sound: preparatorySignal, text: "10 Seconds" },
                { time: 3,   sound: startSignal, text: "Starting Signal Imminent" },
                { time: 0,   sound: null, text: "GO!" }
            ]
        },
        "3": {
            duration: 180,
            signals: [
                { time: 180, sound: warningSignal, text: "Warning Signal (3 Min)" },
                { time: 120, sound: preparatorySignal, text: "2 Minutes to Start" },
                { time: 60,  sound: preparatorySignal, text: "1 Minute to Start" },
                { time: 30,  sound: preparatorySignal, text: "30 Seconds" },
                { time: 20,  sound: preparatorySignal, text: "20 Seconds" },
                { time: 10,  sound: preparatorySignal, text: "10 Seconds" },
                { time: 3,   sound: startSignal, text: "Starting Signal Imminent" },
                { time: 0,   sound: null, text: "GO!" }
            ]
        }
    };

    function updateCountdownDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        if (timeLeft <= 0) {
            countdownDisplay.textContent = "GO!";
        } else {
            countdownDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
    }

    function playCountdownSignal() {
        const currentSequence = sequences[sequenceTypeSelect.value];
        if (!currentSequence) return;
        const upcomingSignals = currentSequence.signals.filter(s => s.time === timeLeft);
        upcomingSignals.forEach(signal => {
            if (signal.sound) {
                signal.sound.currentTime = 0;
                signal.sound.play().catch(e => console.error("Error playing sound:", e));
            }
            signalStatus.textContent = signal.text;
            console.log(`Countdown Signal: ${signal.text} at ${timeLeft}s`);
        });
    }

    function startCountdown() {
        // ... (startCountdown logic remains the same as previous version)
        clearInterval(countdownInterval);
        const selectedSequence = sequences[sequenceTypeSelect.value];
        if (!selectedSequence) {
            alert("Please select a valid sequence.");
            return;
        }
        timeLeft = selectedSequence.duration;
        updateCountdownDisplay();
        playCountdownSignal();
        countdownInterval = setInterval(() => {
            timeLeft--;
            updateCountdownDisplay();
            playCountdownSignal();
            if (timeLeft < 0) {
                clearInterval(countdownInterval);
            }
        }, 1000);
        startButton.disabled = true;
        stopButton.disabled = false;
    }

    function stopCountdown() {
        // ... (stopCountdown logic remains the same as previous version)
        clearInterval(countdownInterval);
        const selectedSequence = sequences[sequenceTypeSelect.value];
        timeLeft = selectedSequence ? selectedSequence.duration : 300;
        updateCountdownDisplay();
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

    stopCountdown(); // Initialize countdown display
    sequenceTypeSelect.addEventListener('change', stopCountdown);


    // --- GPS and Tacking Advisor Logic ---
    const windDirectionCourseInput = document.getElementById('windDirection'); // RC input for initial course
    const legLengthInput = document.getElementById('legLength');
    const calculateCourseButton = document.getElementById('calculateCourseButton');
    const courseResultDisplay = document.getElementById('courseResult');

    // GPS Data Display Elements (from HTML)
    const gpsStatusDisplay = document.getElementById('gpsStatus');
    const latDisplay = document.getElementById('currentLat');
    const lonDisplay = document.getElementById('currentLon');
    const speedDisplay = document.getElementById('currentSpeed');
    const cogDisplay = document.getElementById('currentCOG');
    const startGpsButton = document.getElementById('startGpsButton');
    const stopGpsButton = document.getElementById('stopGpsButton');

    // Tacking Advisor Input Elements (from HTML)
    const trueWindDirInput = document.getElementById('trueWindDirTacking'); // Sailor's input for TWD
    const closeHauledAngleInput = document.getElementById('closeHauledAngle');
    const getAdviceButton = document.getElementById('getAdviceButton');
    const tackingAdviceDisplay = document.getElementById('tackingAdviceDisplay');
    const windwardMarkLatInput = document.getElementById('windwardMarkLat');
    const windwardMarkLonInput = document.getElementById('windwardMarkLon');


    // Global variables for GPS and Tacking data
    let currentBoatPosition = null;    // {latitude, longitude}
    let currentBoatSpeedMPS = 0;       // Speed in meters/second from GPS
    let currentBoatHeadingCOG = 0;     // Course Over Ground from GPS
    let gpsWatchId = null;
    let windwardMarkPosition = null;   // {latitude, longitude} - set by RC or course planner


    const geoOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };

    function handlePositionUpdate(position) {
        currentBoatPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        };
        currentBoatSpeedMPS = position.coords.speed || 0;
        currentBoatHeadingCOG = position.coords.heading || 0;

        if (latDisplay) latDisplay.textContent = `Lat: ${currentBoatPosition.latitude.toFixed(6)}`;
        if (lonDisplay) lonDisplay.textContent = `Lon: ${currentBoatPosition.longitude.toFixed(6)}`;
        if (speedDisplay) speedDisplay.textContent = `SOG: ${(currentBoatSpeedMPS * 1.94384).toFixed(1)} kts`;
        if (cogDisplay) cogDisplay.textContent = `COG: ${Math.round(currentBoatHeadingCOG)}°`;
        if (gpsStatusDisplay) gpsStatusDisplay.textContent = "GPS Active";


        // If windward mark is set and tacking advisor is active, recalculate and show advice
        if (windwardMarkPosition && tackingAdvisorActive) { // tackingAdvisorActive would be a flag set by user
             // Bearing and distance calculation functions would be needed here
            // let bearingToMark = calculateBearing(currentBoatPosition, windwardMarkPosition);
            // let distanceToMark = calculateDistance(currentBoatPosition, windwardMarkPosition);
            // getTackingAdvice(bearingToMark, distanceToMark); // Pass dynamic values
        }
        console.log('GPS Update:', currentBoatPosition, `Speed: ${currentBoatSpeedMPS} m/s`, `Heading: ${currentBoatHeadingCOG}°`);
    }

    function handlePositionError(error) {
        console.warn(`GPS Error (${error.code}): ${error.message}`);
        if (gpsStatusDisplay) gpsStatusDisplay.textContent = `GPS Error: ${error.message}`;
        if (error.code === error.PERMISSION_DENIED && gpsWatchId) {
            navigator.geolocation.clearWatch(gpsWatchId);
            gpsWatchId = null;
        }
    }

    function startGpsWatch() {
        if (navigator.geolocation) {
            if (gpsWatchId) navigator.geolocation.clearWatch(gpsWatchId);
            gpsWatchId = navigator.geolocation.watchPosition(handlePositionUpdate, handlePositionError, geoOptions);
            if (gpsStatusDisplay) gpsStatusDisplay.textContent = "GPS Initializing...";
            console.log("Attempting to watch GPS position...");
        } else {
            console.error("Geolocation is not supported by this browser.");
            if (gpsStatusDisplay) gpsStatusDisplay.textContent = "GPS not supported.";
        }
    }

    function stopGpsWatch() {
        if (gpsWatchId) {
            navigator.geolocation.clearWatch(gpsWatchId);
            gpsWatchId = null;
            if (gpsStatusDisplay) gpsStatusDisplay.textContent = "GPS Inactive.";
            console.log("Stopped watching GPS position.");
        }
    }

    if (startGpsButton) startGpsButton.addEventListener('click', startGpsWatch);
    if (stopGpsButton) stopGpsButton.addEventListener('click', stopGpsWatch);


    // --- Course Planner (RC Tool - conceptual calculation) ---
    function toRadians(degrees) { return degrees * (Math.PI / 180); }
    function toDegrees(radians) { return radians * (180 / Math.PI); }

    function calculateDestinationPointSimple(startPoint, bearingDegrees, distanceNM) {
        // This is still the simplified X,Y for conceptual display
        // For real lat/lon, you need Haversine or Vincenty formulas
        const bearingRadians = toRadians(bearingDegrees);
        const dist = distanceNM; // Assuming distance is in the same conceptual units for now
        const destX = startPoint.x + dist * Math.sin(bearingRadians);
        const destY = startPoint.y + dist * Math.cos(bearingRadians);
        return { x: destX, y: destY };
    }

    if (calculateCourseButton) {
        calculateCourseButton.addEventListener('click', () => {
            const windDir = parseFloat(windDirectionCourseInput.value);
            const legLen = parseFloat(legLengthInput.value);
            const startLineCenter = { x: 0, y: 0 }; // Placeholder

            if (isNaN(windDir) || isNaN(legLen) || legLen <= 0) {
                courseResultDisplay.textContent = "Please enter valid wind direction and leg length.";
                return;
            }
            const windwardMark = calculateDestinationPointSimple(startLineCenter, windDir, legLen);
            const downwindDir = (windDir + 180) % 360;
            const leewardMark = calculateDestinationPointSimple(startLineCenter, downwindDir, legLen);

            // Store conceptual windward mark for tacking advisor (if we want to link them)
            // This is very basic. A real app would store actual lat/lon.
            // windwardMarkPosition = { latitude: windwardMark.y, longitude: windwardMark.x }; // Swapping for demo

            courseResultDisplay.innerHTML = `
                Wind Dir (RC): ${windDir}° | Leg: ${legLen} nm<br>
                <b>Conceptual Marks (Start at 0,0):</b><br>
                Windward: X=${windwardMark.x.toFixed(2)}, Y=${windwardMark.y.toFixed(2)}<br>
                Leeward: X=${leewardMark.x.toFixed(2)}, Y=${leewardMark.y.toFixed(2)}`;
        });
    }


    // --- Tacking Advisor Logic (Sailor's Tool - uses GPS and manual TWD) ---
    let tackingAdvisorActive = false; // Flag to control when advisor runs

    function normalizeAngle(angle) { /* ... same as before ... */ 
        angle = angle % 360;
        if (angle < 0) angle += 360;
        return angle;
    }
    function angleDifference(angle1, angle2) { /* ... same as before ... */
        let diff = normalizeAngle(angle2) - normalizeAngle(angle1);
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        return diff;
    }

    function getCurrentTack(boatHeadingCOG, twd) {
        if (twd === null || boatHeadingCOG === null) return "unknown";
        const windRelativeToBow = angleDifference(boatHeadingCOG, twd);
        if (windRelativeToBow < -5 && windRelativeToBow > -175) return "port"; // Wind from stbd
        if (windRelativeToBow > 5 && windRelativeToBow < 175) return "starboard"; // Wind from port
        return "in_irons_or_downwind";
    }

    function checkHeaderLift(boatHeadingCOG, twd, optimalCloseHauledAngle, currentTack) {
        if (twd === null || boatHeadingCOG === null || currentTack.startsWith("in_irons")) return "not_close_hauled";
        let actualAngleToWind = Math.abs(angleDifference(boatHeadingCOG, twd));

        if (actualAngleToWind > optimalCloseHauledAngle + 7) return "header"; // Increased buffer slightly
        if (actualAngleToWind < optimalCloseHauledAngle - 7) return "lift";
        return "on_optimal_angle";
    }

    // Placeholder for actual bearing/distance calculations using Haversine formula
    function calculateBearing(pos1, pos2) { /* ... Haversine logic ... */ return 0; }
    function calculateDistance(pos1, pos2) { /* ... Haversine logic ... */ return 0; }


    function getTackingAdviceNow() { // Renamed to avoid conflict if it was global
        if (!currentBoatPosition || windwardMarkPosition === null) {
            if (tackingAdviceDisplay) tackingAdviceDisplay.textContent = "Waiting for GPS and/or Windward Mark.";
            return;
        }

        const userTwd = parseFloat(trueWindDirInput.value);
        const userCloseHauledAngle = parseFloat(closeHauledAngleInput.value);

        if (isNaN(userTwd) || isNaN(userCloseHauledAngle)) {
            if (tackingAdviceDisplay) tackingAdviceDisplay.textContent = "Enter TWD & Close-Hauled Angle.";
            return;
        }

        const tack = getCurrentTack(currentBoatHeadingCOG, userTwd);
        let advice = `On ${tack}. COG: ${Math.round(currentBoatHeadingCOG)}°. TWD: ${userTwd}°. `;

        if (tack.startsWith("in_irons")) {
            advice += "Not close-hauled.";
        } else {
            const liftOrHeader = checkHeaderLift(currentBoatHeadingCOG, userTwd, userCloseHauledAngle, tack);
            advice += `Sailing: ${liftOrHeader}. `;

            // Dynamic bearing and distance calculation needed here
            // For now, this part is still conceptual as calculateBearing/Distance are placeholders
            // const bearingToMark = calculateBearing(currentBoatPosition, windwardMarkPosition);
            // const distanceToMark = calculateDistance(currentBoatPosition, windwardMarkPosition);
            // const laylineStatus = checkLaylines(bearingToMark, userTwd, userCloseHauledAngle, tack);
            // advice += `Layline: ${laylineStatus}. `;

            // if (laylineStatus.includes("on_") && laylineStatus.includes("_layline")) {
            // advice += "TACK NOW!";
            // } else
            if (liftOrHeader === "header") {
                advice += "Consider TACKING.";
            } else if (liftOrHeader === "lift") {
                advice += "Good lift, HOLD tack.";
            }
        }
        if (tackingAdviceDisplay) tackingAdviceDisplay.textContent = advice;
    }

    if (getAdviceButton) {
        getAdviceButton.addEventListener('click', () => {
            // Assume windward mark lat/lon has been entered or set by RC tool
            const wmLat = parseFloat(windwardMarkLatInput.value);
            const wmLon = parseFloat(windwardMarkLonInput.value);
            if (!isNaN(wmLat) && !isNaN(wmLon)) {
                windwardMarkPosition = { latitude: wmLat, longitude: wmLon };
                tackingAdvisorActive = true; // Enable continuous advice if GPS is running
                getTackingAdviceNow(); // Get immediate advice
            } else {
                if (tackingAdviceDisplay) tackingAdviceDisplay.textContent = "Set Windward Mark Coords.";
                tackingAdvisorActive = false;
            }
        });
    }

    // Periodically update tacking advice if GPS is active and advisor is on
    // This is a simple way; a more robust way would be to trigger from handlePositionUpdate
    setInterval(() => {
        if (gpsWatchId && tackingAdvisorActive && windwardMarkPosition) {
            getTackingAdviceNow();
        }
    }, 5000); // Update advice every 5 seconds, for example

}); // End DOMContentLoaded