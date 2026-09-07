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

};
