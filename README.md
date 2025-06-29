# valis-world: Interactive Conway's Game of Life

Welcome to the repository for my personal website project, currently showcasing an advanced implementation of Conway's Game of Life. This project serves as both a learning exercise and the foundation for future website features, now including deployment configurations and basic monitoring.

**🚀 You can see it live at [http://valis-world.com](http://valis-world.com)! 🚀**

## Overview

This implementation of Conway's Game of Life runs the core simulation logic within a Web Worker for enhanced performance, allowing for very large grid sizes. The rendering is done using HTML5 Canvas, and the user interface supports smooth panning, zooming, boundary clamping, and interactive pattern spawning. The project is configured for deployment using Nginx and includes integration for monitoring with Uptime Kuma.

## ✨ Current Features

*   **Conway's Game of Life Simulation:** Core rules implemented accurately.
*   **Large Configurable Grid:** Currently set to 8000x2800 logical pixels (1600x560 cells).
*   **Toroidal Grid:** Edges wrap around for continuous simulation space.
*   **Performance Optimizations:**
    *   **Web Worker:** Simulation logic runs in a background thread, keeping the UI responsive.
    *   **Sparse Worker Implementation:** Efficiently handles states with fewer live cells using a Set.
    *   **Canvas Rendering:** Direct pixel manipulation for fast drawing.
    *   **Optimized Drawing:** Only renders cells currently within the viewport.
*   **Smooth Interactions:**
    *   **Panning:** Click and drag (left mouse button) to move the view.
    *   **Zooming:** Mouse scroll wheel zooms in/out, centered on the cursor position.
    *   **Smooth Animation:** Uses `requestAnimationFrame` for fluid zoom transitions.
*   **Boundary Clamping:** Prevents zooming out further than fitting the entire grid and stops panning past the grid edges.
*   **Interactive Pattern Spawning:**
    *   Right-click places and SPACE cycles through a predefined list of patterns (`glider`, `lwss`, `mwss`, `acorn`, `rPentomino`, `hwss`, `gosperGliderGun`, `pulsar`).
    *   Holding the right mouse button "spams" the currently selected pattern at the cursor location.
*   **Dense Initial State:** Includes a wide variety of oscillators, spaceships, methuselahs, guns, and complex structures for an active start.
*   **Monitoring:** Integrated with Uptime Kuma for basic service availability monitoring.

## 🛠️ Tech Stack

*   HTML5
*   CSS3
*   JavaScript (ES6+)
*   Web Workers API
*   HTML5 Canvas API
*   **Deployment:** Nginx (configuration included in `nginx-config/`) on Raspberry Pi
*   **Monitoring:** Uptime Kuma

## 🏛️ Code Architecture Deep Dive

The key to this application's performance is the strict separation of concerns between two main JavaScript files, which run in different browser threads. This architecture allows for a massive, computationally intensive simulation to run smoothly without ever freezing the user interface.

1.  **`script.js` (The Main/UI Thread):** This is the "Control & Render" thread. It is responsible for everything the user sees and interacts with: drawing the grid, handling mouse and keyboard input, and managing the overall application state.
2.  **`worker.js` (The Background/Worker Thread):** This is the dedicated "Simulation Engine." Its sole purpose is to run the Game of Life simulation logic, freeing the main thread from heavy calculations.

### `script.js` - The Control & Render Thread

This file is organized into several classes, each with a specific responsibility, following Object-Oriented principles.

#### `class GameController`
This is the central orchestrator or "brain" of the application.
*   **Role:** It creates instances of all the other manager and handler classes and "wires" them together so they can communicate.
*   **Key Action:** Its `initialize()` method kicks off the entire application, setting up the renderer, view, input handlers, and starting the Web Worker.

#### `class ViewManager`
This class acts as the "camera" for the simulation.
*   **Role:** It manages the state of the viewport, including the current zoom level and pan (translation) offset.
*   **Core Concept:** It uses a `targetZoomLevel` and `targetTranslate` to create smooth animations. Instead of instantly changing the view, it sets a target and uses `requestAnimationFrame` to interpolate the current view towards the target, frame by frame.
*   **Key Feature:** The `clampView()` method prevents the user from panning or zooming too far, ensuring the grid is always accessible.

#### `class InputHandler`
This is the bridge between the user and the application.
*   **Role:** It centralizes all event listeners (`mousedown`, `mousemove`, `wheel`, `keydown`).
*   **Function:** It translates raw user input into meaningful commands, such as calling `viewManager.setTargetView()` when the user drags the mouse, or telling the `GameController` to place a new pattern on a right-click.

#### `class PatternManager`
This class is the "librarian" for all the Game of Life patterns.
*   **Role:** It loads, stores, and provides the blueprints for patterns like "glider" or "pulsar".
*   **Implementation:** It contains a small set of hardcoded patterns for quick access and uses an `async` method with `fetch` and `Promise.all` to load larger, more complex patterns from `.json` files at startup.

#### `class BaseRenderer` & Subclasses (`RectRenderer`, `CircleRenderer`)
This is a textbook example of the **Strategy Pattern**.
*   **`BaseRenderer` (The Abstract Blueprint):** This class contains all the common rendering logic.
    *   **Viewport Culling:** Its most important optimization. Instead of trying to draw all 22+ million potential cells, it calculates the small rectangular portion of the grid currently visible in the viewport and only iterates over those cells.
    *   **High-DPI Support:** It uses `window.devicePixelRatio` to ensure the rendering is crisp on high-resolution displays.
*   **`RectRenderer` & `CircleRenderer` (The Concrete Strategies):** These classes inherit from `BaseRenderer`. Their only job is to provide a specific implementation for the `drawCells()` method—one draws using `fillRect()`, the other using `arc()`. The `GameController` can swap between these "strategies" at any time.

#### `class GameConfig`
A simple but vital utility class.
*   **Role:** It acts as a single source of truth for all static configuration values (e.g., `CELL_SIZE`, `GAME_SPEED`). This prevents "magic numbers" and makes the application easy to tweak.

### `worker.js` - The Simulation Engine

This script is the computational powerhouse. It runs in complete isolation and communicates with `script.js` only through messages.

#### The "Sparse Set" Implementation
This is the **most critical optimization** in the entire project. A naive approach would use a massive 2D array to store the state of every cell. This would consume a huge amount of memory and be incredibly slow to process.
*   **The Solution:** Instead, the worker only keeps track of the cells that are **alive**. It does this using a JavaScript `Set`, which provides highly efficient `add`, `delete`, and `has` operations. A cell's coordinate `(x, y)` is stored as a simple string key: `"x,y"`.

#### The `updateGameStateSparse` Algorithm
This is the engine's core logic, designed to work perfectly with the sparse set.
1.  **Find Relevant Cells:** The algorithm doesn't check every cell on the grid. It knows that the only cells that can possibly change state are the currently live cells and their immediate neighbors. It iterates through the `liveCells` set and builds a temporary list of these "relevant cells".
2.  **Count Neighbors:** As it identifies relevant cells, it keeps a count of how many live neighbors each one has in a `Map`.
3.  **Apply Rules:** Finally, it iterates *only over the small set of relevant cells* and applies the four rules of Conway's Game of Life based on the neighbor count.

#### Efficient Communication: Sending "Deltas"
When the worker finishes a new generation, it doesn't send the entire new state of all live cells back to the main thread. Instead, it sends a small array containing only the cells that **changed state** (a "delta"). This dramatically reduces the amount of data that needs to be passed between threads, which is another key performance factor.

---
Together, these two scripts and their internal architectures form a robust system that delegates tasks efficiently, allowing a complex and resource-intensive simulation to run beautifully in a web browser.

## 🚀 Running Locally

Because this project uses Web Workers **and the web assets are located in the `dist/` directory**, you cannot simply open `dist/index.html` directly in your browser using a `file:///` URL due to browser security restrictions (`null` origin). You need to serve the files using a local web server **from the `dist` directory**.

**Option 1: Python**

1.  Navigate to the project's **root directory** in your terminal.
2.  Run: `cd dist && python -m http.server 8000` (or `python3 -m http.server` or `python -m SimpleHTTPServer` for Python 2).
3.  Open your browser to `http://localhost:8000`.
4.  Press `Ctrl+C` in the terminal to stop the server. Then run `cd ..` to get back to the project root.

**Option 2: Node.js (`http-server`)**

1.  Install: `npm install -g http-server` (if you haven't already).
2.  Navigate to the project's **root directory** in your terminal.
3.  Run: `http-server dist -p 8000 -o` (This tells it to serve the `dist` folder).
4.  This will usually open the browser automatically to the correct address.

**Option 3: VS Code Live Server**

1.  Install the "Live Server" extension in VS Code.
2.  Open the project folder in VS Code.
3.  Right-click `dist/index.html` in the VS Code explorer and choose "Open with Live Server".

## 🌐 Deployment

This project is currently deployed and running at **[http://valis-world.com](http://valis-world.com)**, served by Nginx on a Raspberry Pi.

**Nginx Configuration:**

The `nginx-config/` directory in this repository contains the configuration files intended for the Nginx deployment:
*   `nginx.conf`: A base/global Nginx configuration template.
*   `valis-world.conf`: The site-specific configuration (`server` block) for this project.

**General Deployment Steps:**

1.  **Transfer Web Files:** Copy the contents of the local `dist/` directory to the designated web root directory on the Raspberry Pi server (e.g., `/var/www/valis-world/dist` or similar).
2.  **Transfer & Configure Nginx:**
    *   Copy the configuration files from `nginx-config/` to the appropriate locations on the server (e.g., `/etc/nginx/nginx.conf` and `/etc/nginx/conf.d/valis-world.conf` or using the `sites-available`/`sites-enabled` structure).
    *   **Important:** Modify the `valis-world.conf` file **on the server** to set the correct `server_name` (your domain) and `root` path (pointing to where you copied the `dist` files in step 1).
    *   Test the configuration: `sudo nginx -t`
    *   Reload Nginx to apply changes: `sudo systemctl reload nginx`
3.  **Configure Uptime Kuma:** Set up your Uptime Kuma instance (if running separately) to monitor the live URL (`http://valis-world.com`) to check for availability.

*(Refer to the `README.md` within the `nginx-config/` directory for potentially more specific deployment notes, if you added one there).*

## 🔮 Future Plans

As this is the base for my personal website, future plans include:

*   Adding more interactive elements or simulations.
*   Integrating content sections (blog, portfolio, about).
*   Refining the UI/UX.
*   Further performance tuning if needed.
*   Implementing HTTPS/SSL.
*   Creating a public status page via Uptime Kuma.

## 🤝 Contributing

This is primarily a personal project, but suggestions or bug reports via GitHub Issues are welcome!
