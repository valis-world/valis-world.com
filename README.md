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
    *   Right-click cycles through a predefined list of patterns (`glider`, `lwss`, `mwss`, `acorn`, `rPentomino`, `hwss`, `gosperGliderGun`, `pulsar`).
    *   Holding the right mouse button "spams" the currently selected pattern at the cursor location.
*   **Dense Initial State:** Includes a wide variety of oscillators, spaceships, methuselahs, guns, and complex structures for an active start.
*   **Dynamic Header Bar:** A translucent header appears when scrolling up near the top of the page (when not zoomed in) and hides when scrolling down or zooming into the simulation.
*   **Monitoring:** Integrated with Uptime Kuma for basic service availability monitoring.

## 🛠️ Tech Stack

*   HTML5
*   CSS3
*   JavaScript (ES6+)
*   Web Workers API
*   HTML5 Canvas API
*   **Deployment:** Nginx (configuration included in `nginx-config/`) on Raspberry Pi
*   **Monitoring:** Uptime Kuma

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
