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

    /*
     * Grid pattern creation and visibility (createGrid, updateGridVisibility,
     * showGrid, hideGrid) live in modules/grid/Grid.js, which is applied after
     * this mixin in sww.js and therefore wins at runtime.
     */

    /**
     * Update viewBox attribute on SVG
     */
    updateViewBox() {
        this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);
    }
};
