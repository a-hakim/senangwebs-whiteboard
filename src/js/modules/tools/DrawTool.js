/**
 * DrawTool.js - Freehand path drawing tool
 * 
 * Provides freehand drawing capabilities with path collection and rendering.
 * Handles pointer tracking, path point collection, and boundary calculation.
 * 
 * Responsibilities:
 * - Freehand path drawing with pointer tracking
 * - Point collection during drawing
 * - Path boundary calculation
 * - Relative coordinate conversion
 * - Path rendering and updates
 * 
 * Key Features:
 * - Smooth pointer tracking during drawing
 * - Automatic bounding box calculation
 * - Relative point storage for transformations
 * - Grid snapping support
 * - Real-time path updates
 * 
 * Dependencies:
 * - createElement() - Element creation
 * - snapToGridPoint() - Grid snapping
 * - addSVGElementToDOM() - SVG element attachment
 * - updateSVGElement() - SVG rendering
 * - addElement() - Element registration
 * - saveStateToHistory() - Undo/redo support
 * - selectElement() - Element selection
 * - clearSelection() - Selection clearing
 * 
 * @module DrawTool
 * @since Phase 3 - Tool System Extraction
 */

/**
 * DrawTool mixin - adds freehand path drawing capabilities
 */
export const DrawToolMixin = {
    /**
     * Handle freehand draw tool start (mousedown/pointerdown)
     * Creates a new path element and initializes point collection
     * 
     * @param {Object} point - Starting point {x, y}
     */
    handleDrawStart(point) {
        const snappedPoint = this.snapToGridPoint(point);
        const element = this.createElement('path', snappedPoint);
        element.points = [snappedPoint];
        this.currentElement = element;
        this.isDrawing = true;
        this.addSVGElementToDOM(element);
    },

    /**
     * Handle freehand draw tool move (mousemove/pointermove)
     * Adds points to the path during drawing
     * This is called during updateCurrentElement() for the 'path' case
     * 
     * @param {Object} point - Current pointer position {x, y}
     */
    handleDrawMove(point) {
        if (!this.currentElement || this.currentElement.type !== 'path') return;
        
        // Add point to path
        this.currentElement.points.push(point);
        
        // Update the SVG rendering
        this.updateSVGElement(this.currentElement);
    },

    /**
     * Handle freehand draw tool end (mouseup/pointerup)
     * Finalizes the path by calculating bounds and converting to relative coordinates
     * This is called by finishCurrentElement() which handles path elements specially
     * 
     * The finalization process:
     * 1. Calculate bounding box from all collected points
     * 2. Update element x, y, width, height to match bounds
     * 3. Convert all points to relative coordinates (relative to element origin)
     * 4. Add element to scene and save to history
     * 5. Select the newly created path
     */
    handleDrawEnd() {
        // Path finalization is handled by finishCurrentElement()
        // which has special logic for path elements
        // This method exists for API consistency with other tools
    },

    /**
     * Create SVG path element for freehand drawing
     * 
     * @param {Object} element - Element data with points array
     * @returns {SVGPathElement} Created path element
     */
    createDrawSVGElement(element) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        svg.setAttribute('data-element-id', element.id);
        svg.setAttribute('class', 'sww-element');
        
        element.svgElement = svg;
        this.updateDrawSVG(element);
        
        return svg;
    },

    /**
     * Update SVG path element rendering
     * Handles both absolute coordinates (during drawing) and relative coordinates (after finalization)
     * 
     * @param {Object} element - Element data with points array
     */
    updateDrawSVG(element) {
        const svg = element.svgElement;
        if (!svg) return;

        if (element.points && element.points.length > 0) {
            let pathData;
            
            // During drawing (currentElement), points are in absolute coordinates
            // After finalization, points are relative to element.x, element.y
            if (this.currentElement && this.currentElement.id === element.id) {
                // Drawing in progress - use absolute coordinates
                pathData = this.pointsToPath(element.points);
            } else {
                // Finalized path - convert relative points to absolute for rendering
                const absolutePoints = element.points.map(point => ({
                    x: point.x + element.x,
                    y: point.y + element.y
                }));
                pathData = this.pointsToPath(absolutePoints);
            }
            
            svg.setAttribute('d', pathData);
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', element.strokeColor);
            svg.setAttribute('stroke-width', element.strokeWidth);
            svg.setAttribute('stroke-linecap', 'round');
            svg.setAttribute('stroke-linejoin', 'round');
        }
    },

    /**
     * Convert array of points to SVG path data string
     * Uses simple line-to commands for now (future: bezier smoothing)
     * 
     * @param {Array<Object>} points - Array of {x, y} points
     * @returns {string} SVG path data (e.g., "M 10 20 L 30 40 L 50 60")
     */
    pointsToPath(points) {
        if (!points || points.length === 0) return '';
        
        // Start with MoveTo command for first point
        let path = `M ${points[0].x} ${points[0].y}`;
        
        // Add LineTo commands for remaining points
        for (let i = 1; i < points.length; i++) {
            path += ` L ${points[i].x} ${points[i].y}`;
        }
        
        return path;
    },

    /**
     * Calculate bounding box from array of points
     * Used during path finalization to determine element bounds
     * 
     * @param {Array<Object>} points - Array of {x, y} points
     * @returns {Object} Bounding box {minX, minY, maxX, maxY, width, height}
     */
    calculatePathBounds(points) {
        if (!points || points.length === 0) {
            return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
        }

        let minX = points[0].x;
        let minY = points[0].y;
        let maxX = points[0].x;
        let maxY = points[0].y;

        // Find min and max coordinates
        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        }

        return {
            minX,
            minY,
            maxX,
            maxY,
            width: maxX - minX,
            height: maxY - minY
        };
    },

    /**
     * Convert path points to relative coordinates
     * Used during finalization to make points relative to element origin
     * 
     * @param {Array<Object>} points - Array of absolute {x, y} points
     * @param {number} originX - Origin x coordinate (element.x)
     * @param {number} originY - Origin y coordinate (element.y)
     * @returns {Array<Object>} Array of relative {x, y} points
     */
    convertPointsToRelative(points, originX, originY) {
        return points.map(point => ({
            x: point.x - originX,
            y: point.y - originY
        }));
    },

    /**
     * Finalize path element after drawing completes
     * Calculates bounds and converts points to relative coordinates
     * This is called from finishCurrentElement() for path elements
     * 
     * @param {Object} element - Path element with absolute points
     */
    finalizePathElement(element) {
        if (!element.points || element.points.length === 0) return;

        // Calculate bounding box from all points
        const bounds = this.calculatePathBounds(element.points);

        // Update element properties to reflect actual bounds
        element.x = bounds.minX;
        element.y = bounds.minY;
        element.width = bounds.width;
        element.height = bounds.height;

        // Convert all points to relative coordinates
        element.points = this.convertPointsToRelative(
            element.points,
            bounds.minX,
            bounds.minY
        );
    }
};
