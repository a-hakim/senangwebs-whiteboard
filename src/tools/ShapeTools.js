/**
 * Shape Tools
 * Tools for creating geometric shapes (rectangle, ellipse, diamond)
 */

import { BaseTool } from './BaseTool.js';

export class RectangleTool extends BaseTool {
    constructor() {
        super('rectangle', 'far fa-square');
    }

    onPointerDown(data) {
        const point = this.snapToGrid(data.point);
        this.currentElement = this.createElement('rectangle', point);
        this.addElement(this.currentElement);
    }

    onPointerMove(data) {
        if (!this.isDrawing()) return;

        const point = this.snapToGrid(data.point);
        const width = point.x - this.startPoint.x;
        const height = point.y - this.startPoint.y;

        // Handle negative dimensions
        this.currentElement.x = Math.min(this.startPoint.x, point.x);
        this.currentElement.y = Math.min(this.startPoint.y, point.y);
        this.currentElement.width = Math.abs(width);
        this.currentElement.height = Math.abs(height);

        this.updateElement(this.currentElement);
    }

    onPointerUp(data) {
        if (this.isDrawing()) {
            // Minimum size check
            if (this.currentElement.width < 5 || this.currentElement.height < 5) {
                this.currentElement.width = Math.max(this.currentElement.width, 50);
                this.currentElement.height = Math.max(this.currentElement.height, 50);
                this.updateElement(this.currentElement);
            }
            
            this.finishElement();
        }
    }

    onKeyDown(data) {
        if (data.shiftKey && this.isDrawing()) {
            // Make square when shift is held
            const size = Math.min(this.currentElement.width, this.currentElement.height);
            this.currentElement.width = size;
            this.currentElement.height = size;
            this.updateElement(this.currentElement);
        }
    }
}

export class EllipseTool extends BaseTool {
    constructor() {
        super('ellipse', 'far fa-circle');
    }

    onPointerDown(data) {
        const point = this.snapToGrid(data.point);
        this.currentElement = this.createElement('ellipse', point);
        this.addElement(this.currentElement);
    }

    onPointerMove(data) {
        if (!this.isDrawing()) return;

        const point = this.snapToGrid(data.point);
        const width = point.x - this.startPoint.x;
        const height = point.y - this.startPoint.y;

        // Handle negative dimensions
        this.currentElement.x = Math.min(this.startPoint.x, point.x);
        this.currentElement.y = Math.min(this.startPoint.y, point.y);
        this.currentElement.width = Math.abs(width);
        this.currentElement.height = Math.abs(height);

        this.updateElement(this.currentElement);
    }

    onPointerUp(data) {
        if (this.isDrawing()) {
            // Minimum size check
            if (this.currentElement.width < 5 || this.currentElement.height < 5) {
                this.currentElement.width = Math.max(this.currentElement.width, 50);
                this.currentElement.height = Math.max(this.currentElement.height, 50);
                this.updateElement(this.currentElement);
            }
            
            this.finishElement();
        }
    }

    onKeyDown(data) {
        if (data.shiftKey && this.isDrawing()) {
            // Make circle when shift is held
            const size = Math.min(this.currentElement.width, this.currentElement.height);
            this.currentElement.width = size;
            this.currentElement.height = size;
            this.updateElement(this.currentElement);
        }
    }
}

export class DiamondTool extends BaseTool {
    constructor() {
        super('diamond', 'far fa-gem');
    }

    onPointerDown(data) {
        const point = this.snapToGrid(data.point);
        this.currentElement = this.createElement('diamond', point);
        this.addElement(this.currentElement);
    }

    onPointerMove(data) {
        if (!this.isDrawing()) return;

        const point = this.snapToGrid(data.point);
        const width = point.x - this.startPoint.x;
        const height = point.y - this.startPoint.y;

        // Handle negative dimensions
        this.currentElement.x = Math.min(this.startPoint.x, point.x);
        this.currentElement.y = Math.min(this.startPoint.y, point.y);
        this.currentElement.width = Math.abs(width);
        this.currentElement.height = Math.abs(height);

        this.updateElement(this.currentElement);
    }

    onPointerUp(data) {
        if (this.isDrawing()) {
            // Minimum size check
            if (this.currentElement.width < 5 || this.currentElement.height < 5) {
                this.currentElement.width = Math.max(this.currentElement.width, 50);
                this.currentElement.height = Math.max(this.currentElement.height, 50);
                this.updateElement(this.currentElement);
            }
            
            this.finishElement();
        }
    }

    onKeyDown(data) {
        if (data.shiftKey && this.isDrawing()) {
            // Make square diamond when shift is held
            const size = Math.min(this.currentElement.width, this.currentElement.height);
            this.currentElement.width = size;
            this.currentElement.height = size;
            this.updateElement(this.currentElement);
        }
    }
}
