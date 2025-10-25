/**
 * SelectionBox.js - Drag-to-select box functionality
 * 
 * Provides visual drag-to-select box for multi-element selection.
 * Handles box rendering, drag interaction, and element intersection detection.
 * 
 * Responsibilities:
 * - Selection box SVG rendering
 * - Drag interaction handling (start, update, finish)
 * - Element intersection calculation
 * - Visual feedback during selection
 * - Multi-select with Shift key support
 * 
 * Key Features:
 * - Drag from empty canvas to create selection box
 * - Real-time box size updates during drag
 * - Intersection detection with all elements
 * - Minimum box size threshold (5x5 pixels)
 * - Auto-cleanup after selection
 * 
 * Dependencies:
 * - this.svg - Canvas SVG element
 * - this.selectionGroup - SVG group for selection UI
 * - this.elements - Element array
 * - this.selectElement() - From SelectionManager
 * - this.selectMultiple() - From SelectionManager
 * - this.clearSelection() - From SelectionManager
 * - this.getElementBounds() - Element bounds calculation (legacy)
 * 
 * @module SelectionBox
 * @since Phase 4 - Selection System Extraction
 */

/**
 * SelectionBox mixin - adds drag-to-select box capabilities
 */
export const SelectionBoxMixin = {
    /**
     * Initialize selection box system
     * Called during instance initialization
     */
    initializeSelectionBox() {
        // Selection box state is already initialized in SWWInstance constructor
        // this.isCreatingSelectionBox = false;
        // this.currentSelectionBox = null;
        // this.selectionBoxStart = null;
        
        // No additional initialization needed at this time
    },

    /**
     * Start creating a selection box
     * Called on mousedown/pointerdown on empty canvas
     * 
     * @param {Object} startPoint - Starting point {x, y} in canvas coordinates
     * @param {boolean} addToSelection - If true (Shift held), add to existing selection
     */
    startSelectionBox(startPoint, addToSelection = false) {
        // Clear existing selection unless adding to it
        if (!addToSelection) {
            this.clearSelection();
        }

        // Store start point and state
        this.selectionBoxStart = startPoint;
        this.isCreatingSelectionBox = true;
        this.selectionBoxAdditive = addToSelection;

        // Create the selection box SVG element
        this.currentSelectionBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this.currentSelectionBox.setAttribute('class', 'sww-selection-box');
        this.currentSelectionBox.setAttribute('x', startPoint.x);
        this.currentSelectionBox.setAttribute('y', startPoint.y);
        this.currentSelectionBox.setAttribute('width', 0);
        this.currentSelectionBox.setAttribute('height', 0);
        
        // Add to selection group (above elements, below handles)
        this.selectionGroup.appendChild(this.currentSelectionBox);
    },

    /**
     * Update selection box during drag
     * Called on mousemove/pointermove while creating selection box
     * 
     * @param {Object} currentPoint - Current pointer position {x, y} in canvas coordinates
     */
    updateSelectionBox(currentPoint) {
        if (!this.isCreatingSelectionBox || !this.currentSelectionBox) return;

        const startPoint = this.selectionBoxStart;
        
        // Calculate box bounds (handle dragging in any direction)
        const x = Math.min(startPoint.x, currentPoint.x);
        const y = Math.min(startPoint.y, currentPoint.y);
        const width = Math.abs(currentPoint.x - startPoint.x);
        const height = Math.abs(currentPoint.y - startPoint.y);

        // Update selection box SVG attributes
        this.currentSelectionBox.setAttribute('x', x);
        this.currentSelectionBox.setAttribute('y', y);
        this.currentSelectionBox.setAttribute('width', width);
        this.currentSelectionBox.setAttribute('height', height);
    },

    /**
     * Finish creating selection box
     * Called on mouseup/pointerup after dragging
     * Selects all elements intersecting with the box
     * 
     * @param {Object} endPoint - End point {x, y} in canvas coordinates
     */
    finishSelectionBox(endPoint) {
        if (!this.isCreatingSelectionBox) return;

        const startPoint = this.selectionBoxStart;
        
        // Calculate final box bounds
        const x = Math.min(startPoint.x, endPoint.x);
        const y = Math.min(startPoint.y, endPoint.y);
        const width = Math.abs(endPoint.x - startPoint.x);
        const height = Math.abs(endPoint.y - startPoint.y);

        // Only select if selection box is big enough (avoid accidental micro-drags)
        const MIN_BOX_SIZE = 5; // pixels
        if (width > MIN_BOX_SIZE && height > MIN_BOX_SIZE) {
            // Get all elements that intersect with the selection box
            const intersectingElements = this.getElementsInSelectionBox(x, y, width, height);
            
            // Select the intersecting elements
            if (intersectingElements.length > 0) {
                if (this.selectionBoxAdditive) {
                    // Add to existing selection
                    intersectingElements.forEach(element => {
                        this.selectElement(element, true); // Add to selection
                    });
                } else {
                    // Replace existing selection
                    this.selectMultiple(intersectingElements, false);
                }
            }
        }

        // Clean up selection box
        this.cancelSelectionBox();
    },

    /**
     * Cancel selection box without selecting elements
     * Called on Escape key or other cancellation
     */
    cancelSelectionBox() {
        // Remove selection box SVG element
        if (this.currentSelectionBox) {
            this.currentSelectionBox.remove();
            this.currentSelectionBox = null;
        }

        // Reset state
        this.isCreatingSelectionBox = false;
        this.selectionBoxStart = null;
        this.selectionBoxAdditive = false;
    },

    /**
     * Get all elements that intersect with the selection box
     * 
     * @param {number} boxX - Selection box x coordinate
     * @param {number} boxY - Selection box y coordinate
     * @param {number} boxWidth - Selection box width
     * @param {number} boxHeight - Selection box height
     * @returns {Array<Object>} Array of intersecting elements
     */
    getElementsInSelectionBox(boxX, boxY, boxWidth, boxHeight) {
        const intersecting = [];

        this.elements.forEach(element => {
            // Skip hidden and locked elements
            if (element.hidden || element.locked) return;

            // Check if element intersects with selection box
            if (this.isElementInSelectionBox(element, boxX, boxY, boxWidth, boxHeight)) {
                intersecting.push(element);
            }
        });

        return intersecting;
    },

    /**
     * Check if an element intersects with the selection box
     * Uses axis-aligned bounding box (AABB) intersection test
     * 
     * @param {Object} element - Element to test
     * @param {number} boxX - Selection box x coordinate
     * @param {number} boxY - Selection box y coordinate
     * @param {number} boxWidth - Selection box width
     * @param {number} boxHeight - Selection box height
     * @returns {boolean} True if element intersects with box
     */
    isElementInSelectionBox(element, boxX, boxY, boxWidth, boxHeight) {
        const bounds = this.getElementBounds(element);

        // AABB intersection test
        // Elements do NOT intersect if:
        // - element is completely to the right of box
        // - element is completely to the left of box
        // - element is completely below box
        // - element is completely above box
        // Otherwise, they intersect
        const noIntersection = (
            bounds.x > boxX + boxWidth ||           // element to the right
            bounds.x + bounds.width < boxX ||       // element to the left
            bounds.y > boxY + boxHeight ||          // element below
            bounds.y + bounds.height < boxY         // element above
        );

        return !noIntersection;
    },

    /**
     * Get selection box bounds (for testing/debugging)
     * 
     * @returns {Object|null} {x, y, width, height} or null if no active box
     */
    getSelectionBoxBounds() {
        if (!this.isCreatingSelectionBox || !this.currentSelectionBox) return null;

        return {
            x: parseFloat(this.currentSelectionBox.getAttribute('x')),
            y: parseFloat(this.currentSelectionBox.getAttribute('y')),
            width: parseFloat(this.currentSelectionBox.getAttribute('width')),
            height: parseFloat(this.currentSelectionBox.getAttribute('height'))
        };
    },

    /**
     * Check if currently creating a selection box
     * 
     * @returns {boolean} True if selection box is active
     */
    isCreatingBox() {
        return this.isCreatingSelectionBox;
    }
};
