// Game of Life - Object-Oriented Implementation
// Demonstrates OOP concepts: Classes, Inheritance, Encapsulation, Polymorphism

document.addEventListener('DOMContentLoaded', () => {

    // ==============================================================
    // CLASS 1: Configuration Management
    // Demonstrates: Encapsulation, Static properties
    // ==============================================================
    class GameConfig {
        static TARGET_WIDTH = 8000;
        static TARGET_HEIGHT = 2800;
        static CELL_SIZE = 5;
        static GAME_SPEED = 100;
        static INITIAL_ZOOM_FACTOR = 1.0;
        static MAX_ZOOM_ALLOWED_USER = 25;
        static ZOOM_SENSITIVITY = 1.1;
        static SMOOTH_ZOOM_FACTOR = 0.35;
        static ZOOM_THRESHOLD = 0.001;
        static BACKGROUND_COLOR = '#000000';
        static CELL_COLOR = '#FFFFFF';
        static SPAM_INTERVAL_DELAY = 80;
        static HEADER_HIDE_SCROLL_THRESHOLD = 50;

        static get GRID_SIZE_X() {
            return Math.floor(this.TARGET_WIDTH / this.CELL_SIZE);
        }

        static get GRID_SIZE_Y() {
            return Math.floor(this.TARGET_HEIGHT / this.CELL_SIZE);
        }

        static get LOGICAL_GRID_WIDTH() {
            return this.GRID_SIZE_X * this.CELL_SIZE;
        }

        static get LOGICAL_GRID_HEIGHT() {
            return this.GRID_SIZE_Y * this.CELL_SIZE;
        }
    }

    // ==============================================================
    // CLASS 2: Pattern Management
    // Demonstrates: Encapsulation, Data structures
    // ==============================================================
    class PatternManager {
        constructor() {
            this.patternFilesToLoad = [
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
            ];

            this.patterns = {
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

            this.patternCycleList = ['glider', 'lwss', 'mwss', 'acorn', 'rPentomino', 'hwss', 'gosperGliderGun', 'pulsar'];
            this.currentPatternIndex = 0;
        }

        addPattern(patternCoords, offsetX, offsetY) {
            return patternCoords.map(p => ({ x: p.x + offsetX, y: p.y + offsetY }));
        }

        getCurrentPattern() {
            return this.patterns[this.patternCycleList[this.currentPatternIndex]];
        }

        cycleToNextPattern() {
            this.currentPatternIndex = (this.currentPatternIndex + 1) % this.patternCycleList.length;
        }

        getCurrentPatternName() {
            return this.patternCycleList[this.currentPatternIndex];
        }

        async loadPatternFiles() {
            let allFetchedPatterns = [];
            console.log("PatternManager: Starting to load additional patterns from JSON files...");

            const loadPromises = this.patternFilesToLoad.map(async (fileInfo) => {
                if (!fileInfo || typeof fileInfo.file !== 'string' || typeof fileInfo.offsetX !== 'number' || typeof fileInfo.offsetY !== 'number') {
                    console.warn("PatternManager: Invalid entry in patternFilesToLoad, skipping:", fileInfo);
                    return [];
                }

                try {
                    console.log(`PatternManager: Fetching additional pattern from ${fileInfo.file}...`);
                    const response = await fetch(fileInfo.file);

                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status} while fetching ${fileInfo.file}`);
                    }

                    const loadedJsonPattern = await response.json();

                    if (!Array.isArray(loadedJsonPattern)) {
                        throw new Error(`Fetched data from ${fileInfo.file} is not a valid JSON array.`);
                    }
                    console.log(`PatternManager: Successfully loaded ${loadedJsonPattern.length} cells from ${fileInfo.file}.`);

                    const offsetJsonPattern = loadedJsonPattern.map(cell => ({
                        x: cell.x + fileInfo.offsetX,
                        y: cell.y + fileInfo.offsetY
                    }));

                    return offsetJsonPattern;

                } catch (error) {
                    console.error(`PatternManager: Failed to load or process ${fileInfo.file}:`, error);
                    alert(`Error loading additional pattern from ${fileInfo.file}.\nPlease ensure the file exists and is valid JSON.\nSkipping this file.\n\nDetails: ${error.message}`);
                    return [];
                }
            });

            try {
                const results = await Promise.all(loadPromises);
                allFetchedPatterns = results.flat();
                console.log(`PatternManager: Finished loading all JSON files. Total cells loaded from JSON: ${allFetchedPatterns.length}`);
            } catch (error) {
                console.error("PatternManager: An unexpected error occurred while waiting for patterns to load:", error);
                alert("A critical error occurred while loading pattern files. Initialization may be incomplete.");
            }

            return allFetchedPatterns;
        }
    }

    // ==============================================================
    // CLASS 3: View Management (Camera/Viewport)
    // Demonstrates: Encapsulation, State management
    // ==============================================================
    class ViewManager {
        constructor(renderer = null) {
            this.zoomLevel = 1.0;
            this.boardTranslateX = 0;
            this.boardTranslateY = 0;
            this.targetZoomLevel = 1.0;
            this.targetTranslateX = 0;
            this.targetTranslateY = 0;
            this.isAnimatingZoom = false;
            this.animationFrameId = null;
            this.renderer = renderer;
        }

        clamp(value, min, max) {
            return Math.max(min, Math.min(max, value));
        }

        clampView(targetZ, targetX, targetY, viewW, viewH) {
            const maxZoom = GameConfig.MAX_ZOOM_ALLOWED_USER;
            const minZoom = Math.max(
                viewW / GameConfig.LOGICAL_GRID_WIDTH,
                viewH / GameConfig.LOGICAL_GRID_HEIGHT
            );

            const clampedZoom = this.clamp(targetZ, minZoom, maxZoom);
            const zoomedGridWidth = GameConfig.LOGICAL_GRID_WIDTH * clampedZoom;
            const zoomedGridHeight = GameConfig.LOGICAL_GRID_HEIGHT * clampedZoom;

            // Calculate bounds for translation
            let minTranslateX, maxTranslateX, minTranslateY, maxTranslateY;
            
            if (zoomedGridWidth <= viewW) {
                // Grid is smaller than viewport - center it
                minTranslateX = maxTranslateX = (viewW - zoomedGridWidth) / 2;
            } else {
                // Grid is larger than viewport - allow panning within bounds
                minTranslateX = viewW - zoomedGridWidth;
                maxTranslateX = 0;
            }
            
            if (zoomedGridHeight <= viewH) {
                // Grid is smaller than viewport - center it
                minTranslateY = maxTranslateY = (viewH - zoomedGridHeight) / 2;
            } else {
                // Grid is larger than viewport - allow panning within bounds
                minTranslateY = viewH - zoomedGridHeight;
                maxTranslateY = 0;
            }

            const clampedX = this.clamp(targetX, minTranslateX, maxTranslateX);
            const clampedY = this.clamp(targetY, minTranslateY, maxTranslateY);

            return { zoom: clampedZoom, x: clampedX, y: clampedY };
        }

        animateZoom() {
            if (!this.isAnimatingZoom) return;

            const zoomDiff = this.targetZoomLevel - this.zoomLevel;
            const translateXDiff = this.targetTranslateX - this.boardTranslateX;
            const translateYDiff = this.targetTranslateY - this.boardTranslateY;

            if (Math.abs(zoomDiff) < GameConfig.ZOOM_THRESHOLD && 
                Math.abs(translateXDiff) < GameConfig.ZOOM_THRESHOLD && 
                Math.abs(translateYDiff) < GameConfig.ZOOM_THRESHOLD) {
                this.zoomLevel = this.targetZoomLevel;
                this.boardTranslateX = this.targetTranslateX;
                this.boardTranslateY = this.targetTranslateY;
                this.isAnimatingZoom = false;
                this.animationFrameId = null;
                return;
            }

            this.zoomLevel += zoomDiff * GameConfig.SMOOTH_ZOOM_FACTOR;
            this.boardTranslateX += translateXDiff * GameConfig.SMOOTH_ZOOM_FACTOR;
            this.boardTranslateY += translateYDiff * GameConfig.SMOOTH_ZOOM_FACTOR;

            // Request redraw during animation for smooth zooming
            if (this.renderer) {
                this.renderer.requestDraw();
            }

            this.animationFrameId = requestAnimationFrame(() => this.animateZoom());
        }

        setTargetView(targetZ, targetX, targetY, viewW, viewH) {
            const clamped = this.clampView(targetZ, targetX, targetY, viewW, viewH);
            this.targetZoomLevel = clamped.zoom;
            this.targetTranslateX = clamped.x;
            this.targetTranslateY = clamped.y;

            if (!this.isAnimatingZoom) {
                this.isAnimatingZoom = true;
                this.animateZoom();
            }
        }

        getCurrentView() {
            return {
                zoom: this.zoomLevel,
                translateX: this.boardTranslateX,
                translateY: this.boardTranslateY
            };
        }
    }

    // ==============================================================
    // CLASS 4: Renderer (Drawing)
    // Demonstrates: Encapsulation, Single Responsibility
    // ==============================================================
    class Renderer {
        constructor(canvas, viewManager = null) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.viewManager = viewManager;
            this.drawPending = false;
            this.currentGameStateForDrawing = [];
        }

        setViewManager(viewManager) {
            this.viewManager = viewManager;
        }

        requestDraw() {
            if (!this.drawPending) {
                this.drawPending = true;
                requestAnimationFrame(() => this.drawBoard());
            }
        }

        updateGameState(newState) {
            this.currentGameStateForDrawing = newState;
        }

        drawBoard() {
            this.drawPending = false;

            const dpr = window.devicePixelRatio || 1;
            const rect = this.canvas.getBoundingClientRect();
            const requiredWidth = Math.round(rect.width * dpr);
            const requiredHeight = Math.round(rect.height * dpr);
            
            if (this.canvas.width !== requiredWidth || this.canvas.height !== requiredHeight) {
                this.canvas.width = requiredWidth;
                this.canvas.height = requiredHeight;
                this.ctx.scale(dpr, dpr);
            }

            const viewWidth = this.canvas.clientWidth;
            const viewHeight = this.canvas.clientHeight;
            const currentView = this.viewManager.getCurrentView();
            
            const topLeftWorldX = (0 - currentView.translateX) / currentView.zoom;
            const topLeftWorldY = (0 - currentView.translateY) / currentView.zoom;
            const bottomRightWorldX = (viewWidth - currentView.translateX) / currentView.zoom;
            const bottomRightWorldY = (viewHeight - currentView.translateY) / currentView.zoom;

            const startX = Math.max(0, Math.floor(topLeftWorldX / GameConfig.CELL_SIZE) - 1);
            const startY = Math.max(0, Math.floor(topLeftWorldY / GameConfig.CELL_SIZE) - 1);
            const endX = Math.min(GameConfig.GRID_SIZE_X, Math.ceil(bottomRightWorldX / GameConfig.CELL_SIZE) + 1);
            const endY = Math.min(GameConfig.GRID_SIZE_Y, Math.ceil(bottomRightWorldY / GameConfig.CELL_SIZE) + 1);

            this.ctx.fillStyle = GameConfig.BACKGROUND_COLOR;
            this.ctx.fillRect(0, 0, viewWidth, viewHeight);

            this.ctx.save();
            this.ctx.translate(currentView.translateX, currentView.translateY);
            this.ctx.scale(currentView.zoom, currentView.zoom);

            this.ctx.fillStyle = GameConfig.CELL_COLOR;
            const stateToDraw = this.currentGameStateForDrawing;
            
            if (!Array.isArray(stateToDraw) || stateToDraw.length !== GameConfig.GRID_SIZE_Y) {
                this.ctx.restore();
                return;
            }

            for (let y = startY; y < endY; y++) {
                if (y < 0 || y >= GameConfig.GRID_SIZE_Y) continue;
                const row = stateToDraw[y];
                if (!Array.isArray(row) || row.length !== GameConfig.GRID_SIZE_X) {
                    continue;
                }

                for (let x = startX; x < endX; x++) {
                    if (x < 0 || x >= GameConfig.GRID_SIZE_X) continue;

                    if (row[x] === true) {
                        this.ctx.fillRect(
                            x * GameConfig.CELL_SIZE,
                            y * GameConfig.CELL_SIZE,
                            GameConfig.CELL_SIZE,
                            GameConfig.CELL_SIZE
                        );
                    }
                }
            }

            this.ctx.restore();
        }
    }

    // ==============================================================
    // CLASS 5: Input Handler
    // Demonstrates: Event handling, State management
    // ==============================================================
    class InputHandler {
        constructor(renderer, viewManager, patternManager, gameController) {
            this.renderer = renderer;
            this.viewManager = viewManager;
            this.patternManager = patternManager;
            this.gameController = gameController;
            
            this.isDragging = false;
            this.startX = 0;
            this.startY = 0;
            this.startTranslateX = 0;
            this.startTranslateY = 0;
            this.isRightClickSpamming = false;
            this.spamIntervalId = null;
            this.lastSpamX = 0;
            this.lastSpamY = 0;
            this.isRightClickDown = false;
            this.rightClickStartX = 0;
            this.rightClickStartY = 0;
            this.rightClickMoved = false;

            this.setupEventListeners();
        }

        setupEventListeners() {
            // Canvas events
            this.renderer.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
            this.renderer.canvas.addEventListener('wheel', (e) => this.onWheel(e));
            this.renderer.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
            
            // Document events for mouse movement and release (to handle when mouse leaves canvas)
            document.addEventListener('mousemove', (e) => this.onMouseMove(e));
            document.addEventListener('mouseup', (e) => this.onMouseUp(e));
            
            // Keyboard events for pattern cycling
            document.addEventListener('keydown', (e) => this.onKeyDown(e));
        }

        onMouseDown(e) {
            const rect = this.renderer.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (e.button === 0) { // Left click - drag
                this.isDragging = true;
                this.startX = mouseX;
                this.startY = mouseY;
                const currentView = this.viewManager.getCurrentView();
                this.startTranslateX = currentView.translateX;
                this.startTranslateY = currentView.translateY;
            } else if (e.button === 2) { // Right click - place pattern
                this.isRightClickDown = true;
                this.rightClickStartX = mouseX;
                this.rightClickStartY = mouseY;
                this.rightClickMoved = false;
                // Do not place pattern here; wait for mouseup
            }
        }

        onMouseMove(e) {
            const rect = this.renderer.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (this.isDragging) {
                const deltaX = mouseX - this.startX;
                const deltaY = mouseY - this.startY;
                const currentView = this.viewManager.getCurrentView();
                
                this.viewManager.setTargetView(
                    currentView.zoom,
                    this.startTranslateX + deltaX,
                    this.startTranslateY + deltaY,
                    this.renderer.canvas.clientWidth,
                    this.renderer.canvas.clientHeight
                );
            }

            if (this.isRightClickDown) {
                // Check if right click has moved significantly (more than 5 pixels)
                const moveDistance = Math.sqrt(
                    Math.pow(mouseX - this.rightClickStartX, 2) + 
                    Math.pow(mouseY - this.rightClickStartY, 2)
                );
                
                if (moveDistance > 5) {
                    this.rightClickMoved = true;
                    // Start spam mode if we haven't already
                    if (!this.isRightClickSpamming) {
                        this.startSpamMode(mouseX, mouseY);
                    }
                }
                
                if (this.isRightClickSpamming) {
                    this.lastSpamX = mouseX;
                    this.lastSpamY = mouseY;
                }
            }
        }

        onMouseUp(e) {
            if (e.button === 0) { // Left click
                this.isDragging = false;
            } else if (e.button === 2) { // Right click
                if (this.isRightClickDown) {
                    if (!this.rightClickMoved) {
                        // Single click - place pattern once
                        const rect = this.renderer.canvas.getBoundingClientRect();
                        const mouseX = e.clientX - rect.left;
                        const mouseY = e.clientY - rect.top;
                        this.placeSpamPattern(mouseX, mouseY);
                    } else {
                        // Was dragging - stop spam mode
                        this.stopSpamMode();
                    }
                    this.isRightClickDown = false;
                }
            }
        }

        onWheel(e) {
            e.preventDefault();
            const rect = this.renderer.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const currentView = this.viewManager.getCurrentView();
            const zoomFactor = e.deltaY > 0 ? 1 / GameConfig.ZOOM_SENSITIVITY : GameConfig.ZOOM_SENSITIVITY;
            const newZoom = currentView.zoom * zoomFactor;

            // Calculate the point in world coordinates that the mouse is pointing at
            const worldX = (mouseX - currentView.translateX) / currentView.zoom;
            const worldY = (mouseY - currentView.translateY) / currentView.zoom;

            // Calculate new translation so that the same world point stays under the mouse
            const newTranslateX = mouseX - worldX * newZoom;
            const newTranslateY = mouseY - worldY * newZoom;

            this.viewManager.setTargetView(
                newZoom,
                newTranslateX,
                newTranslateY,
                this.renderer.canvas.clientWidth,
                this.renderer.canvas.clientHeight
            );
        }

        onKeyDown(e) {
            // Space bar to cycle patterns
            if (e.code === 'Space') {
                e.preventDefault();
                console.log(`Before cycling: ${this.patternManager.getCurrentPatternName()}`);
                this.cyclePattern();
                this.updatePatternIndicator();
                console.log(`After cycling: ${this.patternManager.getCurrentPatternName()}`);
            }
        }

        updatePatternIndicator() {
            const patternNameElement = document.getElementById('current-pattern-name');
            if (patternNameElement) {
                patternNameElement.textContent = this.patternManager.getCurrentPatternName();
            }
        }

        placeSpamPattern(mouseX, mouseY) {
            const currentView = this.viewManager.getCurrentView();
            const worldX = (mouseX - currentView.translateX) / currentView.zoom;
            const worldY = (mouseY - currentView.translateY) / currentView.zoom;

            const gridX = Math.floor(worldX / GameConfig.CELL_SIZE);
            const gridY = Math.floor(worldY / GameConfig.CELL_SIZE);

            const pattern = this.patternManager.getCurrentPattern();
            const patternName = this.patternManager.getCurrentPatternName();
            
            console.log(`Placing pattern: ${patternName} at grid (${gridX}, ${gridY}), pattern cells: ${pattern ? pattern.length : 0}`);
            
            if (!pattern) return;

            const cellsToSet = pattern.map(p => ({
                x: (gridX + p.x + GameConfig.GRID_SIZE_X) % GameConfig.GRID_SIZE_X,
                y: (gridY + p.y + GameConfig.GRID_SIZE_Y) % GameConfig.GRID_SIZE_Y,
                alive: true
            }));

            this.gameController.setCells(cellsToSet);
        }

        startSpamMode(mouseX, mouseY) {
            this.isRightClickSpamming = true;
            this.lastSpamX = mouseX;
            this.lastSpamY = mouseY;
            this.spamIntervalId = setInterval(() => {
                this.placeSpamPattern(this.lastSpamX, this.lastSpamY);
            }, GameConfig.SPAM_INTERVAL_DELAY);
        }

        stopSpamMode() {
            this.isRightClickSpamming = false;
            if (this.spamIntervalId) {
                clearInterval(this.spamIntervalId);
                this.spamIntervalId = null;
            }
        }

        cyclePattern() {
            this.patternManager.cycleToNextPattern();
        }
    }

    // ==============================================================
    // CLASS 6: Game Controller (Main Orchestrator)
    // Demonstrates: Composition, Facade pattern
    // ==============================================================
    class GameController {
        constructor() {
            this.worker = null;
            this.patternManager = new PatternManager();
            this.viewManager = new ViewManager();
            this.renderer = null;
            this.inputHandler = null;
            this.headerManager = null;
        }

        async initialize() {
            console.log("GameController: Initializing...");

            // Initialize DOM elements
            const container = document.getElementById('container');
            const canvas = document.getElementById('board-canvas');
            const headerBar = document.getElementById('header-bar');

            if (!container || !canvas || !headerBar) {
                throw new Error("Required DOM elements not found");
            }

            // Initialize components
            this.renderer = new Renderer(canvas);
            this.viewManager = new ViewManager(this.renderer);
            this.renderer.setViewManager(this.viewManager);
            this.inputHandler = new InputHandler(this.renderer, this.viewManager, this.patternManager, this);
            this.headerManager = new HeaderManager(headerBar);

            // Initialize pattern indicator
            this.inputHandler.updatePatternIndicator();

            // Load patterns
            const allFetchedPatterns = await this.patternManager.loadPatternFiles();
            
            // Create initial pattern
            const initialPattern = [
                ...this.patternManager.addPattern(this.patternManager.patterns.gosperGliderGun, 1400, 200)
            ];
            const combinedInitialPattern = initialPattern.concat(allFetchedPatterns);

            // Initialize worker
            await this.initializeWorker(combinedInitialPattern);

            // Initialize viewport
            this.initializeViewport(container, canvas);

            // Start the game
            this.startGame();
        }

        async initializeWorker(combinedInitialPattern) {
            console.log("GameController: Initializing Worker...");
            
            this.worker = new Worker('worker.js');

            this.worker.onmessage = (e) => {
                if (!e || !e.data) {
                    console.warn("GameController received empty/invalid message from worker.");
                    return;
                }

                if (e.data.type === 'stateChanges') {
                    if (!Array.isArray(e.data.changes)) {
                        console.warn("stateChanges received, but 'changes' is not an array:", e.data.changes);
                        return;
                    }

                    e.data.changes.forEach(change => {
                        if (change && typeof change === 'object' &&
                            Number.isInteger(change.y) && change.y >= 0 && change.y < GameConfig.GRID_SIZE_Y &&
                            Number.isInteger(change.x) && change.x >= 0 && change.x < GameConfig.GRID_SIZE_X &&
                            typeof change.alive === 'boolean') {
                            
                            if (this.renderer.currentGameStateForDrawing[change.y]) {
                                this.renderer.currentGameStateForDrawing[change.y][change.x] = change.alive;
                            }
                        }
                    });
                    
                    this.renderer.requestDraw();
                }
            };

            this.worker.onerror = (error) => {
                console.error('Worker Error:', error.message, error);
                alert(`Worker Error: ${error.message}\nSimulation may stop.`);
                this.stopGame();
            };

            // Prepare initial state
            const tempInitialState = Array(GameConfig.GRID_SIZE_Y).fill(null).map(() => Array(GameConfig.GRID_SIZE_X).fill(false));

            combinedInitialPattern.forEach(({ x, y }) => {
                const wrappedX = (x % GameConfig.GRID_SIZE_X + GameConfig.GRID_SIZE_X) % GameConfig.GRID_SIZE_X;
                const wrappedY = (y % GameConfig.GRID_SIZE_Y + GameConfig.GRID_SIZE_Y) % GameConfig.GRID_SIZE_Y;
                
                if (wrappedY >= 0 && wrappedY < GameConfig.GRID_SIZE_Y && wrappedX >= 0 && wrappedX < GameConfig.GRID_SIZE_X) {
                    if (tempInitialState[wrappedY]) {
                        tempInitialState[wrappedY][wrappedX] = true;
                    }
                }
            });

            this.renderer.updateGameState(tempInitialState);

            // Send initial configuration to worker
            this.worker.postMessage({
                type: 'init',
                config: { 
                    gridSizeX: GameConfig.GRID_SIZE_X, 
                    gridSizeY: GameConfig.GRID_SIZE_Y, 
                    gameSpeed: GameConfig.GAME_SPEED 
                },
                initialGameState: tempInitialState
            });
        }

        initializeViewport(container, canvas) {
            const viewW = container.clientWidth;
            const viewH = container.clientHeight;
            
            canvas.style.width = `${viewW}px`;
            canvas.style.height = `${viewH}px`;
            
            let initialX = (viewW - GameConfig.LOGICAL_GRID_WIDTH * GameConfig.INITIAL_ZOOM_FACTOR) / 2;
            let initialY = (viewH - GameConfig.LOGICAL_GRID_HEIGHT * GameConfig.INITIAL_ZOOM_FACTOR) / 2;
            
            const clampedInitial = this.viewManager.clampView(
                GameConfig.INITIAL_ZOOM_FACTOR, 
                initialX, 
                initialY, 
                viewW, 
                viewH
            );
            
            this.viewManager.zoomLevel = clampedInitial.zoom;
            this.viewManager.boardTranslateX = clampedInitial.x;
            this.viewManager.boardTranslateY = clampedInitial.y;
            this.viewManager.targetZoomLevel = clampedInitial.zoom;
            this.viewManager.targetTranslateX = clampedInitial.x;
            this.viewManager.targetTranslateY = clampedInitial.y;

            console.log(`GameController: Grid Size: ${GameConfig.GRID_SIZE_X}x${GameConfig.GRID_SIZE_Y}`);
            console.log(`GameController: Canvas Initialized. Viewport: ${viewW}x${viewH}`);
            console.log(`GameController: Logical Board Size: ${GameConfig.LOGICAL_GRID_WIDTH}x${GameConfig.LOGICAL_GRID_HEIGHT}`);

            this.renderer.requestDraw();
        }

        startGame() {
            if (this.worker) {
                console.log('GameController: Telling worker to start');
                this.worker.postMessage({ type: 'start' });
            }
        }

        stopGame() {
            if (this.worker) {
                console.log('GameController: Telling worker to stop');
                this.worker.postMessage({ type: 'stop' });
            }
        }

        setCells(cells) {
            if (this.worker && cells && Array.isArray(cells)) {
                this.worker.postMessage({ type: 'setCells', cells: cells });
            }
        }

        handleResize() {
            const container = document.getElementById('container');
            const canvas = document.getElementById('board-canvas');
            
            if (!container || !canvas) return;

            const viewW = container.clientWidth;
            const viewH = container.clientHeight;
            
            canvas.style.width = `${viewW}px`;
            canvas.style.height = `${viewH}px`;
            
            const currentView = this.viewManager.getCurrentView();
            const clampedCurrent = this.viewManager.clampView(
                this.viewManager.targetZoomLevel, 
                this.viewManager.targetTranslateX, 
                this.viewManager.targetTranslateY, 
                viewW, 
                viewH
            );
            
            this.viewManager.targetZoomLevel = clampedCurrent.zoom;
            this.viewManager.targetTranslateX = clampedCurrent.x;
            this.viewManager.targetTranslateY = clampedCurrent.y;
            
            if (!this.viewManager.isAnimatingZoom) {
                this.viewManager.zoomLevel = this.viewManager.targetZoomLevel;
                this.viewManager.boardTranslateX = this.viewManager.targetTranslateX;
                this.viewManager.boardTranslateY = this.viewManager.targetTranslateY;
            }
            
            this.renderer.requestDraw();
        }
    }

    // ==============================================================
    // CLASS 7: Header Manager
    // Demonstrates: UI state management
    // ==============================================================
    class HeaderManager {
        constructor(headerBar) {
            this.headerBar = headerBar;
            this.lastScrollTop = 0;
            this.setupScrollListener();
        }

        setupScrollListener() {
            window.addEventListener('scroll', () => this.updateHeaderVisibility(), false);
        }

        updateHeaderVisibility() {
            if (!this.headerBar) return;

            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            if (scrollTop > this.lastScrollTop && scrollTop > GameConfig.HEADER_HIDE_SCROLL_THRESHOLD) {
                if (!this.headerBar.classList.contains('header-hidden')) {
                    this.headerBar.classList.add('header-hidden');
                }
            } else if (scrollTop < this.lastScrollTop || scrollTop <= GameConfig.HEADER_HIDE_SCROLL_THRESHOLD) {
                if (this.headerBar.classList.contains('header-hidden')) {
                    this.headerBar.classList.remove('header-hidden');
                }
            }
            
            this.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        }
    }

    // ==============================================================
    // APPLICATION INITIALIZATION
    // ==============================================================
    const gameController = new GameController();

    // Setup resize handler
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log("Window resized, adjusting canvas and clamping view.");
            gameController.handleResize();
        }, 150);
    });

    // Initialize the application
    gameController.initialize().catch(error => {
        console.error("Failed to initialize game:", error);
        alert("Error initializing simulation. Check console for details.");
    });

}); // End DOMContentLoaded wrapper
