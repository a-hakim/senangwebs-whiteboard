/**
 * Canvas Creation Mixin for SWWInstance
 * Handles SVG canvas setup and background creation
 */

export const CanvasMixin = {
    /**
     * Create main UI structure
     * Sets up SVG canvas with groups for elements and selection
     */
    createUI() {
        // Clear container
        this.container.innerHTML = '';
        this.container.className = 'sww-container';
        
        // Create SVG canvas
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('class', 'sww-canvas');
        this.svg.setAttribute('tabindex', '0');
        this.svg.setAttribute('role', 'application');
        this.svg.setAttribute('aria-label', this.options.ariaLabel || 'Whiteboard drawing canvas');
        this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);
        this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        
        // Create background
        this.createBackground();
        
        // Create main group for elements
        this.elementsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.elementsGroup.setAttribute('class', 'sww-elements');
        this.svg.appendChild(this.elementsGroup);
        
        // Create selection group
        this.selectionGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.selectionGroup.setAttribute('class', 'sww-selection');
        this.svg.appendChild(this.selectionGroup);
        
        this.container.appendChild(this.svg);
        
        // Create toolbar
        this.createToolbar();
        
        // Create properties panel
        this.createPropertiesPanel();
        
        // Create context menu
        this.createContextMenu();
    },

    /**
     * Create background rectangle and grid
     */
    createBackground() {
        // Background rect
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this.backgroundRect = bg;
        bg.setAttribute('x', this.viewBox.x - 5000);
        bg.setAttribute('y', this.viewBox.y - 5000);
        bg.setAttribute('width', 10000);
        bg.setAttribute('height', 10000);
        bg.setAttribute('fill', this.options.backgroundColor);
        this.svg.appendChild(bg);
        
        // Create grid pattern but only show if snap is enabled
        this.createGrid();
        this.updateGridVisibility();
    },

    /**
     * Create grid pattern for snap-to-grid functionality
     */
    createGrid() {
        // Remove existing grid if it exists
        if (this.gridPattern) {
            this.gridPattern.remove();
        }
        if (this.gridRect) {
            this.gridRect.remove();
        }
        if (this.gridDefs) {
            this.gridDefs.remove();
        }
        
        this.gridDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        this.gridPattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
        this.gridPatternId = this.gridPatternId || `sww-grid-${this.generateId()}`;
        this.gridPattern.setAttribute('id', this.gridPatternId);
        this.gridPattern.setAttribute('width', this.options.gridSize);
        this.gridPattern.setAttribute('height', this.options.gridSize);
        this.gridPattern.setAttribute('patternUnits', 'userSpaceOnUse');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${this.options.gridSize} 0 L 0 0 0 ${this.options.gridSize}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#e0e0e0');
        path.setAttribute('stroke-width', '1');
        
        this.gridPattern.appendChild(path);
        this.gridDefs.appendChild(this.gridPattern);
        this.svg.insertBefore(this.gridDefs, this.elementsGroup || null);
        
        this.gridRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this.gridRect.setAttribute('x', this.viewBox.x - 5000);
        this.gridRect.setAttribute('y', this.viewBox.y - 5000);
        this.gridRect.setAttribute('width', 10000);
        this.gridRect.setAttribute('height', 10000);
        this.gridRect.setAttribute('fill', `url(#${this.gridPatternId})`);
        this.svg.insertBefore(this.gridRect, this.elementsGroup || null);
    },

    /**
     * Update grid visibility based on snapToGrid state
     */
    updateGridVisibility() {
        if (this.snapToGrid) {
            this.showGrid();
        } else {
            this.hideGrid();
        }
    },

    /**
     * Show grid pattern
     */
    showGrid() {
        if (!this.gridRect && !this.gridDefs && !this.gridPattern) {
            this.createGrid();
        } else if (this.gridRect && this.gridDefs) {
            this.gridRect.style.display = 'block';
            this.gridDefs.style.display = 'block';
        }
    },

    /**
     * Hide grid pattern
     */
    hideGrid() {
        if (this.gridRect) {
            this.gridRect.style.display = 'none';
        }
        if (this.gridDefs) {
            this.gridDefs.style.display = 'none';
        }
    },

    /**
     * Update viewBox attribute on SVG
     */
    updateViewBox() {
        this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);
    }
};
