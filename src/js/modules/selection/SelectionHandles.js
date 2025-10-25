/**
 * SelectionHandles.js - Resize and rotate handle rendering
 * 
 * Manages visual handles for resizing and rotating selected elements.
 * Handles creation, positioning, and interaction setup for all handle types.
 * 
 * Responsibilities:
 * - Create resize handles (8 positions for most elements, 4 for paths, 2 for lines)
 * - Create rotate handle (circle above top-center)
 * - Position handles around selection bounds
 * - Update handle positions on selection/zoom/pan changes
 * - Handle cursor management for each handle type
 * - Performance optimization for many selected elements
 * 
 * Key Features:
 * - 8 resize handles: nw, n, ne, e, se, s, sw, w
 * - 1 rotate handle above top-center
 * - Element-type specific handles (lines, paths, shapes)
 * - Combined bounds for 10+ selected elements
 * - Selection box visual feedback
 * - Throttled updates with requestAnimationFrame
 * 
 * Dependencies:
 * - this.selectedElements - Current selection Set
 * - this.selectionGroup - SVG group for handles
 * - this.getElementBounds() - Bounds calculation (legacy)
 * - this.startResize() - Resize operation start (to be extracted)
 * - this.startRotation() - Rotate operation start (to be extracted)
 * - this.getPointerPosition() - Coordinate conversion (legacy)
 * - PerformanceUtils.requestAnimationFrame() - Performance helper
 * 
 * @module SelectionHandles
 * @since Phase 4 - Selection System Extraction
 */

import { PerformanceUtils } from '../utils/PerformanceUtils.js';

/**
 * SelectionHandles mixin - adds resize/rotate handle rendering capabilities
 */
