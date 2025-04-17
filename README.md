# valis-world: Interactive Conway's Game of Life

Welcome to the repository for my personal website project, currently showcasing an advanced implementation of Conway's Game of Life. This project serves as both a learning exercise and the foundation for future website features.

**🚀 You can see it live at [valis-world.com](http://valis-world.com)! 🚀**

## Overview

This implementation of Conway's Game of Life runs the core simulation logic within a Web Worker for enhanced performance, allowing for very large grid sizes. The rendering is done using HTML5 Canvas, and the user interface supports smooth panning, zooming, boundary clamping, and interactive pattern spawning.

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
    *   Right-click cycles through a predefined list of patterns (`glider`, `lwss`, `mwss`, `acorn`, `rPentomino`, `hwss`, `gosperGliderGun`, `pulsar`).
    *   Holding the right mouse button "spams" the currently selected pattern at the cursor location.
*   **Dense Initial State:** Includes a wide variety of oscillators, spaceships, methuselahs, guns, and complex structures for an active start.
*   **Dynamic Header Bar:** A translucent header appears when scrolling up near the top of the page (when not zoomed in) and hides when scrolling down or zooming into the simulation.

## 🛠️ Tech Stack

*   HTML5
*   CSS3
*   JavaScript (ES6+)
*   Web Workers API
*   HTML5 Canvas API
*   **Deployment:** Nginx on Raspberry Pi

## 🚀 Running Locally

Because this project uses Web Workers, you cannot simply open the `index.html` file directly in your browser using a `file:///` URL due to browser security restrictions (`null` origin). You need to serve the files using a local web server.

**Option 1: Python**

1.  Navigate to the project directory in your terminal.
2.  Run `python -m http.server 8000` (or `python3 -m http.server` or `python -m SimpleHTTPServer` for Python 2).
3.  Open your browser to `http://localhost:8000`.

**Option 2: Node.js (`http-server`)**

1.  Install: `npm install -g http-server` (if you haven't already).
2.  Navigate to the project directory in your terminal.
3.  Run: `http-server -p 8000 -o`
4.  This will usually open the browser automatically to the correct address.

**Option 3: VS Code Live Server**

1.  Install the "Live Server" extension in VS Code.
2.  Open the project folder in VS Code.
3.  Right-click `index.html` and choose "Open with Live Server".

## 🌐 Deployment

This project is currently deployed and running at **[valis-world.com](http://valis-world.com)**, served by Nginx on a Raspberry Pi.

## 🔮 Future Plans

As this is the base for my personal website, future plans include:

*   Adding more interactive elements or simulations.
*   Integrating content sections (blog, portfolio, about).
*   Refining the UI/UX.
*   Further performance tuning if needed.

## 🤝 Contributing

This is primarily a personal project, but suggestions or bug reports via GitHub Issues are welcome!
