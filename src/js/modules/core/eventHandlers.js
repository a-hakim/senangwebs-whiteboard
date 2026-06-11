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
        this.eventController?.abort();
        this.eventController = new AbortController();
        const listenerOptions = { signal: this.eventController.signal };

        // Throttled pointer move for performance
        const throttledPointerMove = PerformanceUtils.throttle((e) => this.handlePointerMove(e), 16);
        
        // Unthrottled cursor position tracking for accurate paste positioning
        const trackCursorPosition = (e) => {
            const point = this.getPointerPosition(e);
            this.lastPointerPosition = point;
        };
        
        // Debounced viewport update for scroll/zoom
        const debouncedViewportUpdate = PerformanceUtils.debounce(() => this.updateVisibleElements(), 100);
        
        this.svg.addEventListener('pointerdown', (e) => {
            this.isActive = true;
            this.svg.focus({ preventScroll: true });
            if (this.svg.setPointerCapture && e.pointerId !== undefined) {
                this.svg.setPointerCapture(e.pointerId);
            }
            this.handlePointerDown(e);
        }, listenerOptions);
        this.svg.addEventListener('pointermove', (e) => {
            trackCursorPosition(e);
            throttledPointerMove(e);
        }, listenerOptions);
        this.svg.addEventListener('pointerup', (e) => this.handlePointerUp(e), listenerOptions);
        this.svg.addEventListener('pointercancel', (e) => this.handlePointerUp(e), listenerOptions);
        this.svg.addEventListener('dblclick', (e) => this.handleDoubleClick(e), listenerOptions);
        this.svg.addEventListener('blur', () => {
            this.isActive = false;
        }, listenerOptions);
        
        // Handle middle mouse button specifically with auxclick event
        this.svg.addEventListener('auxclick', (e) => {
            if (e.button === 1) {  // Middle mouse button
                e.preventDefault();
                // Already handled in mousedown, but prevent default behavior
            }
        }, listenerOptions);
        
        this.svg.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e);
        }, listenerOptions);
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (this.isActive || this.container.contains(document.activeElement)) {
                this.handleKeyDown(e);
            }
        }, listenerOptions);
        
        // Context menu - hide on click outside
        document.addEventListener('click', (e) => {
            if (this.contextMenu && !this.contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        }, listenerOptions);
        
        // Wheel event for zooming
        this.svg.addEventListener('wheel', (e) => {
            this.handleWheel(e);
            debouncedViewportUpdate();
        }, { ...listenerOptions, passive: false });

        // Table control button clicks (event delegation)
        this.svg.addEventListener('click', (e) => {
            // Handle both old .sww-table-control-btn and new .sww-table-inline-btn
            const controlBtn = e.target.closest('.sww-table-control-btn, .sww-table-inline-btn');
            if (controlBtn) {
                e.preventDefault();
                e.stopPropagation();
                
                const action = controlBtn.getAttribute('data-action');
                const elementId = controlBtn.getAttribute('data-element-id');
                const position = controlBtn.getAttribute('data-position');
                
                if (action && elementId) {
                    const element = this.elements.find(el => el.id === elementId);
                    if (element && element.type === 'table') {
                        const pos = position !== null ? parseInt(position, 10) : null;
                        
                        switch (action) {
                            // Legacy actions (add at end)
                            case 'add-row':
                                this.addTableRow(element);
                                break;
                            case 'remove-row':
                                if (element.tableData.rows.length > 1) {
                                    this.removeTableRow(element, element.tableData.rows.length - 1);
                                }
                                break;
                            case 'add-column':
                                this.addTableColumn(element);
                                break;
                            case 'remove-column':
                                if (element.tableData.headers.length > 1) {
                                    this.removeTableColumn(element, element.tableData.headers.length - 1);
                                }
                                break;
                            
                            // Position-specific actions
                            case 'add-row-at':
                                if (pos !== null) {
                                    this.addTableRowAt(element, pos);
                                }
                                break;
                            case 'remove-row-at':
                                if (pos !== null && element.tableData.rows.length > 1) {
                                    this.removeTableRow(element, pos);
                                }
                                break;
                            case 'add-column-at':
                                if (pos !== null) {
                                    this.addTableColumnAt(element, pos);
                                }
                                break;
                            case 'remove-column-at':
                                if (pos !== null && element.tableData.headers.length > 1) {
                                    this.removeTableColumn(element, pos);
                                }
                                break;
                        }
                    }
                }
            }
        }, listenerOptions);
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
        const touch = e.touches?.[0] || e.changedTouches?.[0];
        const clientX = e.clientX ?? touch?.clientX ?? 0;
        const clientY = e.clientY ?? touch?.clientY ?? 0;
        
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
     * Handle pointer down event
     * Routes to appropriate tool handler based on currentTool
     */
    handlePointerDown(e) {
        // Prevent default for middle mouse button to avoid auto-scroll
        if (e.button === 1) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        e.preventDefault();
        
        // Hide context menu on any click
        this.hideContextMenu();
        
        const point = this.getPointerPosition(e);
        this.lastPointerPosition = point;
        
        if (e.button === 1 || (e.button === 0 && e.altKey) || this.isPreviewMode) {
            // Middle mouse, Alt+click, or preview mode - enable panning for better viewing
            this.isPanning = true;
            this.setCursor('grabbing');
            return;
        }
        
        // Disable tool interactions in preview mode
        if (this.isPreviewMode) {
            return;
        }
        
        switch (this.currentTool) {
            case 'select':
                this.handleSelectStart(point, e);
                break;
            case 'rectangle':
            case 'ellipse':
            case 'diamond':
            case 'parallelogram':
            case 'star':
                this.handleShapeStart(point);
                break;
            case 'line':
            case 'arrow':
                this.handleLineStart(point);
                break;
            case 'draw':
                this.handleDrawStart(point);
                break;
            case 'text':
                this.handleTextStart(point);
                break;
            case 'website':
                this.handleWebsiteStart(point);
                break;
            case 'image':
                this.handleImageStart(point);
                break;
            case 'markdown':
                this.handleMarkdownStart(point);
                break;
            case 'table':
                this.handleTableStart(point);
                break;
        }
    },

    /**
     * Handle pointer move event
     * Manages panning, selection box, resizing, rotating, dragging
     */
    handlePointerMove(e) {
        e.preventDefault();
        const point = this.getPointerPosition(e);
        
        if (this.isPanning) {
            // For panning, we need to work in screen space, not SVG space
            // because the SVG coordinates change as we update the viewBox
            const rect = this.svg.getBoundingClientRect();
            const touch = e.touches?.[0] || e.changedTouches?.[0];
            const screenX = e.clientX ?? touch?.clientX ?? 0;
            const screenY = e.clientY ?? touch?.clientY ?? 0;
            
            if (!this.panStartScreenPos) {
                this.panStartScreenPos = { x: screenX, y: screenY };
                this.panStartViewBox = { ...this.viewBox };
            }
            
            // Calculate screen-space delta
            const screenDx = screenX - this.panStartScreenPos.x;
            const screenDy = screenY - this.panStartScreenPos.y;
            
            // Convert screen delta to SVG coordinate delta
            const svgDx = (screenDx / rect.width) * this.viewBox.width;
            const svgDy = (screenDy / rect.height) * this.viewBox.height;
            
            // Update viewBox from the original starting position
            this.viewBox.x = this.panStartViewBox.x - svgDx;
            this.viewBox.y = this.panStartViewBox.y - svgDy;
            this.updateViewBox();
        } else if (this.isCreatingSelectionBox) {
            this.updateSelectionBox(point);
        } else if (this.isResizing) {
            this.updateResize(point);
        } else if (this.isRotating) {
            this.updateRotation(point);
        } else if (this.isDraggingElement) {
            this.updateElementDrag(point);
        } else if (this.isDrawing && this.currentElement) {
            this.updateCurrentElement(point);
        } else {
            // Update cursor based on what's under the pointer for better UI/UX
            this.updateHoverCursor(point);
        }
        
        this.lastPointerPosition = point;
    },

    /**
     * Handle pointer up event
     * Completes current operation (selection, resize, drag, drawing)
     */
    handlePointerUp(e) {
        e.preventDefault();
        const point = this.getPointerPosition(e);
        
        if (this.isPanning) {
            this.isPanning = false;
            this.panStartScreenPos = null;
            this.panStartViewBox = null;
            this.svg.style.cursor = 'crosshair';
            return;
        }
        
        if (this.isCreatingSelectionBox) {
            this.finishSelectionBox(point);
        } else if (this.isResizing) {
            this.finishResize();
        } else if (this.isRotating) {
            this.finishRotation();
        } else if (this.isDraggingElement) {
            this.finishElementDrag();
        } else if (this.isDrawing && this.currentElement) {
            this.finishCurrentElement();
        }
    },

    /**
     * Handle double click event stub
     * (Full implementation in legacy)
     */
    /**
     * Update the current element being drawn
     * Routes to appropriate update logic based on element type
     * @param {Object} point - Current pointer position {x, y}
     */
    updateCurrentElement(point) {
        if (!this.currentElement) return;
        
        switch (this.currentElement.type) {
            case 'rectangle':
            case 'ellipse':
            case 'diamond':
            case 'parallelogram':
            case 'star':
                this.currentElement.width = point.x - this.currentElement.x;
                this.currentElement.height = point.y - this.currentElement.y;
                break;
                
            case 'line':
            case 'arrow':
                this.currentElement.width = point.x - this.currentElement.x;
                this.currentElement.height = point.y - this.currentElement.y;
                break;
                
            case 'path':
                this.currentElement.points.push(point);
                break;
        }
        
        this.updateSVGElement(this.currentElement);
    },

    /**
     * Finalize the current element being drawn
     * Normalizes dimensions, adds to scene, saves history, and switches to select tool
     */
    finishCurrentElement() {
        if (!this.currentElement) return;
        
        // For path elements (freehand drawings), update width/height based on actual bounds
        // and make points relative to the element's origin
        if (this.currentElement.type === 'path' && this.currentElement.points && this.currentElement.points.length > 0) {
            let minX = this.currentElement.points[0].x;
            let minY = this.currentElement.points[0].y;
            let maxX = this.currentElement.points[0].x;
            let maxY = this.currentElement.points[0].y;
            
            // Find the actual bounding box from all points
            for (let i = 1; i < this.currentElement.points.length; i++) {
                const point = this.currentElement.points[i];
                minX = Math.min(minX, point.x);
                minY = Math.min(minY, point.y);
                maxX = Math.max(maxX, point.x);
                maxY = Math.max(maxY, point.y);
            }
            
            // Update element properties to reflect actual bounds
            this.currentElement.x = minX;
            this.currentElement.y = minY;
            this.currentElement.width = maxX - minX;
            this.currentElement.height = maxY - minY;
            
            // Make all points relative to the element's new origin (minX, minY)
            this.currentElement.points = this.currentElement.points.map(point => ({
                x: point.x - minX,
                y: point.y - minY
            }));
        }
        
        // Normalize elements to always have positive dimensions for consistent resize behavior
        // Convert negative dimensions to positive while adjusting position accordingly
        if (this.currentElement.type !== 'line' && this.currentElement.type !== 'arrow' && this.currentElement.type !== 'path') {
            if (this.currentElement.width < 0) {
                // Negative width: move x position and make width positive
                this.currentElement.x += this.currentElement.width;
                this.currentElement.width = -this.currentElement.width;
            }
            
            if (this.currentElement.height < 0) {
                // Negative height: move y position and make height positive
                this.currentElement.y += this.currentElement.height;
                this.currentElement.height = -this.currentElement.height;
            }
            
            // Update the SVG element with normalized dimensions
            this.updateSVGElement(this.currentElement);
        }
        
        // Add to elements array with spatial index update
        this.addElement(this.currentElement);
        
        // Save state to history AFTER adding the element
        this.saveStateToHistory('createElement');
        
        // Select the newly created element and switch to select tool
        this.clearSelection();
        const finishedElement = this.currentElement;
        
        // Clean up BEFORE selecting to ensure the element is treated as finished
        this.currentElement = null;
        this.isDrawing = false;
        
        // Now select the finished element
        this.selectElement(finishedElement);
        
        // If it's a text element, start editing automatically
        const isTextElement = finishedElement.type === 'text';
        
        // Auto-switch to select tool for better UX
        this.setTool('select');
        
        // Start text editing for text elements
        if (isTextElement) {
            // Use setTimeout to ensure the tool change is complete
            setTimeout(() => {
                this.startTextEditing(finishedElement);
            }, 10);
        }
    },

    /**
     * Handle double-click event
     * Opens editing interface for text, image, website, and markdown elements
     * @param {Event} e - Double-click event
     */
    handleDoubleClick(e) {
        e.preventDefault();
        
        // Prevent editing in preview mode
        if (this.isPreviewMode) {
            return;
        }
        
        const point = this.getPointerPosition(e);
        const element = this.getElementAtPoint(point);
        
        // Handle double-click for editable elements when in select mode
        if (element && this.currentTool === 'select') {
            if (element.type === 'text') {
                this.startTextEditing(element);
            } else if (element.type === 'image') {
                this.editImageElement(element);
            } else if (element.type === 'website') {
                this.editWebsiteElement(element);
            } else if (element.type === 'markdown') {
                // Switch to editing mode for markdown elements
                const container = element.svgElement.querySelector('.sww-markdown-element-container');
                const textarea = element.svgElement.querySelector('.sww-markdown-editor');
                const renderedView = element.svgElement.querySelector('.sww-markdown-rendered');
                
                if (container && textarea && renderedView) {
                    // Toggle to editing mode using CSS classes on the container
                    container.classList.add('sww-markdown-editing');
                    container.classList.remove('sww-markdown-readonly');
                    
                    textarea.readOnly = false;
                    textarea.style.cursor = 'text';
                    textarea.focus();
                    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
                    
                    // Add blur handler to switch back to rendered view
                    const handleBlur = () => {
                        // Switch back to rendered view using CSS classes
                        container.classList.remove('sww-markdown-editing');
                        container.classList.add('sww-markdown-readonly');
                        
                        textarea.readOnly = true;
                        textarea.style.cursor = 'default';
                        textarea.removeEventListener('blur', handleBlur);
                        
                        // Save state for undo/redo
                        this.saveStateToHistory('editMarkdown');
                    };
                    textarea.addEventListener('blur', handleBlur);
                }
            } else if (element.type === 'table') {
                // For table elements, the editing happens inline via the TableToolMixin
                // Select the cell that was clicked for inline editing
                const clickedCell = e.target.closest('.sww-table-cell');
                if (clickedCell && this.editTableCell) {
                    const isHeader = clickedCell.classList.contains('sww-table-header');
                    const row = clickedCell.closest('tr');
                    const tbody = element.svgElement.querySelector('tbody');
                    const rows = tbody ? Array.from(tbody.querySelectorAll('tr')) : [];
                    const rowIndex = isHeader ? 'header' : rows.indexOf(row);
                    const cells = Array.from(row.querySelectorAll('th, td'));
                    const colIndex = cells.indexOf(clickedCell);
                    
                    if (rowIndex !== -1 && colIndex !== -1) {
                        this.editTableCell(element, rowIndex, colIndex, clickedCell);
                    }
                }
            }
        }
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
