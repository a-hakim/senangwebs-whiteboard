/**
 * Canvas Manager
 * Handles canvas creation, viewport management, and basic rendering
 */

export class CanvasManager {
    constructor(container, options = {}) {
        this.container = container;
        this.options = options;
        this.viewBox = { x: 0, y: 0, width: 1000, height: 1000 };
        this.zoom = 1;
        this.svg = null;
        this.defs = null;
        this.backgroundGroup = null;
        this.elementsGroup = null;
        this.overlayGroup = null;
        
        this.init();
    }

    init() {
        this.createSVG();
        this.createBackground();
        this.createGrid();
        this.setupGroups();
    }

    createSVG() {
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.style.width = this.options.width || '100%';
        this.svg.style.height = this.options.height || '100%';
        this.svg.style.backgroundColor = this.options.backgroundColor || '#ffffff';
        this.svg.style.cursor = 'crosshair';
        this.svg.style.userSelect = 'none';
        this.svg.style.touchAction = 'none';

        // Add definitions for patterns and markers
        this.defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        this.svg.appendChild(this.defs);

        this.container.appendChild(this.svg);
        this.updateViewBox();
    }

    setupGroups() {
        // Background group (grid, etc.)
        this.backgroundGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.backgroundGroup.setAttribute('class', 'sww-background');
        this.svg.appendChild(this.backgroundGroup);

        // Elements group (main drawing elements)
        this.elementsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.elementsGroup.setAttribute('class', 'sww-elements');
        this.svg.appendChild(this.elementsGroup);

        // Overlay group (selection handles, etc.)
        this.overlayGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.overlayGroup.setAttribute('class', 'sww-overlay');
        this.svg.appendChild(this.overlayGroup);
    }

    createBackground() {
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('width', '100%');
        background.setAttribute('height', '100%');
        background.setAttribute('fill', this.options.backgroundColor || '#ffffff');
        background.setAttribute('class', 'sww-canvas-background');
        
        if (this.backgroundGroup) {
            this.backgroundGroup.appendChild(background);
        }
    }

    createGrid() {
        if (!this.options.showGrid) return;

        const gridSize = this.options.gridSize || 20;
        const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
        pattern.setAttribute('id', 'sww-grid');
        pattern.setAttribute('width', gridSize);
        pattern.setAttribute('height', gridSize);
        pattern.setAttribute('patternUnits', 'userSpaceOnUse');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${gridSize} 0 L 0 0 0 ${gridSize}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#e0e0e0');
        path.setAttribute('stroke-width', '1');

        pattern.appendChild(path);
        this.defs.appendChild(pattern);

        const gridRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        gridRect.setAttribute('width', '100%');
        gridRect.setAttribute('height', '100%');
        gridRect.setAttribute('fill', 'url(#sww-grid)');
        gridRect.setAttribute('class', 'sww-grid');

        if (this.backgroundGroup) {
            this.backgroundGroup.appendChild(gridRect);
        }
    }

    updateViewBox() {
        const { x, y, width, height } = this.viewBox;
        this.svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
    }

    setViewBox(x, y, width, height) {
        this.viewBox = { x, y, width, height };
        this.updateViewBox();
    }

    setZoom(zoom) {
        this.zoom = Math.max(0.1, Math.min(5, zoom));
        const centerX = this.viewBox.width / 2;
        const centerY = this.viewBox.height / 2;
        const newWidth = 1000 / this.zoom;
        const newHeight = 1000 / this.zoom;
        
        this.setViewBox(
            centerX - newWidth / 2,
            centerY - newHeight / 2,
            newWidth,
            newHeight
        );
    }

    pan(deltaX, deltaY) {
        this.setViewBox(
            this.viewBox.x + deltaX,
            this.viewBox.y + deltaY,
            this.viewBox.width,
            this.viewBox.height
        );
    }

    screenToSVG(clientX, clientY) {
        const rect = this.svg.getBoundingClientRect();
        const point = this.svg.createSVGPoint();
        point.x = clientX - rect.left;
        point.y = clientY - rect.top;
        
        const svgPoint = point.matrixTransform(this.svg.getScreenCTM().inverse());
        return { x: svgPoint.x, y: svgPoint.y };
    }

    showGrid() {
        const grid = this.svg.querySelector('.sww-grid');
        if (grid) {
            grid.style.display = 'block';
        }
    }

    hideGrid() {
        const grid = this.svg.querySelector('.sww-grid');
        if (grid) {
            grid.style.display = 'none';
        }
    }

    clear() {
        while (this.elementsGroup.firstChild) {
            this.elementsGroup.removeChild(this.elementsGroup.firstChild);
        }
        while (this.overlayGroup.firstChild) {
            this.overlayGroup.removeChild(this.overlayGroup.firstChild);
        }
    }

    resize() {
        // Handle container resize
        const rect = this.container.getBoundingClientRect();
        this.svg.style.width = rect.width + 'px';
        this.svg.style.height = rect.height + 'px';
    }

    dispose() {
        if (this.svg && this.svg.parentNode) {
            this.svg.parentNode.removeChild(this.svg);
        }
    }
}
