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
     */
    saveStateToHistory(actionType) {
        if (this.isPerformingHistoryAction) return;
        if (!this.elements) return;
        
        // Dynamically adjust max history size based on element count for performance
        const maxSize = this.elements.length > 500 ? 20 : this.maxHistorySize;
        
        const currentState = {
            ...this.createSceneSnapshot(),
            actionType: actionType,
            timestamp: Date.now()
        };

        const previousState = this.historyStack[this.historyIndex];
        if (previousState && JSON.stringify(previousState.elements) === JSON.stringify(currentState.elements)) {
            return;
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
        this.emitSceneChanged(
            actionType,
            Array.from(this.selectedElements, (element) => element.id)
        );
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
        this.emitSceneChanged('undo');
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
        this.emitSceneChanged('redo');
    },

    /**
     * Restore a saved state from history
     * @param {Object} state - The state object to restore
     */
    restoreState(state) {
        this.applySceneSnapshot(state, { preserveHistory: true });
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
