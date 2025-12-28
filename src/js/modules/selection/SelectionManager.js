/**
 * SelectionManager.js - Core selection state and operations
 * 
 * Manages element selection state, including single and multi-select operations.
 * Handles selection changes, visual feedback, and selection queries.
 * 
 * Responsibilities:
 * - Selection state management (Set of selected elements)
 * - Add/remove elements from selection
 * - Selection validation and locked element handling
 * - Group selection support
 * - Selection change notifications
 * - Selection bounds calculation
 * 
 * Key Features:
 * - Single and multi-select support
 * - Shift-click to add/remove from selection
 * - Group-aware selection (select all elements in group)
 * - Locked element protection
 * - CSS class management for visual feedback
 * - Integration with properties panel and layers
 * 
 * Dependencies:
 * - this.elements - Element array
 * - this.updateSelectionHandles() - Handle rendering (legacy)
 * - this.syncPropertiesPanel() - Properties panel sync (legacy)
 * - this.clearSelectionHandles() - Handle cleanup (legacy)
 * - this.saveStateToHistory() - History tracking (legacy)
 * - this.updateSVGElement() - Element re-rendering (legacy)
 * - this.removeElement() - Element removal (legacy)
 * 
 * @module SelectionManager
 * @since Phase 4 - Selection System Extraction
 */

/**
 * SelectionManager mixin - adds selection state management capabilities
 */
