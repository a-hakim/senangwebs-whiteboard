/**
 * History Manager
 * Handles undo/redo functionality with state management
 */

export class HistoryManager {
    constructor(maxSize = 50) {
        this.stack = [];
        this.index = -1;
        this.maxSize = maxSize;
        this.isPerformingAction = false;
    }

    saveState(actionType, state, beforeState = null) {
        if (this.isPerformingAction) return;

        // Remove any states after current index (when user made changes after undo)
        this.stack = this.stack.slice(0, this.index + 1);

        // Add new state
        const historyEntry = {
            actionType,
            state: this.deepClone(state),
            beforeState: beforeState ? this.deepClone(beforeState) : null,
            timestamp: Date.now()
        };

        this.stack.push(historyEntry);
        this.index = this.stack.length - 1;

        // Maintain max size
        if (this.stack.length > this.maxSize) {
            this.stack.shift();
            this.index--;
        }
    }

    canUndo() {
        return this.index > 0;
    }

    canRedo() {
        return this.index < this.stack.length - 1;
    }

    undo() {
        if (!this.canUndo()) return null;

        this.index--;
        const state = this.stack[this.index];
        return this.deepClone(state.state);
    }

    redo() {
        if (!this.canRedo()) return null;

        this.index++;
        const state = this.stack[this.index];
        return this.deepClone(state.state);
    }

    clear() {
        this.stack = [];
        this.index = -1;
    }

    getHistory() {
        return {
            stack: this.stack.map(entry => ({
                actionType: entry.actionType,
                timestamp: entry.timestamp
            })),
            index: this.index,
            canUndo: this.canUndo(),
            canRedo: this.canRedo()
        };
    }

    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }

        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }

        if (obj instanceof Set) {
            return new Set([...obj]);
        }

        if (obj instanceof Map) {
            return new Map([...obj]);
        }

        if (typeof obj === 'object') {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }

        return obj;
    }

    setPerformingAction(isPerforming) {
        this.isPerformingAction = isPerforming;
    }
}
