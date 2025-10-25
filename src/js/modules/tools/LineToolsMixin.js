/**
 * LineToolsMixin.js
 * Handles drawing of line and arrow elements
 */

export const LineToolsMixin = {
    /**
     * Start drawing a line or arrow
     * Called on pointer down when line/arrow tool is active
     * @param {Object} point - {x, y} coordinates
     */
    handleLineStart(point) {
        const snappedPoint = this.snapToGridPoint(point);
        const element = this.createElement(this.currentTool, snappedPoint);
        this.currentElement = element;
        this.isDrawing = true;
        this.addSVGElementToDOM(element);
    },

    /**
     * Update line endpoint during drawing
     * Called on pointer move while drawing
     * @param {Object} point - {x, y} coordinates
     */
    handleLineMove(point) {
        if (!this.currentElement) return;
        
        // Calculate width and height from start point to current point
        // Width and height can be negative (allows drawing in any direction)
        this.currentElement.width = point.x - this.currentElement.x;
        this.currentElement.height = point.y - this.currentElement.y;
        
        // Update the SVG element to reflect new endpoint
        this.updateSVGElement(this.currentElement);
    },

    /**
     * Finalize line creation
     * Called on pointer up after drawing
     */
    handleLineEnd() {
        if (!this.currentElement) return;
        
        const element = this.currentElement;
        
        // Lines and arrows can have negative dimensions (direction matters)
        // No normalization needed unlike shapes
        
        // Add to elements array
        this.addElement(element);
        
        // Save state for undo/redo
        this.saveStateToHistory('createElement');
        
        // Select the newly created element
        this.clearSelection();
        const finishedElement = this.currentElement;
        
        // Clean up drawing state
        this.currentElement = null;
        this.isDrawing = false;
        
        // Select the finished element
        this.selectElement(finishedElement);
        
        // Auto-switch to select tool for better UX
        this.setTool('select');
    },

    /**
     * Create SVG element for a line or arrow
     * @param {Object} element - Element object
     * @returns {SVGLineElement} Created SVG line element
     */
    createLineSVGElement(element) {
        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        svgElement.setAttribute('data-element-id', element.id);
        svgElement.setAttribute('class', 'sww-element');
        return svgElement;
    },

    /**
     * Update line/arrow SVG attributes
     * @param {Object} element - Element object with SVG reference
     */
    updateLineSVG(element) {
        const svg = element.svgElement;
        if (!svg) return;
        
        // Set line coordinates
        // x1, y1 is the start point (element.x, element.y)
        // x2, y2 is the end point (element.x + width, element.y + height)
        svg.setAttribute('x1', element.x);
        svg.setAttribute('y1', element.y);
        svg.setAttribute('x2', element.x + element.width);
        svg.setAttribute('y2', element.y + element.height);
        
        // Add arrow marker for arrow type
        if (element.type === 'arrow') {
            const markerId = this.createArrowMarker(element.strokeColor);
            svg.setAttribute('marker-end', `url(#${markerId})`);
            
            // Support for start marker if configured in toolState
            if (this.toolState && this.toolState.arrowStartMarker) {
                svg.setAttribute('marker-start', `url(#${markerId})`);
            }
        }
    },

    /**
     * Create arrow marker definition for SVG
     * Markers are reused across arrows with the same color
     * @param {string} strokeColor - Hex color for the arrow marker
     * @returns {string} Marker ID to reference in marker-end attribute
     */
    createArrowMarker(strokeColor = '#000000') {
        // Create unique marker ID for each color
        const markerId = `arrowhead-${strokeColor.replace('#', '')}`;
        
        // Reuse existing marker if already created
        if (document.getElementById(markerId)) {
            return markerId;
        }
        
        // Ensure we have a dedicated defs element for markers
        if (!this.markerDefs) {
            this.markerDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            this.markerDefs.setAttribute('id', 'sww-marker-defs');
            this.svg.appendChild(this.markerDefs);
        }
        const defs = this.markerDefs;
        
        // Create marker element
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', markerId);
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '7');
        marker.setAttribute('refX', '9'); // Position at tip of arrow
        marker.setAttribute('refY', '3.5'); // Center vertically
        marker.setAttribute('orient', 'auto'); // Auto-rotate to match line angle
        marker.setAttribute('markerUnits', 'strokeWidth');
        
        // Create arrow shape (triangle)
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
        polygon.setAttribute('fill', strokeColor);
        
        marker.appendChild(polygon);
        defs.appendChild(marker);
        
        return markerId;
    },

    /**
     * Update arrow marker color when stroke color changes
     * @param {Object} element - Arrow element
     * @param {string} newColor - New stroke color
     */
    updateArrowMarker(element, newColor) {
        if (element.type !== 'arrow') return;
        
        const markerId = this.createArrowMarker(newColor);
        if (element.svgElement) {
            element.svgElement.setAttribute('marker-end', `url(#${markerId})`);
            
            if (this.toolState && this.toolState.arrowStartMarker) {
                element.svgElement.setAttribute('marker-start', `url(#${markerId})`);
            }
        }
    },

    /**
     * Check if a tool is a line tool
     * @param {string} toolName - Tool name to check
     * @returns {boolean} True if tool is a line tool
     */
    isLineToolType(toolName) {
        const lineTools = ['line', 'arrow'];
        return lineTools.includes(toolName);
    },

    /**
     * Get default settings for line elements
     * @returns {Object} Default line settings
     */
    getLineDefaults() {
        return {
            strokeWidth: 2,
            fillColor: 'transparent',
            fillStyle: 'solid'
        };
    },

    /**
     * Calculate line length
     * @param {Object} element - Line or arrow element
     * @returns {number} Length in pixels
     */
    getLineLength(element) {
        if (!this.isLineToolType(element.type)) return 0;
        
        const dx = element.width;
        const dy = element.height;
        return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * Calculate line angle in degrees
     * @param {Object} element - Line or arrow element
     * @returns {number} Angle in degrees (0-360)
     */
    getLineAngle(element) {
        if (!this.isLineToolType(element.type)) return 0;
        
        const angleRad = Math.atan2(element.height, element.width);
        const angleDeg = angleRad * (180 / Math.PI);
        return angleDeg;
    },

    /**
     * Set line angle while maintaining length
     * @param {Object} element - Line or arrow element
     * @param {number} angleDeg - Desired angle in degrees
     */
    setLineAngle(element, angleDeg) {
        if (!this.isLineToolType(element.type)) return;
        
        const length = this.getLineLength(element);
        const angleRad = angleDeg * (Math.PI / 180);
        
        element.width = length * Math.cos(angleRad);
        element.height = length * Math.sin(angleRad);
        
        this.updateSVGElement(element);
    },

    /**
     * Set line length while maintaining angle
     * @param {Object} element - Line or arrow element
     * @param {number} length - Desired length in pixels
     */
    setLineLength(element, length) {
        if (!this.isLineToolType(element.type)) return;
        
        const currentLength = this.getLineLength(element);
        if (currentLength === 0) return;
        
        const scale = length / currentLength;
        element.width *= scale;
        element.height *= scale;
        
        this.updateSVGElement(element);
    }
};
