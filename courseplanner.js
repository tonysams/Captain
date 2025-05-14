// Ensure this runs after the DOM is loaded, or put in the existing DOMContentLoaded listener
const windDirectionInput = document.getElementById('windDirection');
const legLengthInput = document.getElementById('legLength');
const calculateCourseButton = document.getElementById('calculateCourseButton');
const courseResultDisplay = document.getElementById('courseResult');
// For future real-world use with actual coordinates:
// const startLatInput = document.getElementById('startLineCenterLat');
// const startLonInput = document.getElementById('startLineCenterLon');


/**
 * Converts degrees to radians.
 * @param {number} degrees
 * @returns {number} radians
 */
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Calculates the destination point given a starting point, bearing (degrees), and distance.
 * This is a simplified Cartesian calculation for concept. Real-world would use Haversine or similar for lat/lon.
 * For this conceptual draft, 0 degrees (North) is along the positive Y-axis, 90 degrees (East) is along the positive X-axis.
 * @param {object} startPoint - {x, y}
 * @param {number} bearingDegrees - Wind direction FROM, so mark is in this direction.
 * @param {number} distance - Leg length
 * @returns {object} - {x, y} of the destination
 */
function calculateDestinationPoint(startPoint, bearingDegrees, distance) {
    const bearingRadians = toRadians(bearingDegrees);
    // Adjusting for standard Cartesian: 0 deg = +Y, 90 deg = +X
    // If wind is FROM 0 deg (North), boat sails TO 0 deg (North).
    // Wind vector points where wind comes FROM. Course vector points where you sail TO.
    // For a windward mark, you sail INTO the wind. So if wind is FROM 180 (South), you sail TOWARDS 180.
    // Let's clarify: "Head to Wind" means the boat's bow is pointing to, say, 30 degrees. That's the wind direction.
    // The windward mark is in that direction.

    // Standard navigation angles: 0 North, 90 East.
    // dx = distance * sin(bearing)
    // dy = distance * cos(bearing)
    const destX = startPoint.x + distance * Math.sin(bearingRadians);
    const destY = startPoint.y + distance * Math.cos(bearingRadians);
    return { x: destX, y: destY };
}


calculateCourseButton.addEventListener('click', () => {
    const windDir = parseFloat(windDirectionInput.value); // This is the "Head to Wind" direction
    const legLen = parseFloat(legLengthInput.value);
    // For this simple draft, let's assume start line center is at (0,0)
    const startLineCenter = { x: 0, y: 0 };

    if (isNaN(windDir) || isNaN(legLen) || legLen <= 0) {
        courseResultDisplay.textContent = "Please enter valid wind direction and leg length.";
        return;
    }

    // 1. Calculate Windward Mark
    // The windward mark is directly upwind from the starting area.
    // The bearing TO the windward mark IS the wind direction.
    const windwardMark = calculateDestinationPoint(startLineCenter, windDir, legLen);

    // 2. Calculate Leeward Mark
    // For a simple windward-leeward, the leeward mark is 180 degrees from the windward mark,
    // passing back through the starting area, or simply downwind from the windward mark by legLen * 2
    // or for a simple setup, it's back at/near the starting line, or legLen downwind from start.
    // A common configuration has the leeward mark such that the finish line is near it,
    // and the start/finish are roughly in the middle of the windward-leeward axis.

    // Let's place the leeward mark 'legLen' downwind from the startLineCenter for this draft.
    // Downwind direction is windDir + 180 degrees.
    const downwindDir = (windDir + 180) % 360;
    const leewardMark = calculateDestinationPoint(startLineCenter, downwindDir, legLen); // Could also be relative to windwardMark

    // Alternative: Leeward mark is such that start line is in the middle.
    // If windward mark is (Xw, Yw), and start is (0,0), then leeward mark is (-Xw, -Yw)
    // const leewardMarkSimple = { x: -windwardMark.x, y: -windwardMark.y };


    courseResultDisplay.innerHTML = `
        Wind Direction (Head to Wind): ${windDir}°<br>
        Leg Length: ${legLen} nm<br><br>
        ASSUMING START LINE CENTER AT (0,0):<br>
        Calculated Windward Mark (conceptual coordinates): X=${windwardMark.x.toFixed(2)}, Y=${windwardMark.y.toFixed(2)}<br>
        Calculated Leeward Mark (conceptual coordinates, downwind from start): X=${leewardMark.x.toFixed(2)}, Y=${leewardMark.y.toFixed(2)}
    `;

    // TODO for next steps:
    // - Integrate with a mapping library (Leaflet.js, OpenLayers, Google Maps API).
    // - Use actual Lat/Lon for startLineCenter.
    // - Use Haversine formula or similar for accurate distance/bearing calculations on a sphere.
    // - Allow defining start line (committee boat + pin end) instead of just a center point.
    // - Add logic for different course types (triangle, offset marks).
    // - Incorporate geographic boundaries of Jordanelle.
});