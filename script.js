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

    // --- Calculated Grid Properties ---
    const gridSizeX = Math.floor(targetWidth / cellSize);
    const gridSizeY = Math.floor(targetHeight / cellSize);
    const logicalGridWidth = gridSizeX * cellSize;
    const logicalGridHeight = gridSizeY * cellSize;

    // --- DOM Elements and Context ---
    const container = document.getElementById('container');
    const canvas = document.getElementById('board-canvas');
    const ctx = canvas.getContext('2d');
    // Note: headerBar is defined later

    // --- Core Game State ---
    let currentGameStateForDrawing = [];
    let drawPending = false;

    // --- View State (Current Rendered) ---
    let zoomLevel = 1.0;
    let boardTranslateX = 0;
    let boardTranslateY = 0;

    // --- View State (Animation Target) ---
    let targetZoomLevel = 1.0;
    let targetTranslateX = 0;
    let targetTranslateY = 0;
    let isAnimatingZoom = false;
    let animationFrameId = null;

    // --- Panning State ---
    let isDragging = false;
    let startX, startY;
    let startTranslateX, startTranslateY;

    // --- Right-Click Pattern Spamming State ---
    const patternCycleList = ['glider', 'lwss', 'mwss', 'acorn', 'rPentomino', 'hwss', 'gosperGliderGun', 'pulsar'];
    let currentPatternIndex = 0;
    let isRightClickSpamming = false;
    let spamIntervalId = null;
    const spamIntervalDelay = 80;
    let lastSpamX = 0;
    let lastSpamY = 0;

    // --- Web Worker Reference ---
    let worker = null;

    // ==============================================================
    // --- Floating Header Logic (Scroll-Only Version) ---
    // ==============================================================
    const headerBar = document.getElementById('header-bar');
    let lastScrollTop = 0;
    const headerHideScrollThreshold = 50; // Pixels scrolled down before hiding

    // Central function to update header visibility based ONLY on scroll
    function updateHeaderVisibility() {
        // Ensure headerBar exists before proceeding
        if (!headerBar) return;

        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // --- Visibility Logic (Based ONLY on Scroll) ---
        if (scrollTop > lastScrollTop && scrollTop > headerHideScrollThreshold) {
            // Scrolling Down past threshold -> HIDE
            if (!headerBar.classList.contains('header-hidden')) {
                 headerBar.classList.add('header-hidden');
                 // console.log("Hiding Header (Scroll Down)");
            }
        } else if (scrollTop < lastScrollTop || scrollTop <= headerHideScrollThreshold) {
             // Scrolling Up OR Near the Top (within threshold) -> SHOW
            if (headerBar.classList.contains('header-hidden')) {
                 headerBar.classList.remove('header-hidden');
                 // console.log("Showing Header (Scroll Up or Top)");
            }
        }
        // Note: If scrolling stops while down low, it stays hidden until scrolled up.

        // Update last scroll position AFTER determining visibility for this frame
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }

    // --- Scroll Detection ---
    // Add listener after the function is defined
    window.addEventListener('scroll', updateHeaderVisibility, false); // Call central function on scroll
    // <<< --- END: HEADER LOGIC DEFINITIONS MOVED HERE --- >>>


    // --- Patterns (Object containing pattern definitions) ---
    function addPattern(pattern, offsetX, offsetY) {
        return pattern.map(p => ({ x: p.x + offsetX, y: p.y + offsetY }));
    }


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
        pentadecathlon: [ { x: 2, y: 0 }, { x: 7, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 8, y: 1 }, { x: 9, y: 1 }, { x: 2, y: 2 }, { x: 7, y: 2 } ], // Corrected Pentadecathlon
        toad: [ { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 } ],
        hwss: [{ x: 2, y: 0 }, { x: 3, y: 0 }, { x: 0, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 0, y: 2 }, { x: 6, y: 2 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 } ],
        mwss: [ { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 0, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 0, y: 2 }, { x: 5, y: 2 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 } ],
        turtle: [ {x:3, y:0}, {x:4, y:0}, {x:1, y:1}, {x:2, y:1}, {x:5, y:1}, {x:6, y:1}, {x:0, y:2}, {x:3, y:2}, {x:6, y:2}, {x:8, y:2}, {x:0, y:3}, {x:5, y:3}, {x:9, y:3}, {x:0, y:4}, {x:3, y:4}, {x:6, y:4}, {x:8, y:4}, {x:1, y:5}, {x:2, y:5}, {x:5, y:5}, {x:6, y:5}, {x:3, y:6}, {x:4, y:6}, {x:4, y:7}, {x:4, y:8} ],
        lobster: [ {x:6, y:0}, {x:11, y:0}, {x:5, y:1}, {x:7, y:1}, {x:10, y:1}, {x:12, y:1}, {x:2, y:2}, {x:5, y:2}, {x:7, y:2}, {x:9, y:2}, {x:11, y:2}, {x:1, y:3}, {x:3, y:3}, {x:7, y:3}, {x:8, y:3}, {x:9, y:3}, {x:13, y:3}, {x:15, y:3}, {x:0, y:4}, {x:3, y:4}, {x:5, y:4}, {x:7, y:4}, {x:9, y:4}, {x:11, y:4}, {x:13, y:4}, {x:16, y:4}, {x:1, y:5}, {x:2, y:5}, {x:3, y:5}, {x:5, y:5}, {x:7, y:5}, {x:9, y:5}, {x:11, y:5}, {x:13, y:5}, {x:14, y:5}, {x:15, y:5}, {x:2, y:6}, {x:4, y:6}, {x:6, y:6}, {x:8, y:6}, {x:10, y:6}, {x:12, y:6}, {x:3, y:7}, {x:5, y:7}, {x:7, y:7}, {x:9, y:7}, {x:11, y:7}, {x:4, y:8}, {x:6, y:8}, {x:8, y:8}, {x:10, y:8}, {x:5, y:9}, {x:7, y:9}, {x:9, y:9}, {x:6, y:10}, {x:8, y:10}, {x:7, y:11}, {x:10, y:12}, {x:11, y:12}, {x:12, y:12}, {x:11, y:13}, {x:11, y:14}, {x:12, y:14}, {x:13, y:14}, {x:10, y:15}, {x:12, y:15}, {x:10, y:16} ]
    };

    // --- Initial Pattern Placement ---
    // Grid Size is 1600x560 (from 8000x2800 / 5) - Updated calculation
    let initialPattern = [
        // Guns
        ...addPattern(patterns.gosperGliderGun, 10, 10),
        ...addPattern(patterns.gosperGliderGun, 1550, 10),

        // Pulsars
        ...addPattern(patterns.pulsar, 80, 20),
        ...addPattern(patterns.pulsar, 1500, 540), // Near bottom right
        ...addPattern(patterns.pulsar, 50, 250),   // Left edge mid
        ...addPattern(patterns.pulsar, 1500, 250), // Right edge mid

        // Spaceships
        ...addPattern(patterns.lwss, 150, 40), ...addPattern(patterns.lwss, 10, 300),
        ...addPattern(patterns.lwss, 1580, 250), ...addPattern(patterns.lwss, 800, 550),
        ...addPattern(patterns.mwss, 100, 50), ...addPattern(patterns.mwss, 1450, 400),
        ...addPattern(patterns.hwss, 1400, 100), ...addPattern(patterns.hwss, 100, 500),

        // Gliders
        ...addPattern(patterns.glider, 5, 550), ...addPattern(patterns.glider, 1580, 10),
        ...addPattern(patterns.glider, 1500, 400), ...addPattern(patterns.glider, 100, 100),

        // Oscillators/Still Lifes
        ...addPattern(patterns.beacon, 50, 350), ...addPattern(patterns.beacon, 1550, 350),
        ...addPattern(patterns.pentadecathlon, 1400, 350), ...addPattern(patterns.pentadecathlon, 250, 100), // P15
        ...addPattern(patterns.block, 50, 5), ...addPattern(patterns.beehive, 70, 5),
        ...addPattern(patterns.loaf, 50, 540), ...addPattern(patterns.tub, 1550, 5), // Adjusted Y for Loaf
        ...addPattern(patterns.block, 1565, 5), ...addPattern(patterns.beehive, 1580, 540), // Adjusted Y for Beehive

        // Central Chaos Cluster (Adjusted for 1600x560 center ~800, 280)
        ...addPattern(patterns.rPentomino, 798, 285), ...addPattern(patterns.rPentomino, 780, 270),
        ...addPattern(patterns.rPentomino, 815, 300), ...addPattern(patterns.rPentomino, 790, 260),
        ...addPattern(patterns.rPentomino, 805, 310), ...addPattern(patterns.acorn, 770, 280),
        ...addPattern(patterns.acorn, 825, 275), ...addPattern(patterns.acorn, 785, 295),
        ...addPattern(patterns.acorn, 810, 265), ...addPattern(patterns.blinker_v, 790, 280),
        ...addPattern(patterns.blinker_v, 792, 280), ...addPattern(patterns.toad, 800, 290),
        ...addPattern(patterns.toad, 806, 290), ...addPattern(patterns.beacon, 775, 260),
        ...addPattern(patterns.beacon, 820, 310), ...addPattern(patterns.beacon, 795, 250),
        ...addPattern(patterns.glider, 750, 250), ...addPattern(patterns.glider, 755, 252),
        ...addPattern(patterns.glider, 845, 250), ...addPattern(patterns.glider, 840, 252),
        ...addPattern(patterns.glider, 750, 320), ...addPattern(patterns.glider, 755, 318),
        ...addPattern(patterns.glider, 845, 320), ...addPattern(patterns.glider, 840, 318),
        ...addPattern(patterns.glider, 770, 285), ...addPattern(patterns.glider, 825, 285),
        ...addPattern(patterns.lwss, 740, 286), ...addPattern(patterns.lwss, 850, 286),
        ...addPattern(patterns.mwss, 798, 240), ...addPattern(patterns.hwss, 798, 330),
        ...addPattern(patterns.block, 785, 265), ...addPattern(patterns.block, 810, 305),
        ...addPattern(patterns.tub, 795, 275), ...addPattern(patterns.loaf, 815, 255),
        ...addPattern(patterns.turtle, 1250, 280), ...addPattern(patterns.turtle, 1250, 400), // Turtles
        ...addPattern(patterns.turtle, 1250, 100),
        ...addPattern(patterns.lobster, 1000, 200), ...addPattern(patterns.lobster, 1200, 400), // Lobsters

        // Additional Peripheral Spaceship Fleet
        ...addPattern(patterns.lwss, 200, 5), ...addPattern(patterns.lwss, 415, 5),
        ...addPattern(patterns.mwss, 650, 3), ...addPattern(patterns.lwss, 870, 5),
        ...addPattern(patterns.hwss, 1100, 2), ...addPattern(patterns.lwss, 1330, 5),
        ...addPattern(patterns.mwss, 1450, 3),
        ...addPattern(patterns.lwss, 200, 550), ...addPattern(patterns.mwss, 450, 548), // Adjusted Y
        ...addPattern(patterns.hwss, 700, 547), ...addPattern(patterns.lwss, 950, 550), // Adjusted Y
        ...addPattern(patterns.lwss, 1165, 550), ...addPattern(patterns.mwss, 1400, 548), // Adjusted Y
        ...addPattern(patterns.lwss, 5, 50), ...addPattern(patterns.mwss, 3, 120),
        ...addPattern(patterns.hwss, 2, 190), ...addPattern(patterns.lwss, 5, 260),
        ...addPattern(patterns.lwss, 5, 330), ...addPattern(patterns.mwss, 3, 400),
        ...addPattern(patterns.hwss, 2, 470),
        ...addPattern(patterns.lwss, 1590, 50), ...addPattern(patterns.mwss, 1588, 120),
        ...addPattern(patterns.hwss, 1587, 190), ...addPattern(patterns.lwss, 1590, 260),
        ...addPattern(patterns.lwss, 1590, 330), ...addPattern(patterns.mwss, 1588, 400),
        ...addPattern(patterns.hwss, 1587, 470),
        ...addPattern(patterns.lwss, 120, 120), ...addPattern(patterns.mwss, 380, 80),
        ...addPattern(patterns.hwss, 620, 150), ...addPattern(patterns.lwss, 980, 280),
        ...addPattern(patterns.mwss, 1250, 350), ...addPattern(patterns.hwss, 1450, 250),
        ...addPattern(patterns.lwss, 480, 500), ...addPattern(patterns.mwss, 1120, 500),

        // Mega-Structure (Adjusted position slightly for new grid size)
        ...addPattern(patterns.pulsar, 380, 280), ...addPattern(patterns.pulsar, 410, 280),
        ...addPattern(patterns.pulsar, 380, 310), ...addPattern(patterns.pulsar, 410, 310),
        ...addPattern(patterns.gosperGliderGun, 350, 260), ...addPattern(patterns.gosperGliderGun, 440, 260),
        ...addPattern(patterns.gosperGliderGun, 440, 340), ...addPattern(patterns.gosperGliderGun, 350, 340),
        ...addPattern(patterns.hwss, 360, 240), ...addPattern(patterns.hwss, 430, 240),
        ...addPattern(patterns.hwss, 360, 360), ...addPattern(patterns.hwss, 430, 360),
        ...addPattern(patterns.rPentomino, 395, 295), ...addPattern(patterns.rPentomino, 405, 305),
        ...addPattern(patterns.acorn, 370, 300), ...addPattern(patterns.acorn, 430, 300),
        ...addPattern(patterns.block, 340, 250), ...addPattern(patterns.block, 460, 250),
        ...addPattern(patterns.block, 340, 350), ...addPattern(patterns.block, 460, 350),
        ...addPattern(patterns.tub, 350, 290), ...addPattern(patterns.tub, 450, 290),
        ...addPattern(patterns.tub, 350, 310), ...addPattern(patterns.tub, 450, 310),
    ];
    // --- End Patterns ---


    // --- Game State Logic (MOVED TO worker.js) ---

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
        // Use calculated gridSizeX/Y for bounds check during drawing loop below
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
        if (!Array.isArray(stateToDraw) || stateToDraw.length !== gridSizeY) { // Check row count consistency
             console.warn("drawBoard called with invalid state height or state not ready, skipping draw.", stateToDraw?.length);
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
    // --- View State and Clamping ---
    // ==============================================================

    /** Utility to clamp a value between a min and max */
    function clamp(value, min, max) {
        // Ensure min is actually less than or equal to max before clamping
        if (min > max) {
             return Math.max(min, Math.min(value, max)); // Standard clamp logic handles this case
        }
        return Math.max(min, Math.min(value, max));
    }


    /**
     * Calculates the minimum allowed zoom level to FIT the entire grid within the viewport,
     * and clamps the target zoom and translation. When at minimum zoom, if the grid
     * is smaller than the viewport in one dimension, it centers it, preventing panning.
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
        const minAllowedZoom = Math.min(minZoomX, minZoomY); // Ensures "Fit"

        // 2. Clamp Target Zoom
        const clampedZoom = clamp(targetZ, minAllowedZoom, maxZoomAllowedUser);

        // 3. Calculate Scaled Dimensions
        const scaledGridWidth = logicalGridWidth * clampedZoom;
        const scaledGridHeight = logicalGridHeight * clampedZoom;

        // 4. Calculate Translation Bounds
        const maxTranslateX = 0;
        const maxTranslateY = 0;
        const minTranslateX = viewW - scaledGridWidth;
        const minTranslateY = viewH - scaledGridHeight;

        // 5. Clamp or Center Target Translation
        let finalX, finalY;
        if (scaledGridWidth < viewW) {
            finalX = (viewW - scaledGridWidth) / 2; // Center H
        } else {
            finalX = clamp(targetX, minTranslateX, maxTranslateX);
        }
        if (scaledGridHeight < viewH) {
            finalY = (viewH - scaledGridHeight) / 2; // Center V
        } else {
            finalY = clamp(targetY, minTranslateY, maxTranslateY);
        }

        return { zoom: clampedZoom, x: finalX, y: finalY };
    }


    // --- Smooth Zoom Animation Loop ---
    /** Interpolates current view state towards target state over multiple frames. */
    function animateZoom() {
        if (!isAnimatingZoom) return;

        // Clamp the TARGETS before interpolation
        const viewW = canvas.clientWidth;
        const viewH = canvas.clientHeight;
        const clampedTarget = clampView(targetZoomLevel, targetTranslateX, targetTranslateY, viewW, viewH);
        targetZoomLevel = clampedTarget.zoom;
        targetTranslateX = clampedTarget.x;
        targetTranslateY = clampedTarget.y;

        // Interpolate current towards clamped target
        zoomLevel += (targetZoomLevel - zoomLevel) * smoothZoomFactor;
        boardTranslateX += (targetTranslateX - boardTranslateX) * smoothZoomFactor;
        boardTranslateY += (targetTranslateY - boardTranslateY) * smoothZoomFactor;

        requestDraw();
        // updateHeaderVisibility(); // <<< REMOVED CALL HERE

        // Check stop condition
        const zoomDiff = Math.abs(targetZoomLevel - zoomLevel);
        const transXDiff = Math.abs(targetTranslateX - boardTranslateX);
        const transYDiff = Math.abs(targetTranslateY - boardTranslateY);

        if (zoomDiff < zoomThreshold && transXDiff < 0.1 && transYDiff < 0.1) {
            // Snap to final target
            zoomLevel = targetZoomLevel;
            boardTranslateX = targetTranslateX;
            boardTranslateY = targetTranslateY;
            requestDraw();
            isAnimatingZoom = false;
            animationFrameId = null;
            // updateHeaderVisibility(); // <<< REMOVED CALL HERE (after snapping)
        } else {
            animationFrameId = requestAnimationFrame(animateZoom);
        }
    }


    // --- Spam Pattern Placement (Sends message to worker) ---
    /**
     * Calculates the target cells for the selected pattern at the last mouse position
     * and sends a message to the worker to update its state.
     */
    function placeSpamPattern() {
        if (patternCycleList.length === 0 || !worker) return;

        const patternKey = patternCycleList[currentPatternIndex];
        const patternCoords = patterns[patternKey];
        if (!patternCoords) {
             console.warn(`Spam: Pattern key "${patternKey}" not found.`);
             return;
        }

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

        if (cellsToUpdate.length > 0) {
             worker.postMessage({ type: 'setCells', cells: cellsToUpdate });
        }
    }

    // CONTINUATION OF PART 4...

    // ==============================================================
    // --- Mouse Interaction Listeners (Panning and Spamming) ---
    // ==============================================================

    // --- Mouse Wheel Listener (Zoom) ---
    container.addEventListener('wheel', (e) => {
        e.preventDefault();

        // --- Stop any existing animation frame ---
        if (isAnimatingZoom) {
             cancelAnimationFrame(animationFrameId);
             isAnimatingZoom = false; // Reset flag
        }

        // Get mouse position relative to the container
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate world coordinates under mouse
        const worldX = (mouseX - boardTranslateX) / zoomLevel;
        const worldY = (mouseY - boardTranslateY) / zoomLevel;

        // Calculate potential new target zoom level
        let potentialTargetZoom = targetZoomLevel * (e.deltaY < 0 ? zoomSensitivity : 1 / zoomSensitivity);

        // Calculate the translation that *would* keep the world point under the mouse
        let potentialTargetX = mouseX - worldX * potentialTargetZoom;
        let potentialTargetY = mouseY - worldY * potentialTargetZoom;

        // --- Clamp the entire potential view state ---
        const viewW = canvas.clientWidth;
        const viewH = canvas.clientHeight;
        const clamped = clampView(potentialTargetZoom, potentialTargetX, potentialTargetY, viewW, viewH);

        // --- ALWAYS Update the actual targets ---
        targetZoomLevel = clamped.zoom;
        targetTranslateX = clamped.x;
        targetTranslateY = clamped.y;

        // updateHeaderVisibility(); // <<< REMOVED CALL HERE

        // --- ALWAYS Start (or ensure) the animation loop is running ---
        if (!isAnimatingZoom) {
            isAnimatingZoom = true;
            animationFrameId = requestAnimationFrame(animateZoom);
        }

    }, { passive: false });


    // --- Panning & Spamming (Mouse Drag / Hold) Logic ---
    container.addEventListener('mousedown', (e) => {
        // --- Left Click: Start Panning ---
        if (e.button === 0) {
             if (isAnimatingZoom) { // Stop zoom animation
                 cancelAnimationFrame(animationFrameId);
                 isAnimatingZoom = false;
                 // Snap view to target state
                 const viewW = canvas.clientWidth; const viewH = canvas.clientHeight;
                 const clampedSnap = clampView(targetZoomLevel, targetTranslateX, targetTranslateY, viewW, viewH);
                 zoomLevel = clampedSnap.zoom; boardTranslateX = clampedSnap.x; boardTranslateY = clampedSnap.y;
                 // updateHeaderVisibility(); // <<< REMOVED CALL HERE (after snapping)
                 requestDraw();
             }
            isDragging = true;
            startX = e.clientX; startY = e.clientY;
            startTranslateX = boardTranslateX; startTranslateY = boardTranslateY;
            container.classList.add('dragging');
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            e.preventDefault();
        }
        // --- Right Click: Start Spamming ---
        else if (e.button === 2) {
            e.preventDefault();
            if (spamIntervalId) clearInterval(spamIntervalId);

            isRightClickSpamming = true;
            currentPatternIndex = (currentPatternIndex + 1) % patternCycleList.length; // Cycle first
            console.log(`Main: Right-click started. Next pattern: ${patternCycleList[currentPatternIndex]}`);

            const rect = canvas.getBoundingClientRect();
            lastSpamX = e.clientX - rect.left;
            lastSpamY = e.clientY - rect.top;

            placeSpamPattern(); // Place first one immediately

            console.log(`Main: Starting spam interval for ${patternCycleList[currentPatternIndex]}`);
            spamIntervalId = setInterval(placeSpamPattern, spamIntervalDelay);

             document.addEventListener('mousemove', onMouseMove);
             document.addEventListener('mouseup', onMouseUp);
        }
    });

    function onMouseMove(e) {
        // --- Panning Update ---
        if (isDragging) {
            e.preventDefault();
            const dx = e.clientX - startX; const dy = e.clientY - startY;
            let potentialX = startTranslateX + dx; let potentialY = startTranslateY + dy;
            const viewW = canvas.clientWidth; const viewH = canvas.clientHeight;
            const clamped = clampView(zoomLevel, potentialX, potentialY, viewW, viewH);
            boardTranslateX = clamped.x; boardTranslateY = clamped.y;
            targetTranslateX = boardTranslateX; targetTranslateY = boardTranslateY;
            // updateHeaderVisibility(); // <<< REMOVED CALL HERE
            requestDraw();
        }
        // --- Spamming Position Update ---
        else if (isRightClickSpamming) {
             const rect = canvas.getBoundingClientRect();
             lastSpamX = e.clientX - rect.left;
             lastSpamY = e.clientY - rect.top;
        }
    }

    function onMouseUp(e) {
        // --- Stop Panning ---
        if (isDragging && e.button === 0) {
            isDragging = false;
            container.classList.remove('dragging');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
             console.log("Main: Panning stopped.");
        }
        // --- Stop Spamming ---
        else if (isRightClickSpamming && e.button === 2) {
            isRightClickSpamming = false;
            if (spamIntervalId) {
                clearInterval(spamIntervalId);
                console.log("Main: Spam interval cleared:", spamIntervalId);
                spamIntervalId = null;
            }
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    }

    // Context Menu: ONLY prevent default browser behavior. Logic is in mousedown.
    container.addEventListener('contextmenu', e => {
        e.preventDefault();
    });


    // ==============================================================
    // --- Initialization and Resize Handling ---
    // ==============================================================
    function initialize() {
        // --- Create and Initialize Worker ---
        console.log("Main: Initializing Worker...");
        try {
            worker = new Worker('worker.js');

            // Handle messages received FROM the worker
            worker.onmessage = function(e) {
                // Check for the 'stateChanges' message type from sparse worker
                if (e.data && e.data.type === 'stateChanges') { // <<< LISTENING FOR CORRECT TYPE
                    if (Array.isArray(e.data.changes)) {
                         // Ensure the drawing state array exists and has correct dimensions
                         if (!Array.isArray(currentGameStateForDrawing) || currentGameStateForDrawing.length !== gridSizeY ||
                             (gridSizeY > 0 && (!Array.isArray(currentGameStateForDrawing[0]) || currentGameStateForDrawing[0].length !== gridSizeX)))
                         {
                              console.error("Main: drawing state is invalid before applying changes! Re-initializing (may cause flicker).");
                              currentGameStateForDrawing = Array(gridSizeY).fill(null).map(() => Array(gridSizeX).fill(false));
                         }
                         // Apply each change from the 'changes' array
                         e.data.changes.forEach(change => {
                             if (change && typeof change === 'object' && /*...validation...*/ change.y >= 0 && change.y < gridSizeY && change.x >= 0 && change.x < gridSizeX) {
                                 currentGameStateForDrawing[change.y][change.x] = change.alive;
                             } else { /* ... warning ... */ }
                         });
                         requestDraw();
                    } else { /* ... warning ... */ }
                } else { /* ... unknown message log ... */ }
            };

            worker.onerror = function(error) {
                 console.error('Worker Error:', error.message, error);
                 alert(`Worker Error: ${error.message}\nSimulation may stop.`);
            };

            // --- Generate Initial State locally first ---
            console.log(`Main: Preparing initial state: ${gridSizeX}x${gridSizeY}`);
            const tempInitialState = Array(gridSizeY).fill(null).map(() => Array(gridSizeX).fill(false));
            initialPattern.forEach(({ x, y }) => {
                const wrappedX = (x % gridSizeX + gridSizeX) % gridSizeX;
                const wrappedY = (y % gridSizeY + gridSizeY) % gridSizeY;
                if (wrappedY >= 0 && wrappedY < gridSizeY && wrappedX >= 0 && wrappedX < gridSizeX) {
                    tempInitialState[wrappedY][wrappedX] = true;
                }
            });
            currentGameStateForDrawing = tempInitialState;
            console.log("Main: Initial state prepared.");

            // --- Send Initial Data TO Worker ---
            console.log("Main: Sending initial data to worker...");
            worker.postMessage({
                type: 'init',
                config: { gridSizeX: gridSizeX, gridSizeY: gridSizeY, gameSpeed: gameSpeed },
                initialGameState: currentGameStateForDrawing
            });
            console.log("Main: Initial 'init' message sent.");

            // --- Initialize Viewport ---
            const viewW = container.clientWidth;
            const viewH = container.clientHeight;
            canvas.style.width = `${viewW}px`;
            canvas.style.height = `${viewH}px`;
            let initialX = (viewW - logicalGridWidth * initialZoomFactor) / 2;
            let initialY = (viewH - logicalGridHeight * initialZoomFactor) / 2;
            const clampedInitial = clampView(initialZoomFactor, initialX, initialY, viewW, viewH);
            zoomLevel = clampedInitial.zoom;
            boardTranslateX = clampedInitial.x;
            boardTranslateY = clampedInitial.y;
            targetZoomLevel = clampedInitial.zoom;
            targetTranslateX = clampedInitial.x;
            targetTranslateY = clampedInitial.y;

            // updateHeaderVisibility(); // <<< REMOVED CALL HERE

            // --- Log Initial State ---
            console.log(`Main: Grid Size: ${gridSizeX}x${gridSizeY}`);
            console.log(`Main: Canvas Initialized. Viewport: ${viewW}x${viewH}`);
            console.log(`Main: Logical Board Size: ${logicalGridWidth}x${logicalGridHeight}`);
            console.log(`Main: Clamped Initial Zoom: ${zoomLevel.toFixed(3)}`);
            console.log(`Main: Clamped Initial Translate: (${boardTranslateX.toFixed(1)}, ${boardTranslateY.toFixed(1)})`);

            // Initial draw
            requestDraw();
            // Tell worker to start simulation
            startGame();

        } catch (err) {
            console.error("Failed to initialize worker or simulation:", err);
            alert("Error initializing simulation. Check console for details.");
        }
    }

    // --- Window Resize Handling ---
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

             // updateHeaderVisibility(); // <<< REMOVED CALL HERE

             if (!isAnimatingZoom) {
                 zoomLevel = targetZoomLevel;
                 boardTranslateX = targetTranslateX;
                 boardTranslateY = targetTranslateY;
             }

             requestDraw();
        }, 250);
    });

    // --- Run Initialization ---
    initialize();

}); // End DOMContentLoaded
