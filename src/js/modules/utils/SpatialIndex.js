/**
 * Spatial indexing for efficient hit testing with large numbers of elements
 */
export class SpatialIndex {
    constructor(cellSize = 100) {
        this.cellSize = cellSize;
        this.grid = new Map();
        this.elementCells = new Map();
    }
    
    getCellKey(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }
    
    insert(element, bounds) {
        if (!bounds) return;
        this.remove(element);
        
        const startX = Math.floor(bounds.x / this.cellSize);
        const endX = Math.floor((bounds.x + bounds.width) / this.cellSize);
        const startY = Math.floor(bounds.y / this.cellSize);
        const endY = Math.floor((bounds.y + bounds.height) / this.cellSize);
        
        const occupiedCells = new Set();
        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const key = `${x},${y}`;
                if (!this.grid.has(key)) {
                    this.grid.set(key, new Set());
                }
                this.grid.get(key).add(element);
                occupiedCells.add(key);
            }
        }
        this.elementCells.set(element, occupiedCells);
    }
    
    query(point) {
        const key = this.getCellKey(point.x, point.y);
        return this.grid.get(key) || new Set();
    }

    queryBounds(bounds) {
        const results = new Set();
        const startX = Math.floor(bounds.x / this.cellSize);
        const endX = Math.floor((bounds.x + bounds.width) / this.cellSize);
        const startY = Math.floor(bounds.y / this.cellSize);
        const endY = Math.floor((bounds.y + bounds.height) / this.cellSize);

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const elements = this.grid.get(`${x},${y}`);
                if (elements) elements.forEach((element) => results.add(element));
            }
        }

        return results;
    }
    
    remove(element) {
        const occupiedCells = this.elementCells.get(element);
        if (!occupiedCells) return;

        for (const key of occupiedCells) {
            const elements = this.grid.get(key);
            if (!elements) continue;
            elements.delete(element);
            if (elements.size === 0) {
                this.grid.delete(key);
            }
        }
        this.elementCells.delete(element);
    }
    
    clear() {
        this.grid.clear();
        this.elementCells.clear();
    }
    
    rebuild(elements, getBoundsFunc) {
        this.clear();
        elements.forEach(element => {
            const bounds = getBoundsFunc(element);
            this.insert(element, bounds);
        });
    }
}
