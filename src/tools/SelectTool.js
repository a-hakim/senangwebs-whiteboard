/**
 * Select Tool
 * Handles element selection, movement, and manipulation
 */

import { BaseTool } from './BaseTool.js';
import { isPointInRect, distanceBetweenPoints } from '../utils/helpers.js';

export class SelectTool extends BaseTool {
    constructor() {
        super('select', 'fas fa-mouse-pointer');
        
        // Selection state
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
        this.isCreatingSelectionBox = false;
        
        // Manipulation state
        this.dragStartPoint = null;
        this.resizeHandle = null;
        this.selectionBox = null;
        this.selectionBoxStart = null;
        
        // Drag threshold to distinguish between click and drag
        this.dragThreshold = 3;
    }

    onActivate() {
        if (this.instance) {
            this.instance.canvas.svg.style.cursor = 'default';
        }
    }

    onPointerDown(data) {
        const { point, shiftKey, ctrlKey } = data;
        
        // Check if clicking on a resize handle
        const handle = this.getResizeHandleAtPoint(point);
        if (handle) {
            this.startResize(handle, point);
            return;
        }

        // Check if clicking on rotation handle
        if (this.isRotationHandle(point)) {
            this.startRotation(point);
            return;
        }

        // Check if clicking on an element
        const element = this.instance.getElementAtPoint(point);
        
        if (element) {
            if (shiftKey || ctrlKey) {
                // Multi-select
                this.instance.toggleElementSelection(element);
            } else if (!this.instance.isElementSelected(element)) {
                // Select single element
                this.instance.selectElement(element);
            }
            
            // Start dragging if element is selected
            if (this.instance.isElementSelected(element)) {
                this.startDrag(point);
            }
        } else {
            // Click on empty space
            if (!shiftKey && !ctrlKey) {
                this.instance.clearSelection();
            }
            
            // Start selection box
            this.startSelectionBox(point);
        }
    }

    onPointerMove(data) {
        const { point, isDown } = data;
        
        if (!isDown || !this.startPoint) return;

        const distance = distanceBetweenPoints(this.startPoint, point);
        
        if (this.isResizing) {
            this.updateResize(point);
        } else if (this.isRotating) {
            this.updateRotation(point);
        } else if (this.isDragging) {
            this.updateDrag(point);
        } else if (this.isCreatingSelectionBox) {
            this.updateSelectionBox(point);
        } else if (distance > this.dragThreshold) {
            // Start appropriate action based on what was clicked
            const element = this.instance.getElementAtPoint(this.startPoint);
            if (element && this.instance.isElementSelected(element)) {
                this.startDrag(this.startPoint);
            } else {
                this.startSelectionBox(this.startPoint);
            }
        }
    }

    onPointerUp(data) {
        const { point } = data;
        
        if (this.isResizing) {
            this.finishResize();
        } else if (this.isRotating) {
            this.finishRotation();
        } else if (this.isDragging) {
            this.finishDrag();
        } else if (this.isCreatingSelectionBox) {
            this.finishSelectionBox(point);
        }
        
        this.resetState();
    }

    onDoubleClick(data) {
        const { point } = data;
        const element = this.instance.getElementAtPoint(point);
        
        if (element && element.type === 'text') {
            this.instance.startTextEditing(element);
        }
    }

    onKeyDown(data) {
        const { code, key } = data;
        
        switch (code) {
            case 'Delete':
            case 'Backspace':
                this.instance.deleteSelectedElements();
                break;
            case 'Escape':
                this.instance.clearSelection();
                break;
        }
    }

    // Drag operations

    startDrag(point) {
        this.isDragging = true;
        this.dragStartPoint = point;
        this.instance.canvas.svg.style.cursor = 'move';
        
        // Save initial positions for undo
        this.instance.saveStateToHistory('dragStart');
    }

