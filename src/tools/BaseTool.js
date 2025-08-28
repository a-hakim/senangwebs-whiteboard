/**
 * Base Tool Class
 * Abstract base class for all drawing tools
 */

export class BaseTool {
    constructor(name, icon = null) {
        this.name = name;
        this.icon = icon;
        this.isActive = false;
        this.currentElement = null;
        this.startPoint = null;
    }

    /**
     * Called when tool becomes active
     */
    activate(instance) {
        this.instance = instance;
        this.isActive = true;
        this.onActivate();
    }

    /**
     * Called when tool becomes inactive
     */
    deactivate() {
        this.isActive = false;
        this.currentElement = null;
        this.startPoint = null;
        this.onDeactivate();
        this.instance = null;
    }

    /**
     * Handle pointer down event
     */
    handlePointerDown(data) {
        this.startPoint = data.point;
        this.onPointerDown(data);
    }

    /**
     * Handle pointer move event
     */
    handlePointerMove(data) {
        this.onPointerMove(data);
    }

    /**
     * Handle pointer up event
     */
    handlePointerUp(data) {
        this.onPointerUp(data);
        this.startPoint = null;
    }

    /**
     * Handle double click event
     */
    handleDoubleClick(data) {
        this.onDoubleClick(data);
    }

    /**
     * Handle key down event
     */
    handleKeyDown(data) {
        this.onKeyDown(data);
    }

    /**
     * Get cursor style for this tool
     */
    getCursor() {
        return 'crosshair';
    }

    // Override these methods in subclasses

    onActivate() {
        // Override in subclasses
    }

    onDeactivate() {
        // Override in subclasses
    }

    onPointerDown(data) {
        // Override in subclasses
    }

    onPointerMove(data) {
        // Override in subclasses
    }

    onPointerUp(data) {
        // Override in subclasses
    }

    onDoubleClick(data) {
        // Override in subclasses
    }

    onKeyDown(data) {
        // Override in subclasses
    }

    // Helper methods

    createElement(type, point) {
        if (!this.instance) return null;
        return this.instance.elementFactory.createElement(type, point, this.instance.toolSettings);
    }

    addElement(element) {
        if (!this.instance) return;
        this.instance.addElement(element);
    }

    updateElement(element) {
        if (!this.instance) return;
        this.instance.updateElement(element);
    }

    finishElement() {
        if (this.currentElement && this.instance) {
            this.instance.finishElement(this.currentElement);
            this.currentElement = null;
        }
    }

    snapToGrid(point) {
        if (!this.instance || !this.instance.options.snapToGrid) return point;
        
        const gridSize = this.instance.options.gridSize || 20;
        return {
            x: Math.round(point.x / gridSize) * gridSize,
            y: Math.round(point.y / gridSize) * gridSize
        };
    }

    isDrawing() {
        return this.currentElement !== null;
    }
}
