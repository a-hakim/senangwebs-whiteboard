/**
 * Grid.js
 * Grid display and snapping functionality
 * Part of Phase 7: Final extractions
 * 
 * Provides methods for:
 * - Creating and displaying grid pattern
 * - Show/hide grid
 * - Grid snapping for elements
 * - Grid button state management
 */

export const GridMixin = {
    /**
     * Create SVG grid pattern
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
        
        // Create defs element for pattern definition
        this.gridDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        this.gridPatternId = this.gridPatternId || `sww-grid-${this.generateId()}`;
        
        // Create grid pattern
        this.gridPattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
        this.gridPattern.setAttribute('id', this.gridPatternId);
        this.gridPattern.setAttribute('width', this.options.gridSize);
        this.gridPattern.setAttribute('height', this.options.gridSize);
        this.gridPattern.setAttribute('patternUnits', 'userSpaceOnUse');
        
        // Create path for grid lines
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${this.options.gridSize} 0 L 0 0 0 ${this.options.gridSize}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#e0e0e0');
        path.setAttribute('stroke-width', '1');
        
        this.gridPattern.appendChild(path);
        this.gridDefs.appendChild(this.gridPattern);
        this.svg.insertBefore(this.gridDefs, this.elementsGroup || this.selectionGroup || null);
        
        // Create rectangle that uses the grid pattern
        this.gridRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this.gridRect.setAttribute('x', this.viewBox.x - 5000);
        this.gridRect.setAttribute('y', this.viewBox.y - 5000);
        this.gridRect.setAttribute('width', 10000);
        this.gridRect.setAttribute('height', 10000);
        this.gridRect.setAttribute('fill', `url(#${this.gridPatternId})`);
        this.svg.insertBefore(this.gridRect, this.elementsGroup || this.selectionGroup || null);
    },

    /**
     * Show the grid
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
     * Hide the grid
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
     * Toggle grid visibility
     * @returns {boolean} New grid visibility state
     */
    toggleGrid() {
        this.options.showGrid = !this.options.showGrid;
        // Also toggle grid snapping when toggling grid visibility
        this.snapToGrid = this.options.showGrid;
        
        if (this.options.showGrid) {
            this.showGrid();
        } else {
            this.hideGrid();
        }
        
        // Update toggle grid button visual state
        this.updateGridButtonState();
        
        return this.options.showGrid;
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
     * Snap a point to the grid
     * @param {Object} point - Point with x and y coordinates
     * @returns {Object} Snapped point
     */
    snapToGridPoint(point) {
        if (!this.snapToGrid) return point;
        
        const gridSize = this.options.gridSize;
        return {
            x: Math.round(point.x / gridSize) * gridSize,
            y: Math.round(point.y / gridSize) * gridSize
        };
    },

    /**
     * Snap a numeric value to the grid
     * @param {number} value - Value to snap
     * @returns {number} Snapped value
     */
    snapToGridValue(value) {
        if (!this.snapToGrid) return value;
        
        const gridSize = this.options.gridSize;
        return Math.round(value / gridSize) * gridSize;
    },

    /**
     * Toggle grid snapping on/off
     * @returns {boolean} New snapping state
     */
    toggleGridSnap() {
        this.snapToGrid = !this.snapToGrid;
        return this.snapToGrid;
    },

    /**
     * Toggle grid snap button and update UI
     */
    toggleGridSnapButton() {
        const isSnapping = this.toggleGridSnap();
        const button = this.container.querySelector('[data-action="snap-grid"]');
        if (button) {
            if (isSnapping) {
                button.classList.add('active');
                button.title = 'Grid Snap: ON (Click to disable)';
            } else {
                button.classList.remove('active');
                button.title = 'Grid Snap: OFF (Click to enable)';
            }
        }
        
        // Show/hide grid based on snap state
        this.updateGridVisibility();
    },

    /**
     * Update grid button visual state
     */
    updateGridButtonState() {
        // Find the toggle grid button and update its active state
        const gridButton = document.querySelector('#toggle-grid-btn');
        if (gridButton) {
            if (this.options.showGrid) {
                gridButton.classList.add('active');
            } else {
                gridButton.classList.remove('active');
            }
        }
    }
};
