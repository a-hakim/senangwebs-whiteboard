/**
 * DrawTool.js - Freehand path drawing tool
 *
 * Provides the entry point for freehand drawing. Pointer tracking is routed
 * through core/eventHandlers.js (updateCurrentElement / finishCurrentElement),
 * and path rendering is handled by rendering/SVGRenderer.js.
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
    }
};
