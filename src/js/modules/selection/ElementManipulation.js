/**
 * ElementManipulation.js
 * Handles drag, resize, and rotate operations for selected elements
 * Part of Phase 4: Selection System
 */

export const ElementManipulationMixin = {
    /**
     * Start dragging selected elements
     * Called from handleSelectStart when element is clicked
     */
    startElementDrag(point) {
        // Check if any selected elements are locked
        const hasLockedElements = Array.from(this.selectedElements).some(el => el.locked);
        if (hasLockedElements) {
            return; // Don't allow dragging locked elements
        }

        this.isDraggingElement = true;
        this.manipulationMode = 'move';
        this.dragStartPoint = point;

        // Update cursor to show grabbing state
        this.svg.style.cursor = 'grabbing';

        // Store initial positions of all selected elements
        this.selectedElements.forEach(el => {
            el.dragStartX = el.x;
            el.dragStartY = el.y;
        });
    },

    /**
     * Update element positions during drag
     * Called continuously during pointer move
     */
    updateElementDrag(point) {
        if (!this.isDraggingElement || !this.dragStartPoint) return;

        const dx = point.x - this.dragStartPoint.x;
        const dy = point.y - this.dragStartPoint.y;
        const selectedElements = Array.from(this.selectedElements);
        const shouldSnapDrag = this.snapToGrid &&
            selectedElements.some(element => element.type !== 'path');
        const moveX = shouldSnapDrag ? this.snapToGridValue(dx) : dx;
        const moveY = shouldSnapDrag ? this.snapToGridValue(dy) : dy;

        // Move all selected elements
        selectedElements.forEach(element => {
            element.x = element.dragStartX + moveX;
            element.y = element.dragStartY + moveY;

            this.updateSVGElement(element);
        });

        this.updateSelectionHandles();
    },

    /**
     * Finish dragging elements and save to history
     */
    finishElementDrag() {
        if (!this.isDraggingElement) return;

        // Save state after the drag operation is complete
        this.saveStateToHistory('moveElements');

        // Clean up drag state and update spatial index
        this.selectedElements.forEach(element => {
            delete element.dragStartX;
            delete element.dragStartY;
            this.updateElementInSpatialIndex(element);
        });

        this.isDraggingElement = false;
        this.dragStartPoint = null;
        this.manipulationMode = null;

        // Reset cursor - will be updated by next pointer move
        this.svg.style.cursor = 'grab';
    },

    /**
     * Start resizing selected elements
     * @param {string} handleType - The resize handle being dragged (nw, ne, sw, se, n, s, e, w)
     * @param {Object} point - The pointer position {x, y}
     */
    startResize(handleType, point) {
        // Check if any selected elements are locked
        const hasLockedElements = Array.from(this.selectedElements).some(el => el.locked);
        if (hasLockedElements) {
            return; // Don't allow resizing locked elements
        }

        this.isResizing = true;
        this.manipulationMode = 'resize';
        this.resizeHandle = handleType;
        this.dragStartPoint = point;

        // Store initial dimensions of selected elements
        this.selectedElements.forEach(element => {
            element.resizeStartX = element.x;
            element.resizeStartY = element.y;

            if (element.type === 'text') {
                // For text elements, ensure consistent dimensions
                if (!element.width || !element.height) {
                    const bounds = this.measureText(element.text || 'Text', element.fontSize, element.fontFamily);
                    const padding = 10;
                    element.width = bounds.width + (padding * 2);
                    element.height = bounds.height + (padding * 2);
                }
            } else if (element.type === 'path') {
                // For path elements, store the original points for scaling
                element.resizeStartPoints = element.points ? element.points.map(p => ({x: p.x, y: p.y})) : [];
            }

            element.resizeStartWidth = element.width;
            element.resizeStartHeight = element.height;
        });
    },

    /**
     * Update element dimensions during resize
     * Handles all 8 resize handles with different logic for shapes, text, lines, and paths
     */
    updateResize(point) {
        if (!this.isResizing || !this.dragStartPoint) return;

        let dx = point.x - this.dragStartPoint.x;
        let dy = point.y - this.dragStartPoint.y;

        this.selectedElements.forEach(element => {
            const startX = element.resizeStartX;
            const startY = element.resizeStartY;
            const startWidth = element.resizeStartWidth;
            const startHeight = element.resizeStartHeight;

            // Transform dx/dy to account for element rotation
            let localDx = dx;
            let localDy = dy;

            if (element.rotation && element.rotation !== 0) {
                const angle = -element.rotation * Math.PI / 180; // Negative for inverse transformation
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);

                // Rotate the delta vector to match element's local coordinate system
                localDx = dx * cos - dy * sin;
                localDy = dx * sin + dy * cos;
            }

            // Use local deltas for resize calculations
            dx = localDx;
            dy = localDy;

            // Store the original values in case we need to constrain
            let newX = element.x;
            let newY = element.y;
            let newWidth = element.width;
            let newHeight = element.height;

            // Special handling for lines and arrows - preserve direction
            if (element.type === 'line' || element.type === 'arrow') {
                switch (this.resizeHandle) {
                    case 'se': // Moving end point
                        newWidth = startWidth + dx;
                        newHeight = startHeight + dy;
                        break;
                    case 'nw': // Moving start point
                        newX = startX + dx;
                        newY = startY + dy;
                        newWidth = startWidth - dx;
                        newHeight = startHeight - dy;
                        break;
                    default:
                        // Map other handles to the two main ones
                        if (['w', 'nw', 'sw', 'n'].includes(this.resizeHandle)) {
                            // Move start point
                            newX = startX + dx;
                            newY = startY + dy;
                            newWidth = startWidth - dx;
                            newHeight = startHeight - dy;
                        } else {
                            // Move end point
                            newWidth = startWidth + dx;
                            newHeight = startHeight + dy;
                        }
                        break;
                }
            } else if (element.type === 'path') {
                // Special handling for path elements (freehand drawings)
                // Path elements support proportional scaling from all 4 corners
                let scaleX, scaleY;

                // Determine scale based on handle direction
                switch (this.resizeHandle) {
                    case 'se': // Southeast - scale from NW origin
                        scaleX = (startWidth + dx) / startWidth;
                        scaleY = (startHeight + dy) / startHeight;
                        break;
                    case 'nw': // Northwest - scale from SE origin
                        scaleX = (startWidth - dx) / startWidth;
                        scaleY = (startHeight - dy) / startHeight;
                        break;
                    case 'ne': // Northeast - scale from SW origin
                        scaleX = (startWidth + dx) / startWidth;
                        scaleY = (startHeight - dy) / startHeight;
                        break;
                    case 'sw': // Southwest - scale from NE origin
                        scaleX = (startWidth - dx) / startWidth;
                        scaleY = (startHeight + dy) / startHeight;
                        break;
                    default:
                        scaleX = 1;
                        scaleY = 1;
                }

                // Use uniform scale to maintain proportions (aspect ratio)
                const scale = Math.min(Math.abs(scaleX), Math.abs(scaleY));

                // Apply the scale
                newWidth = startWidth * scale;
                newHeight = startHeight * scale;

                // Adjust position based on which corner is being dragged
                switch (this.resizeHandle) {
                    case 'se': // Southeast - origin stays at NW
                        // No position change needed
                        break;
                    case 'nw': // Northwest - origin moves, SE corner stays fixed
                        newX = startX + startWidth - newWidth;
                        newY = startY + startHeight - newHeight;
                        break;
                    case 'ne': // Northeast - origin moves vertically, SW corner stays fixed
                        newY = startY + startHeight - newHeight;
                        break;
                    case 'sw': // Southwest - origin moves horizontally, NE corner stays fixed
                        newX = startX + startWidth - newWidth;
                        break;
                }

                // Scale the points from the original stored points
                if (element.resizeStartPoints) {
                    element.points = element.resizeStartPoints.map(point => ({
                        x: point.x * scale,
                        y: point.y * scale
                    }));
                }
            } else {
                const isTextElement = element.type === 'text';

                // Standard resize behavior for shapes
                switch (this.resizeHandle) {
                    case 'se': // Southeast handle - works for all elements
                        newWidth = startWidth + dx;
                        newHeight = startHeight + dy;
                        break;
                    case 'sw': // Southwest handle
                        newX = startX + dx;
                        newWidth = startWidth - dx;
                        newHeight = startHeight + dy;
                        break;
                    case 'ne': // Northeast handle
                        newY = startY + dy;
                        newWidth = startWidth + dx;
                        newHeight = startHeight - dy;
                        break;
                    case 'nw': // Northwest handle
                        newX = startX + dx;
                        newY = startY + dy;
                        newWidth = startWidth - dx;
                        newHeight = startHeight - dy;
                        break;
                    case 'e': // East handle - adjust width only
                        newWidth = startWidth + dx;
                        break;
                    case 'w': // West handle
                        newX = startX + dx;
                        newWidth = startWidth - dx;
                        break;
                    case 'n': // North handle
                        newY = startY + dy;
                        newHeight = startHeight - dy;
                        break;
                    case 's': // South handle - adjust height only
                        newHeight = startHeight + dy;
                        break;
                }

                // For text elements: prevent flipping and enforce minimum size
                if (isTextElement) {
                    // Calculate minimum size based on text content
                    const textContent = element.originalText || element.text || 'Text';
                    const measuredBounds = this.measureText(textContent, element.fontSize, element.fontFamily);
                    const padding = 20;

                    const minWidth = Math.max(100, measuredBounds.width + padding);
                    const minHeight = Math.max(40, element.fontSize * 1.5 + padding);

                    // Handle width constraints for west-side handles
                    if (['w', 'nw', 'sw'].includes(this.resizeHandle)) {
                        if (newWidth < minWidth) {
                            // Adjust position so the RIGHT edge (anchor) stays in place
                            newX = startX + startWidth - minWidth;
                            newWidth = minWidth;
                        }
                    } else {
                        // For east-side handles, just enforce minimum
                        if (newWidth < minWidth) {
                            newWidth = minWidth;
                        }
                    }

                    // Handle height constraints for north-side handles
                    if (['n', 'nw', 'ne'].includes(this.resizeHandle)) {
                        if (newHeight < minHeight) {
                            // Adjust position so the BOTTOM edge (anchor) stays in place
                            newY = startY + startHeight - minHeight;
                            newHeight = minHeight;
                        }
                    } else {
                        // For south-side handles, just enforce minimum
                        if (newHeight < minHeight) {
                            newHeight = minHeight;
                        }
                    }
                }
            }

            // Ensure minimum size and prevent negative values
            const minSize = 10;

            if (element.type === 'line' || element.type === 'arrow') {
                // For lines and arrows, allow negative dimensions to preserve direction
                const minLineLength = 20; // Minimum line length
                const currentLength = Math.sqrt(newWidth * newWidth + newHeight * newHeight);

                if (currentLength < minLineLength) {
                    // Preserve direction but enforce minimum length
                    const scale = minLineLength / currentLength;
                    newWidth = newWidth * scale;
                    newHeight = newHeight * scale;
                }
            } else {
                // Standard minimum size constraints for other shapes
                const currentAbsWidth = Math.abs(newWidth);
                const currentAbsHeight = Math.abs(newHeight);

                // Handle width constraints
                if (currentAbsWidth < minSize) {
                    const direction = newWidth >= 0 ? 1 : -1;
                    newWidth = minSize * direction;

                    if (this.resizeHandle.includes('w')) {
                        // West handles: adjust X position to maintain right edge
                        if (direction > 0) {
                            newX = startX + startWidth - minSize;
                        } else {
                            newX = startX + startWidth + minSize;
                        }
                    }
                }

                // Handle height constraints
                if (currentAbsHeight < minSize) {
                    const direction = newHeight >= 0 ? 1 : -1;
                    newHeight = minSize * direction;

                    if (this.resizeHandle.includes('n')) {
                        // North handles: adjust Y position to maintain bottom edge
                        if (direction > 0) {
                            newY = startY + startHeight - minSize;
                        } else {
                            newY = startY + startHeight + minSize;
                        }
                    }
                }
            }

            // Apply the constrained values
            element.x = newX;
            element.y = newY;
            element.width = newWidth;
            element.height = newHeight;

            // Apply grid snapping to position and size
            if (this.snapToGrid) {
                const snappedPoint = this.snapToGridPoint({ x: element.x, y: element.y });
                element.x = snappedPoint.x;
                element.y = snappedPoint.y;
                element.width = this.snapToGridValue(element.width);
                element.height = this.snapToGridValue(element.height);
            }

            // Special handling for text elements
            if (element.type === 'text') {
                this.adjustTextToFitBounds(element);
            }

            this.updateSVGElement(element);
        });

        this.updateSelectionHandles();

        // Update properties panel in real-time during resize (only width/height)
        if (this.throttledRealTimeUpdate) {
            this.throttledRealTimeUpdate(['width', 'height']);
        }
    },

    /**
     * Adjust text element content to fit within bounds
     * Wraps text to fit available width
     */
    adjustTextToFitBounds(element) {
        if (element.type !== 'text') return;

        const originalText = element.originalText || element.text || 'Text';
        element.originalText = originalText; // Store original text for re-wrapping

        const padding = 10; // Consistent padding
        const targetWidth = Math.abs(element.width) - (padding * 2);
        const targetHeight = Math.abs(element.height) - (padding * 2);

        if (targetWidth <= 0 || targetHeight <= 0) return;

        // Maintain the current font size - don't scale it down
        const fontSize = element.fontSize;

        // Wrap the text to fit the width, maintaining font size
        const wrappedText = this.wrapText(originalText, targetWidth, fontSize, element.fontFamily);

        // Update element text with wrapped version
        element.text = wrappedText;
    },

    /**
     * Wrap text to fit within a maximum width
     * @param {string} text - The text to wrap
     * @param {number} maxWidth - Maximum width in pixels
     * @param {number} fontSize - Font size
     * @param {string} fontFamily - Font family
     * @returns {string} Wrapped text with newlines
     */
    wrapText(text, maxWidth, fontSize, fontFamily) {
        if (!text || maxWidth <= 0) return text;

        const words = text.split(/(\s+)/); // Keep whitespace
        const lines = [];
        let currentLine = '';

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine + word;
            const testBounds = this.measureText(testLine, fontSize, fontFamily);

            if (testBounds.width <= maxWidth || currentLine === '') {
                currentLine = testLine;
            } else {
                // Current line is full, start new line
                if (currentLine.trim()) {
                    lines.push(currentLine.trim());
                }
                currentLine = word;

                // If single word is too long, just keep it
                if (this.measureText(currentLine, fontSize, fontFamily).width > maxWidth) {
                    if (currentLine.trim()) {
                        lines.push(currentLine.trim());
                        currentLine = '';
                    }
                }
            }
        }

        // Add remaining text
        if (currentLine.trim()) {
            lines.push(currentLine.trim());
        }

        return lines.join('\n');
    },

    /**
     * Finish resizing elements and save to history
     */
    finishResize() {
        if (!this.isResizing) return;

        // Save state after the resize operation is complete
        this.saveStateToHistory('resizeElements');

        // Normalize all resized elements to southeast direction for consistent behavior
        this.selectedElements.forEach(element => {
            // Only normalize shape elements (not lines, arrows, or paths)
            if (element.type !== 'line' && element.type !== 'arrow' && element.type !== 'path') {
                if (element.width < 0) {
                    // Negative width: move x position and make width positive
                    element.x += element.width;
                    element.width = -element.width;
                }

                if (element.height < 0) {
                    // Negative height: move y position and make height positive
                    element.y += element.height;
                    element.height = -element.height;
                }

                // Update the SVG element with normalized dimensions
                this.updateSVGElement(element);
            }

            this.updateElementInSpatialIndex(element);
        });

        // Update selection handles after normalization
        this.updateSelectionHandles();

        // Clean up resize state
        this.selectedElements.forEach(element => {
            delete element.resizeStartX;
            delete element.resizeStartY;
            delete element.resizeStartWidth;
            delete element.resizeStartHeight;
            delete element.resizeStartPoints; // Clean up path-specific data
        });

        this.isResizing = false;
        this.resizeHandle = null;
        this.dragStartPoint = null;
        this.manipulationMode = null;
    },

    /**
     * Start rotating selected elements
     * @param {Object} point - The pointer position {x, y}
     */
    startRotation(point) {
        this.isRotating = true;
        this.manipulationMode = 'rotate';
        this.dragStartPoint = point;

        this.svg.style.cursor = 'crosshair';

        this.selectedElements.forEach(element => {
            element.rotateStartAngle = element.rotation || 0;
        });
    },

    /**
     * Update element rotation during rotate operation
     * Snaps to 5-degree increments
     */
    updateRotation(point) {
        if (!this.isRotating || !this.dragStartPoint) return;

        // Calculate rotation angle based on mouse movement
        this.selectedElements.forEach(element => {
            const bounds = this.getElementBounds(element);
            const centerX = bounds.x + bounds.width / 2;
            const centerY = bounds.y + bounds.height / 2;

            // Calculate angles
            const startAngle = Math.atan2(this.dragStartPoint.y - centerY, this.dragStartPoint.x - centerX);
            const currentAngle = Math.atan2(point.y - centerY, point.x - centerX);
            const deltaAngle = (currentAngle - startAngle) * (180 / Math.PI);

            // Calculate the new rotation angle
            let newRotation = (element.rotateStartAngle + deltaAngle) % 360;

            // Snap to 5-degree increments
            newRotation = Math.round(newRotation / 5) * 5;

            // Ensure angle is between 0 and 360
            if (newRotation < 0) newRotation += 360;

            element.rotation = newRotation;
            this.updateSVGElement(element);
        });

        this.updateSelectionHandles();

        // Update properties panel in real-time during rotation
        if (this.throttledRealTimeUpdate) {
            this.throttledRealTimeUpdate(['rotation']);
        }
    },

    /**
     * Finish rotating elements and save to history
     */
    finishRotation() {
        if (!this.isRotating) return;

        // Save state after the rotation operation is complete
        this.saveStateToHistory('rotateElements');

        // Clean up rotation state and update spatial index
        this.selectedElements.forEach(element => {
            delete element.rotateStartAngle;
            this.updateElementInSpatialIndex(element);
        });

        this.isRotating = false;
        this.dragStartPoint = null;
        this.manipulationMode = null;

        // Reset cursor - will be updated by next pointer move
        this.svg.style.cursor = 'default';
    }
};
