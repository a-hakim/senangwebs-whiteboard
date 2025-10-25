/**
 * ShapeToolsMixin.js
 * Handles drawing of shape elements: rectangle, ellipse, diamond, parallelogram, star
 */

export const ShapeToolsMixin = {
    /**
     * Start drawing a shape
     * Called on pointer down when a shape tool is active
     * @param {Object} point - {x, y} coordinates
     */
    handleShapeStart(point) {
        const snappedPoint = this.snapToGridPoint(point);
        const element = this.createElement(this.currentTool, snappedPoint);
        this.currentElement = element;
        this.isDrawing = true;
        this.addSVGElementToDOM(element);
    },

    /**
     * Update shape dimensions during drawing
     * Called on pointer move while drawing
     * @param {Object} point - {x, y} coordinates
     */
    handleShapeMove(point) {
        if (!this.currentElement) return;
        
        // Calculate width and height from start point to current point
        this.currentElement.width = point.x - this.currentElement.x;
        this.currentElement.height = point.y - this.currentElement.y;
        
        // Update the SVG element to reflect new dimensions
        this.updateSVGElement(this.currentElement);
    },

    /**
     * Finalize shape creation
     * Called on pointer up after drawing
     */
    handleShapeEnd() {
        if (!this.currentElement) return;
        
        const element = this.currentElement;
        
        // Normalize dimensions to always be positive
        // This ensures consistent resize behavior
        if (element.width < 0) {
            element.x += element.width;
            element.width = -element.width;
        }
        
        if (element.height < 0) {
            element.y += element.height;
            element.height = -element.height;
        }
        
        // Update SVG with normalized dimensions
        this.updateSVGElement(element);
        
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
     * Create SVG element for a shape
     * @param {Object} element - Element object
     * @returns {SVGElement} Created SVG element
     */
    createShapeSVGElement(element) {
        let svgElement;
        
        switch (element.type) {
            case 'rectangle':
                svgElement = this.createRectangleSVG(element);
                break;
            case 'ellipse':
                svgElement = this.createEllipseSVG(element);
                break;
            case 'diamond':
                svgElement = this.createDiamondSVG(element);
                break;
            case 'parallelogram':
                svgElement = this.createParallelogramSVG(element);
                break;
            case 'star':
                svgElement = this.createStarSVG(element);
                break;
            default:
                console.warn(`Unknown shape type: ${element.type}`);
                svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        }
        
        return svgElement;
    },

    /**
     * Create rectangle SVG element
     * @param {Object} element - Element object
     * @returns {SVGRectElement} Rectangle SVG element
     */
    createRectangleSVG(element) {
        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        svgElement.setAttribute('data-element-id', element.id);
        svgElement.setAttribute('class', 'sww-element');
        return svgElement;
    },

    /**
     * Create ellipse SVG element
     * @param {Object} element - Element object
     * @returns {SVGEllipseElement} Ellipse SVG element
     */
    createEllipseSVG(element) {
        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        svgElement.setAttribute('data-element-id', element.id);
        svgElement.setAttribute('class', 'sww-element');
        return svgElement;
    },

    /**
     * Create diamond SVG element (as polygon)
     * @param {Object} element - Element object
     * @returns {SVGPolygonElement} Diamond SVG element
     */
    createDiamondSVG(element) {
        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        svgElement.setAttribute('data-element-id', element.id);
        svgElement.setAttribute('class', 'sww-element');
        return svgElement;
    },

    /**
     * Create parallelogram SVG element (as polygon)
     * @param {Object} element - Element object
     * @returns {SVGPolygonElement} Parallelogram SVG element
     */
    createParallelogramSVG(element) {
        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        svgElement.setAttribute('data-element-id', element.id);
        svgElement.setAttribute('class', 'sww-element');
        return svgElement;
    },

    /**
     * Create star SVG element (as polygon)
     * @param {Object} element - Element object
     * @returns {SVGPolygonElement} Star SVG element
     */
    createStarSVG(element) {
        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        svgElement.setAttribute('data-element-id', element.id);
        svgElement.setAttribute('class', 'sww-element');
        return svgElement;
    },

    /**
     * Update rectangle SVG attributes
     * @param {Object} element - Element object with SVG reference
     */
    updateRectangleSVG(element) {
        const svg = element.svgElement;
        if (!svg) return;
        
        // Handle negative dimensions for northwest direction
        const rectX = element.width < 0 ? element.x + element.width : element.x;
        const rectY = element.height < 0 ? element.y + element.height : element.y;
        
        svg.setAttribute('x', rectX);
        svg.setAttribute('y', rectY);
        svg.setAttribute('width', Math.abs(element.width));
        svg.setAttribute('height', Math.abs(element.height));
    },

    /**
     * Update ellipse SVG attributes
     * @param {Object} element - Element object with SVG reference
     */
    updateEllipseSVG(element) {
        const svg = element.svgElement;
        if (!svg) return;
        
        const cx = element.x + element.width / 2;
        const cy = element.y + element.height / 2;
        const rx = Math.abs(element.width) / 2;
        const ry = Math.abs(element.height) / 2;
        
        svg.setAttribute('cx', cx);
        svg.setAttribute('cy', cy);
        svg.setAttribute('rx', rx);
        svg.setAttribute('ry', ry);
    },

    /**
     * Update diamond SVG attributes
     * @param {Object} element - Element object with SVG reference
     */
    updateDiamondSVG(element) {
        const svg = element.svgElement;
        if (!svg) return;
        
        const cx = element.x + element.width / 2;
        const cy = element.y + element.height / 2;
        const w = Math.abs(element.width) / 2;
        const h = Math.abs(element.height) / 2;
        
        // Diamond points: top, right, bottom, left
        const points = `${cx},${cy - h} ${cx + w},${cy} ${cx},${cy + h} ${cx - w},${cy}`;
        svg.setAttribute('points', points);
    },

    /**
     * Update parallelogram SVG attributes
     * @param {Object} element - Element object with SVG reference
     */
    updateParallelogramSVG(element) {
        const svg = element.svgElement;
        if (!svg) return;
        
        const skew = element.width * 0.2; // 20% skew
        
        // Parallelogram points: top-left, top-right, bottom-right, bottom-left
        const points = `${element.x + skew},${element.y} ${element.x + element.width},${element.y} ${element.x + element.width - skew},${element.y + element.height} ${element.x},${element.y + element.height}`;
        svg.setAttribute('points', points);
    },

    /**
     * Update star SVG attributes
     * @param {Object} element - Element object with SVG reference
     */
    updateStarSVG(element) {
        const svg = element.svgElement;
        if (!svg) return;
        
        const points = this.createStarPoints(element.x, element.y, element.width, element.height);
        svg.setAttribute('points', points);
    },

    /**
     * Generate star polygon points
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Star width
     * @param {number} height - Star height
     * @returns {string} SVG points string
     */
    createStarPoints(x, y, width, height) {
        const cx = x + width / 2;
        const cy = y + height / 2;
        const outerRadius = Math.min(Math.abs(width), Math.abs(height)) / 2;
        const innerRadius = outerRadius * 0.4; // Inner radius is 40% of outer
        const numPoints = 5; // 5-pointed star
        const points = [];
        
        for (let i = 0; i < numPoints * 2; i++) {
            const angle = (Math.PI / numPoints) * i - Math.PI / 2; // Start from top
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const px = cx + radius * Math.cos(angle);
            const py = cy + radius * Math.sin(angle);
            points.push(`${px},${py}`);
        }
        
        return points.join(' ');
    },

    /**
     * Check if a tool is a shape tool
     * @param {string} toolName - Tool name to check
     * @returns {boolean} True if tool is a shape tool
     */
    isShapeToolType(toolName) {
        const shapeTools = ['rectangle', 'ellipse', 'diamond', 'parallelogram', 'star'];
        return shapeTools.includes(toolName);
    },

    /**
     * Get default settings for shape elements
     * @returns {Object} Default shape settings
     */
    getShapeDefaults() {
        return {
            strokeWidth: 2,
            fillColor: '#ffffff',
            fillStyle: 'solid'
        };
    }
};
