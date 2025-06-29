// Game of Life - Object-Oriented Implementation
// Demonstrates OOP concepts: Classes, Inheritance, Encapsulation, Polymorphism

document.addEventListener('DOMContentLoaded', () => {

    // ==============================================================
    // CLASS 1: Configuration Management
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
    // ==============================================================
    class PatternManager {
        constructor() {
            this.patternFilesToLoad = [
                { file: 'patterns/glider-oszilator_pattern.json', offsetX: 650, offsetY: 130 },
                { file: 'patterns/shuttle_pattern.json', offsetX: 705, offsetY: 185 },
                { file: 'patterns/shuttle_pattern.json', offsetX: 780, offsetY: 185 },
                { file: 'patterns/shuttle_pattern.json', offsetX: 855, offsetY: 185 },
                { file: 'patterns/shuttle_pattern.json', offsetX: 710, offsetY: 260 },
                { file: 'patterns/shuttle_pattern.json', offsetX: 785, offsetY: 260 },
                { file: 'patterns/shuttle_pattern.json', offsetX: 860, offsetY: 260 },
                { file: 'patterns/big-ship_pattern.json', offsetX: 100, offsetY: 300 },
                { file: 'patterns/big-ship_pattern.json', offsetX: 1300, offsetY: 100 },
                { file: 'patterns/wide-ship_pattern.json', offsetX: 50, offsetY: 30 }
            ];

            this.patterns = {
                glider: [{ x: 1, y: 0 }, { x: 2, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
                lwss: [{ x: 1, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 4, y: 2 }, { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }],
                pulsar: [{ x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 8, y: 0 }, { x: 9, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 2 }, { x: 5, y: 2 }, { x: 7, y: 2 }, { x: 12, y: 2 }, { x: 0, y: 3 }, { x: 5, y: 3 }, { x: 7, y: 3 }, { x: 12, y: 3 }, { x: 0, y: 4 }, { x: 5, y: 4 }, { x: 7, y: 4 }, { x: 12, y: 4 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 8, y: 5 }, { x: 9, y: 5 }, { x: 10, y: 5 }, { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 8, y: 7 }, { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 0, y: 8 }, { x: 5, y: 8 }, { x: 7, y: 8 }, { x: 12, y: 8 }, { x: 0, y: 9 }, { x: 5, y: 9 }, { x: 7, y: 9 }, { x: 12, y: 9 }, { x: 0, y: 10 }, { x: 5, y: 10 }, { x: 7, y: 10 }, { x: 12, y: 10 }, { x: 2, y: 12 }, { x: 3, y: 12 }, { x: 4, y: 12 }, { x: 8, y: 12 }, { x: 9, y: 12 }, { x: 10, y: 12 }],
                gosperGliderGun: [{ x: 24, y: 0 }, { x: 22, y: 1 }, { x: 24, y: 1 }, { x: 12, y: 2 }, { x: 13, y: 2 }, { x: 20, y: 2 }, { x: 21, y: 2 }, { x: 34, y: 2 }, { x: 35, y: 2 }, { x: 11, y: 3 }, { x: 15, y: 3 }, { x: 20, y: 3 }, { x: 21, y: 3 }, { x: 34, y: 3 }, { x: 35, y: 3 }, { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 10, y: 4 }, { x: 16, y: 4 }, { x: 20, y: 4 }, { x: 21, y: 4 }, { x: 0, y: 5 }, { x: 1, y: 5 }, { x: 10, y: 5 }, { x: 14, y: 5 }, { x: 16, y: 5 }, { x: 17, y: 5 }, { x: 22, y: 5 }, { x: 24, y: 5 }, { x: 10, y: 6 }, { x: 16, y: 6 }, { x: 24, y: 6 }, { x: 11, y: 7 }, { x: 15, y: 7 }, { x: 12, y: 8 }, { x: 13, y: 8 }],
                rPentomino: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
                acorn: [{ x: 1, y: 0 }, { x: 3, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }]
            };
            this.patternCycleList = ['glider', 'lwss', 'pulsar', 'gosperGliderGun', 'rPentomino', 'acorn'];
            this.currentPatternIndex = 0;
        }

        addPattern(coords, offsetX, offsetY) {
            return coords.map(p => ({ x: p.x + offsetX, y: p.y + offsetY }));
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
            const promises = this.patternFilesToLoad.map(async (fileInfo) => {
                try {
                    const response = await fetch(fileInfo.file);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    const data = await response.json();
                    return data.map(cell => ({ x: cell.x + fileInfo.offsetX, y: cell.y + fileInfo.offsetY }));
                } catch (error) {
                    console.error(`Failed to load ${fileInfo.file}:`, error);
                    return [];
                }
            });

            try {
                const allPatterns = await Promise.all(promises);
                return allPatterns.flat();
            } catch (error) {
                console.error("Error loading patterns:", error);
                return [];
            }
        }
    }

    // ==============================================================
    // CLASS 3: View Management
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
            this.renderer = renderer;
        }

        clamp(value, min, max) {
            return Math.max(min, Math.min(max, value));
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

        clampView(targetZ, targetX, targetY, viewW, viewH) {
            const maxZoom = GameConfig.MAX_ZOOM_ALLOWED_USER;
            const minZoom = Math.max(viewW / GameConfig.LOGICAL_GRID_WIDTH, viewH / GameConfig.LOGICAL_GRID_HEIGHT);
            const clampedZoom = this.clamp(targetZ, minZoom, maxZoom);
            const zoomedGridWidth = GameConfig.LOGICAL_GRID_WIDTH * clampedZoom;
            const zoomedGridHeight = GameConfig.LOGICAL_GRID_HEIGHT * clampedZoom;
            let minTranslateX, maxTranslateX, minTranslateY, maxTranslateY;

            if (zoomedGridWidth <= viewW) {
                minTranslateX = maxTranslateX = (viewW - zoomedGridWidth) / 2;
            } else {
                minTranslateX = viewW - zoomedGridWidth;
                maxTranslateX = 0;
            }

            if (zoomedGridHeight <= viewH) {
                minTranslateY = maxTranslateY = (viewH - zoomedGridHeight) / 2;
            } else {
                minTranslateY = viewH - zoomedGridHeight;
                maxTranslateY = 0;
            }

            return {
                zoom: clampedZoom,
                x: this.clamp(targetX, minTranslateX, maxTranslateX),
                y: this.clamp(targetY, minTranslateY, maxTranslateY)
            };
        }

        animateZoom() {
            if (!this.isAnimatingZoom) {
                return;
            }

            const zoomDiff = this.targetZoomLevel - this.zoomLevel;
            const translateXDiff = this.targetTranslateX - this.boardTranslateX;
            const translateYDiff = this.targetTranslateY - this.boardTranslateY;

            const isFinished = Math.abs(zoomDiff) < GameConfig.ZOOM_THRESHOLD &&
                Math.abs(translateXDiff) < GameConfig.ZOOM_THRESHOLD &&
                Math.abs(translateYDiff) < GameConfig.ZOOM_THRESHOLD;

            if (isFinished) {
                this.zoomLevel = this.targetZoomLevel;
                this.boardTranslateX = this.targetTranslateX;
                this.boardTranslateY = this.targetTranslateY;
                this.isAnimatingZoom = false;
                return;
            }

            this.zoomLevel += zoomDiff * GameConfig.SMOOTH_ZOOM_FACTOR;
            this.boardTranslateX += translateXDiff * GameConfig.SMOOTH_ZOOM_FACTOR;
            this.boardTranslateY += translateYDiff * GameConfig.SMOOTH_ZOOM_FACTOR;

            if (this.renderer) {
                this.renderer.requestDraw();
            }

            requestAnimationFrame(() => this.animateZoom());
        }
    }

    // ==============================================================
    // BASE CLASS 4: BaseRenderer
    // ==============================================================
    class BaseRenderer {
        constructor(canvas, viewManager = null) {
            if (this.constructor === BaseRenderer) {
                throw new Error("BaseRenderer is an abstract class and cannot be instantiated directly.");
            }

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

        drawCells() {
            throw new Error("Subclass must implement 'drawCells()'.");
        }

        drawBoard() {
            this.drawPending = false;

            const dpr = window.devicePixelRatio || 1;
            const rect = this.canvas.getBoundingClientRect();

            if (this.canvas.width !== Math.round(rect.width * dpr) || this.canvas.height !== Math.round(rect.height * dpr)) {
                this.canvas.width = Math.round(rect.width * dpr);
                this.canvas.height = Math.round(rect.height * dpr);
                this.ctx.scale(dpr, dpr);
            }

            const viewWidth = this.canvas.clientWidth;
            const viewHeight = this.canvas.clientHeight;
            const currentView = this.viewManager.getCurrentView();

            const startX = Math.max(0, Math.floor(((0 - currentView.translateX) / currentView.zoom) / GameConfig.CELL_SIZE) - 1);
            const startY = Math.max(0, Math.floor(((0 - currentView.translateY) / currentView.zoom) / GameConfig.CELL_SIZE) - 1);
            const endX = Math.min(GameConfig.GRID_SIZE_X, Math.ceil(((viewWidth - currentView.translateX) / currentView.zoom) / GameConfig.CELL_SIZE) + 1);
            const endY = Math.min(GameConfig.GRID_SIZE_Y, Math.ceil(((viewHeight - currentView.translateY) / currentView.zoom) / GameConfig.CELL_SIZE) + 1);

            this.ctx.fillStyle = GameConfig.BACKGROUND_COLOR;
            this.ctx.fillRect(0, 0, viewWidth, viewHeight);

            this.ctx.save();
            this.ctx.translate(currentView.translateX, currentView.translateY);
            this.ctx.scale(currentView.zoom, currentView.zoom);
            this.ctx.fillStyle = GameConfig.CELL_COLOR;

            this.drawCells(startX, startY, endX, endY);

            this.ctx.restore();
        }
    }

    class RectRenderer extends BaseRenderer {
        constructor(...args) {
            super(...args);
            this.shapeName = 'Square';
        }

        drawCells(startX, startY, endX, endY) {
            const state = this.currentGameStateForDrawing;
            if (!state || state.length === 0) {
                return;
            }
            for (let y = startY; y < endY; y++) {
                if (!state[y]) {
                    continue;
                }
                for (let x = startX; x < endX; x++) {
                    if (state[y][x]) {
                        this.ctx.fillRect(x * GameConfig.CELL_SIZE, y * GameConfig.CELL_SIZE, GameConfig.CELL_SIZE, GameConfig.CELL_SIZE);
                    }
                }
            }
        }
    }

    class CircleRenderer extends BaseRenderer {
        constructor(...args) {
            super(...args);
            this.shapeName = 'Circle';
        }

        drawCells(startX, startY, endX, endY) {
            const state = this.currentGameStateForDrawing;
            if (!state || state.length === 0) {
                return;
            }
            const radius = GameConfig.CELL_SIZE / 2;
            for (let y = startY; y < endY; y++) {
                if (!state[y]) {
                    continue;
                }
                for (let x = startX; x < endX; x++) {
                    if (state[y][x]) {
                        this.ctx.beginPath();
                        this.ctx.arc(x * GameConfig.CELL_SIZE + radius, y * GameConfig.CELL_SIZE + radius, radius, 0, 2 * Math.PI);
                        this.ctx.fill();
                    }
                }
            }
        }
    }

    // ==============================================================
    // CLASS 5: InputHandler
    // ==============================================================
    class InputHandler {
        constructor(canvas, viewManager, patternManager, gameController) {
            this.canvas = canvas;
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
            this.canvas.addEventListener('mousedown', e => this.onMouseDown(e));
            this.canvas.addEventListener('wheel', e => this.onWheel(e));
            this.canvas.addEventListener('contextmenu', e => e.preventDefault());
            document.addEventListener('mousemove', e => this.onMouseMove(e));
            document.addEventListener('mouseup', e => this.onMouseUp(e));
            document.addEventListener('keydown', e => this.onKeyDown(e));
        }

        onKeyDown(e) {
            if (e.code === 'Space') {
                e.preventDefault();
                this.cyclePattern();
            } else if (e.code === 'KeyS') {
                e.preventDefault();
                this.gameController.toggleRenderer();
            }
        }

        updateUIIndicators() {
            const patternEl = document.getElementById('current-pattern-name');
            const shapeEl = document.getElementById('current-shape-name');

            if (patternEl) {
                patternEl.textContent = this.patternManager.getCurrentPatternName();
            }

            if (shapeEl) {
                shapeEl.textContent = this.gameController.renderer.shapeName;
            }
        }

        cyclePattern() {
            this.patternManager.cycleToNextPattern();
            this.updateUIIndicators();
        }

        placeSpamPattern(mouseX, mouseY) {
            const view = this.viewManager.getCurrentView();
            const gridX = Math.floor(((mouseX - view.translateX) / view.zoom) / GameConfig.CELL_SIZE);
            const gridY = Math.floor(((mouseY - view.translateY) / view.zoom) / GameConfig.CELL_SIZE);
            const pattern = this.patternManager.getCurrentPattern();
            if (!pattern) {
                return;
            }
            const cells = pattern.map(p => ({
                x: (gridX + p.x + GameConfig.GRID_SIZE_X) % GameConfig.GRID_SIZE_X,
                y: (gridY + p.y + GameConfig.GRID_SIZE_Y) % GameConfig.GRID_SIZE_Y,
                alive: true
            }));
            this.gameController.setCells(cells);
        }

        onMouseDown(e) {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (e.button === 0) {
                this.isDragging = true;
                this.startX = mouseX;
                this.startY = mouseY;
                const view = this.viewManager.getCurrentView();
                this.startTranslateX = view.translateX;
                this.startTranslateY = view.translateY;
            } else if (e.button === 2) {
                this.isRightClickDown = true;
                this.rightClickStartX = mouseX;
                this.rightClickStartY = mouseY;
                this.rightClickMoved = false;
            }
        }

        onMouseMove(e) {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (this.isDragging) {
                const deltaX = mouseX - this.startX;
                const deltaY = mouseY - this.startY;
                this.viewManager.setTargetView(this.viewManager.getCurrentView().zoom, 
                this.startTranslateX + deltaX, 
                this.startTranslateY + deltaY, 
                this.canvas.clientWidth, 
                this.canvas.clientHeight);
            }
            if (this.isRightClickDown) {
                const moveDistance = Math.sqrt(Math.pow(mouseX - this.rightClickStartX, 2) + Math.pow(mouseY - this.rightClickStartY, 2));
                if (moveDistance > 5) {
                    this.rightClickMoved = true;
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
            if (e.button === 0) {
                this.isDragging = false;
            } else if (e.button === 2) {
                if (this.isRightClickDown) {
                    if (!this.rightClickMoved) {
                        const rect = this.canvas.getBoundingClientRect();
                        this.placeSpamPattern(e.clientX - rect.left, e.clientY - rect.top);
                    } else {
                        this.stopSpamMode();
                    }
                    this.isRightClickDown = false;
                }
            }
        }

        onWheel(e) {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const view = this.viewManager.getCurrentView();
            const zoomFactor = e.deltaY > 0 ? 1 / GameConfig.ZOOM_SENSITIVITY : GameConfig.ZOOM_SENSITIVITY;
            const newZoom = view.zoom * zoomFactor;
            const worldX = (mouseX - view.translateX) / view.zoom;
            const worldY = (mouseY - view.translateY) / view.zoom;
            const newTranslateX = mouseX - worldX * newZoom;
            const newTranslateY = mouseY - worldY * newZoom;
            this.viewManager.setTargetView(newZoom, newTranslateX, newTranslateY, this.canvas.clientWidth, this.canvas.clientHeight);
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
            }
        }
    }

    // ==============================================================
    // CLASS 6: Game Controller
    // ==============================================================
    class GameController {
        constructor() {
            this.worker = null;
            this.patternManager = new PatternManager();
            this.viewManager = null;
            this.renderer = null;
            this.inputHandler = null;
        }

        async initialize() {
            const canvas = document.getElementById('board-canvas');
            const container = document.getElementById('container');

            this.renderer = new RectRenderer(canvas);
            this.viewManager = new ViewManager(this.renderer);
            this.renderer.setViewManager(this.viewManager);

            this.inputHandler = new InputHandler(this.renderer.canvas, this.viewManager, this.patternManager, this);

            this.inputHandler.updateUIIndicators();

            const fetchedPatterns = await this.patternManager.loadPatternFiles();
            const initialPattern = this.patternManager.addPattern(this.patternManager.patterns.gosperGliderGun, 1400, 200);

            await this.initializeWorker(initialPattern.concat(fetchedPatterns));
            this.initializeViewport(container, canvas);
            this.startGame();
        }

        toggleRenderer() {
            const oldState = this.renderer.currentGameStateForDrawing;
            const canvas = this.renderer.canvas;
            let newRenderer;

            if (this.renderer instanceof RectRenderer) {
                newRenderer = new CircleRenderer(canvas, this.viewManager);
            } else {
                newRenderer = new RectRenderer(canvas, this.viewManager);
            }

            newRenderer.updateGameState(oldState);
            this.renderer = newRenderer;
            this.viewManager.renderer = this.renderer;

            this.inputHandler.updateUIIndicators();
            this.renderer.requestDraw();
        }

        async initializeWorker(initialPattern) {
            this.worker = new Worker('worker.js');

            this.worker.onmessage = (e) => {
                if (e.data.type === 'stateChanges') {
                    e.data.changes.forEach(change => {
                        if (change && this.renderer.currentGameStateForDrawing[change.y]) {
                            this.renderer.currentGameStateForDrawing[change.y][change.x] = change.alive;
                        }
                    });
                    this.renderer.requestDraw();
                }
            };

            const initialState = Array(GameConfig.GRID_SIZE_Y).fill(null).map(() => Array(GameConfig.GRID_SIZE_X).fill(false));

            initialPattern.forEach(({ x, y }) => {
                const wrappedX = (x + GameConfig.GRID_SIZE_X) % GameConfig.GRID_SIZE_X;
                const wrappedY = (y + GameConfig.GRID_SIZE_Y) % GameConfig.GRID_SIZE_Y;
                if (initialState[wrappedY]) {
                    initialState[wrappedY][wrappedX] = true;
                }
            });

            this.renderer.updateGameState(initialState);

            this.worker.postMessage({
                type: 'init',
                config: {
                    gridSizeX: GameConfig.GRID_SIZE_X,
                    gridSizeY: GameConfig.GRID_SIZE_Y,
                    gameSpeed: GameConfig.GAME_SPEED
                },
                initialGameState: initialState
            });
        }

        initializeViewport(container, canvas) {
            const viewW = container.clientWidth;
            const viewH = container.clientHeight;
            canvas.style.width = `${viewW}px`;
            canvas.style.height = `${viewH}px`;
            const initialX = (viewW - GameConfig.LOGICAL_GRID_WIDTH * GameConfig.INITIAL_ZOOM_FACTOR) / 2;
            const initialY = (viewH - GameConfig.LOGICAL_GRID_HEIGHT * GameConfig.INITIAL_ZOOM_FACTOR) / 2;
            const clamped = this.viewManager.clampView(GameConfig.INITIAL_ZOOM_FACTOR, initialX, initialY, viewW, viewH);
            this.viewManager.setTargetView(clamped.zoom, clamped.x, clamped.y, viewW, viewH);
            this.renderer.requestDraw();
        }

        startGame() {
            if (this.worker) {
                this.worker.postMessage({ type: 'start' });
            }
        }

        setCells(cells) {
            if (this.worker) {
                this.worker.postMessage({ type: 'setCells', cells: cells });
            }
        }

        handleResize() {
            const container = document.getElementById('container');
            const canvas = document.getElementById('board-canvas');
            if (!container || !canvas) {
                return;
            }
            const viewW = container.clientWidth;
            const viewH = container.clientHeight;
            const clamped = this.viewManager.clampView(this.viewManager.targetZoomLevel, 
                this.viewManager.targetTranslateX, 
                this.viewManager.targetTranslateY, viewW, viewH);
                
            this.viewManager.setTargetView(clamped.zoom, clamped.x, clamped.y, viewW, viewH);
            this.renderer.requestDraw();
        }
    }

    
    // ==============================================================
    // APPLICATION INITIALIZATION
    // ==============================================================
    const gameController = new GameController();

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => gameController.handleResize(), 150);
    });

    gameController.initialize().catch(error => {
        console.error("Failed to initialize game:", error);
        alert("A critical error occurred during initialization. Check the console for details.");
    });
});