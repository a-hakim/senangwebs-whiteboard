/**
 * Viewport.js
 * Viewport management - zoom, pan, and view transformations
 * Part of Phase 6: Features
 * 
 * Provides methods for:
 * - Zoom in/out with mouse wheel
 * - Pan/drag canvas view
 * - ViewBox management and updates
 * - Pointer position calculations
 * - Cursor state management
 */

export const ViewportMixin = {
    /**
     * Handle mouse wheel events for zooming
     * @param {WheelEvent} e - The wheel event
     */
    handleWheel(e) {
        // Only zoom when Ctrl or Cmd key is pressed
        if (!e.ctrlKey && !e.metaKey) {
            // Allow normal scroll behavior when modifier key is not pressed
            return;
        }
        
        e.preventDefault();
        const point = this.getPointerPosition(e);
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        
        // Update zoom level with constraints
        this.zoom *= zoomFactor;
        this.zoom = Math.max(0.1, Math.min(5, this.zoom));
        
        // Calculate new viewBox dimensions
        const newWidth = this.viewBox.width / zoomFactor;
        const newHeight = this.viewBox.height / zoomFactor;
        
        // Zoom towards pointer position
        const dx = (this.viewBox.width - newWidth) * (point.x - this.viewBox.x) / this.viewBox.width;
        const dy = (this.viewBox.height - newHeight) * (point.y - this.viewBox.y) / this.viewBox.height;
        
        this.viewBox.x += dx;
        this.viewBox.y += dy;
        this.viewBox.width = newWidth;
        this.viewBox.height = newHeight;
        
        this.updateViewBox();
    },

    /**
     * Zoom in (centered on current view)
     */
    zoomIn() {
        const zoomFactor = 1.1;
        this.zoom *= zoomFactor;
        this.zoom = Math.max(0.1, Math.min(5, this.zoom));
        
        // Center zoom on current viewBox center
        const centerX = this.viewBox.x + this.viewBox.width / 2;
        const centerY = this.viewBox.y + this.viewBox.height / 2;
        
        const newWidth = this.viewBox.width / zoomFactor;
        const newHeight = this.viewBox.height / zoomFactor;
        
        this.viewBox.x = centerX - newWidth / 2;
        this.viewBox.y = centerY - newHeight / 2;
        this.viewBox.width = newWidth;
        this.viewBox.height = newHeight;
        
        this.updateViewBox();
        
        // Update visible elements for performance
        if (this.elements.length > 100 && this.updateVisibleElements) {
            this.updateVisibleElements();
        }
    },

    /**
     * Zoom out (centered on current view)
     */
    zoomOut() {
        const zoomFactor = 0.9;
        this.zoom *= zoomFactor;
        this.zoom = Math.max(0.1, Math.min(5, this.zoom));
        
        // Center zoom on current viewBox center
        const centerX = this.viewBox.x + this.viewBox.width / 2;
        const centerY = this.viewBox.y + this.viewBox.height / 2;
        
        const newWidth = this.viewBox.width / zoomFactor;
        const newHeight = this.viewBox.height / zoomFactor;
        
        this.viewBox.x = centerX - newWidth / 2;
        this.viewBox.y = centerY - newHeight / 2;
        this.viewBox.width = newWidth;
        this.viewBox.height = newHeight;
        
        this.updateViewBox();
        
        // Update visible elements for performance
        if (this.elements.length > 100 && this.updateVisibleElements) {
            this.updateVisibleElements();
        }
    },

    /**
     * Reset zoom to 100% and center view
     */
    resetZoom() {
        this.zoom = 1;
        this.viewBox = { x: 0, y: 0, width: 1000, height: 1000 };
        this.updateViewBox();
        
        // Update visible elements for performance
        if (this.elements.length > 100 && this.updateVisibleElements) {
            this.updateVisibleElements();
        }
    },

    /**
     * Zoom to fit all elements in view
     */
    zoomToFit() {
        if (this.fitCanvasToElements) {
            this.fitCanvasToElements();
        }
    },

    /**
     * Zoom to specific level
     * @param {number} zoomLevel - Target zoom level (0.1 to 5)
     */
    setZoom(zoomLevel) {
        // Constrain zoom level
        zoomLevel = Math.max(0.1, Math.min(5, zoomLevel));
        
        const zoomFactor = zoomLevel / this.zoom;
        this.zoom = zoomLevel;
        
        // Center zoom on current viewBox center
        const centerX = this.viewBox.x + this.viewBox.width / 2;
        const centerY = this.viewBox.y + this.viewBox.height / 2;
        
        const newWidth = this.viewBox.width / zoomFactor;
        const newHeight = this.viewBox.height / zoomFactor;
        
        this.viewBox.x = centerX - newWidth / 2;
        this.viewBox.y = centerY - newHeight / 2;
        this.viewBox.width = newWidth;
        this.viewBox.height = newHeight;
        
        this.updateViewBox();
        
        // Update visible elements for performance
        if (this.elements.length > 100 && this.updateVisibleElements) {
            this.updateVisibleElements();
        }
    },

    /**
     * Pan viewport by delta
     * @param {number} dx - Delta X in viewBox coordinates
     * @param {number} dy - Delta Y in viewBox coordinates
     */
    pan(dx, dy) {
        this.viewBox.x += dx;
        this.viewBox.y += dy;
        this.updateViewBox();
    },

    /**
     * Start panning operation
     * @param {Object} point - Starting point
     */
    startPan(point) {
        this.isPanning = true;
        this.panStartPoint = point;
        this.setCursor('grabbing');
    },

    /**
     * Update panning during drag
     * @param {Object} currentPoint - Current pointer position
     */
    updatePan(currentPoint) {
        if (!this.isPanning || !this.lastPointerPosition) return;
        
        const dx = currentPoint.x - this.lastPointerPosition.x;
        const dy = currentPoint.y - this.lastPointerPosition.y;
        
        this.viewBox.x -= dx;
        this.viewBox.y -= dy;
        this.updateViewBox();
    },

    /**
     * Finish panning operation
     */
    finishPan() {
        this.isPanning = false;
        this.panStartPoint = null;
        this.setCursor('default');
    },

    /**
     * Update SVG viewBox attribute
     */
    updateViewBox() {
        if (!this.svg) return;
        this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);
        
        // Update visible elements for performance optimization
        if (this.elements.length > 100 && this.updateVisibleElements) {
            this.updateVisibleElements();
        }
    },

    /**
     * Get pointer position in SVG coordinates
     * @param {MouseEvent|TouchEvent} e - The pointer event
     * @returns {Object} Point with x and y coordinates
     */
    getPointerPosition(e) {
        const rect = this.svg.getBoundingClientRect();
        const touch = e.touches?.[0] || e.changedTouches?.[0];
        const clientX = e.clientX ?? touch?.clientX ?? 0;
        const clientY = e.clientY ?? touch?.clientY ?? 0;
        
        // Use SVG's coordinate transformation if available (more accurate)
        if (this.svg.getScreenCTM) {
            const point = this.svg.createSVGPoint();
            point.x = clientX;
            point.y = clientY;
            const transformedPoint = point.matrixTransform(this.svg.getScreenCTM().inverse());
            return { x: transformedPoint.x, y: transformedPoint.y };
        }
        
        // Fallback to manual calculation
        const relativeX = clientX - rect.left;
        const relativeY = clientY - rect.top;
        
        const x = (relativeX / rect.width) * this.viewBox.width + this.viewBox.x;
        const y = (relativeY / rect.height) * this.viewBox.height + this.viewBox.y;
        
        return { x, y };
    },

    /**
     * Convert SVG coordinates to screen coordinates
     * @param {number} x - X coordinate in SVG space
     * @param {number} y - Y coordinate in SVG space
     * @returns {Object} Point with x and y in screen coordinates
     */
    svgToScreenCoordinates(x, y) {
        const rect = this.svg.getBoundingClientRect();
        
        const screenX = ((x - this.viewBox.x) / this.viewBox.width) * rect.width + rect.left;
        const screenY = ((y - this.viewBox.y) / this.viewBox.height) * rect.height + rect.top;
        
        return { x: screenX, y: screenY };
    },

    /**
     * Set cursor style
     * @param {string} cursorType - Cursor type: 'default', 'grab', 'grabbing', 'crosshair'
     */
    setCursor(cursorType) {
        if (!this.svg) return;
        
        this.svg.classList.remove('grabbing', 'grab', 'crosshair', 'default');
        if (cursorType !== 'default') {
            this.svg.classList.add(cursorType);
        }
    },

    /**
     * Get current zoom level
     * @returns {number} Current zoom level
     */
    getZoom() {
        return this.zoom;
    },

    /**
     * Get current viewBox
     * @returns {Object} ViewBox with x, y, width, height
     */
    getViewBox() {
        return { ...this.viewBox };
    },

    /**
     * Set viewBox directly
     * @param {Object} viewBox - ViewBox object with x, y, width, height
     */
    setViewBox(viewBox) {
        this.viewBox = { ...viewBox };
        this.updateViewBox();
    },

    /**
     * Center view on specific coordinates
     * @param {number} x - X coordinate to center on
     * @param {number} y - Y coordinate to center on
     */
    centerViewOn(x, y) {
        this.viewBox.x = x - this.viewBox.width / 2;
        this.viewBox.y = y - this.viewBox.height / 2;
        this.updateViewBox();
    },

    /**
     * Check if point is visible in current viewport
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if point is visible
     */
    isPointVisible(x, y) {
        return x >= this.viewBox.x && 
               x <= this.viewBox.x + this.viewBox.width &&
               y >= this.viewBox.y && 
               y <= this.viewBox.y + this.viewBox.height;
    },

    /**
     * Get viewport bounds
     * @returns {Object} Bounds with minX, minY, maxX, maxY
     */
    getViewportBounds() {
        return {
            minX: this.viewBox.x,
            minY: this.viewBox.y,
            maxX: this.viewBox.x + this.viewBox.width,
            maxY: this.viewBox.y + this.viewBox.height
        };
    }
};
