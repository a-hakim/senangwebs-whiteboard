/**
 * ElementActions.js
 * Element manipulation actions - lock, group, delete, reorder
 * Part of Phase 7: Final extractions
 * 
 * Provides methods for:
 * - Lock/unlock elements
 * - Group/ungroup elements
 * - Delete elements
 * - Bring to front/send to back
 * - Edit elements
 */

export const ElementActionsMixin = {
    /**
     * Lock selected elements
     */
    lockSelected() {
        if (this.selectedElements.size === 0) return;
        
        this.saveStateToHistory('lockElements');
        
        this.selectedElements.forEach(element => {
            if (!element.locked) {
                element.locked = true;
                // Update visual indication using CSS classes
                if (element.svgElement) {
                    const currentClass = element.svgElement.getAttribute('class') || '';
                    if (!currentClass.includes('sww-locked')) {
                        element.svgElement.setAttribute('class', currentClass + ' sww-locked');
                    }
                }
            }
        });
        
        // Update control panel if it exists
        if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
            window.swwControlPanel.updateLayers();
        }
    },

    /**
     * Unlock selected elements
     */
    unlockSelected() {
        if (this.selectedElements.size === 0) return;
        
        this.saveStateToHistory('unlockElements');
        
        this.selectedElements.forEach(element => {
            if (element.locked) {
                element.locked = false;
                // Remove visual indication using CSS classes
                if (element.svgElement) {
                    const currentClass = element.svgElement.getAttribute('class') || '';
                    element.svgElement.setAttribute('class', currentClass.replace('sww-locked', '').trim());
                }
            }
        });
        
        // Update control panel if it exists
        if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
            window.swwControlPanel.updateLayers();
        }
    },

    /**
     * Group selected elements
     */
    groupSelected() {
        if (this.selectedElements.size < 2) return;
        
        this.saveStateToHistory('groupElements');
        
        const groupId = this.generateId();
        
        this.selectedElements.forEach(element => {
            element.groupId = groupId;
        });
        
        if (this.showNotification) {
            this.showNotification(`Grouped ${this.selectedElements.size} elements`, 'success');
        }
        
        // Update control panel if it exists
        if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
            window.swwControlPanel.updateLayers();
        }
    },

    /**
     * Ungroup selected elements
     */
    ungroupSelected() {
        if (this.selectedElements.size === 0) return;
        
        this.saveStateToHistory('ungroupElements');
        
        let ungroupedCount = 0;
        
        this.selectedElements.forEach(element => {
            if (element.groupId) {
                // Find all elements in the same group
                const groupElements = this.elements.filter(el => el.groupId === element.groupId);
                
                // Remove group from all elements in the group
                groupElements.forEach(groupEl => {
                    groupEl.groupId = null;
                });
                
                ungroupedCount += groupElements.length;
            }
        });
        
        if (ungroupedCount > 0 && this.showNotification) {
            this.showNotification(`Ungrouped ${ungroupedCount} elements`, 'success');
        }
        
        // Update control panel if it exists
        if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
            window.swwControlPanel.updateLayers();
        }
    },

    /**
     * Delete selected elements
     */
    deleteSelected() {
        if (this.selectedElements.size === 0) return;
        
        // Filter out locked elements
        const elementsToDelete = Array.from(this.selectedElements).filter(element => !element.locked);
        
        if (elementsToDelete.length === 0) {
            if (this.showNotification) {
                this.showNotification('Cannot delete locked elements', 'warning');
            }
            return;
        }
        
        this.saveStateToHistory('deleteElements');
        
        elementsToDelete.forEach(element => {
            this.removeElement(element);
            this.selectedElements.delete(element);
        });
        
        // Update selection handles for remaining elements
        if (this.selectedElements.size > 0) {
            this.updateSelectionHandles();
        } else {
            this.clearSelectionHandles();
        }
        
        if (this.updateTextPropertiesVisibility) {
            this.updateTextPropertiesVisibility();
        }
        
        // Update control panel if it exists
        if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
            window.swwControlPanel.updateLayers();
        }
        
        if (this.showNotification) {
            this.showNotification(`Deleted ${elementsToDelete.length} element${elementsToDelete.length > 1 ? 's' : ''}`, 'success');
        }
    },

    /**
     * Alias for deleteSelected for backward compatibility
     */
    deleteSelectedElements() {
        this.deleteSelected();
    },

    /**
     * Bring selected elements to front (top layer)
     */
    bringToFront() {
        if (this.selectedElements.size === 0) return;
        
        this.saveStateToHistory('bringToFront');
        
        // Convert to array and sort by current position in elements array
        const selectedArray = Array.from(this.selectedElements);
        const elementsToMove = selectedArray.map(element => {
            const index = this.elements.indexOf(element);
            return { element, index };
        }).sort((a, b) => a.index - b.index);
        
        // Remove elements from their current positions (from back to front to maintain indices)
        for (let i = elementsToMove.length - 1; i >= 0; i--) {
            const { element, index } = elementsToMove[i];
            this.elements.splice(index, 1);
            
            // Move SVG element to end (top layer)
            if (element.svgElement && this.elementsGroup) {
                element.svgElement.remove();
                this.elementsGroup.appendChild(element.svgElement);
            }
        }
        
        // Add elements to the end of the array (top layer)
        elementsToMove.forEach(({ element }) => {
            this.elements.push(element);
        });
        
        // Rebuild spatial index after reordering
        if (this.spatialIndex && this.spatialIndex.rebuild) {
            this.spatialIndex.rebuild(this.elements, (el) => this.getElementBounds(el));
        }
        
        // Update control panel if it exists
        if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
            window.swwControlPanel.updateLayers();
        }
    },

    /**
     * Send selected elements to back (bottom layer)
     */
    sendToBack() {
        if (this.selectedElements.size === 0) return;
        
        this.saveStateToHistory('sendToBack');
        
        // Convert to array and sort by current position in elements array
        const selectedArray = Array.from(this.selectedElements);
        const elementsToMove = selectedArray.map(element => {
            const index = this.elements.indexOf(element);
            return { element, index };
        }).sort((a, b) => b.index - a.index); // Sort in reverse order
        
        // Remove elements from their current positions (from front to back to maintain indices)
        elementsToMove.forEach(({ element, index }) => {
            this.elements.splice(index, 1);
            
            // Move SVG element to beginning (bottom layer)
            if (element.svgElement && this.elementsGroup) {
                element.svgElement.remove();
                this.elementsGroup.insertBefore(element.svgElement, this.elementsGroup.firstChild);
            }
        });
        
        // Add elements to the beginning of the array (bottom layer)
        elementsToMove.reverse().forEach(({ element }) => {
            this.elements.unshift(element);
        });
        
        // Rebuild spatial index after reordering
        if (this.spatialIndex && this.spatialIndex.rebuild) {
            this.spatialIndex.rebuild(this.elements, (el) => this.getElementBounds(el));
        }
        
        // Update control panel if it exists
        if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
            window.swwControlPanel.updateLayers();
        }
    },

    /**
     * Aliases for LayersPanel compatibility
     */
    bringSelectedToFront() {
        this.bringToFront();
    },

    sendSelectedToBack() {
        this.sendToBack();
    },

    /**
     * Edit selected elements (for text, website, image, markdown)
     */
    editSelected() {
        if (this.selectedElements.size === 0) return;
        
        // Find first editable element in selection
        const editableElement = Array.from(this.selectedElements).find(el => 
            el.type === 'text' || el.type === 'website' || el.type === 'image' || el.type === 'markdown'
        );
        
        if (editableElement) {
            switch (editableElement.type) {
                case 'text':
                    if (this.startTextEditing) {
                        this.startTextEditing(editableElement);
                    }
                    break;
                case 'website':
                    if (this.editWebsiteElement) {
                        this.editWebsiteElement(editableElement);
                    }
                    break;
                case 'image':
                    if (this.editImageElement) {
                        this.editImageElement(editableElement);
                    }
                    break;
                case 'markdown':
                    // For markdown, enable editing and focus the textarea
                    if (editableElement.svgElement) {
                        const textarea = editableElement.svgElement.querySelector('.sww-markdown-editor');
                        const hint = editableElement.svgElement.querySelector('.sww-markdown-hint');
                        if (textarea) {
                            textarea.readOnly = false;
                            textarea.style.cursor = 'text';
                            textarea.focus();
                            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
                            
                            // Hide the hint when editing
                            if (hint) hint.style.display = 'none';
                            
                            // Add blur handler to make it read-only again when done editing
                            const handleBlur = () => {
                                textarea.readOnly = true;
                                textarea.style.cursor = 'default';
                                if (hint) hint.style.display = 'block';
                                textarea.removeEventListener('blur', handleBlur);
                            };
                            textarea.addEventListener('blur', handleBlur);
                        }
                    }
                    break;
            }
        }
    },

    /**
     * Select all elements
     */
    selectAll() {
        this.clearSelection();
        
        this.elements.forEach(element => {
            if (!element.locked) {
                this.selectedElements.add(element);
            }
        });
        
        this.updateSelectionHandles();
        
        if (this.syncPropertiesPanel) {
            this.syncPropertiesPanel();
        }
    }
};
