/**
 * SelectionTool.js
 * Handles the selection tool behavior - selecting, dragging, and manipulating elements
 */

export const SelectionToolMixin = {
    /**
     * Handle selection tool pointer down
     * Determines if clicking on an element or starting a selection box
     * @param {Object} point - {x, y} coordinates
     * @param {Event} e - Original pointer event
     */
    handleSelectStart(point, e) {
        const element = this.getElementAtPoint(point);
        
        if (element) {
            // Check if element is locked
            if (element.locked) {
                // Allow selection but prevent manipulation
                if (!e.shiftKey && !this.selectedElements.has(element)) {
                    this.clearSelection();
                }
                this.selectElement(element);
                return; // Don't start dragging
            }
            
            // Handle multi-selection logic
            if (e.shiftKey) {
                // Shift+click: toggle element in/out of selection
                if (this.selectedElements.has(element)) {
                    this.deselectElement(element);
                } else {
                    this.selectElement(element);
                }
            } else {
                // Regular click
                if (!this.selectedElements.has(element)) {
                    // Element not selected: clear others and select this one
                    this.clearSelection();
                    this.selectElement(element);
                }
                // If element is already selected: keep all selections for group drag
            }
            
            // Check if any selected elements are locked
            const hasLockedElements = Array.from(this.selectedElements).some(el => el.locked);
            if (hasLockedElements) {
                return; // Don't start dragging if any elements are locked
            }
            
            // Start dragging the selected element(s)
            // This will drag ALL selected elements together
            this.isDraggingElement = true;
            this.manipulationMode = 'move';
            this.dragStartPoint = point;
            
            // Update cursor to show grabbing state
            this.svg.style.cursor = 'grabbing';
            
            // Store initial positions of all selected elements
            this.selectedElements.forEach(el => {
                el.dragStartX = el.x;
                el.dragStartY = el.y;
            });
        } else {
            if (!e.shiftKey) {
                this.clearSelection();
            }
            // Start selection box
            this.startSelectionBox(point);
        }
    }
};