    updateDrag(point) {
        if (!this.isDragging || !this.dragStartPoint) return;
        
        const deltaX = point.x - this.dragStartPoint.x;
        const deltaY = point.y - this.dragStartPoint.y;
        
        // Snap to grid if enabled
        let snappedDelta = { x: deltaX, y: deltaY };
        if (this.instance.options.snapToGrid) {
            const gridSize = this.instance.options.gridSize;
            snappedDelta.x = Math.round(deltaX / gridSize) * gridSize;
            snappedDelta.y = Math.round(deltaY / gridSize) * gridSize;
        }
        
        this.instance.moveSelectedElements(snappedDelta.x, snappedDelta.y);
        this.dragStartPoint = {
            x: this.dragStartPoint.x + snappedDelta.x,
            y: this.dragStartPoint.y + snappedDelta.y
        };
    }

    finishDrag() {
        if (this.isDragging) {
            this.instance.canvas.svg.style.cursor = 'default';
            this.instance.saveStateToHistory('dragEnd');
        }
    }

    // Selection box operations

    startSelectionBox(point) {
        this.isCreatingSelectionBox = true;
        this.selectionBoxStart = point;
        this.selectionBox = this.instance.createSelectionBoxElement(point);
    }

    updateSelectionBox(point) {
        if (!this.isCreatingSelectionBox || !this.selectionBoxStart) return;
        
        this.instance.updateSelectionBoxElement(this.selectionBox, this.selectionBoxStart, point);
    }

    finishSelectionBox(point) {
        if (!this.isCreatingSelectionBox || !this.selectionBoxStart) return;
        
        const box = {
            x: Math.min(this.selectionBoxStart.x, point.x),
            y: Math.min(this.selectionBoxStart.y, point.y),
            width: Math.abs(point.x - this.selectionBoxStart.x),
            height: Math.abs(point.y - this.selectionBoxStart.y)
        };
        
        // Select elements within the box
        const elementsInBox = this.instance.getElementsInBox(box);
        if (elementsInBox.length > 0) {
            this.instance.selectElements(elementsInBox);
        }
        
        // Remove selection box
        this.instance.removeSelectionBoxElement(this.selectionBox);
    }

    // Resize operations

    startResize(handle, point) {
        this.isResizing = true;
        this.resizeHandle = handle;
        this.dragStartPoint = point;
        this.instance.canvas.svg.style.cursor = this.getResizeCursor(handle);
        
        this.instance.saveStateToHistory('resizeStart');
    }

    updateResize(point) {
        if (!this.isResizing || !this.resizeHandle) return;
        
        this.instance.resizeSelectedElements(this.resizeHandle, point, this.dragStartPoint);
    }

    finishResize() {
        if (this.isResizing) {
            this.instance.canvas.svg.style.cursor = 'default';
            this.instance.saveStateToHistory('resizeEnd');
        }
    }

    // Rotation operations

    startRotation(point) {
        this.isRotating = true;
        this.dragStartPoint = point;
        this.instance.canvas.svg.style.cursor = 'grab';
        
        this.instance.saveStateToHistory('rotateStart');
    }

    updateRotation(point) {
        if (!this.isRotating) return;
        
        this.instance.rotateSelectedElements(point, this.dragStartPoint);
    }

    finishRotation() {
        if (this.isRotating) {
            this.instance.canvas.svg.style.cursor = 'default';
            this.instance.saveStateToHistory('rotateEnd');
        }
    }

    // Helper methods

    getResizeHandleAtPoint(point) {
        // Implementation depends on how resize handles are rendered
        // This would check if the point is over a resize handle
        return this.instance.getResizeHandleAtPoint(point);
    }

    isRotationHandle(point) {
        // Check if point is over rotation handle
        return this.instance.isRotationHandleAtPoint(point);
    }

    getResizeCursor(handle) {
        const cursors = {
            'nw': 'nw-resize',
            'n': 'n-resize',
            'ne': 'ne-resize',
            'e': 'e-resize',
            'se': 'se-resize',
            's': 's-resize',
            'sw': 'sw-resize',
            'w': 'w-resize'
        };
        return cursors[handle] || 'default';
    }

    resetState() {
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
        this.isCreatingSelectionBox = false;
        this.dragStartPoint = null;
        this.resizeHandle = null;
        this.selectionBox = null;
        this.selectionBoxStart = null;
        
        if (this.instance) {
            this.instance.canvas.svg.style.cursor = 'default';
        }
    }

    getCursor() {
        return 'default';
    }
}
