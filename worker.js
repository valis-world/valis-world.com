// worker.js - Game of Life Simulation Logic - SPARSE IMPLEMENTATION

// Use a Set to store live cell coordinates as strings "x,y"
let liveCells = new Set();
let gridSizeX = 0;
let gridSizeY = 0;
let simulationRunning = false;
let intervalId = null;
let gameSpeed = 100;
let generationCount = 0;

// Helper to generate coordinate string key
function coordKey(x, y) {
    return `${x},${y}`;
}

// Helper to parse coordinate string key
function parseKey(key) {
    const parts = key.split(',');
    return { x: parseInt(parts[0], 10), y: parseInt(parts[1], 10) };
}

// --- Core Game Logic (Sparse Approach) ---

function updateGameStateSparse() {
    // console.log(`Worker: updateGameStateSparse called (Gen: ${generationCount})`);
    if (gridSizeX === 0 || gridSizeY === 0) {
         console.error("Worker: updateGameStateSparse called before grid dimensions are set.");
         stopGameLoop(); return;
    }

    const neighborCounts = new Map(); // Map<string, number> storing "x,y" -> count
    const relevantCells = new Set();  // Set<string> of cells that might change (live cells + their neighbors)

    // 1. Iterate through LIVE cells to populate neighbor counts and relevant cells
    for (const key of liveCells) {
        const { x, y } = parseKey(key);
        relevantCells.add(key); // The live cell itself is relevant

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue; // Skip self

                const nx = x + dx;
                const ny = y + dy;
                // Wrap coordinates
                const wrappedX = (nx % gridSizeX + gridSizeX) % gridSizeX;
                const wrappedY = (ny % gridSizeY + gridSizeY) % gridSizeY;
                const neighborKey = coordKey(wrappedX, wrappedY);

                // Increment neighbor count for this neighbor
                neighborCounts.set(neighborKey, (neighborCounts.get(neighborKey) || 0) + 1);
                // Mark this neighbor as relevant for the next step's check
                relevantCells.add(neighborKey);
            }
        }
    }

    const nextLiveCells = new Set(); // Holds live cells for the *next* generation
    const changes = []; // Array for {x, y, alive} changes to send back

    // 2. Iterate through RELEVANT cells (live cells and their neighbors)
    for (const key of relevantCells) {
        const { x, y } = parseKey(key);
        const count = neighborCounts.get(key) || 0; // Get neighbor count (0 if not in map)
        const isCurrentlyAlive = liveCells.has(key);
        let willBeAlive = false;

        // Apply Game of Life rules
        if (isCurrentlyAlive && (count === 2 || count === 3)) {
            willBeAlive = true; // Survives
        } else if (!isCurrentlyAlive && count === 3) {
            willBeAlive = true; // Born
        }
        // else: Dies or stays dead (willBeAlive remains false)

        // 3. Determine next state and record changes
        if (willBeAlive) {
            nextLiveCells.add(key); // Add to next generation's live set
        }

        // Record change *only if* the state is different from the current state
        if (isCurrentlyAlive !== willBeAlive) {
            changes.push({ x: x, y: y, alive: willBeAlive });
        }
    }

    // 4. Update the worker's state
    liveCells = nextLiveCells;
    generationCount++;

    // 5. Send changes back to the main thread
    if (changes.length > 0) {
        // console.log(`Worker sending state changes (Gen: ${generationCount}), Count: ${changes.length}`);
        try {
            self.postMessage({ type: 'stateChanges', changes: changes });
        } catch (e) {
            console.error("Error posting stateChanges message:", e);
            stopGameLoop();
        }
    } else {
        // console.log(`Worker: No changes in Gen: ${generationCount}`);
    }
}

// --- Simulation Loop Control (Unchanged) ---
function startGameLoop() {
     if (!simulationRunning) {
         console.log('Worker: startGameLoop called - Starting sparse simulation loop');
         simulationRunning = true;
         generationCount = 0;
         if (intervalId) clearInterval(intervalId);
         intervalId = setInterval(updateGameStateSparse, gameSpeed); // Use sparse update function
         console.log('Worker: Interval started with ID:', intervalId, 'Speed:', gameSpeed);
     } else { /* Already running */ }
}
function stopGameLoop() {
     if (simulationRunning) {
         console.log('Worker: stopGameLoop called - Stopping simulation loop');
         if (intervalId) { clearInterval(intervalId); console.log('Worker: Interval cleared:', intervalId); }
         intervalId = null; simulationRunning = false;
     }
}


