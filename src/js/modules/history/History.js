/**
 * History.js
 * Undo/Redo history management
 * Part of Phase 6: Features
 * 
 * Provides methods for:
 * - Saving states to history stack
 * - Undo/redo operations
 * - History state restoration
 * - History button state management
 */

export const HistoryMixin = {
    /**
     * Save current state to history stack
     * @param {string} actionType - Type of action being saved (e.g., 'draw', 'move', 'delete')
     * @param {Object} beforeState - Optional state before the action
     */
    saveStateToHistory(actionType, beforeState = null) {
        if (this.isPerformingHistoryAction) return;
        if (!this.elements) return;
        
        // Dynamically adjust max history size based on element count for performance
        const maxSize = this.elements.length > 500 ? 20 : this.maxHistorySize;
        
        // Create optimized state copy - only store essential data
        const currentState = {
            elements: this.elements.map(el => ({
                id: el.id,
                type: el.type,
                x: el.x,
                y: el.y,
                width: el.width,
                height: el.height,
                strokeColor: el.strokeColor,
                strokeWidth: el.strokeWidth,
                fillColor: el.fillColor,
                fillStyle: el.fillStyle,
                opacity: el.opacity,
                fontSize: el.fontSize,
                fontFamily: el.fontFamily,
                textAlign: el.textAlign,
                textColor: el.textColor,
                text: el.text,
                points: el.points,
                url: el.url,
                imageUrl: el.imageUrl,
                markdown: el.markdown,
                src: el.src,
                // Only store properties that change from defaults to save memory
                ...(el.rotation !== 0 && { rotation: el.rotation }),
                ...(el.locked && { locked: el.locked }),
                ...(el.visible === false && { visible: el.visible }),
                ...(el.groupId && { groupId: el.groupId }),
                ...(el.gradientType && { gradientType: el.gradientType }),
                ...(el.gradientStops && { gradientStops: el.gradientStops })
            })),
            selectedElements: Array.from(this.selectedElements).map(el => el.id),
            actionType: actionType,
            timestamp: Date.now()
        };
        
        // If beforeState is provided, use it as the previous state
        if (beforeState) {
            currentState.beforeState = beforeState;
        }
        
        // Remove any history beyond current index (when undoing then making new changes)
        this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
        
        // Add new state to history
        this.historyStack.push(currentState);
        this.historyIndex = this.historyStack.length - 1;
        
        // Limit history size
        if (this.historyStack.length > maxSize) {
            this.historyStack.shift();
            this.historyIndex--;
        }
        
        this.updateHistoryButtons();
    },

    /**
     * Undo last action
     */
    undo() {
        if (this.historyIndex <= 0) {
            return;
        }
        
        this.isPerformingHistoryAction = true;
        this.historyIndex--;
        
        const previousState = this.historyStack[this.historyIndex];
        this.restoreState(previousState);
        
        this.isPerformingHistoryAction = false;
        this.updateHistoryButtons();
    },

    /**
     * Redo previously undone action
     */
    redo() {
        if (this.historyIndex >= this.historyStack.length - 1) {
            return;
        }
        
        this.isPerformingHistoryAction = true;
        this.historyIndex++;
        
        const nextState = this.historyStack[this.historyIndex];
        this.restoreState(nextState);
        
        this.isPerformingHistoryAction = false;
        this.updateHistoryButtons();
    },

    /**
     * Restore a saved state from history
     * @param {Object} state - The state object to restore
     */
    restoreState(state) {
        // Clear current state
        this.elements = [];
        this.selectedElements.clear();
        
        if (this.elementsGroup) {
            this.elementsGroup.innerHTML = '';
        }
        
        if (this.spatialIndex) {
            this.spatialIndex.clear();
        }
        
        // Restore elements with proper data structure
        this.elements = state.elements.map(elementData => {
            // Create a complete element object with all properties
            const element = {
                id: elementData.id,
                type: elementData.type,
                x: elementData.x,
                y: elementData.y,
                width: elementData.width,
                height: elementData.height,
                strokeColor: elementData.strokeColor,
                strokeWidth: elementData.strokeWidth,
                fillColor: elementData.fillColor,
                fillStyle: elementData.fillStyle,
                opacity: elementData.opacity,
                fontSize: elementData.fontSize,
                fontFamily: elementData.fontFamily,
                textAlign: elementData.textAlign,
                textColor: elementData.textColor,
                text: elementData.text,
                points: elementData.points,
                url: elementData.url,
                imageUrl: elementData.imageUrl,
                markdown: elementData.markdown,
                src: elementData.src,
                rotation: elementData.rotation || 0,
                locked: elementData.locked || false,
                visible: elementData.visible !== false,
                groupId: elementData.groupId || null,
                gradientType: elementData.gradientType || null,
                gradientStops: elementData.gradientStops || null
            };
            
            return element;
        });
        
        // Recreate SVG elements and add them to the DOM with spatial index
        this.elements.forEach(element => {
            const svgElement = this.createSVGElement(element);
            element.svgElement = svgElement;
            this.addSVGElementToDOM(element);
            
            // Add to spatial index
            if (this.spatialIndex) {
                const bounds = this.getElementBounds(element);
                this.spatialIndex.insert(element, bounds);
            }
        });
        
        // Restore selection based on element IDs
        this.selectedElements.clear();
        if (state.selectedElements && state.selectedElements.length > 0) {
            state.selectedElements.forEach(elementId => {
                const element = this.elements.find(el => el.id === elementId);
                if (element) {
                    this.selectedElements.add(element);
                }
            });
        }
        
        // Update UI with performance optimization
        this.updateSelectionHandles();
        
        if (this.syncPropertiesPanel) {
            this.syncPropertiesPanel();
        }
        
        if (this.updateTextPropertiesVisibility) {
            this.updateTextPropertiesVisibility();
        }
        
        // Update visible elements for performance
        if (this.elements.length > 100 && this.updateVisibleElements) {
            this.updateVisibleElements();
        }
        
        // Update control panel if it exists
        if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
            window.swwControlPanel.updateLayers();
        }
    },

    /**
     * Update undo/redo button states
     */
    updateHistoryButtons() {
        const undoBtn = this.container.querySelector('[data-action="undo"]');
        const redoBtn = this.container.querySelector('[data-action="redo"]');
        
        if (undoBtn) {
            // Can undo if we have history and historyIndex > 0 (can go back to previous states)
            const canUndo = this.historyStack.length > 1 && this.historyIndex > 0;
            undoBtn.disabled = !canUndo;
            undoBtn.style.opacity = canUndo ? '1' : '0.5';
        }
        
        if (redoBtn) {
            // Can redo if we're not at the end of history stack
            const canRedo = this.historyIndex < this.historyStack.length - 1;
            redoBtn.disabled = !canRedo;
            redoBtn.style.opacity = canRedo ? '1' : '0.5';
        }
    },

    /**
     * Clear history stack
     */
    clearHistory() {
        this.historyStack = [];
        this.historyIndex = -1;
        this.updateHistoryButtons();
    },

    /**
     * Get history statistics
     * @returns {Object} History stats including size, current index, and memory usage
     */
    getHistoryStats() {
        const estimatedMemory = JSON.stringify(this.historyStack).length;
        
        return {
            stackSize: this.historyStack.length,
            currentIndex: this.historyIndex,
            canUndo: this.historyIndex > 0,
            canRedo: this.historyIndex < this.historyStack.length - 1,
            estimatedMemoryBytes: estimatedMemory,
            maxSize: this.elements.length > 500 ? 20 : this.maxHistorySize
        };
    }
};
