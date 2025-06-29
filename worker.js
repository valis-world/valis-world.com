// worker.js - Game of Life Simulation Logic - SPARSE IMPLEMENTATIOn

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
    if (gridSizeX === 0 || gridSizeY === 0) {
         console.error("Worker: updateGameStateSparse called before grid dimensions are set.");
         stopGameLoop(); return;
    }

    const neighborCounts = new Map();
    const relevantCells = new Set();

    for (const key of liveCells) {
        const { x, y } = parseKey(key);
        relevantCells.add(key);

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;

                const nx = x + dx;
                const ny = y + dy;
                const wrappedX = (nx % gridSizeX + gridSizeX) % gridSizeX;
                const wrappedY = (ny % gridSizeY + gridSizeY) % gridSizeY;
                const neighborKey = coordKey(wrappedX, wrappedY);

                neighborCounts.set(neighborKey, (neighborCounts.get(neighborKey) || 0) + 1);
                relevantCells.add(neighborKey);
            }
        }
    }

    const nextLiveCells = new Set();
    const changes = [];

    for (const key of relevantCells) {
        const { x, y } = parseKey(key);
        const count = neighborCounts.get(key) || 0;
        const isCurrentlyAlive = liveCells.has(key);
        let willBeAlive = false;

        // Apply Game of Life rules
        if (isCurrentlyAlive && (count === 2 || count === 3)) {
            willBeAlive = true;
        } else if (!isCurrentlyAlive && count === 3) {
            willBeAlive = true;
        }

        if (willBeAlive) {
            nextLiveCells.add(key);
        }

        if (isCurrentlyAlive !== willBeAlive) {
            changes.push({ x: x, y: y, alive: willBeAlive });
        }
    }

    liveCells = nextLiveCells;
    generationCount++;

    if (changes.length > 0) {
        try {
            self.postMessage({ type: 'stateChanges', changes: changes });
        } catch (e) {
            console.error("Error posting stateChanges message:", e);
            stopGameLoop();
        }
    }
}

function startGameLoop() {
     if (!simulationRunning) {
         console.log('Worker: startGameLoop called - Starting sparse simulation loop');
         simulationRunning = true;
         generationCount = 0;
         if (intervalId) clearInterval(intervalId);
         intervalId = setInterval(updateGameStateSparse, gameSpeed);
         console.log('Worker: Interval started with ID:', intervalId, 'Speed:', gameSpeed);
     }
}
function stopGameLoop() {
     if (simulationRunning) {
         console.log('Worker: stopGameLoop called - Stopping simulation loop');
         if (intervalId) { clearInterval(intervalId); console.log('Worker: Interval cleared:', intervalId); }
         intervalId = null; simulationRunning = false;
     }
}


self.onmessage = function(e) {
    const data = e.data;
    console.log('Worker Received Message:', data?.type);

    if (!data || typeof data !== 'object') { console.error('Worker received invalid message data:', data); return; }

    switch (data.type) {
        case 'init':
            console.log('Worker: Processing init message (sparse).');
            if (!data.config || !data.initialGameState) { console.error('Worker init: Missing config or initialGameState.'); return; }

            stopGameLoop();

            gridSizeX = data.config.gridSizeX;
            gridSizeY = data.config.gridSizeY;
            gameSpeed = data.config.gameSpeed;

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
                 return;
            }

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

        case 'setCells':
             console.log('Worker: Processing setCells message (sparse).');
             if (liveCells && data.cells && Array.isArray(data.cells)) {
                 const cellsThatActuallyChanged = [];
                 data.cells.forEach(cell => {
                     if (typeof cell === 'object' && cell !== null && typeof cell.x === 'number' && typeof cell.y === 'number' && typeof cell.alive === 'boolean') {
                         if (cell.y >= 0 && cell.y < gridSizeY && cell.x >= 0 && cell.x < gridSizeX) {
                             const key = coordKey(cell.x, cell.y);
                             const currentlyAlive = liveCells.has(key);
                             let stateChanged = false;

                             if (cell.alive && !currentlyAlive) {
                                 liveCells.add(key);
                                 stateChanged = true;
                             } else if (!cell.alive && currentlyAlive) {
                                 liveCells.delete(key);
                                 stateChanged = true;
                             }

                             if (stateChanged) {
                                 cellsThatActuallyChanged.push({ x: cell.x, y: cell.y, alive: cell.alive });
                             }
                         }
                     }
                 });

                 if (cellsThatActuallyChanged.length > 0) {
                     console.log(`Worker: Sending ${cellsThatActuallyChanged.length} state changes after setCells.`);
                     try {
                        self.postMessage({ type: 'stateChanges', changes: cellsThatActuallyChanged });
                     } catch (e) {
                        console.error("Error posting stateChanges message after setCells:", e);
                        stopGameLoop();
                     }
                 }
             }
             break;

        case 'updateSpeed':
             console.log('Worker: Processing updateSpeed message.');
             if (typeof data.gameSpeed === 'number' && data.gameSpeed > 0) {
                 gameSpeed = data.gameSpeed;
                 console.log('Worker: Speed updated to', gameSpeed);
                 if (simulationRunning) {
                     console.log('Worker: Restarting loop for new speed.');
                     stopGameLoop(); startGameLoop();
                 }
             }
             break;

        default:
            console.warn('Worker received unknown message type:', data.type);
    }
};

console.log('worker.js (SPARSE) loaded and waiting for messages.');
