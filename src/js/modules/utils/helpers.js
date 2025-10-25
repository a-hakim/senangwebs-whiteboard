/**
 * Helper utility functions
 */

/**
 * Generate unique ID for elements
 */
export function generateId() {
    return `element-${Date.now()}-${Math.random()}`;
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Validate hex color
 */
export function isValidHex(hex) {
    return /^#[0-9A-F]{6}$/i.test(hex);
}

/**
 * Snap value to grid
 */
export function snapToGrid(value, gridSize) {
    return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap point to grid
 */
export function snapPointToGrid(point, gridSize) {
    return {
        x: snapToGrid(point.x, gridSize),
        y: snapToGrid(point.y, gridSize)
    };
}

/**
 * Get distance between two points
 */
export function getDistance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get angle between two points in degrees
 */
export function getAngle(p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
}

/**
 * Clamp value between min and max
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