export const SelectionManagerMixin = {
    /**
     * Initialize selection system
     * Called during instance initialization
     */
    initializeSelectionSystem() {
        // Selection state is already initialized in SWWInstance constructor
        // this.selectedElements = new Set();
        
        // No additional initialization needed at this time
        // Future: Custom event system for selection changes
    },

    /**
     * Select an element and add it to the selection
     * Handles group selection automatically
     * 
     * @param {Object} element - Element to select
     * @param {boolean} addToSelection - If true, add to existing selection (default: false)
     */
    selectElement(element, addToSelection = false) {
        if (!element) return;

        // Clear existing selection unless adding to it
        if (!addToSelection) {
            this.clearSelection();
        }

        // If element is in a group, select all elements in the group
        if (element.groupId) {
            const groupElements = this.elements.filter(el => el.groupId === element.groupId);
            groupElements.forEach(groupElement => {
                this.addElementToSelection(groupElement);
            });
        } else {
            this.addElementToSelection(element);
        }

        // Update UI to reflect selection
        this.updateSelectionHandles();
        this.syncPropertiesPanel();

        // Ensure UI state is properly updated after selection change
        setTimeout(() => {
            this.updateTextPropertiesVisibility();

            // Update layers panel to reflect selection changes
            if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
                window.swwControlPanel.updateLayers();
            }
        }, 0);
    },

    /**
     * Add a single element to the selection (internal)
     * Applies visual selection class
     * 
     * @param {Object} element - Element to add
     */
    addElementToSelection(element) {
        if (!element || !element.svgElement) return;

        this.selectedElements.add(element);

        // Add 'selected' CSS class for visual feedback
        const currentClass = element.svgElement.getAttribute('class') || '';
        if (!currentClass.includes('selected')) {
            element.svgElement.setAttribute('class', currentClass + ' selected');
        }
    },

    /**
     * Deselect a specific element
     * Removes from selection and updates visual state
     * 
     * @param {Object} element - Element to deselect
     */
    deselectElement(element) {
        if (!element || !this.selectedElements.has(element)) return;

        this.selectedElements.delete(element);

        // Remove 'selected' CSS class
        if (element.svgElement) {
            const currentClass = element.svgElement.getAttribute('class') || '';
            element.svgElement.setAttribute('class', currentClass.replace('selected', '').trim());
        }

        // Update UI
        this.updateSelectionHandles();
        this.syncPropertiesPanel();
    },

    /**
     * Toggle element selection
     * If selected, deselect. If not selected, select.
     * 
     * @param {Object} element - Element to toggle
     */
    toggleElementSelection(element) {
        if (this.isSelected(element)) {
            this.deselectElement(element);
        } else {
            this.selectElement(element, true); // Add to existing selection
        }
    },

    /**
     * Clear all selected elements
     * Commits any pending properties panel changes first
     */
    clearSelection() {
        // Commit any pending changes in properties panel before clearing selection
        this.commitPropertiesPanelChanges();

        // Remove visual selection class from all selected elements
        this.selectedElements.forEach(element => {
            if (element.svgElement) {
                const currentClass = element.svgElement.getAttribute('class') || '';
                element.svgElement.setAttribute('class', currentClass.replace('selected', '').trim());
                
                // Reset markdown elements to readonly mode when deselected
                if (element.type === 'markdown') {
                    const container = element.svgElement.querySelector('.sww-markdown-element-container');
                    const textarea = element.svgElement.querySelector('.sww-markdown-editor');
                    
                    if (container && textarea) {
                        container.classList.remove('sww-markdown-editing');
                        container.classList.add('sww-markdown-readonly');
                        textarea.readOnly = true;
                        textarea.style.cursor = 'default';
                        textarea.blur();
                    }
                }
            }
        });

        // Clear the selection set
        this.selectedElements.clear();

        // Update UI
        this.clearSelectionHandles();
        this.syncPropertiesPanel();

        // Update layers panel to reflect selection changes
        if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
            window.swwControlPanel.updateLayers();
        }
    },

    /**
     * Select all elements in the scene
     * Ignores hidden and locked elements
     */
    selectAll() {
        this.clearSelection();
        this.elements.forEach(element => {
            // Skip hidden elements
            if (element.hidden) return;
            
            this.selectElement(element, true); // Add to selection
        });
    },

    /**
     * Select multiple elements at once
     * Used by selection box to select intersecting elements
     * 
     * @param {Array<Object>} elements - Array of elements to select
     * @param {boolean} addToSelection - If true, add to existing selection
     */
    selectMultiple(elements, addToSelection = false) {
        if (!addToSelection) {
            this.clearSelection();
        }

        elements.forEach(element => {
            this.addElementToSelection(element);
        });

        // Update UI once after all selections
        this.updateSelectionHandles();
        this.syncPropertiesPanel();
    },

    /**
     * Delete all selected elements
     * Respects locked element protection
     */
    deleteSelectedElements() {
        if (this.selectedElements.size === 0) return;

        // Filter out locked elements
        const elementsToDelete = Array.from(this.selectedElements).filter(element => !element.locked);

        elementsToDelete.forEach(element => {
            this.removeElement(element);
            this.selectedElements.delete(element);
        });

        // Save state after deletion
        this.saveStateToHistory('deleteElements');

        // Update selection handles for remaining elements
        if (this.selectedElements.size > 0) {
            this.updateSelectionHandles();
        } else {
            this.clearSelectionHandles();
        }
        
        this.updateTextPropertiesVisibility();
    },

    /**
     * Move selected elements by keyboard arrows
     * Respects grid snapping and locked elements
     * 
     * @param {string} arrowKey - Arrow key pressed ('ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight')
     * @param {boolean} isShiftPressed - If true, move by larger increment
     */
    moveSelectedElements(arrowKey, isShiftPressed = false) {
        if (this.selectedElements.size === 0) return;

        // Check if any selected elements are locked
        const hasLockedElements = Array.from(this.selectedElements).some(element => element.locked);
        if (hasLockedElements) return;

        // Determine movement distance based on grid snapping
        let moveDistance;
        if (this.snapToGrid) {
            // When grid snapping is on, move by grid units
            moveDistance = isShiftPressed ? this.options.gridSize * 5 : this.options.gridSize;
        } else {
            // When grid snapping is off, move by pixels
            moveDistance = isShiftPressed ? 10 : 1;
        }

        // Determine movement direction
        let dx = 0, dy = 0;
        switch (arrowKey) {
            case 'ArrowUp':
                dy = -moveDistance;
                break;
            case 'ArrowDown':
                dy = moveDistance;
                break;
            case 'ArrowLeft':
                dx = -moveDistance;
                break;
            case 'ArrowRight':
                dx = moveDistance;
                break;
            default:
                return;
        }

        // Save state for undo functionality
        this.saveStateToHistory('moveElements');

        // Move all selected elements
        this.selectedElements.forEach(element => {
            element.x += dx;
            element.y += dy;

            // Update the SVG element
            this.updateSVGElement(element);

            // Update spatial index
            this.updateElementInSpatialIndex(element);
        });

        // Update selection handles to reflect new positions
        this.updateSelectionHandles();

        // Update properties panel with new position values
        this.syncPropertiesPanel();
    },

    /**
     * Get element by its unique ID
     * 
     * @param {string} elementId - Element ID to find
     * @returns {Object|null} Element or null if not found
     */
    getElementById(elementId) {
        return this.elements.find(element => element.id === elementId) || null;
    },

    /**
     * Select element by ID
     * Clears existing selection first
     * 
     * @param {string} elementId - Element ID to select
     * @returns {boolean} True if element found and selected
     */
    selectElementById(elementId) {
        const element = this.getElementById(elementId);
        if (element) {
            this.clearSelection();
            this.selectElement(element);
            return true;
        }
        return false;
    },

    /**
     * Delete element by ID
     * Selects element first, then deletes it
     * 
     * @param {string} elementId - Element ID to delete
     * @returns {boolean} True if element found and deleted
     */
    deleteElementById(elementId) {
        const element = this.getElementById(elementId);
        if (element) {
            this.clearSelection();
            this.selectElement(element);
            this.deleteSelectedElements();
            return true;
        }
        return false;
    },

    /**
     * Check if an element is currently selected
     * 
     * @param {Object} element - Element to check
     * @returns {boolean} True if element is selected
     */
    isSelected(element) {
        return this.selectedElements.has(element);
    },

    /**
     * Check if any elements are selected
     * 
     * @returns {boolean} True if selection is not empty
     */
    hasSelection() {
        return this.selectedElements.size > 0;
    },

    /**
     * Get array of selected elements
     * 
     * @returns {Array<Object>} Array of selected elements
     */
    getSelectedElements() {
        return Array.from(this.selectedElements);
    },

    /**
     * Get count of selected elements
     * 
     * @returns {number} Number of selected elements
     */
    getSelectionCount() {
        return this.selectedElements.size;
    },

    /**
     * Get bounding box for all selected elements
     * Returns the smallest rectangle that contains all selected elements
     * 
     * @returns {Object|null} {x, y, width, height} or null if no selection
     */
    getSelectionBounds() {
        if (this.selectedElements.size === 0) return null;

        const elements = Array.from(this.selectedElements);
        
        // Initialize with first element bounds
        let minX = elements[0].x;
        let minY = elements[0].y;
        let maxX = elements[0].x + (elements[0].width || 0);
        let maxY = elements[0].y + (elements[0].height || 0);

        // Expand bounds to include all selected elements
        elements.forEach(element => {
            minX = Math.min(minX, element.x);
            minY = Math.min(minY, element.y);
            maxX = Math.max(maxX, element.x + (element.width || 0));
            maxY = Math.max(maxY, element.y + (element.height || 0));
        });

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    },

    /**
     * Check if selection contains any locked elements
     * 
     * @returns {boolean} True if any selected element is locked
     */
    hasLockedElementsInSelection() {
        return Array.from(this.selectedElements).some(element => element.locked);
    },

    /**
     * Check if selection contains any grouped elements
     * 
     * @returns {boolean} True if any selected element has a groupId
     */
    hasGroupedElementsInSelection() {
        return Array.from(this.selectedElements).some(element => element.groupId);
    },

    /**
     * Commit any pending changes in properties panel
     * Forces blur on active input to trigger change events
     * Called before clearing selection
     */
    commitPropertiesPanelChanges() {
        if (!this.propertiesPanel) return;

        // Force any focused input to trigger its change event
        const activeElement = document.activeElement;
        if (activeElement && activeElement.closest('.sww-properties-panel')) {
            // If an input in the properties panel is active, blur it to trigger change event
            activeElement.blur();
            // Give a brief moment for the change event to process
            setTimeout(() => {
                // Re-focus the canvas or appropriate element if needed
                if (this.svg) {
                    this.svg.focus();
                }
            }, 10);
        }
    }
};
