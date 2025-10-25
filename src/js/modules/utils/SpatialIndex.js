/**
 * Spatial indexing for efficient hit testing with large numbers of elements
 */
export class SpatialIndex {
    constructor(cellSize = 100) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }
    
    getCellKey(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }
    
    insert(element, bounds) {
        if (!bounds) return;
        
        const startX = Math.floor(bounds.x / this.cellSize);
        const endX = Math.floor((bounds.x + bounds.width) / this.cellSize);
        const startY = Math.floor(bounds.y / this.cellSize);
        const endY = Math.floor((bounds.y + bounds.height) / this.cellSize);
        
        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const key = `${x},${y}`;
                if (!this.grid.has(key)) {
                    this.grid.set(key, new Set());
                }
                this.grid.get(key).add(element);
            }
        }
    }
    
    query(point) {
        const key = this.getCellKey(point.x, point.y);
        return this.grid.get(key) || new Set();
    }
    
    remove(element) {
        for (const [key, elements] of this.grid.entries()) {
            elements.delete(element);
            if (elements.size === 0) {
                this.grid.delete(key);
            }
        }
    }
    
    clear() {
        this.grid.clear();
    }
    
    rebuild(elements, getBoundsFunc) {
        this.clear();
        elements.forEach(element => {
            const bounds = getBoundsFunc(element);
            this.insert(element, bounds);
        });
    }
}