export const SelectionHandlesMixin = {
    /**
     * Initialize selection handles system
     * Called during instance initialization
     */
    initializeSelectionHandles() {
        // State is initialized in constructor
        // this.selectionUpdateScheduled = false;
        
        // No additional initialization needed
    },

    /**
     * Update selection handles for current selection
     * Throttled with requestAnimationFrame for performance
     * Shows selection boxes and resize/rotate handles
     */
    updateSelectionHandles() {
        // Only update if selection update isn't already scheduled
        if (this.selectionUpdateScheduled) return;

        this.selectionUpdateScheduled = true;
        PerformanceUtils.requestAnimationFrame(() => {
            this.clearSelectionHandles();

            if (this.selectedElements.size === 0) {
                this.selectionUpdateScheduled = false;
                return;
            }

            // For performance with many selected elements, show combined bounds
            if (this.selectedElements.size > 10) {
                const combinedBounds = this.getCombinedSelectionBounds();
                this.createSelectionBox(combinedBounds);
                this.createResizeHandles(combinedBounds);
                this.createRotateHandle(combinedBounds);
            } else {
                // Show selection boxes and handles for each selected element
                this.selectedElements.forEach(element => {
                    const bounds = this.getElementBounds(element);

                    // Create selection box visual
                    this.createSelectionBox(bounds);

                    // Add appropriate handles based on element type
                    if (element.type === 'line' || element.type === 'arrow') {
                        this.createLineHandles(element);
                    } else {
                        this.createResizeHandles(bounds, element);
                        this.createRotateHandle(bounds);
                    }
                });
            }

            this.selectionUpdateScheduled = false;

            // Update control panel if available
            if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
                window.swwControlPanel.updateLayers();
            }
        });
    },

    /**
     * Clear all selection handles and boxes
     * Removes all children from selection group
     */
    clearSelectionHandles() {
        if (this.selectionGroup) {
            this.selectionGroup.innerHTML = '';
        }
    },

    /**
     * Create selection box visual around bounds
     * Dashed outline to show selection
     * 
     * @param {Object} bounds - Bounding box {x, y, width, height}
     */
    createSelectionBox(bounds) {
        const selectionBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        selectionBox.setAttribute('class', 'sww-selection-box');
        selectionBox.setAttribute('x', bounds.x - 2);
        selectionBox.setAttribute('y', bounds.y - 2);
        selectionBox.setAttribute('width', bounds.width + 4);
        selectionBox.setAttribute('height', bounds.height + 4);
        this.selectionGroup.appendChild(selectionBox);
    },

    /**
     * Create resize handles for standard elements
     * 8 handles for shapes, 4 for paths
     * 
     * @param {Object} bounds - Bounding box {x, y, width, height}
     * @param {Object} element - Element being handled (optional, for type checking)
     */
    createResizeHandles(bounds, element = null) {
        const handleSize = 8;

        // For path elements (freehand drawings), only show 4 corner handles
        // since they only support proportional scaling from corners
        const isPathElement = element && element.type === 'path';

        let handles;
        if (isPathElement) {
            // Show only 4 corner handles for path elements
            handles = [
                { x: bounds.x - handleSize / 2, y: bounds.y - handleSize / 2, cursor: 'nw-resize', type: 'nw' },
                { x: bounds.x + bounds.width - handleSize / 2, y: bounds.y - handleSize / 2, cursor: 'ne-resize', type: 'ne' },
                { x: bounds.x + bounds.width - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2, cursor: 'se-resize', type: 'se' },
                { x: bounds.x - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2, cursor: 'sw-resize', type: 'sw' }
            ];
        } else {
            // Show all 8 handles for other elements
            handles = [
                { x: bounds.x - handleSize / 2, y: bounds.y - handleSize / 2, cursor: 'nw-resize', type: 'nw' },
                { x: bounds.x + bounds.width / 2 - handleSize / 2, y: bounds.y - handleSize / 2, cursor: 'n-resize', type: 'n' },
                { x: bounds.x + bounds.width - handleSize / 2, y: bounds.y - handleSize / 2, cursor: 'ne-resize', type: 'ne' },
                { x: bounds.x + bounds.width - handleSize / 2, y: bounds.y + bounds.height / 2 - handleSize / 2, cursor: 'e-resize', type: 'e' },
                { x: bounds.x + bounds.width - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2, cursor: 'se-resize', type: 'se' },
                { x: bounds.x + bounds.width / 2 - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2, cursor: 's-resize', type: 's' },
                { x: bounds.x - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2, cursor: 'sw-resize', type: 'sw' },
                { x: bounds.x - handleSize / 2, y: bounds.y + bounds.height / 2 - handleSize / 2, cursor: 'w-resize', type: 'w' }
            ];
        }

        handles.forEach(handle => {
            const handleRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            handleRect.setAttribute('class', 'sww-handle');
            handleRect.setAttribute('x', handle.x);
            handleRect.setAttribute('y', handle.y);
            handleRect.setAttribute('width', handleSize);
            handleRect.setAttribute('height', handleSize);
            handleRect.setAttribute('data-handle-type', handle.type);
            handleRect.style.cursor = handle.cursor;

            // Add event listeners for resize
            handleRect.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.startResize(handle.type, this.getPointerPosition(e));
            });

            handleRect.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const touch = e.touches[0];
                this.startResize(handle.type, this.getPointerPosition(touch));
            }, { passive: false });

            this.selectionGroup.appendChild(handleRect);
        });
    },

    /**
     * Create rotate handle above top-center of bounds
     * Circular handle for rotation
     * 
     * @param {Object} bounds - Bounding box {x, y, width, height}
     */
    createRotateHandle(bounds) {
        const rotateHandle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        rotateHandle.setAttribute('class', 'sww-handle rotate');
        rotateHandle.setAttribute('cx', bounds.x + bounds.width / 2);
        rotateHandle.setAttribute('cy', bounds.y - 20);
        rotateHandle.setAttribute('r', 6);
        rotateHandle.style.cursor = 'crosshair'; // Rotation cursor

        rotateHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.startRotation(this.getPointerPosition(e));
        });

        rotateHandle.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const touch = e.touches[0];
            this.startRotation(this.getPointerPosition(touch));
        }, { passive: false });

        this.selectionGroup.appendChild(rotateHandle);
    },

    /**
     * Create handles for line/arrow elements
     * Only 2 handles: start and end points
     * 
     * @param {Object} element - Line or arrow element
     */
    createLineHandles(element) {
        const handleSize = 8;

        // For lines and arrows, only show start and end point handles
        const startX = element.x;
        const startY = element.y;
        const endX = element.x + element.width;
        const endY = element.y + element.height;

        const handles = [
            { x: startX - handleSize / 2, y: startY - handleSize / 2, cursor: 'move', type: 'nw' }, // Start point
            { x: endX - handleSize / 2, y: endY - handleSize / 2, cursor: 'move', type: 'se' }    // End point
        ];

        handles.forEach(handle => {
            const handleRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            handleRect.setAttribute('class', 'sww-handle');
            handleRect.setAttribute('x', handle.x);
            handleRect.setAttribute('y', handle.y);
            handleRect.setAttribute('width', handleSize);
            handleRect.setAttribute('height', handleSize);
            handleRect.setAttribute('data-handle-type', handle.type);
            handleRect.style.cursor = handle.cursor;

            // Add event listeners for resize (moving endpoints)
            handleRect.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.startResize(handle.type, this.getPointerPosition(e));
            });

            handleRect.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const touch = e.touches[0];
                this.startResize(handle.type, this.getPointerPosition(touch));
            }, { passive: false });

            this.selectionGroup.appendChild(handleRect);
        });
    },

    /**
     * Get combined bounding box for all selected elements
     * Used when many elements are selected (10+) for performance
     * 
     * @returns {Object} Combined bounds {x, y, width, height}
     */
    getCombinedSelectionBounds() {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        this.selectedElements.forEach(element => {
            const bounds = this.getElementBounds(element);
            minX = Math.min(minX, bounds.x);
            minY = Math.min(minY, bounds.y);
            maxX = Math.max(maxX, bounds.x + bounds.width);
            maxY = Math.max(maxY, bounds.y + bounds.height);
        });

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    },

    /**
     * Check if a point is near the rotate handle
     * Used for hit testing during pointer events
     * 
     * @param {Object} point - Point to test {x, y}
     * @param {number} tolerance - Hit test tolerance in pixels (default: 5)
     * @returns {boolean} True if point is near rotate handle
     */
    isPointNearRotateHandle(point, tolerance = 5) {
        if (this.selectedElements.size === 0) return false;

        const bounds = this.getSelectionBounds();
        if (!bounds) return false;

        const rotateHandleX = bounds.x + bounds.width / 2;
        const rotateHandleY = bounds.y - 20;
        const rotateHandleRadius = 6;

        // Calculate distance from point to rotate handle center
        const distance = Math.sqrt(
            Math.pow(point.x - rotateHandleX, 2) +
            Math.pow(point.y - rotateHandleY, 2)
        );

        return distance <= (rotateHandleRadius + tolerance);
    },

    /**
     * Get handle at a specific point
     * Returns handle type if point is over a handle, null otherwise
     * 
     * @param {Object} point - Point to test {x, y}
     * @param {number} tolerance - Hit test tolerance in pixels (default: 5)
     * @returns {string|null} Handle type ('nw', 'n', 'ne', etc.) or null
     */
    getHandleAtPoint(point, tolerance = 5) {
        // Check all handle elements in selection group
        const handles = this.selectionGroup.querySelectorAll('.sww-handle');
        
        for (const handle of handles) {
            if (handle.tagName === 'rect') {
                // Rectangle handle (resize)
                const x = parseFloat(handle.getAttribute('x'));
                const y = parseFloat(handle.getAttribute('y'));
                const width = parseFloat(handle.getAttribute('width'));
                const height = parseFloat(handle.getAttribute('height'));

                if (point.x >= x - tolerance && point.x <= x + width + tolerance &&
                    point.y >= y - tolerance && point.y <= y + height + tolerance) {
                    return handle.getAttribute('data-handle-type');
                }
            } else if (handle.tagName === 'circle') {
                // Circle handle (rotate)
                const cx = parseFloat(handle.getAttribute('cx'));
                const cy = parseFloat(handle.getAttribute('cy'));
                const r = parseFloat(handle.getAttribute('r'));

                const distance = Math.sqrt(
                    Math.pow(point.x - cx, 2) + Math.pow(point.y - cy, 2)
                );

                if (distance <= r + tolerance) {
                    return 'rotate';
                }
            }
        }

        return null;
    },

    /**
     * Get cursor style for a handle type
     * 
     * @param {string} handleType - Handle type ('nw', 'n', 'ne', etc.)
     * @returns {string} CSS cursor value
     */
    getHandleCursor(handleType) {
        const cursors = {
            'nw': 'nw-resize',
            'n': 'n-resize',
            'ne': 'ne-resize',
            'e': 'e-resize',
            'se': 'se-resize',
            's': 's-resize',
            'sw': 'sw-resize',
            'w': 'w-resize',
            'rotate': 'crosshair'
        };

        return cursors[handleType] || 'default';
    }
};
