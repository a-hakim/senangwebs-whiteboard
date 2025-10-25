/**
 * Clipboard.js
 * Copy/Paste functionality for elements
 * Part of Phase 6: Features
 * 
 * Provides methods for:
 * - Copy selected elements to clipboard
 * - Paste elements from clipboard
 * - Cut elements (copy + delete)
 * - Duplicate elements
 * - Clipboard management
 */

export const ClipboardMixin = {
    /**
     * Copy selected elements to clipboard
     */
    copySelected() {
        if (this.selectedElements.size === 0) {
            if (this.showNotification) {
                this.showNotification('No elements selected to copy', 'warning');
            }
            return;
        }
        
        // Clear clipboard and copy selected elements
        this.clipboard = [];
        
        this.selectedElements.forEach(element => {
            // Create a deep copy of the element (without SVG reference)
            const elementCopy = {
                ...element,
                id: this.generateId(), // Generate new ID for paste
                x: element.x + 20, // Offset for paste
                y: element.y + 20
            };
            
            // Remove SVG reference from copy
            delete elementCopy.svgElement;
            
            this.clipboard.push(elementCopy);
        });
        
        if (this.showNotification) {
            this.showNotification(
                `Copied ${this.clipboard.length} element${this.clipboard.length > 1 ? 's' : ''}`, 
                'copy'
            );
        }
        
        // Update context menu state if available
        if (this.updateContextMenuState) {
            this.updateContextMenuState();
        }
    },

    /**
     * Cut selected elements (copy + delete)
     */
    cutSelected() {
        if (this.selectedElements.size === 0) {
            if (this.showNotification) {
                this.showNotification('No elements selected to cut', 'warning');
            }
            return;
        }
        
        // Copy to clipboard first
        this.copySelected();
        
        // Then delete selected elements
        this.deleteSelected();
        
        if (this.showNotification) {
            this.showNotification(
                `Cut ${this.clipboard.length} element${this.clipboard.length > 1 ? 's' : ''}`, 
                'copy'
            );
        }
    },

    /**
     * Paste elements from clipboard
     */
    pasteClipboard() {
        if (this.clipboard.length === 0) {
            if (this.showNotification) {
                this.showNotification('Nothing to paste', 'warning');
            }
            return;
        }
        
        // Save state before pasting
        this.saveStateToHistory('pasteElements');
        
        // Clear current selection
        this.clearSelection();
        
        // Calculate paste position - use last mouse position if available, otherwise viewport center
        const pasteX = this.lastPointerPosition?.x ?? (this.viewBox.x + this.viewBox.width / 2);
        const pasteY = this.lastPointerPosition?.y ?? (this.viewBox.y + this.viewBox.height / 2);
        
        // Find the top-left corner of the clipboard elements to maintain relative positioning
        let minX = Infinity, minY = Infinity;
        this.clipboard.forEach(element => {
            minX = Math.min(minX, element.x);
            minY = Math.min(minY, element.y);
        });
        
        // Calculate offset to position the pasted elements at cursor/viewport center
        const offsetX = pasteX - minX;
        const offsetY = pasteY - minY;
        
        // Create new elements from clipboard
        const pastedElements = [];
        this.clipboard.forEach(elementData => {
            const newElement = {
                ...elementData,
                id: this.generateId(),
                x: elementData.x + offsetX,
                y: elementData.y + offsetY
            };
            
            // Create SVG element and add to canvas
            const svgElement = this.createSVGElement(newElement);
            newElement.svgElement = svgElement;
            this.elements.push(newElement);
            this.addSVGElementToDOM(newElement);
            
            // Select the new element
            this.selectElement(newElement);
            pastedElements.push(newElement);
        });
        
        // Update clipboard positions for next paste (add small offset)
        this.clipboard.forEach(element => {
            element.x += 20;
            element.y += 20;
        });
        
        if (this.showNotification) {
            this.showNotification(
                `Pasted ${this.clipboard.length} element${this.clipboard.length > 1 ? 's' : ''}`, 
                'paste'
            );
        }
        
        // Update control panel if it exists
        if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
            window.swwControlPanel.updateLayers();
        }
        
        return pastedElements;
    },

    /**
     * Duplicate selected elements (copy + paste in place with offset)
     */
    duplicateSelected() {
        if (this.selectedElements.size === 0) {
            if (this.showNotification) {
                this.showNotification('No elements selected to duplicate', 'warning');
            }
            return;
        }
        
        // Save state before duplicating
        this.saveStateToHistory('duplicateElements');
        
        // Store original selection
        const originalSelection = Array.from(this.selectedElements);
        
        // Clear selection
        this.clearSelection();
        
        // Create duplicates with small offset
        const duplicates = [];
        originalSelection.forEach(element => {
            const duplicate = {
                ...element,
                id: this.generateId(),
                x: element.x + 20,
                y: element.y + 20
            };
            
            // Remove SVG reference
            delete duplicate.svgElement;
            
            // Create SVG element and add to canvas
            const svgElement = this.createSVGElement(duplicate);
            duplicate.svgElement = svgElement;
            this.elements.push(duplicate);
            this.addSVGElementToDOM(duplicate);
            
            // Select the duplicate
            this.selectElement(duplicate);
            duplicates.push(duplicate);
        });
        
        if (this.showNotification) {
            this.showNotification(
                `Duplicated ${duplicates.length} element${duplicates.length > 1 ? 's' : ''}`, 
                'paste'
            );
        }
        
        // Update control panel if it exists
        if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
            window.swwControlPanel.updateLayers();
        }
        
        return duplicates;
    },

    /**
     * Clear clipboard
     */
    clearClipboard() {
        this.clipboard = [];
        
        // Update context menu state if available
        if (this.updateContextMenuState) {
            this.updateContextMenuState();
        }
    },

    /**
     * Check if clipboard has content
     * @returns {boolean} True if clipboard has elements
     */
    hasClipboardContent() {
        return this.clipboard && this.clipboard.length > 0;
    },

    /**
     * Get clipboard content count
     * @returns {number} Number of elements in clipboard
     */
    getClipboardCount() {
        return this.clipboard ? this.clipboard.length : 0;
    },

    /**
     * Get clipboard content
     * @returns {Array} Array of clipboard elements
     */
    getClipboardContent() {
        return this.clipboard ? [...this.clipboard] : [];
    },

    /**
     * Set clipboard content from external source
     * @param {Array} elements - Array of element objects
     */
    setClipboardContent(elements) {
        if (!Array.isArray(elements)) {
            console.warn('Clipboard content must be an array');
            return;
        }
        
        this.clipboard = elements.map(element => {
            const elementCopy = { ...element };
            delete elementCopy.svgElement; // Remove SVG reference
            return elementCopy;
        });
        
        // Update context menu state if available
        if (this.updateContextMenuState) {
            this.updateContextMenuState();
        }
    },

    /**
     * Copy element to clipboard by ID
     * @param {string} elementId - Element ID to copy
     */
    copyElementById(elementId) {
        const element = this.getElementById(elementId);
        if (!element) {
            console.warn(`Element with ID ${elementId} not found`);
            return;
        }
        
        // Clear selection and select this element
        this.clearSelection();
        this.selectElement(element);
        
        // Copy selected
        this.copySelected();
    },

    /**
     * Paste at specific coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    pasteAt(x, y) {
        if (this.clipboard.length === 0) {
            if (this.showNotification) {
                this.showNotification('Nothing to paste', 'warning');
            }
            return;
        }
        
        // Save state before pasting
        this.saveStateToHistory('pasteElements');
        
        // Clear current selection
        this.clearSelection();
        
        // Find the center of the clipboard elements
        let minX = Infinity, minY = Infinity;
        this.clipboard.forEach(element => {
            minX = Math.min(minX, element.x);
            minY = Math.min(minY, element.y);
        });
        
        // Calculate offset to paste at specified coordinates
        const offsetX = x - minX;
        const offsetY = y - minY;
        
        // Create new elements from clipboard
        const pastedElements = [];
        this.clipboard.forEach(elementData => {
            const newElement = {
                ...elementData,
                id: this.generateId(),
                x: elementData.x + offsetX,
                y: elementData.y + offsetY
            };
            
            // Create SVG element and add to canvas
            const svgElement = this.createSVGElement(newElement);
            newElement.svgElement = svgElement;
            this.elements.push(newElement);
            this.addSVGElementToDOM(newElement);
            
            // Select the new element
            this.selectElement(newElement);
            pastedElements.push(newElement);
        });
        
        if (this.showNotification) {
            this.showNotification(
                `Pasted ${this.clipboard.length} element${this.clipboard.length > 1 ? 's' : ''}`, 
                'paste'
            );
        }
        
        // Update control panel if it exists
        if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
            window.swwControlPanel.updateLayers();
        }
        
        return pastedElements;
    }
};
