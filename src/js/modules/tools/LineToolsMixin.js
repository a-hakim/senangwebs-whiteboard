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
    }
};
