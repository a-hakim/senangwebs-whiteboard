/**
 * Example: Canvas Background and Grid Management
 * 
 * This shows how to extract a complete feature from sww.js into a module.
 * This module handles background creation and grid pattern management.
 */

/**
 * Background management mixin for SWWInstance
 */
export const BackgroundMixin = {
    /**
     * Create canvas background
     */
    createBackground() {
        // Background rect
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
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
     * Create grid pattern
     */
    createGrid() {
        // Remove existing grid if it exists
        if (this.gridPattern) {
            this.gridPattern.parentNode.removeChild(this.gridPattern.parentNode);
        }
        if (this.gridRect) {
            this.gridRect.parentNode.removeChild(this.gridRect);
        }
        if (this.gridDefs) {
            this.gridDefs.parentNode.removeChild(this.gridDefs);
        }
        
        this.gridDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        this.gridPattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
        this.gridPattern.setAttribute('id', 'sww-grid');
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
        this.svg.appendChild(this.gridDefs);
        
        this.gridRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this.gridRect.setAttribute('x', this.viewBox.x - 5000);
        this.gridRect.setAttribute('y', this.viewBox.y - 5000);
        this.gridRect.setAttribute('width', 10000);
        this.gridRect.setAttribute('height', 10000);
        this.gridRect.setAttribute('fill', 'url(#sww-grid)');
        this.svg.appendChild(this.gridRect);
    },
    
    /**
     * Update grid visibility based on settings
     */
    updateGridVisibility() {
        if (!this.gridRect) return;
        
        if (this.options.showGrid) {
            this.gridRect.style.display = 'block';
        } else {
            this.gridRect.style.display = 'none';
        }
    },
    
    /**
     * Show grid
     */
    showGrid() {
        this.options.showGrid = true;
        this.updateGridVisibility();
        this.updateGridButtonState();
    },
    
    /**
     * Hide grid
     */
    hideGrid() {
        this.options.showGrid = false;
        this.updateGridVisibility();
        this.updateGridButtonState();
    },
    
    /**
     * Toggle grid visibility
     */
    toggleGrid() {
        this.options.showGrid = !this.options.showGrid;
        this.updateGridVisibility();
        this.updateGridButtonState();
        
        // Show notification
        if (this.showNotification) {
            const message = this.options.showGrid ? 'Grid enabled' : 'Grid disabled';
            this.showNotification(message, 'info', 1000);
        }
    },
    
    /**
     * Update grid button state in UI
     */
    updateGridButtonState() {
        const gridButton = document.querySelector('[data-action="toggle-grid"]');
        if (!gridButton) return;
        
        if (this.options.showGrid) {
            gridButton.classList.add('active');
        } else {
            gridButton.classList.remove('active');
        }
    }
};

// Usage in main SWWInstance:
// import { BackgroundMixin } from './modules/canvas/Background.js';
// Object.assign(SWWInstance.prototype, BackgroundMixin);
