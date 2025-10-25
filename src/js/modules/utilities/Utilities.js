/**
 * Utilities.js
 * Utility helper functions
 * Part of Phase 7: Final extractions
 * 
 * Provides methods for:
 * - ID generation
 * - Element lookup by ID
 * - Element visibility toggle
 * - Element selection/deletion by ID
 * - Element bounds calculation
 * - Text measurement
 * - Rotation bounds calculation
 */

export const UtilitiesMixin = {
    /**
     * Generate a unique ID for elements
     * @returns {string} Unique ID with 'sww-' prefix
     */
    generateId() {
        return 'sww-' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Find an element by its ID
     * @param {string} elementId - Element ID to search for
     * @returns {Object|null} Element object or null if not found
     */
    getElementById(elementId) {
        return this.elements.find(element => element.id === elementId) || null;
    },

    /**
     * Toggle element visibility
     * @param {string} elementId - Element ID to toggle
     * @returns {boolean} True if toggled successfully
     */
    toggleElementVisibility(elementId) {
        const element = this.getElementById(elementId);
        if (element) {
            element.hidden = !element.hidden;
            
            // Update the SVG element visibility
            if (element.svgElement) {
                element.svgElement.style.display = element.hidden ? 'none' : '';
            }
            
            // Trigger an optimized render update
            if (this.performOptimizedRender) {
                this.performOptimizedRender();
            }
            return true;
        }
        return false;
    },

    /**
     * Select an element by its ID
     * @param {string} elementId - Element ID to select
     * @returns {boolean} True if selected successfully
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
     * Delete an element by its ID
     * @param {string} elementId - Element ID to delete
     * @returns {boolean} True if deleted successfully
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
     * Calculate element bounds with support for different element types
     * @param {Object} element - Element to calculate bounds for
     * @returns {Object} Bounds with x, y, width, height
     */
    getElementBounds(element) {
        let bounds;
        
        if (element.type === 'text') {
            // Always use consistent boundary calculation for text elements
            const text = element.text || 'Text';
            const measuredBounds = this.measureText(text, element.fontSize, element.fontFamily);
            
            // Standard padding for all text elements
            const padding = 10;
            
            // Use resized dimensions if available, otherwise use measured bounds
            let width = element.width ? Math.abs(element.width) : measuredBounds.width + (padding * 2);
            let height = element.height ? Math.abs(element.height) : measuredBounds.height + (padding * 2);
            
            // Ensure minimum dimensions for better UX
            width = Math.max(width, measuredBounds.width + (padding * 2));
            height = Math.max(height, measuredBounds.height + (padding * 2));
            
            // Consistent positioning - always use element position as top-left corner
            bounds = {
                x: element.x,
                y: element.y,
                width: width,
                height: height
            };
        } else if (element.type === 'line' || element.type === 'arrow') {
            // For lines and arrows, create bounding box from start and end points
            const startX = element.x;
            const startY = element.y;
            const endX = element.x + element.width;
            const endY = element.y + element.height;
            
            // Calculate the actual bounding rectangle
            const minX = Math.min(startX, endX);
            const minY = Math.min(startY, endY);
            const maxX = Math.max(startX, endX);
            const maxY = Math.max(startY, endY);
            
            // Add some padding for easier selection
            const padding = 5;
            
            bounds = {
                x: minX - padding,
                y: minY - padding,
                width: (maxX - minX) + (padding * 2),
                height: (maxY - minY) + (padding * 2)
            };
        } else if (element.type === 'path') {
            // For freehand drawing paths, handle both drawing and finished states
            if (this.currentElement && this.currentElement.id === element.id) {
                // Currently being drawn: points are absolute, calculate bounds directly
                if (element.points && element.points.length > 0) {
                    let minX = element.points[0].x;
                    let minY = element.points[0].y;
                    let maxX = element.points[0].x;
                    let maxY = element.points[0].y;
                    
                    // Find the bounding box from absolute points
                    for (let i = 1; i < element.points.length; i++) {
                        const point = element.points[i];
                        minX = Math.min(minX, point.x);
                        minY = Math.min(minY, point.y);
                        maxX = Math.max(maxX, point.x);
                        maxY = Math.max(maxY, point.y);
                    }
                    
                    // Add padding for easier selection
                    const padding = Math.max(element.strokeWidth || 2, 8);
                    
                    bounds = {
                        x: minX - padding,
                        y: minY - padding,
                        width: (maxX - minX) + (padding * 2),
                        height: (maxY - minY) + (padding * 2)
                    };
                }
            } else if (element.width !== undefined && element.height !== undefined) {
                // Finished element: use the stored bounds since points are now relative
                const padding = Math.max(element.strokeWidth || 2, 8);
                
                bounds = {
                    x: element.x - padding,
                    y: element.y - padding,
                    width: element.width + (padding * 2),
                    height: element.height + (padding * 2)
                };
            } else if (element.points && element.points.length > 0) {
                // Fallback: calculate from relative points
                let minX = element.points[0].x;
                let minY = element.points[0].y;
                let maxX = element.points[0].x;
                let maxY = element.points[0].y;
                
                // Find the bounding box from relative points
                for (let i = 1; i < element.points.length; i++) {
                    const point = element.points[i];
                    minX = Math.min(minX, point.x);
                    minY = Math.min(minY, point.y);
                    maxX = Math.max(maxX, point.x);
                    maxY = Math.max(maxY, point.y);
                }
                
                // Add padding and convert to absolute coordinates
                const padding = Math.max(element.strokeWidth || 2, 8);
                
                bounds = {
                    x: element.x + minX - padding,
                    y: element.y + minY - padding,
                    width: (maxX - minX) + (padding * 2),
                    height: (maxY - minY) + (padding * 2)
                };
            } else {
                // Final fallback if no points available
                bounds = {
                    x: element.x,
                    y: element.y,
                    width: Math.max(Math.abs(element.width || 0), 20),
                    height: Math.max(Math.abs(element.height || 0), 20)
                };
            }
        } else if (element.type === 'star') {
            // For star shapes, calculate bounds based on actual star points using elliptical radii
            const absWidth = Math.abs(element.width);
            const absHeight = Math.abs(element.height);
            
            // Calculate center based on actual position and dimensions
            const cx = element.width >= 0 ? element.x + element.width / 2 : element.x + element.width / 2;
            const cy = element.height >= 0 ? element.y + element.height / 2 : element.y + element.height / 2;
            
            // Use separate radii for width and height to match createStarPoints
            const outerRadiusX = absWidth / 2;
            const outerRadiusY = absHeight / 2;
            const innerRadiusX = outerRadiusX * 0.4;
            const innerRadiusY = outerRadiusY * 0.4;
            
            // Find the actual bounds of the star points
            let minX = cx, maxX = cx, minY = cy, maxY = cy;
            
            for (let i = 0; i < 10; i++) {
                const angle = (i * Math.PI) / 5 - Math.PI / 2;
                const radiusX = i % 2 === 0 ? outerRadiusX : innerRadiusX;
                const radiusY = i % 2 === 0 ? outerRadiusY : innerRadiusY;
                const pointX = cx + radiusX * Math.cos(angle);
                const pointY = cy + radiusY * Math.sin(angle);
                
                minX = Math.min(minX, pointX);
                maxX = Math.max(maxX, pointX);
                minY = Math.min(minY, pointY);
                maxY = Math.max(maxY, pointY);
            }
            
            // Add small padding for easier selection
            const padding = Math.max(element.strokeWidth || 2, 3);
            
            bounds = {
                x: minX - padding,
                y: minY - padding,
                width: (maxX - minX) + (padding * 2),
                height: (maxY - minY) + (padding * 2)
            };
        } else {
            // For other elements (rectangle, ellipse, diamond, parallelogram), handle negative dimensions
            const elementX = element.width < 0 ? element.x + element.width : element.x;
            const elementY = element.height < 0 ? element.y + element.height : element.y;
            bounds = {
                x: elementX,
                y: elementY,
                width: Math.abs(element.width),
                height: Math.abs(element.height)
            };
        }
        
        // Apply rotation if element is rotated
        if (element.rotation && element.rotation !== 0) {
            return this.getRotatedBounds(bounds, element.rotation);
        }
        
        return bounds;
    },

    /**
     * Calculate bounds for a rotated element
     * @param {Object} bounds - Original bounds with x, y, width, height
     * @param {number} rotation - Rotation angle in degrees
     * @returns {Object} Rotated bounds
     */
    getRotatedBounds(bounds, rotation) {
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        
        // Get the four corners of the original rectangle
        const corners = [
            { x: bounds.x, y: bounds.y },
            { x: bounds.x + bounds.width, y: bounds.y },
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
            { x: bounds.x, y: bounds.y + bounds.height }
        ];
        
        // Rotate each corner around the center
        const rotatedCorners = corners.map(corner => {
            const radians = (rotation * Math.PI) / 180;
            const dx = corner.x - centerX;
            const dy = corner.y - centerY;
            
            return {
                x: centerX + dx * Math.cos(radians) - dy * Math.sin(radians),
                y: centerY + dx * Math.sin(radians) + dy * Math.cos(radians)
            };
        });
        
        // Find the bounding box of the rotated corners
        let minX = rotatedCorners[0].x;
        let maxX = rotatedCorners[0].x;
        let minY = rotatedCorners[0].y;
        let maxY = rotatedCorners[0].y;
        
        for (let i = 1; i < rotatedCorners.length; i++) {
            minX = Math.min(minX, rotatedCorners[i].x);
            maxX = Math.max(maxX, rotatedCorners[i].x);
            minY = Math.min(minY, rotatedCorners[i].y);
            maxY = Math.max(maxY, rotatedCorners[i].y);
        }
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    },

    /**
     * Measure text dimensions
     * @param {string} text - Text to measure (supports multi-line)
     * @param {number} fontSize - Font size in pixels
     * @param {string} fontFamily - Font family name
     * @returns {Object} Dimensions with width and height
     */
    measureText(text, fontSize = 16, fontFamily = 'Arial') {
        // Create a temporary canvas to measure text
        if (!this.textMeasureCanvas) {
            this.textMeasureCanvas = document.createElement('canvas');
            this.textMeasureContext = this.textMeasureCanvas.getContext('2d');
        }
        
        const ctx = this.textMeasureContext;
        ctx.font = `${fontSize}px ${fontFamily}`;
        
        const lines = text.split('\n');
        let maxWidth = 0;
        
        for (const line of lines) {
            const metrics = ctx.measureText(line);
            maxWidth = Math.max(maxWidth, metrics.width);
        }
        
        const lineHeight = fontSize * 1.3; // Increased line height for better spacing
        const height = lines.length * lineHeight;
        
        return {
            width: Math.max(maxWidth, 40), // Increased minimum width
            height: Math.max(height, fontSize * 1.3) // Better minimum height
        };
    },

    /**
     * Clean up element resources and event listeners
     * @param {Object} element - Element to clean up
     */
    cleanupElement(element) {
        // Remove event listeners
        if (element.svgElement) {
            element.svgElement.removeEventListener('mousedown', element._mouseDownHandler);
            element.svgElement.removeEventListener('touchstart', element._touchStartHandler);
        }
        
        // Clear references
        element.svgElement = null;
        element._mouseDownHandler = null;
        element._touchStartHandler = null;
    },

    /**
     * Get element at a specific point (hit testing)
     * Uses spatial index for performance with many elements
     * @param {Object} point - {x, y} coordinates
     * @returns {Object|null} Element at point or null
     */
    getElementAtPoint(point) {
        // Use spatial index for efficient hit testing with large numbers of elements
        const candidates = this.spatialIndex.query(point);
        
        // Convert Set to Array and reverse for proper z-order (top elements first)
        const candidateArray = Array.from(candidates);
        
        // Sort by z-index (array index represents z-order)
        candidateArray.sort((a, b) => {
            const indexA = this.elements.indexOf(a);
            const indexB = this.elements.indexOf(b);
            return indexB - indexA; // Reverse order for top-to-bottom checking
        });
        
        // Check candidates for actual hit
        for (const element of candidateArray) {
            if (this.isPointInElement(point, element)) {
                return element;
            }
        }
        
        // Fallback to original method if spatial index doesn't find anything
        // This handles edge cases where elements might not be properly indexed
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const element = this.elements[i];
            if (this.isPointInElement(point, element)) {
                return element;
            }
        }
        
        return null;
    },

    /**
     * Check if a point is within an element's bounds
     * Different logic for different element types
     * @param {Object} point - {x, y} coordinates
     * @param {Object} element - Element to test
     * @returns {boolean} True if point is in element
     */
    isPointInElement(point, element) {
        const bounds = this.getElementBounds(element);
        const tolerance = 12; // Minimum 12px tolerance for better UI/UX across all elements
        
        switch (element.type) {
            case 'text':
                // For text, use the calculated bounds with tolerance
                return point.x >= bounds.x - tolerance && 
                       point.x <= bounds.x + bounds.width + tolerance &&
                       point.y >= bounds.y - tolerance && 
                       point.y <= bounds.y + bounds.height + tolerance;
                       
            case 'line':
            case 'arrow':
                // For lines, use increased tolerance for easier selection
                const lineSelectionTolerance = Math.max(element.strokeWidth / 2 + 8, tolerance); // Minimum 12px for easy clicking
                return this.distanceToLine(point, 
                    { x: element.x, y: element.y }, 
                    { x: element.x + element.width, y: element.y + element.height }
                ) <= lineSelectionTolerance;
                
            case 'path':
                // For paths, check if near any point in the path
                if (element.points) {
                    for (let i = 0; i < element.points.length; i++) {
                        const pathPoint = element.points[i];
                        let absoluteX, absoluteY;
                        
                        // Check if this is the current element being drawn
                        if (this.currentElement && this.currentElement.id === element.id) {
                            // During drawing: points are absolute coordinates
                            absoluteX = pathPoint.x;
                            absoluteY = pathPoint.y;
                        } else {
                            // Finished element: convert relative point to absolute coordinates
                            absoluteX = pathPoint.x + element.x;
                            absoluteY = pathPoint.y + element.y;
                        }
                        
                        const distance = Math.sqrt(
                            Math.pow(point.x - absoluteX, 2) + 
                            Math.pow(point.y - absoluteY, 2)
                        );
                        if (distance <= Math.max(element.strokeWidth || 2, tolerance)) {
                            return true;
                        }
                    }
                }
                return false;
                
            default:
                // For rectangles, ellipses, diamonds, parallelograms, stars - use bounds with minimum 12px tolerance
                return point.x >= bounds.x - tolerance && 
                       point.x <= bounds.x + bounds.width + tolerance &&
                       point.y >= bounds.y - tolerance && 
                       point.y <= bounds.y + bounds.height + tolerance;
        }
    },

    /**
     * Calculate distance from a point to a line segment
     * Used for line/arrow hit testing
     * @param {Object} point - {x, y} point to test
     * @param {Object} lineStart - {x, y} line start point
     * @param {Object} lineEnd - {x, y} line end point
     * @returns {number} Distance in pixels
     */
    distanceToLine(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) return Math.sqrt(A * A + B * B);
        
        let param = dot / lenSq;
        
        if (param < 0) {
            return Math.sqrt(A * A + B * B);
        } else if (param > 1) {
            const E = point.x - lineEnd.x;
            const F = point.y - lineEnd.y;
            return Math.sqrt(E * E + F * F);
        } else {
            const xx = lineStart.x + param * C;
            const yy = lineStart.y + param * D;
            const dx = point.x - xx;
            const dy = point.y - yy;
            return Math.sqrt(dx * dx + dy * dy);
        }
    }
};
