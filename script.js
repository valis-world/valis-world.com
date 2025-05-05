document.addEventListener('DOMContentLoaded', () => {

    // --- Configuration ---
    const targetWidth = 8000; // User's preferred size
    const targetHeight = 2800; // User's preferred size
    const cellSize = 5;
    const gameSpeed = 100; // ms between updates (worker uses this)
    const initialZoomFactor = 1.0; // Start zoomed to fit (will be clamped)
    const maxZoomAllowedUser = 25; // User-defined MAX zoom
    const zoomSensitivity = 1.1;
    const smoothZoomFactor = 0.35; // Higher = more responsive zoom animation
    const zoomThreshold = 0.001; // Stop animation threshold

    // Colors
    const backgroundColor = '#000000'; // Black
    const cellColor = '#FFFFFF';       // White

    // *** Path to the ADDITIONAL pattern file to load ***
    // This file's contents will be ADDED to the hardcoded 'initialPattern' below
    const patternFilesToLoad = [
        { file: 'patterns/glider-oszilator_pattern.json', offsetX: 650, offsetY: 130 },
        { file: 'patterns/shuttle_pattern.json', offsetX: 705, offsetY: 185},
        { file: 'patterns/shuttle_pattern.json', offsetX: 780, offsetY: 185},
        { file: 'patterns/shuttle_pattern.json', offsetX: 855, offsetY: 185},
        { file: 'patterns/shuttle_pattern.json', offsetX: 710, offsetY: 260},
        { file: 'patterns/shuttle_pattern.json', offsetX: 785, offsetY: 260},
        { file: 'patterns/shuttle_pattern.json', offsetX: 860, offsetY: 260},
        { file: 'patterns/big-ship_pattern.json', offsetX: 100, offsetY: 300},
        { file: 'patterns/big-ship_pattern.json', offsetX: 1300, offsetY: 100},
        { file: 'patterns/wide-ship_pattern.json', offsetX: 50, offsetY: 30}
        // Add more objects here for more files
    ];

    // --- Calculated Grid Properties ---
    const gridSizeX = Math.floor(targetWidth / cellSize);
    const gridSizeY = Math.floor(targetHeight / cellSize);
    const logicalGridWidth = gridSizeX * cellSize;
    const logicalGridHeight = gridSizeY * cellSize;

    // --- DOM Elements and Context ---
    const container = document.getElementById('container');
    const canvas = document.getElementById('board-canvas');
    const ctx = canvas.getContext('2d');
    const headerBar = document.getElementById('header-bar'); // Defined early

    // --- Core Game State ---
    let currentGameStateForDrawing = []; // Will be populated from worker or initial pattern
    let drawPending = false;

    // --- View State (Current Rendered & Animation Target) ---
    let zoomLevel = 1.0;
    let boardTranslateX = 0;
    let boardTranslateY = 0;
    let targetZoomLevel = 1.0;
    let targetTranslateX = 0;
    let targetTranslateY = 0;
    let isAnimatingZoom = false;
    let animationFrameId = null;

    // --- Interaction States ---
    let isDragging = false;
    let startX, startY;
    let startTranslateX, startTranslateY;
    // List of small patterns available for right-click spamming
    const patternCycleList = ['glider', 'lwss', 'mwss', 'acorn', 'rPentomino', 'hwss', 'gosperGliderGun', 'pulsar'];
    let currentPatternIndex = 0;
    let isRightClickSpamming = false;
    let spamIntervalId = null;
    const spamIntervalDelay = 80; // ms between spam placements
    let lastSpamX = 0; // Tracks mouse position during spamming
    let lastSpamY = 0;

    // --- Web Worker Reference ---
    let worker = null;

    // ==============================================================
    // --- Floating Header Logic (Scroll-Only Version) ---
    // ==============================================================
    let lastScrollTop = 0;
    const headerHideScrollThreshold = 50; // Pixels scrolled down before hiding
    function updateHeaderVisibility() {
        // Ensure headerBar exists before proceeding
        if (!headerBar) return;

        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Visibility Logic (Based ONLY on Scroll)
        if (scrollTop > lastScrollTop && scrollTop > headerHideScrollThreshold) {
            // Scrolling Down past threshold -> HIDE
            if (!headerBar.classList.contains('header-hidden')) {
                 headerBar.classList.add('header-hidden');
            }
        } else if (scrollTop < lastScrollTop || scrollTop <= headerHideScrollThreshold) {
             // Scrolling Up OR Near the Top (within threshold) -> SHOW
            if (headerBar.classList.contains('header-hidden')) {
                 headerBar.classList.remove('header-hidden');
            }
        }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }
    // Add scroll listener
    window.addEventListener('scroll', updateHeaderVisibility, false);


    // --- Helper for hardcoded pattern placement ---
    // NOTE: This addPattern is used below to define initialPattern,
    // it's DIFFERENT from the 'patterns' object used for spamming.
    function addPattern(patternCoords, offsetX, offsetY) {
        // Takes a pattern array [{x:relX, y:relY}, ...] and offsets it
        return patternCoords.map(p => ({ x: p.x + offsetX, y: p.y + offsetY }));
    }

    // ==============================================================
    // --- Hardcoded Initial Pattern Definitions ---
    // This object holds the relative coordinates for patterns used
    // ONLY for building the hardcoded `initialPattern` array below.
    // ==============================================================
    const patterns = {
        glider: [ { x: 1, y: 0 }, { x: 2, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 } ],
        lwss: [ { x: 1, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 4, y: 2 }, { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 } ],
        pulsar: [ {x:2, y:0}, {x:3, y:0}, {x:4, y:0}, {x:8, y:0}, {x:9, y:0}, {x:10, y:0}, {x:0, y:2}, {x:5, y:2}, {x:7, y:2}, {x:12, y:2}, {x:0, y:3}, {x:5, y:3}, {x:7, y:3}, {x:12, y:3}, {x:0, y:4}, {x:5, y:4}, {x:7, y:4}, {x:12, y:4}, {x:2, y:5}, {x:3, y:5}, {x:4, y:5}, {x:8, y:5}, {x:9, y:5}, {x:10, y:5}, {x:2, y:7}, {x:3, y:7}, {x:4, y:7}, {x:8, y:7}, {x:9, y:7}, {x:10, y:7}, {x:0, y:8}, {x:5, y:8}, {x:7, y:8}, {x:12, y:8}, {x:0, y:9}, {x:5, y:9}, {x:7, y:9}, {x:12, y:9}, {x:0, y:10}, {x:5, y:10}, {x:7, y:10}, {x:12, y:10}, {x:2, y:12}, {x:3, y:12}, {x:4, y:12}, {x:8, y:12}, {x:9, y:12}, {x:10, y:12} ],
        gosperGliderGun: [ {x:24, y:0}, {x:22, y:1}, {x:24, y:1}, {x:12, y:2}, {x:13, y:2}, {x:20, y:2}, {x:21, y:2}, {x:34, y:2}, {x:35, y:2}, {x:11, y:3}, {x:15, y:3}, {x:20, y:3}, {x:21, y:3}, {x:34, y:3}, {x:35, y:3}, {x:0, y:4}, {x:1, y:4}, {x:10, y:4}, {x:16, y:4}, {x:20, y:4}, {x:21, y:4}, {x:0, y:5}, {x:1, y:5}, {x:10, y:5}, {x:14, y:5}, {x:16, y:5}, {x:17, y:5}, {x:22, y:5}, {x:24, y:5}, {x:10, y:6}, {x:16, y:6}, {x:24, y:6}, {x:11, y:7}, {x:15, y:7}, {x:12, y:8}, {x:13, y:8} ],
        rPentomino: [ {x:1, y:0}, {x:2, y:0}, {x:0, y:1}, {x:1, y:1}, {x:1, y:2} ],
        block: [ {x:0, y:0}, {x:1, y:0}, {x:0, y:1}, {x:1, y:1} ],
        beehive: [ {x:1, y:0}, {x:2, y:0}, {x:0, y:1}, {x:3, y:1}, {x:1, y:2}, {x:2, y:2} ],
        loaf: [ {x:1, y:0}, {x:2, y:0}, {x:0, y:1}, {x:3, y:1}, {x:1, y:2}, {x:3, y:2}, {x:2, y:3} ],
        tub: [ {x:1, y:0}, {x:0, y:1}, {x:2, y:1}, {x:1, y:2} ],
        blinker_v: [ { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 } ],
        acorn: [ { x: 1, y: 0 }, { x: 3, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 } ],
        beacon: [ { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 3, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 3 } ],
        pentadecathlon: [ { x: 2, y: 0 }, { x: 7, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 8, y: 1 }, { x: 9, y: 1 }, { x: 2, y: 2 }, { x: 7, y: 2 } ],
        toad: [ { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 } ],
        hwss: [{ x: 2, y: 0 }, { x: 3, y: 0 }, { x: 0, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 0, y: 2 }, { x: 6, y: 2 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 } ],
        mwss: [ { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 0, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 0, y: 2 }, { x: 5, y: 2 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 } ],
        turtle: [ {x:3, y:0}, {x:4, y:0}, {x:1, y:1}, {x:2, y:1}, {x:5, y:1}, {x:6, y:1}, {x:0, y:2}, {x:3, y:2}, {x:6, y:2}, {x:8, y:2}, {x:0, y:3}, {x:5, y:3}, {x:9, y:3}, {x:0, y:4}, {x:3, y:4}, {x:6, y:4}, {x:8, y:4}, {x:1, y:5}, {x:2, y:5}, {x:5, y:5}, {x:6, y:5}, {x:3, y:6}, {x:4, y:6}, {x:4, y:7}, {x:4, y:8} ],
        lobster: [ {x:6, y:0}, {x:11, y:0}, {x:5, y:1}, {x:7, y:1}, {x:10, y:1}, {x:12, y:1}, {x:2, y:2}, {x:5, y:2}, {x:7, y:2}, {x:9, y:2}, {x:11, y:2}, {x:1, y:3}, {x:3, y:3}, {x:7, y:3}, {x:8, y:3}, {x:9, y:3}, {x:13, y:3}, {x:15, y:3}, {x:0, y:4}, {x:3, y:4}, {x:5, y:4}, {x:7, y:4}, {x:9, y:4}, {x:11, y:4}, {x:13, y:4}, {x:16, y:4}, {x:1, y:5}, {x:2, y:5}, {x:3, y:5}, {x:5, y:5}, {x:7, y:5}, {x:9, y:5}, {x:11, y:5}, {x:13, y:5}, {x:14, y:5}, {x:15, y:5}, {x:2, y:6}, {x:4, y:6}, {x:6, y:6}, {x:8, y:6}, {x:10, y:6}, {x:12, y:6}, {x:3, y:7}, {x:5, y:7}, {x:7, y:7}, {x:9, y:7}, {x:11, y:7}, {x:4, y:8}, {x:6, y:8}, {x:8, y:8}, {x:10, y:8}, {x:5, y:9}, {x:7, y:9}, {x:9, y:9}, {x:6, y:10}, {x:8, y:10}, {x:7, y:11}, {x:10, y:12}, {x:11, y:12}, {x:12, y:12}, {x:11, y:13}, {x:11, y:14}, {x:12, y:14}, {x:13, y:14}, {x:10, y:15}, {x:12, y:15}, {x:10, y:16} ]
    };

    // ==============================================================
    // --- Hardcoded Initial Pattern Placement ---
    // This array will be combined with the data fetched from JSON later
    // It uses the _initialPatterns object and addPattern helper defined above.
    // Grid Size is 1600x560 based on Config
    // ==============================================================
    let initialPattern = [
        ...addPattern(patterns.gosperGliderGun, 1400, 200)
    ];
    // --- End Hardcoded Patterns ---

    // --- Game Control (Start/Stop via Worker) ---
    /** Starts the simulation by telling the worker */
    function startGame() {
        if (worker) {
             console.log('Main: Telling worker to start');
             worker.postMessage({ type: 'start' });
             // Simulation running state is managed within the worker now
        } else {
            console.error("Worker not initialized before startGame call.");
        }
    }
    /** Stops the simulation by telling the worker */
    function stopGame() {
         if (worker) {
             console.log('Main: Telling worker to stop');
             worker.postMessage({ type: 'stop' });
             // Simulation running state is managed within the worker now
         }
    }


    // --- Drawing Logic ---
    /** Requests a redraw using requestAnimationFrame to avoid unnecessary draws. */
    function requestDraw() {
        // Only schedule a new frame if one isn't already pending
        if (!drawPending) {
            drawPending = true;
            requestAnimationFrame(drawBoard); // Ask browser to call drawBoard before next repaint
        }
    }

    /** Draws the current game state (received from worker) onto the canvas. */
    function drawBoard() {
        drawPending = false; // Reset the flag as we are drawing now

        // --- Canvas Size and Scaling (for high DPI) ---
        const dpr = window.devicePixelRatio || 1; // Get device pixel ratio
        const rect = canvas.getBoundingClientRect(); // Get current CSS size
        // Check if internal resolution needs update (avoids resizing cost every frame)
        const requiredWidth = Math.round(rect.width * dpr);
        const requiredHeight = Math.round(rect.height * dpr);
        if (canvas.width !== requiredWidth || canvas.height !== requiredHeight) {
            canvas.width = requiredWidth;   // Set internal bitmap width
            canvas.height = requiredHeight; // Set internal bitmap height
            ctx.scale(dpr, dpr); // Scale context coordinate system to match CSS pixels
            // console.log("Canvas resized internally:", canvas.width, canvas.height, "DPR:", dpr);
        }

        // --- Calculate Visible Area (Optimization) ---
        const viewWidth = canvas.clientWidth;  // Use CSS pixel size for view calculations
        const viewHeight = canvas.clientHeight;
        // Inverse transform screen coordinates (0,0 and viewWidth,viewHeight) to world coordinates (cell grid)
        const topLeftWorldX = (0 - boardTranslateX) / zoomLevel;
        const topLeftWorldY = (0 - boardTranslateY) / zoomLevel;
        const bottomRightWorldX = (viewWidth - boardTranslateX) / zoomLevel;
        const bottomRightWorldY = (viewHeight - boardTranslateY) / zoomLevel;

        // Determine the range of grid cells potentially visible (add buffer of 1 cell)
        const startX = Math.max(0, Math.floor(topLeftWorldX / cellSize) - 1);
        const startY = Math.max(0, Math.floor(topLeftWorldY / cellSize) - 1);
        const endX = Math.min(gridSizeX, Math.ceil(bottomRightWorldX / cellSize) + 1);
        const endY = Math.min(gridSizeY, Math.ceil(bottomRightWorldY / cellSize) + 1);

        // --- Drawing ---
        // Clear the entire canvas (using CSS size)
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, viewWidth, viewHeight);

        // Apply current pan and zoom transform to the drawing context
        ctx.save(); // Save default state (identity transform)
        ctx.translate(boardTranslateX, boardTranslateY);
        ctx.scale(zoomLevel, zoomLevel);

        // --- Draw Alive Cells (Using state received from worker) ---
        ctx.fillStyle = cellColor;
        const stateToDraw = currentGameStateForDrawing; // Use the latest state from the worker
        // Basic validation of the state structure
        if (!Array.isArray(stateToDraw) || stateToDraw.length !== gridSizeY) { // Check row count consistency
             // console.warn("drawBoard called with invalid state height or state not ready.", stateToDraw?.length);
             ctx.restore(); // Ensure context is restored even if nothing to draw
             return; // Don't attempt to draw if the state isn't ready or valid height
        }

        // Iterate only over potentially visible cells
        for (let y = startY; y < endY; y++) {
             // Basic bounds check for row against the *expected* grid size
            if (y < 0 || y >= gridSizeY) continue; // Use calculated gridSizeY from config
            const row = stateToDraw[y]; // Get the row from the received state
            // Check if the row itself exists and is an array with the correct width
            if (!Array.isArray(row) || row.length !== gridSizeX) { // Check column count consistency
                // console.warn(`Row ${y} in stateToDraw is not a valid array or has wrong width.`); // Can be noisy
                continue; // Skip invalid row
            }

            for (let x = startX; x < endX; x++) {
                 // Basic bounds check for column against expected grid size
                if (x < 0 || x >= gridSizeX) continue; // Use calculated gridSizeX from config

                // Check if the specific cell exists in the row and is true
                if (row[x] === true) { // Explicitly check for true (alive)
                    // Draw a rectangle for the alive cell
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
            }
        }
        // --- End Draw Alive Cells ---

        ctx.restore(); // Restore context to state before translate/scale
    }

    // ==============================================================
    // --- View State Clamping and Animation ---
    // ==============================================================

    /** Utility to clamp a value between a min and max */
    function clamp(value, min, max) {
        // Basic clamp function
        return Math.max(min, Math.min(value, max));
    }

    /**
     * Calculates the minimum allowed zoom level to FIT the entire grid within the viewport,
     * and clamps the target zoom and translation. When at minimum zoom, if the grid
     * is smaller than the viewport in one dimension, it centers it, preventing panning
     * in that dimension.
     * @param {number} targetZ - The desired target zoom level.
     * @param {number} targetX - The desired target translation X.
     * @param {number} targetY - The desired target translation Y.
     * @param {number} viewW - Current viewport width (canvas.clientWidth).
     * @param {number} viewH - Current viewport height (canvas.clientHeight).
     * @returns {object} Clamped { zoom, x, y }
     */
    function clampView(targetZ, targetX, targetY, viewW, viewH) {
        // 1. Calculate Minimum Zoom required to FIT the entire grid
        const minZoomX = viewW / logicalGridWidth;
        const minZoomY = viewH / logicalGridHeight;
        // Use the smaller zoom factor to ensure the whole grid fits
        const minAllowedZoom = Math.min(minZoomX, minZoomY);

        // 2. Clamp Target Zoom between min allowed and user max
        const clampedZoom = clamp(targetZ, minAllowedZoom, maxZoomAllowedUser);

        // 3. Calculate Scaled Grid Dimensions at the clamped zoom level
        const scaledGridWidth = logicalGridWidth * clampedZoom;
        const scaledGridHeight = logicalGridHeight * clampedZoom;

        // 4. Calculate Translation Bounds (where the edges of the grid can be)
        // Max translation is 0 (top-left corner aligned with viewport top-left)
        const maxTranslateX = 0;
        const maxTranslateY = 0;
        // Min translation positions the bottom-right corner at the viewport bottom-right
        const minTranslateX = viewW - scaledGridWidth;
        const minTranslateY = viewH - scaledGridHeight;

        // 5. Clamp or Center Target Translation
        let finalX, finalY;
        // If grid is narrower than view (at current zoom), center it horizontally.
        // Otherwise, clamp the translation so grid edges don't go past viewport edges.
        if (scaledGridWidth < viewW) {
            finalX = (viewW - scaledGridWidth) / 2; // Center horizontally
        } else {
            finalX = clamp(targetX, minTranslateX, maxTranslateX); // Clamp pan X
        }
        // If grid is shorter than view (at current zoom), center it vertically.
        // Otherwise, clamp the translation.
        if (scaledGridHeight < viewH) {
            finalY = (viewH - scaledGridHeight) / 2; // Center vertically
        } else {
            finalY = clamp(targetY, minTranslateY, maxTranslateY); // Clamp pan Y
        }

        return { zoom: clampedZoom, x: finalX, y: finalY };
    }


    // --- Smooth Zoom Animation Loop ---
    /** Interpolates current view state towards target state over multiple frames. */
    function animateZoom() {
        // Stop if animation flag is turned off elsewhere
        if (!isAnimatingZoom) return;

        // Clamp the TARGETS before interpolation each frame.
        // This ensures we animate towards a valid final state even if the
        // initial target was outside bounds (e.g., zooming too far out).
        const viewW = canvas.clientWidth;
        const viewH = canvas.clientHeight;
        const clampedTarget = clampView(targetZoomLevel, targetTranslateX, targetTranslateY, viewW, viewH);
        targetZoomLevel = clampedTarget.zoom;
        targetTranslateX = clampedTarget.x;
        targetTranslateY = clampedTarget.y;

        // Interpolate current view state towards the (clamped) target state
        // smoothZoomFactor controls how quickly it converges (0 to 1)
        zoomLevel += (targetZoomLevel - zoomLevel) * smoothZoomFactor;
        boardTranslateX += (targetTranslateX - boardTranslateX) * smoothZoomFactor;
        boardTranslateY += (targetTranslateY - boardTranslateY) * smoothZoomFactor;

        // Request a redraw with the new interpolated view state
        requestDraw();

        // Check stop condition: are we close enough to the target?
        const zoomDiff = Math.abs(targetZoomLevel - zoomLevel);
        const transXDiff = Math.abs(targetTranslateX - boardTranslateX);
        const transYDiff = Math.abs(targetTranslateY - boardTranslateY);

        // If differences are below thresholds, snap to the final target and stop.
        if (zoomDiff < zoomThreshold && transXDiff < 0.1 && transYDiff < 0.1) {
            zoomLevel = targetZoomLevel;
            boardTranslateX = targetTranslateX;
            boardTranslateY = targetTranslateY;
            requestDraw(); // Final draw at the exact target position
            isAnimatingZoom = false; // Turn off animation flag
            animationFrameId = null; // Clear animation frame ID
        } else {
            // Otherwise, continue the animation on the next available frame
            animationFrameId = requestAnimationFrame(animateZoom);
        }
    }

    // ==============================================================
    // --- Spam Pattern Placement Function ---
    // This function uses the 'patterns' object defined in Part 2
    // ==============================================================

    /**
     * Calculates the target cells for the selected spam pattern at the last mouse position
     * and sends a message to the worker to update its state (make cells alive).
     */
    function placeSpamPattern() {
        console.log("DEBUG: placeSpamPattern function entered"); // <<< ADD LOG

        if (patternCycleList.length === 0 || !worker || currentPatternIndex < 0){
             console.log("DEBUG: placeSpamPattern returning early (no list, worker, or index). Worker:", worker); // <<< ADD LOG
             return;
        }

        const patternKey = patternCycleList[currentPatternIndex];
        // Assumes 'patterns' object is defined correctly in Part 2
        const patternCoords = patterns[patternKey];
        if (!patternCoords) {
             console.warn(`DEBUG: Spam: Pattern key "${patternKey}" not found in spam definitions (Part 2).`);
             return;
        }
        console.log("DEBUG: Found pattern coords for", patternKey); // <<< ADD LOG

        const worldX = (lastSpamX - boardTranslateX) / zoomLevel;
        const worldY = (lastSpamY - boardTranslateY) / zoomLevel;
        const clickGridX = Math.floor(worldX / cellSize);
        const clickGridY = Math.floor(worldY / cellSize);

        const cellsToUpdate = [];
        patternCoords.forEach(point => {
            const targetGridX = clickGridX + point.x;
            const targetGridY = clickGridY + point.y;
            const wrappedX = (targetGridX % gridSizeX + gridSizeX) % gridSizeX;
            const wrappedY = (targetGridY % gridSizeY + gridSizeY) % gridSizeY;
            if (wrappedY >= 0 && wrappedY < gridSizeY && wrappedX >= 0 && wrappedX < gridSizeX) {
                 cellsToUpdate.push({ x: wrappedX, y: wrappedY, alive: true });
            }
        });
        console.log("DEBUG: Cells calculated:", cellsToUpdate.length > 0 ? cellsToUpdate : "None"); // <<< ADD LOG

        if (cellsToUpdate.length > 0) {
             console.log("DEBUG: Posting setCells message to worker"); // <<< ADD LOG
             worker.postMessage({ type: 'setCells', cells: cellsToUpdate });
        } else {
             console.log("DEBUG: No cells to update, not posting message."); // <<< ADD LOG
        }
    }

    // ==============================================================
    // --- Mouse Interaction Listeners (Panning, Zooming, Spamming) ---
    // ==============================================================

    // --- Mouse Wheel Listener (Zoom) ---
    container.addEventListener('wheel', (e) => {
        e.preventDefault(); // Prevent default page scrolling behavior

        // Stop any existing zoom animation immediately if user scrolls again
        if (isAnimatingZoom) {
             cancelAnimationFrame(animationFrameId);
             isAnimatingZoom = false; // Reset flag
        }

        // Get mouse position relative to the container element
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate world coordinates under mouse BEFORE zoom changes
        const worldX = (mouseX - boardTranslateX) / zoomLevel;
        const worldY = (mouseY - boardTranslateY) / zoomLevel;

        // Determine zoom direction and calculate potential new target zoom level
        let potentialTargetZoom = targetZoomLevel * (e.deltaY < 0 ? zoomSensitivity : 1 / zoomSensitivity);

        // Calculate the translation adjustment needed to keep the world point (worldX, worldY)
        // under the mouse cursor (mouseX, mouseY) AFTER the zoom.
        let potentialTargetX = mouseX - worldX * potentialTargetZoom;
        let potentialTargetY = mouseY - worldY * potentialTargetZoom;

        // Clamp the entire potential view state (zoom and translation) to valid bounds
        const viewW = canvas.clientWidth;
        const viewH = canvas.clientHeight;
        const clamped = clampView(potentialTargetZoom, potentialTargetX, potentialTargetY, viewW, viewH);

        // Update the animation target values
        targetZoomLevel = clamped.zoom;
        targetTranslateX = clamped.x;
        targetTranslateY = clamped.y;

        // Ensure the animation loop is running to smoothly transition to the target
        if (!isAnimatingZoom) {
            isAnimatingZoom = true;
            animationFrameId = requestAnimationFrame(animateZoom);
        }

    }, { passive: false }); // passive: false is required to allow preventDefault()

        // --- Panning & Spamming (Mouse Button Down) Logic ---
        container.addEventListener('mousedown', (e) => { // Single listener start

            // --- Left Click: Start Panning ---
            if (e.button === 0) { // Check for left mouse button (button index 0)
                 if (isAnimatingZoom) { // Stop any ongoing zoom animation before panning
                     cancelAnimationFrame(animationFrameId);
                     isAnimatingZoom = false;
                     // Snap view to the animation's target state immediately
                     const viewW = canvas.clientWidth; const viewH = canvas.clientHeight;
                     const clampedSnap = clampView(targetZoomLevel, targetTranslateX, targetTranslateY, viewW, viewH);
                     zoomLevel = clampedSnap.zoom; boardTranslateX = clampedSnap.x; boardTranslateY = clampedSnap.y;
                     updateHeaderVisibility(); // Re-check header visibility after snapping view state
                     requestDraw(); // Draw the snapped state
                 }
                isDragging = true; // Set the flag indicating panning has started
                startX = e.clientX; startY = e.clientY; // Record the starting screen coordinates of the mouse
                startTranslateX = boardTranslateX; startTranslateY = boardTranslateY; // Record the board's translation at the start of the drag
                container.classList.add('dragging'); // Add a CSS class for visual feedback (e.g., change cursor)
    
                // CRITICAL: Add move and up listeners to the *document* so they work even if the mouse leaves the container
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
                e.preventDefault(); // Prevent default browser actions like text selection during drag
            } // End of left click logic
    
            // --- Right Click: Start Spamming ---
            else if (e.button === 2) { // Check for right mouse button (button index 2)
                e.preventDefault(); // IMPORTANT: Prevent the default context menu
                console.log("DEBUG: Right Mouse Down Fired");
    
                if (!worker) { // Ensure the worker is ready before trying to interact
                    console.warn("DEBUG: Right-click ignored: Worker not ready yet.");
                    return; // Exit the handler if worker isn't available
                }
                console.log("DEBUG: Worker seems ready:", worker);
    
                // Clear any existing spam interval if one was somehow leftover (safety check)
                if (spamIntervalId) clearInterval(spamIntervalId);
    
                isRightClickSpamming = true; // Set the flag indicating spamming has started
                currentPatternIndex = (currentPatternIndex + 1) % patternCycleList.length; // Cycle to the next pattern in the list
                console.log(`DEBUG: Starting Spam. Pattern: ${patternCycleList[currentPatternIndex]}`);
    
                // Get the initial mouse position relative to the canvas for the first placement
                const rect = canvas.getBoundingClientRect();
                lastSpamX = e.clientX - rect.left;
                lastSpamY = e.clientY - rect.top;
    
                console.log("DEBUG: Calling placeSpamPattern initially");
                placeSpamPattern(); // Place the first pattern immediately upon right-click
    
                console.log("DEBUG: Starting spam interval");
                // Start the interval timer to repeatedly call placeSpamPattern
                spamIntervalId = setInterval(placeSpamPattern, spamIntervalDelay);
    
                 // CRITICAL: Add move and up listeners to the *document* for spamming as well
                 document.addEventListener('mousemove', onMouseMove);
                 document.addEventListener('mouseup', onMouseUp);
            } // End of right click logic
    
        }); // Single listener end
    // --- Mouse Move Handler (for Panning and Spamming Position Update) ---
    function onMouseMove(e) {
        // --- Panning Update ---
        if (isDragging) {
            e.preventDefault(); // Good practice during drag operations
            // Calculate change in screen coordinates from the start of the drag
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            // Calculate the new potential translation based on the starting translation and delta
            let potentialX = startTranslateX + dx;
            let potentialY = startTranslateY + dy;

            // Clamp the view based on the new potential translation (using current zoom level)
            const viewW = canvas.clientWidth; const viewH = canvas.clientHeight;
            const clamped = clampView(zoomLevel, potentialX, potentialY, viewW, viewH);

            // Update the actual board translation directly (no animation for panning)
            boardTranslateX = clamped.x;
            boardTranslateY = clamped.y;
            // Also update the animation targets to match the current state,
            // preventing a jump if a zoom starts immediately after panning stops.
            targetTranslateX = boardTranslateX;
            targetTranslateY = boardTranslateY;

            requestDraw(); // Redraw the board at the new panned position
        }
        // --- Spamming Position Update ---
        else if (isRightClickSpamming) {
             // Continuously update the last known mouse position relative to the canvas.
             // The placeSpamPattern function (called by the interval) will use these coords.
             const rect = canvas.getBoundingClientRect();
             lastSpamX = e.clientX - rect.left;
             lastSpamY = e.clientY - rect.top;
        }
    }

    // --- Mouse Button Release Handler ---
    function onMouseUp(e) {
        // --- Stop Panning ---
        // Check if dragging was active and the button released was the left button
        if (isDragging && e.button === 0) {
            isDragging = false; // Turn off dragging state
            container.classList.remove('dragging'); // Restore default cursor style
            // Remove the document-level listeners added on mousedown
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
             console.log("Main: Panning stopped.");
        }
        // --- Stop Spamming ---
        // Check if spamming was active and the button released was the right button
        else if (isRightClickSpamming && e.button === 2) {
            isRightClickSpamming = false; // Turn off spamming state
            // Clear the interval timer
            if (spamIntervalId) {
                clearInterval(spamIntervalId);
                console.log("Main: Spam interval cleared:", spamIntervalId);
                spamIntervalId = null;
            }
            // Remove the document-level listeners added on mousedown
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    }

    // --- Context Menu Prevention ---
    // Prevent the default browser context menu ONLY when right-clicking inside the container
    container.addEventListener('contextmenu', e => {
        e.preventDefault();
    });

        // ==============================================================
    // --- Initialization and Resize Handling ---
    // ==============================================================

    /** Initializes the worker, loads patterns, sets up view, and starts game */
    async function initialize() { // Marked async to use await for fetch

        // --- Load ADDITIONAL Pattern Data from JSON Files ---
        let allFetchedPatterns = []; // Array to hold coordinates from ALL fetched JSON files

        console.log("Main: Starting to load additional patterns from JSON files...");

        // Create an array of promises, one for each file loading operation
        const loadPromises = patternFilesToLoad.map(async (fileInfo) => {
            // Check if fileInfo and fileInfo.file are valid before proceeding
            if (!fileInfo || typeof fileInfo.file !== 'string' || typeof fileInfo.offsetX !== 'number' || typeof fileInfo.offsetY !== 'number') {
                console.warn("Main: Invalid entry in patternFilesToLoad, skipping:", fileInfo);
                return []; // Skip this invalid entry
            }

            try {
                console.log(`Main: Fetching additional pattern from ${fileInfo.file}...`);
                const response = await fetch(fileInfo.file); // Fetch the specific file

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status} while fetching ${fileInfo.file}`);
                }

                const loadedJsonPattern = await response.json(); // Parse its JSON content

                if (!Array.isArray(loadedJsonPattern)) {
                     throw new Error(`Fetched data from ${fileInfo.file} is not a valid JSON array.`);
                }
                console.log(`Main: Successfully loaded ${loadedJsonPattern.length} cells from ${fileInfo.file}.`);

                // Apply the specific offsets for THIS file
                console.log(`Main: Applying offset (${fileInfo.offsetX}, ${fileInfo.offsetY}) to pattern from ${fileInfo.file}.`);
                const offsetJsonPattern = loadedJsonPattern.map(cell => ({
                    x: cell.x + fileInfo.offsetX,
                    y: cell.y + fileInfo.offsetY
                }));

                // Return the processed (offset) pattern data for this file
                return offsetJsonPattern;

            } catch (error) {
                // Handle errors for a specific file
                console.error(`Main: Failed to load or process ${fileInfo.file}:`, error);
                alert(`Error loading additional pattern from ${fileInfo.file}.\nPlease ensure the file exists and is valid JSON.\nSkipping this file.\n\nDetails: ${error.message}`);
                return []; // Return an empty array for this file on error, so Promise.all doesn't fail entirely
            }
        }); // End of .map() which creates the promises

        // --- Wait for all fetch operations to complete ---
        try {
            // Promise.all waits for every promise in loadPromises to resolve
            const results = await Promise.all(loadPromises);
            // Flatten the array of arrays into a single array of pattern coordinates
            allFetchedPatterns = results.flat();
            console.log(`Main: Finished loading all JSON files. Total cells loaded from JSON: ${allFetchedPatterns.length}`);
        } catch (error) {
            // Catch errors in Promise.all itself (less likely with individual catches)
            console.error("Main: An unexpected error occurred while waiting for patterns to load:", error);
            alert("A critical error occurred while loading pattern files. Initialization may be incomplete.");
            // Depending on severity, you might want to return here
        }
        // --- End of loading JSON patterns ---


        // --- Combine Hardcoded and ALL Loaded Patterns ---
        // Ensure the hardcoded 'initialPattern' array (defined elsewhere) exists
        if (typeof initialPattern === 'undefined' || !Array.isArray(initialPattern)) {
             console.error("Main: The hardcoded 'initialPattern' array is missing or not an array! Cannot proceed.");
             alert("Error: The hardcoded initial pattern is missing. Please check the script.");
             return; // Stop initialization
        }

        // Concatenate the hardcoded array with the array containing cells from ALL loaded JSON files
        const combinedInitialPattern = initialPattern.concat(allFetchedPatterns); // Use allFetchedPatterns here
        console.log(`Main: Total initial live cells (hardcoded + all JSON): ${combinedInitialPattern.length}`);


        // --- Create and Initialize Worker (using the combined pattern) ---
        console.log("Main: Initializing Worker...");
        try {
            worker = new Worker('worker.js'); // Create the worker

            // Handle messages received FROM the worker
            worker.onmessage = function(e) {
                // Add basic check for e.data
                if (!e || !e.data) {
                    console.warn("Main received empty/invalid message from worker.");
                    return;
                }
                console.log("DEBUG: Main thread received message from worker:", e.data.type || 'Unknown type');

                if (e.data.type === 'stateChanges') {
                    // Add check for e.data.changes being an array
                    if (!Array.isArray(e.data.changes)) {
                        console.warn("stateChanges received, but 'changes' is not an array:", e.data.changes);
                        return;
                    }
                    console.log("DEBUG: Processing stateChanges from worker:", e.data.changes.length, "changes");

                    e.data.changes.forEach(change => {
                        // Add more robust checking for each change object
                        if (change && typeof change === 'object' &&
                            Number.isInteger(change.y) && change.y >= 0 && change.y < gridSizeY &&
                            Number.isInteger(change.x) && change.x >= 0 && change.x < gridSizeX &&
                            typeof change.alive === 'boolean')
                        {
                            // Check if the row exists before accessing it
                            if (currentGameStateForDrawing[change.y]) {
                                currentGameStateForDrawing[change.y][change.x] = change.alive;
                            } else {
                                console.warn(`Attempted to access non-existent row ${change.y} in currentGameStateForDrawing.`);
                            }
                        } else {
                            console.warn("Invalid change object received from worker:", change);
                        }
                    });
                    console.log("DEBUG: Requesting draw after stateChanges");
                    requestDraw(); // Request a redraw after applying changes
                } else {
                    console.log("Received other message type from worker:", e.data.type);
                }
            };

            // Handle errors originating FROM the worker
            worker.onerror = function(error) {
                 console.error('Worker Error:', error.message, error);
                 alert(`Worker Error: ${error.message}\nSimulation may stop.`);
                 stopGame(); // Attempt to stop if worker errors out
            };

            // --- Prepare Initial Game State using the COMBINED pattern ---
            console.log(`Main: Preparing initial state for worker: ${gridSizeX}x${gridSizeY}`);
            // Create a 2D array representing the grid, initially all false (dead)
            const tempInitialState = Array(gridSizeY).fill(null).map(() => Array(gridSizeX).fill(false));

            // Populate the initial state array based on the COMBINED JSON and hardcoded data
            combinedInitialPattern.forEach(({ x, y }) => {
                // Apply toroidal wrapping to the loaded coordinates
                const wrappedX = (x % gridSizeX + gridSizeX) % gridSizeX;
                const wrappedY = (y % gridSizeY + gridSizeY) % gridSizeY;
                // Check bounds before assignment
                if (wrappedY >= 0 && wrappedY < gridSizeY && wrappedX >= 0 && wrappedX < gridSizeX) {
                    // Ensure the target row exists (it should, based on array creation above)
                    if (tempInitialState[wrappedY]) {
                         tempInitialState[wrappedY][wrappedX] = true; // Set the cell to alive
                    } else {
                        // This case should ideally not happen if tempInitialState is created correctly
                        console.warn(`Attempted write to non-existent row ${wrappedY} during initial state creation.`);
                    }
                } else {
                     // This case should also not happen if gridSizeX/Y are correct
                     console.warn(`Coordinates (${x}, ${y}) wrapped outside bounds (${wrappedX}, ${wrappedY}) during initial state creation.`);
                }
            });
            // Set the main thread's drawing state immediately as well
            currentGameStateForDrawing = tempInitialState;
            console.log("Main: Initial state prepared using combined patterns.");

            // --- Send Initial Configuration and State TO Worker ---
            console.log("Main: Sending initial data to worker...");
            worker.postMessage({
                type: 'init',
                config: { gridSizeX: gridSizeX, gridSizeY: gridSizeY, gameSpeed: gameSpeed },
                initialGameState: currentGameStateForDrawing // Send the state we just built
            });
            console.log("Main: Initial 'init' message sent.");

            // --- Initialize Viewport ---
            const viewW = container.clientWidth; const viewH = container.clientHeight;
            // Set initial canvas CSS size (internal resolution set in drawBoard)
            canvas.style.width = `${viewW}px`; canvas.style.height = `${viewH}px`;
            // Calculate initial translation to center the view (or clamp if zoomed out)
            let initialX = (viewW - logicalGridWidth * initialZoomFactor) / 2;
            let initialY = (viewH - logicalGridHeight * initialZoomFactor) / 2;
            // Clamp the initial view state
            const clampedInitial = clampView(initialZoomFactor, initialX, initialY, viewW, viewH);
            // Set both current and target view states
            zoomLevel = clampedInitial.zoom; boardTranslateX = clampedInitial.x; boardTranslateY = clampedInitial.y;
            targetZoomLevel = clampedInitial.zoom; targetTranslateX = clampedInitial.x; targetTranslateY = clampedInitial.y;

            // Log initial setup details
            console.log(`Main: Grid Size: ${gridSizeX}x${gridSizeY}`);
            console.log(`Main: Canvas Initialized. Viewport: ${viewW}x${viewH}`);
            console.log(`Main: Logical Board Size: ${logicalGridWidth}x${logicalGridHeight}`);
            console.log(`Main: Clamped Initial Zoom: ${zoomLevel.toFixed(3)}`);
            console.log(`Main: Clamped Initial Translate: (${boardTranslateX.toFixed(1)}, ${boardTranslateY.toFixed(1)})`);

            // Initial draw using the combined pattern
            requestDraw();
            // Tell worker to start the simulation loop
            startGame();

        } catch (err) { // Catch errors during worker setup/init message posting
            console.error("Failed to initialize worker or simulation:", err);
            alert("Error initializing simulation. Check console for details.");
        }
    } // <<< END OF initialize FUNCTION


    // --- Window Resize Handling ---
    // ... (Keep the existing resize handler as it is) ...
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log("Window resized, adjusting canvas and clamping view.");
             const viewW = container.clientWidth;
             const viewH = container.clientHeight;
             canvas.style.width = `${viewW}px`;
             canvas.style.height = `${viewH}px`;
             const clampedCurrent = clampView(targetZoomLevel, targetTranslateX, targetTranslateY, viewW, viewH);
             targetZoomLevel = clampedCurrent.zoom;
             targetTranslateX = clampedCurrent.x;
             targetTranslateY = clampedCurrent.y;
             if (!isAnimatingZoom) {
                 zoomLevel = targetZoomLevel;
                 boardTranslateX = targetTranslateX;
                 boardTranslateY = targetTranslateY;
             }
             requestDraw();
        }, 150);
    });

    // --- Run Initialization ---
    initialize(); // Call the async initialization function

}); // End DOMContentLoaded wrapper