// --- Worker Message Handler ---
self.onmessage = function(e) {
    const data = e.data;
    console.log('Worker Received Message:', data?.type);

    if (!data || typeof data !== 'object') { console.error('Worker received invalid message data:', data); return; }

    switch (data.type) {
        case 'init':
            console.log('Worker: Processing init message (sparse).');
            if (!data.config || !data.initialGameState) { console.error('Worker init: Missing config or initialGameState.'); return; }

            // Stop any previous simulation just in case
            stopGameLoop();

            gridSizeX = data.config.gridSizeX;
            gridSizeY = data.config.gridSizeY;
            gameSpeed = data.config.gameSpeed;

            // --- Convert received 2D array state to Set representation ---
            liveCells = new Set();
            const initialGameStateArray = data.initialGameState;
            if (Array.isArray(initialGameStateArray)) {
                for (let y = 0; y < initialGameStateArray.length; y++) {
                    if (Array.isArray(initialGameStateArray[y])) {
                         for (let x = 0; x < initialGameStateArray[y].length; x++) {
                             if (initialGameStateArray[y][x] === true) {
                                 liveCells.add(coordKey(x, y));
                             }
                         }
                    }
                }
            } else {
                 console.error("Worker init: initialGameState was not an array!");
                 // Handle error - perhaps request state again or stop
                 return;
            }
            // --- End Conversion ---

            console.log(`Worker Initialized: ${gridSizeX}x${gridSizeY}, Speed: ${gameSpeed}, Initial Live Cells: ${liveCells.size}`);
            break;

        case 'start':
             console.log('Worker: Processing start message.');
             startGameLoop();
             break;

        case 'stop':
             console.log('Worker: Processing stop message.');
             stopGameLoop();
             break;

        case 'setCells': // Handle manual cell changes from main thread
             console.log('Worker: Processing setCells message (sparse).');
             if (liveCells && data.cells && Array.isArray(data.cells)) {
                 const cellsThatActuallyChanged = []; // Track changes *caused* by this message
                 data.cells.forEach(cell => {
                     if (typeof cell === 'object' && cell !== null && typeof cell.x === 'number' && typeof cell.y === 'number' && typeof cell.alive === 'boolean') {
                         if (cell.y >= 0 && cell.y < gridSizeY && cell.x >= 0 && cell.x < gridSizeX) {
                             const key = coordKey(cell.x, cell.y);
                             const currentlyAlive = liveCells.has(key);
                             let stateChanged = false;

                             if (cell.alive && !currentlyAlive) { // Make alive
                                 liveCells.add(key);
                                 stateChanged = true;
                             } else if (!cell.alive && currentlyAlive) { // Make dead
                                 liveCells.delete(key);
                                 stateChanged = true;
                             }

                             if (stateChanged) {
                                 // Add this change to the list to send back for immediate draw update
                                 cellsThatActuallyChanged.push({ x: cell.x, y: cell.y, alive: cell.alive });
                             }
                         } else { /* Out of bounds log */ }
                     } else { /* Invalid structure log */ }
                 });

                 // Send back ONLY the changes made by this specific "setCells" call
                 if (cellsThatActuallyChanged.length > 0) {
                     console.log(`Worker: Sending ${cellsThatActuallyChanged.length} state changes after setCells.`);
                     try {
                        self.postMessage({ type: 'stateChanges', changes: cellsThatActuallyChanged });
                     } catch (e) {
                        console.error("Error posting stateChanges message after setCells:", e);
                        stopGameLoop();
                     }
                 }
             } else { /* Invalid data log */ }
             break;

        case 'updateSpeed':
             // (No change needed from previous version)
             console.log('Worker: Processing updateSpeed message.');
             if (typeof data.gameSpeed === 'number' && data.gameSpeed > 0) {
                 gameSpeed = data.gameSpeed;
                 console.log('Worker: Speed updated to', gameSpeed);
                 if (simulationRunning) {
                     console.log('Worker: Restarting loop for new speed.');
                     stopGameLoop(); startGameLoop();
                 }
             } else { /* Invalid value log */ }
             break;

        default:
            console.warn('Worker received unknown message type:', data.type);
    }
};

console.log('worker.js (SPARSE) loaded and waiting for messages.');