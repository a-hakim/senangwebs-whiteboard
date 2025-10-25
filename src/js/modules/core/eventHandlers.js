/**
 * Event Handling Mixin for SWWInstance
 * Sets up mouse, touch, keyboard, and wheel event listeners
 */

import { PerformanceUtils } from '../utils/PerformanceUtils.js';

export const EventHandlersMixin = {
    /**
     * Set up all event listeners for the canvas
     */
    setupEventListeners() {
        // Throttled pointer move for performance
        const throttledPointerMove = PerformanceUtils.throttle((e) => this.handlePointerMove(e), 16);
        
        // Debounced viewport update for scroll/zoom
        const debouncedViewportUpdate = PerformanceUtils.debounce(() => this.updateVisibleElements(), 100);
        
        // Mouse events
        this.svg.addEventListener('mousedown', (e) => this.handlePointerDown(e));
        this.svg.addEventListener('mousemove', throttledPointerMove);
        this.svg.addEventListener('mouseup', (e) => this.handlePointerUp(e));
        this.svg.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        this.svg.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e);
        });
        
        // Touch events
        this.svg.addEventListener('touchstart', (e) => this.handlePointerDown(e));
        this.svg.addEventListener('touchmove', throttledPointerMove);
        this.svg.addEventListener('touchend', (e) => this.handlePointerUp(e));
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Context menu - hide on click outside
        document.addEventListener('click', (e) => {
            if (this.contextMenu && !this.contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        });
        
        // Wheel event for zooming
        this.svg.addEventListener('wheel', (e) => {
            this.handleWheel(e);
            debouncedViewportUpdate();
        });
    },

    /**
     * Handle keyboard shortcuts and commands
     */
    handleKeyDown(e) {
        const activeElement = document.activeElement;
        const isEditingInput = activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA' || 
            activeElement.tagName === 'SELECT' ||
            activeElement.contentEditable === 'true'
        );
        
        if (isEditingInput || this.isPreviewMode) {
            return;
        }
        
        if (e.key === 'Delete' || e.key === 'Backspace') {
            this.deleteSelectedElements();
        } else if (e.key === 'Escape') {
            this.clearSelection();
        } else if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            this.selectAll();
        } else if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.undo();
        } else if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) {
            e.preventDefault();
            this.redo();
        } else if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            this.copySelected();
        } else if (e.ctrlKey && e.key === 'v') {
            e.preventDefault();
            this.pasteClipboard();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            this.moveSelectedElements(e.key, e.shiftKey);
        }
    },

    /**
     * Handle mouse wheel for zooming
     */
    handleWheel(e) {
        if (!e.ctrlKey && !e.metaKey) {
            // Allow normal scroll behavior when Ctrl is not pressed
            return;
        }
        
        e.preventDefault();
        const point = this.getPointerPosition(e);
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        
        this.zoom *= zoomFactor;
        this.zoom = Math.max(0.1, Math.min(5, this.zoom));
        
        const newWidth = this.viewBox.width / zoomFactor;
        const newHeight = this.viewBox.height / zoomFactor;
        const dx = (this.viewBox.width - newWidth) * (point.x - this.viewBox.x) / this.viewBox.width;
        const dy = (this.viewBox.height - newHeight) * (point.y - this.viewBox.y) / this.viewBox.height;
        
        this.viewBox.x += dx;
        this.viewBox.y += dy;
        this.viewBox.width = newWidth;
        this.viewBox.height = newHeight;
        
        this.updateViewBox();
    },

    /**
     * Get pointer position in SVG coordinates
     */
    getPointerPosition(e) {
        const rect = this.svg.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        if (this.svg.getScreenCTM) {
            const point = this.svg.createSVGPoint();
            point.x = clientX;
            point.y = clientY;
            const transformedPoint = point.matrixTransform(this.svg.getScreenCTM().inverse());
            return { x: transformedPoint.x, y: transformedPoint.y };
        }
        
        const relativeX = clientX - rect.left;
        const relativeY = clientY - rect.top;
        
        const x = (relativeX / rect.width) * this.viewBox.width + this.viewBox.x;
        const y = (relativeY / rect.height) * this.viewBox.height + this.viewBox.y;
        
        return { x, y };
    },

    /**
     * Set cursor style on SVG canvas
     */
    setCursor(cursorType) {
        this.svg.classList.remove('grabbing', 'grab', 'crosshair', 'default');
        if (cursorType !== 'default') {
            this.svg.classList.add(cursorType);
        }
    },

    /**
     * Update cursor based on hover state
     * (Stub - full implementation in legacy)
     */
    updateHoverCursor(point) {
        // Stub - actual implementation still in legacy
    },

    /**
     * Handle pointer down event stub
     * (Full implementation in legacy)
     */
    handlePointerDown(e) {
        // Stub - actual implementation still in legacy
    },

    /**
     * Handle pointer move event stub
     * (Full implementation in legacy)
     */
    handlePointerMove(e) {
        // Stub - actual implementation still in legacy
    },

    /**
     * Handle pointer up event stub
     * (Full implementation in legacy)
     */
    handlePointerUp(e) {
        // Stub - actual implementation still in legacy
    },

    /**
     * Handle double click event stub
     * (Full implementation in legacy)
     */
    handleDoubleClick(e) {
        // Stub - actual implementation still in legacy
    },

    /**
     * Show context menu stub
     * (Full implementation in legacy)
     */
    showContextMenu(e) {
        // Stub - actual implementation still in legacy
    },

    /**
     * Hide context menu stub
     * (Full implementation in legacy)
     */
    hideContextMenu() {
        // Stub - actual implementation still in legacy
    }
};
