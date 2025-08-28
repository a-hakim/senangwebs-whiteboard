/**
 * Canvas Manager
 * Handles canvas creation, viewport management, and basic rendering
 */

class CanvasManager {
    constructor(container, options = {}) {
        this.container = container;
        this.options = options;
        this.viewBox = { x: 0, y: 0, width: 1000, height: 1000 };
        this.zoom = 1;
        this.svg = null;
        this.defs = null;
        this.backgroundGroup = null;
        this.elementsGroup = null;
        this.overlayGroup = null;
        
        this.init();
    }

    init() {
        this.createSVG();
        this.createBackground();
        this.createGrid();
        this.setupGroups();
    }

    createSVG() {
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.style.width = this.options.width || '100%';
        this.svg.style.height = this.options.height || '100%';
        this.svg.style.backgroundColor = this.options.backgroundColor || '#ffffff';
        this.svg.style.cursor = 'crosshair';
        this.svg.style.userSelect = 'none';
        this.svg.style.touchAction = 'none';

        // Add definitions for patterns and markers
        this.defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        this.svg.appendChild(this.defs);

        this.container.appendChild(this.svg);
        this.updateViewBox();
    }

    setupGroups() {
        // Background group (grid, etc.)
        this.backgroundGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.backgroundGroup.setAttribute('class', 'sww-background');
        this.svg.appendChild(this.backgroundGroup);

        // Elements group (main drawing elements)
        this.elementsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.elementsGroup.setAttribute('class', 'sww-elements');
        this.svg.appendChild(this.elementsGroup);

        // Overlay group (selection handles, etc.)
        this.overlayGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.overlayGroup.setAttribute('class', 'sww-overlay');
        this.svg.appendChild(this.overlayGroup);
    }

    createBackground() {
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('width', '100%');
        background.setAttribute('height', '100%');
        background.setAttribute('fill', this.options.backgroundColor || '#ffffff');
        background.setAttribute('class', 'sww-canvas-background');
        
        if (this.backgroundGroup) {
            this.backgroundGroup.appendChild(background);
        }
    }

    createGrid() {
        if (!this.options.showGrid) return;

        const gridSize = this.options.gridSize || 20;
        const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
        pattern.setAttribute('id', 'sww-grid');
        pattern.setAttribute('width', gridSize);
        pattern.setAttribute('height', gridSize);
        pattern.setAttribute('patternUnits', 'userSpaceOnUse');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${gridSize} 0 L 0 0 0 ${gridSize}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#e0e0e0');
        path.setAttribute('stroke-width', '1');

        pattern.appendChild(path);
        this.defs.appendChild(pattern);

        const gridRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        gridRect.setAttribute('width', '100%');
        gridRect.setAttribute('height', '100%');
        gridRect.setAttribute('fill', 'url(#sww-grid)');
        gridRect.setAttribute('class', 'sww-grid');

        if (this.backgroundGroup) {
            this.backgroundGroup.appendChild(gridRect);
        }
    }

    updateViewBox() {
        const { x, y, width, height } = this.viewBox;
        this.svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
    }

    setViewBox(x, y, width, height) {
        this.viewBox = { x, y, width, height };
        this.updateViewBox();
    }

    setZoom(zoom) {
        this.zoom = Math.max(0.1, Math.min(5, zoom));
        const centerX = this.viewBox.width / 2;
        const centerY = this.viewBox.height / 2;
        const newWidth = 1000 / this.zoom;
        const newHeight = 1000 / this.zoom;
        
        this.setViewBox(
            centerX - newWidth / 2,
            centerY - newHeight / 2,
            newWidth,
            newHeight
        );
    }

    pan(deltaX, deltaY) {
        this.setViewBox(
            this.viewBox.x + deltaX,
            this.viewBox.y + deltaY,
            this.viewBox.width,
            this.viewBox.height
        );
    }

    screenToSVG(clientX, clientY) {
        const rect = this.svg.getBoundingClientRect();
        const point = this.svg.createSVGPoint();
        point.x = clientX - rect.left;
        point.y = clientY - rect.top;
        
        const svgPoint = point.matrixTransform(this.svg.getScreenCTM().inverse());
        return { x: svgPoint.x, y: svgPoint.y };
    }

    showGrid() {
        const grid = this.svg.querySelector('.sww-grid');
        if (grid) {
            grid.style.display = 'block';
        }
    }

    hideGrid() {
        const grid = this.svg.querySelector('.sww-grid');
        if (grid) {
            grid.style.display = 'none';
        }
    }

    clear() {
        while (this.elementsGroup.firstChild) {
            this.elementsGroup.removeChild(this.elementsGroup.firstChild);
        }
        while (this.overlayGroup.firstChild) {
            this.overlayGroup.removeChild(this.overlayGroup.firstChild);
        }
    }

    resize() {
        // Handle container resize
        const rect = this.container.getBoundingClientRect();
        this.svg.style.width = rect.width + 'px';
        this.svg.style.height = rect.height + 'px';
    }

    dispose() {
        if (this.svg && this.svg.parentNode) {
            this.svg.parentNode.removeChild(this.svg);
        }
    }
}

/**
 * SWW Core Configuration
 * Contains default settings and constants for the library
 */

const VERSION = '2.0.0';

const DEFAULT_OPTIONS = {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    gridSize: 20,
    showGrid: true,
    snapToGrid: true,
    maxHistorySize: 50,
    enableDebug: false
};

const DEFAULT_TOOL_SETTINGS = {
    strokeColor: '#000000',
    strokeWidth: 2,
    fillColor: 'transparent',
    fillStyle: 'solid',
    opacity: 1,
    fontSize: 16,
    fontFamily: 'Arial',
    textAlign: 'left',
    textColor: '#000000'
};

const TOOL_TYPES = {
    SELECT: 'select',
    RECTANGLE: 'rectangle',
    ELLIPSE: 'ellipse',
    DIAMOND: 'diamond',
    ARROW: 'arrow',
    LINE: 'line',
    DRAW: 'draw',
    TEXT: 'text',
    WEBSITE: 'website',
    IMAGE: 'image',
    MARKDOWN: 'markdown'
};

const ELEMENT_TYPES = Object.values(TOOL_TYPES);

const EVENT_TYPES = {
    ELEMENT_CREATED: 'elementCreated',
    ELEMENT_UPDATED: 'elementUpdated',
    ELEMENT_DELETED: 'elementDeleted',
    SELECTION_CHANGED: 'selectionChanged',
    TOOL_CHANGED: 'toolChanged',
    CANVAS_UPDATED: 'canvasUpdated'
};

/**
 * Helper Utilities
 * Common utility functions used throughout the library
 */

/**
 * Generate a unique ID for elements
 */
function generateId() {
    return 'sww-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
}

/**
 * Calculate distance between two points
 */
function distanceBetweenPoints(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Element Factory
 * Handles creation and management of drawing elements
 */


class ElementFactory {
    static createElement(type, point, settings = {}) {
        const id = generateId();
        const baseElement = {
            id,
            type,
            x: point.x,
            y: point.y,
            width: 0,
            height: 0,
            rotation: 0,
            locked: false,
            visible: true,
            zIndex: Date.now(),
            ...DEFAULT_TOOL_SETTINGS,
            ...settings
        };

        switch (type) {
            case 'rectangle':
            case 'ellipse':
            case 'diamond':
                return {
                    ...baseElement,
                    width: 100,
                    height: 80
                };

            case 'arrow':
            case 'line':
                return {
                    ...baseElement,
                    width: 100,
                    height: 0,
                    points: [
                        { x: point.x, y: point.y },
                        { x: point.x + 100, y: point.y }
                    ]
                };

            case 'draw':
                return {
                    ...baseElement,
                    points: [{ x: point.x, y: point.y }],
                    fillColor: 'transparent'
                };

            case 'text':
                return {
                    ...baseElement,
                    text: 'Type here...',
                    fontSize: settings.fontSize || 16,
                    fontFamily: settings.fontFamily || 'Arial',
                    textAlign: settings.textAlign || 'left',
                    width: 0,
                    height: 0,
                    fillColor: 'transparent'
                };

            case 'website':
                return {
                    ...baseElement,
                    url: 'https://example.com',
                    width: 300,
                    height: 200,
                    fillColor: 'transparent'
                };

            case 'image':
                return {
                    ...baseElement,
                    src: '',
                    width: 200,
                    height: 150,
                    fillColor: 'transparent'
                };

            case 'markdown':
                return {
                    ...baseElement,
                    content: '# Markdown Content',
                    width: 300,
                    height: 200,
                    fillColor: 'transparent'
                };

            default:
                throw new Error(`Unknown element type: ${type}`);
        }
    }

    static cloneElement(element) {
        return {
            ...element,
            id: generateId(),
            x: element.x + 20,
            y: element.y + 20,
            zIndex: Date.now()
        };
    }

    static validateElement(element) {
        if (!element.id || !element.type) {
            return false;
        }

        if (!ELEMENT_TYPES.includes(element.type)) {
            return false;
        }

        if (typeof element.x !== 'number' || typeof element.y !== 'number') {
            return false;
        }

        return true;
    }

    static getBoundingBox(element) {
        switch (element.type) {
            case 'line':
            case 'arrow':
                if (element.points && element.points.length >= 2) {
                    const xs = element.points.map(p => p.x);
                    const ys = element.points.map(p => p.y);
                    return {
                        x: Math.min(...xs),
                        y: Math.min(...ys),
                        width: Math.max(...xs) - Math.min(...xs),
                        height: Math.max(...ys) - Math.min(...ys)
                    };
                }
                break;

            case 'draw':
                if (element.points && element.points.length > 0) {
                    const xs = element.points.map(p => p.x);
                    const ys = element.points.map(p => p.y);
                    return {
                        x: Math.min(...xs),
                        y: Math.min(...ys),
                        width: Math.max(...xs) - Math.min(...xs) || 1,
                        height: Math.max(...ys) - Math.min(...ys) || 1
                    };
                }
                break;

            default:
                return {
                    x: element.x,
                    y: element.y,
                    width: element.width || 0,
                    height: element.height || 0
                };
        }

        return { x: 0, y: 0, width: 0, height: 0 };
    }
}

/**
 * History Manager
 * Handles undo/redo functionality with state management
 */

class HistoryManager {
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

/**
 * SVG Renderer
 * Handles rendering of drawing elements to SVG
 */

class SVGRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.elementMap = new Map(); // Track SVG elements by element ID
    }

    renderElement(element) {
        // Remove existing SVG element if it exists
        this.removeElement(element);

        // Create new SVG element
        const svgElement = this.createSVGElement(element);
        if (!svgElement) return;

        // Add to canvas
        this.canvas.elementsGroup.appendChild(svgElement);
        
        // Track the element
        this.elementMap.set(element.id, svgElement);
    }

    removeElement(element) {
        const svgElement = this.elementMap.get(element.id);
        if (svgElement && svgElement.parentNode) {
            svgElement.parentNode.removeChild(svgElement);
        }
        this.elementMap.delete(element.id);
    }

    createSVGElement(element) {
        switch (element.type) {
            case 'rectangle':
                return this.createRectangle(element);
            case 'ellipse':
                return this.createEllipse(element);
            case 'diamond':
                return this.createDiamond(element);
            case 'line':
                return this.createLine(element);
            case 'arrow':
                return this.createArrow(element);
            case 'draw':
                return this.createPath(element);
            case 'text':
                return this.createText(element);
            default:
                console.warn(`Unknown element type: ${element.type}`);
                return null;
        }
    }

    createRectangle(element) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', element.x);
        rect.setAttribute('y', element.y);
        rect.setAttribute('width', element.width);
        rect.setAttribute('height', element.height);
        this.applyStyles(rect, element);
        return rect;
    }

    createEllipse(element) {
        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ellipse.setAttribute('cx', element.x + element.width / 2);
        ellipse.setAttribute('cy', element.y + element.height / 2);
        ellipse.setAttribute('rx', element.width / 2);
        ellipse.setAttribute('ry', element.height / 2);
        this.applyStyles(ellipse, element);
        return ellipse;
    }

    createDiamond(element) {
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const cx = element.x + element.width / 2;
        const cy = element.y + element.height / 2;
        const points = [
            `${cx},${element.y}`,
            `${element.x + element.width},${cy}`,
            `${cx},${element.y + element.height}`,
            `${element.x},${cy}`
        ].join(' ');
        polygon.setAttribute('points', points);
        this.applyStyles(polygon, element);
        return polygon;
    }

    createLine(element) {
        if (!element.points || element.points.length < 2) return null;
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', element.points[0].x);
        line.setAttribute('y1', element.points[0].y);
        line.setAttribute('x2', element.points[1].x);
        line.setAttribute('y2', element.points[1].y);
        this.applyStyles(line, element);
        return line;
    }

    createArrow(element) {
        if (!element.points || element.points.length < 2) return null;
        
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Create line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', element.points[0].x);
        line.setAttribute('y1', element.points[0].y);
        line.setAttribute('x2', element.points[1].x);
        line.setAttribute('y2', element.points[1].y);
        line.setAttribute('marker-end', 'url(#arrowhead)');
        this.applyStyles(line, element);
        g.appendChild(line);
        
        return g;
    }

    createPath(element) {
        if (!element.points || element.points.length === 0) return null;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = this.pointsToPath(element.points);
        path.setAttribute('d', d);
        this.applyStyles(path, element);
        return path;
    }

    createText(element) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', element.x);
        text.setAttribute('y', element.y + (element.fontSize || 16));
        text.setAttribute('font-family', element.fontFamily || 'Arial');
        text.setAttribute('font-size', element.fontSize || 16);
        text.setAttribute('fill', element.textColor || element.strokeColor || '#000000');
        text.textContent = element.text || '';
        
        if (element.rotation) {
            const cx = element.x + element.width / 2;
            const cy = element.y + element.height / 2;
            text.setAttribute('transform', `rotate(${element.rotation} ${cx} ${cy})`);
        }
        
        return text;
    }

    applyStyles(svgElement, element) {
        // Set common attributes
        svgElement.setAttribute('data-element-id', element.id);
        svgElement.setAttribute('class', 'sww-element');
        
        // Stroke
        svgElement.setAttribute('stroke', element.strokeColor || 'none');
        svgElement.setAttribute('stroke-width', element.strokeWidth || 1);
        
        // Fill
        if (element.fillStyle === 'transparent' || element.fillColor === 'transparent') {
            svgElement.setAttribute('fill', 'none');
        } else if (element.fillStyle === 'hachure') {
            svgElement.setAttribute('fill', `url(#hachure-${element.fillColor?.replace('#', '') || '000000'})`);
        } else {
            svgElement.setAttribute('fill', element.fillColor || 'none');
        }
        
        // Opacity
        if (element.opacity !== undefined && element.opacity !== 1) {
            svgElement.setAttribute('opacity', element.opacity);
        }
        
        // Rotation
        if (element.rotation && element.type !== 'text') {
            const cx = element.x + element.width / 2;
            const cy = element.y + element.height / 2;
            svgElement.setAttribute('transform', `rotate(${element.rotation} ${cx} ${cy})`);
        }
    }

    pointsToPath(points) {
        if (points.length === 0) return '';
        
        let path = `M ${points[0].x} ${points[0].y}`;
        
        for (let i = 1; i < points.length; i++) {
            path += ` L ${points[i].x} ${points[i].y}`;
        }
        
        return path;
    }

    clear() {
        this.elementMap.clear();
        if (this.canvas.elementsGroup) {
            while (this.canvas.elementsGroup.firstChild) {
                this.canvas.elementsGroup.removeChild(this.canvas.elementsGroup.firstChild);
            }
        }
    }

    createElement(tagName) {
        return document.createElementNS('http://www.w3.org/2000/svg', tagName);
    }
}

/**
 * Event Manager
 * Handles event listening and dispatching throughout the library
 */

class EventManager {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        
        return () => this.off(event, callback);
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    /**
     * Add one-time event listener
     */
    once(event, callback) {
        const wrapper = (...args) => {
            callback(...args);
            this.off(event, wrapper);
        };
        return this.on(event, wrapper);
    }

    /**
     * Emit event
     */
    emit(event, data = null) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Remove all listeners for an event
     */
    removeAllListeners(event = null) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }

    /**
     * Get listener count for an event
     */
    listenerCount(event) {
        return this.listeners.has(event) ? this.listeners.get(event).size : 0;
    }

    /**
     * Get all events that have listeners
     */
    eventNames() {
        return Array.from(this.listeners.keys());
    }
}

/**
 * Input Handler
 * Manages mouse, touch, and keyboard input
 */
class InputHandler {
    constructor(canvasManager, eventManager) {
        this.canvas = canvasManager;
        this.events = eventManager;
        this.pointerState = {
            isDown: false,
            button: null,
            startPoint: null,
            currentPoint: null,
            lastPoint: null
        };
        this.keyState = new Set();
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        const svg = this.canvas.svg;

        // Pointer events
        svg.addEventListener('pointerdown', this.handlePointerDown.bind(this));
        svg.addEventListener('pointermove', this.handlePointerMove.bind(this));
        svg.addEventListener('pointerup', this.handlePointerUp.bind(this));
        svg.addEventListener('pointercancel', this.handlePointerUp.bind(this));

        // Mouse events
        svg.addEventListener('wheel', this.handleWheel.bind(this));
        svg.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        svg.addEventListener('contextmenu', this.handleContextMenu.bind(this));

        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));

        // Window events
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    handlePointerDown(e) {
        e.preventDefault();
        const point = this.canvas.screenToSVG(e.clientX, e.clientY);
        
        this.pointerState = {
            isDown: true,
            button: e.button,
            startPoint: point,
            currentPoint: point,
            lastPoint: point
        };

        this.events.emit('pointerDown', {
            point,
            originalEvent: e,
            button: e.button,
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
            altKey: e.altKey
        });
    }

    handlePointerMove(e) {
        e.preventDefault();
        const point = this.canvas.screenToSVG(e.clientX, e.clientY);
        
        this.pointerState.lastPoint = this.pointerState.currentPoint;
        this.pointerState.currentPoint = point;

        this.events.emit('pointerMove', {
            point,
            originalEvent: e,
            isDown: this.pointerState.isDown,
            startPoint: this.pointerState.startPoint,
            lastPoint: this.pointerState.lastPoint,
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
            altKey: e.altKey
        });
    }

    handlePointerUp(e) {
        e.preventDefault();
        const point = this.canvas.screenToSVG(e.clientX, e.clientY);
        
        this.events.emit('pointerUp', {
            point,
            originalEvent: e,
            startPoint: this.pointerState.startPoint,
            button: this.pointerState.button,
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
            altKey: e.altKey
        });

        this.pointerState.isDown = false;
        this.pointerState.button = null;
    }

    handleWheel(e) {
        e.preventDefault();
        const point = this.canvas.screenToSVG(e.clientX, e.clientY);
        
        this.events.emit('wheel', {
            point,
            deltaX: e.deltaX,
            deltaY: e.deltaY,
            deltaZ: e.deltaZ,
            originalEvent: e,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            altKey: e.altKey
        });
    }

    handleDoubleClick(e) {
        e.preventDefault();
        const point = this.canvas.screenToSVG(e.clientX, e.clientY);
        
        this.events.emit('doubleClick', {
            point,
            originalEvent: e
        });
    }

    handleContextMenu(e) {
        e.preventDefault();
        const point = this.canvas.screenToSVG(e.clientX, e.clientY);
        
        this.events.emit('contextMenu', {
            point,
            clientX: e.clientX,
            clientY: e.clientY,
            originalEvent: e
        });
    }

    handleKeyDown(e) {
        this.keyState.add(e.code);
        
        this.events.emit('keyDown', {
            code: e.code,
            key: e.key,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            altKey: e.altKey,
            metaKey: e.metaKey,
            originalEvent: e
        });
    }

    handleKeyUp(e) {
        this.keyState.delete(e.code);
        
        this.events.emit('keyUp', {
            code: e.code,
            key: e.key,
            originalEvent: e
        });
    }

    handleResize() {
        this.canvas.resize();
        this.events.emit('resize');
    }

    isKeyPressed(keyCode) {
        return this.keyState.has(keyCode);
    }

    getPointerState() {
        return { ...this.pointerState };
    }

    dispose() {
        const svg = this.canvas.svg;
        if (svg) {
            svg.removeEventListener('pointerdown', this.handlePointerDown);
            svg.removeEventListener('pointermove', this.handlePointerMove);
            svg.removeEventListener('pointerup', this.handlePointerUp);
            svg.removeEventListener('wheel', this.handleWheel);
            svg.removeEventListener('dblclick', this.handleDoubleClick);
            svg.removeEventListener('contextmenu', this.handleContextMenu);
        }

        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('resize', this.handleResize);
    }
}

/**
 * Export Manager
 * Handles exporting drawings to various formats
 */

class ExportManager {
    constructor(instance) {
        this.instance = instance;
    }

    /**
     * Export scene to SVG format
     */
    exportToSVG() {
        const scene = this.instance.getScene();
        const { viewBox } = scene;
        
        // Create a new SVG element for export
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', viewBox.width);
        svg.setAttribute('height', viewBox.height);
        svg.setAttribute('viewBox', `0 0 ${viewBox.width} ${viewBox.height}`);
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        
        // Add defs for patterns and markers
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        this.addExportDefs(defs);
        svg.appendChild(defs);

        // Add background
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('width', '100%');
        background.setAttribute('height', '100%');
        background.setAttribute('fill', this.instance.options.backgroundColor || '#ffffff');
        svg.appendChild(background);

        // Add elements
        scene.elements.forEach(element => {
            if (element.visible !== false) {
                const svgElement = this.createSVGElement(element);
                if (svgElement) {
                    svg.appendChild(svgElement);
                }
            }
        });

        // Convert to string
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);
        
        // Download the file
        this.downloadFile(svgString, 'drawing.svg', 'image/svg+xml');
        
        return svgString;
    }

    /**
     * Export scene to PNG format
     */
    exportToPNG(scale = 2) {
        const svgString = this.exportToSVG();
        const scene = this.instance.getScene();
        const { viewBox } = scene;
        
        // Create canvas for rasterization
        const canvas = document.createElement('canvas');
        canvas.width = viewBox.width * scale;
        canvas.height = viewBox.height * scale;
        const ctx = canvas.getContext('2d');
        
        // Create image from SVG
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
            // Draw image to canvas
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Convert to PNG and download
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'drawing.png';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 'image/png');
            
            URL.revokeObjectURL(url);
        };
        
        img.src = url;
    }

    /**
     * Export scene data as JSON
     */
    exportToJSON() {
        const scene = this.instance.getScene();
        const jsonString = JSON.stringify(scene, null, 2);
        this.downloadFile(jsonString, 'drawing.json', 'application/json');
        return jsonString;
    }

    /**
     * Create SVG element from drawing element
     */
    createSVGElement(element) {
        switch (element.type) {
            case 'rectangle':
                return this.createSVGRect(element);
            case 'ellipse':
                return this.createSVGEllipse(element);
            case 'diamond':
                return this.createSVGDiamond(element);
            case 'line':
                return this.createSVGLine(element);
            case 'arrow':
                return this.createSVGArrow(element);
            case 'draw':
                return this.createSVGPath(element);
            case 'text':
                return this.createSVGText(element);
            default:
                console.warn(`Unknown element type for export: ${element.type}`);
                return null;
        }
    }

    createSVGRect(element) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', element.x);
        rect.setAttribute('y', element.y);
        rect.setAttribute('width', element.width);
        rect.setAttribute('height', element.height);
        this.applyCommonStyles(rect, element);
        return rect;
    }

    createSVGEllipse(element) {
        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ellipse.setAttribute('cx', element.x + element.width / 2);
        ellipse.setAttribute('cy', element.y + element.height / 2);
        ellipse.setAttribute('rx', element.width / 2);
        ellipse.setAttribute('ry', element.height / 2);
        this.applyCommonStyles(ellipse, element);
        return ellipse;
    }

    createSVGDiamond(element) {
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const cx = element.x + element.width / 2;
        const cy = element.y + element.height / 2;
        const points = [
            `${cx},${element.y}`,
            `${element.x + element.width},${cy}`,
            `${cx},${element.y + element.height}`,
            `${element.x},${cy}`
        ].join(' ');
        polygon.setAttribute('points', points);
        this.applyCommonStyles(polygon, element);
        return polygon;
    }

    createSVGLine(element) {
        if (!element.points || element.points.length < 2) return null;
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', element.points[0].x);
        line.setAttribute('y1', element.points[0].y);
        line.setAttribute('x2', element.points[1].x);
        line.setAttribute('y2', element.points[1].y);
        this.applyCommonStyles(line, element);
        return line;
    }

    createSVGArrow(element) {
        if (!element.points || element.points.length < 2) return null;
        
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', element.points[0].x);
        line.setAttribute('y1', element.points[0].y);
        line.setAttribute('x2', element.points[1].x);
        line.setAttribute('y2', element.points[1].y);
        line.setAttribute('marker-end', 'url(#arrowhead)');
        this.applyCommonStyles(line, element);
        g.appendChild(line);
        
        return g;
    }

    createSVGPath(element) {
        if (!element.points || element.points.length === 0) return null;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = this.pointsToPath(element.points);
        path.setAttribute('d', d);
        this.applyCommonStyles(path, element);
        return path;
    }

    createSVGText(element) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', element.x);
        text.setAttribute('y', element.y + (element.fontSize || 16));
        text.setAttribute('font-family', element.fontFamily || 'Arial');
        text.setAttribute('font-size', element.fontSize || 16);
        text.setAttribute('fill', element.textColor || element.strokeColor || '#000000');
        text.textContent = element.text || '';
        
        if (element.rotation) {
            const cx = element.x + element.width / 2;
            const cy = element.y + element.height / 2;
            text.setAttribute('transform', `rotate(${element.rotation} ${cx} ${cy})`);
        }
        
        return text;
    }

    applyCommonStyles(svgElement, element) {
        // Stroke
        svgElement.setAttribute('stroke', element.strokeColor || 'none');
        svgElement.setAttribute('stroke-width', element.strokeWidth || 1);
        
        // Fill
        if (element.fillStyle === 'transparent' || element.fillColor === 'transparent') {
            svgElement.setAttribute('fill', 'none');
        } else if (element.fillStyle === 'hachure') {
            svgElement.setAttribute('fill', `url(#hachure-${element.fillColor.replace('#', '')})`);
        } else {
            svgElement.setAttribute('fill', element.fillColor || 'none');
        }
        
        // Opacity
        if (element.opacity !== undefined && element.opacity !== 1) {
            svgElement.setAttribute('opacity', element.opacity);
        }
        
        // Rotation
        if (element.rotation) {
            const cx = element.x + element.width / 2;
            const cy = element.y + element.height / 2;
            svgElement.setAttribute('transform', `rotate(${element.rotation} ${cx} ${cy})`);
        }
    }

    addExportDefs(defs) {
        // Add arrow marker
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '7');
        marker.setAttribute('refX', '10');
        marker.setAttribute('refY', '3.5');
        marker.setAttribute('orient', 'auto');
        
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
        polygon.setAttribute('fill', 'black');
        
        marker.appendChild(polygon);
        defs.appendChild(marker);
        
        // Add hachure patterns for common colors
        const colors = ['ff0000', '00ff00', '0000ff', '000000', 'ffff00', 'ff00ff', '00ffff'];
        colors.forEach(color => {
            const pattern = this.createHatchPattern(`#${color}`, `hachure-${color}`);
            defs.appendChild(pattern);
        });
    }

    createHatchPattern(color, id) {
        const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
        pattern.setAttribute('id', id);
        pattern.setAttribute('patternUnits', 'userSpaceOnUse');
        pattern.setAttribute('width', '8');
        pattern.setAttribute('height', '8');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M0,8 L8,0');
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', '1');
        
        pattern.appendChild(path);
        return pattern;
    }

    pointsToPath(points) {
        if (points.length === 0) return '';
        
        let path = `M ${points[0].x} ${points[0].y}`;
        
        for (let i = 1; i < points.length; i++) {
            path += ` L ${points[i].x} ${points[i].y}`;
        }
        
        return path;
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
}

/**
 * Base Tool Class
 * Abstract base class for all drawing tools
 */

class BaseTool {
    constructor(name, icon = null) {
        this.name = name;
        this.icon = icon;
        this.isActive = false;
        this.currentElement = null;
        this.startPoint = null;
    }

    /**
     * Called when tool becomes active
     */
    activate(instance) {
        this.instance = instance;
        this.isActive = true;
        this.onActivate();
    }

    /**
     * Called when tool becomes inactive
     */
    deactivate() {
        this.isActive = false;
        this.currentElement = null;
        this.startPoint = null;
        this.onDeactivate();
        this.instance = null;
    }

    /**
     * Handle pointer down event
     */
    handlePointerDown(data) {
        this.startPoint = data.point;
        this.onPointerDown(data);
    }

    /**
     * Handle pointer move event
     */
    handlePointerMove(data) {
        this.onPointerMove(data);
    }

    /**
     * Handle pointer up event
     */
    handlePointerUp(data) {
        this.onPointerUp(data);
        this.startPoint = null;
    }

    /**
     * Handle double click event
     */
    handleDoubleClick(data) {
        this.onDoubleClick(data);
    }

    /**
     * Handle key down event
     */
    handleKeyDown(data) {
        this.onKeyDown(data);
    }

    /**
     * Get cursor style for this tool
     */
    getCursor() {
        return 'crosshair';
    }

    // Override these methods in subclasses

    onActivate() {
        // Override in subclasses
    }

    onDeactivate() {
        // Override in subclasses
    }

    onPointerDown(data) {
        // Override in subclasses
    }

    onPointerMove(data) {
        // Override in subclasses
    }

    onPointerUp(data) {
        // Override in subclasses
    }

    onDoubleClick(data) {
        // Override in subclasses
    }

    onKeyDown(data) {
        // Override in subclasses
    }

    // Helper methods

    createElement(type, point) {
        if (!this.instance) return null;
        return this.instance.elementFactory.createElement(type, point, this.instance.toolSettings);
    }

    addElement(element) {
        if (!this.instance) return;
        this.instance.addElement(element);
    }

    updateElement(element) {
        if (!this.instance) return;
        this.instance.updateElement(element);
    }

    finishElement() {
        if (this.currentElement && this.instance) {
            this.instance.finishElement(this.currentElement);
            this.currentElement = null;
        }
    }

    snapToGrid(point) {
        if (!this.instance || !this.instance.options.snapToGrid) return point;
        
        const gridSize = this.instance.options.gridSize || 20;
        return {
            x: Math.round(point.x / gridSize) * gridSize,
            y: Math.round(point.y / gridSize) * gridSize
        };
    }

    isDrawing() {
        return this.currentElement !== null;
    }
}

/**
 * Select Tool
 * Handles element selection, movement, and manipulation
 */


class SelectTool extends BaseTool {
    constructor() {
        super('select', 'fas fa-mouse-pointer');
        
        // Selection state
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
        this.isCreatingSelectionBox = false;
        
        // Manipulation state
        this.dragStartPoint = null;
        this.resizeHandle = null;
        this.selectionBox = null;
        this.selectionBoxStart = null;
        
        // Drag threshold to distinguish between click and drag
        this.dragThreshold = 3;
    }

    onActivate() {
        if (this.instance) {
            this.instance.canvas.svg.style.cursor = 'default';
        }
    }

    onPointerDown(data) {
        const { point, shiftKey, ctrlKey } = data;
        
        // Check if clicking on a resize handle
        const handle = this.getResizeHandleAtPoint(point);
        if (handle) {
            this.startResize(handle, point);
            return;
        }

        // Check if clicking on rotation handle
        if (this.isRotationHandle(point)) {
            this.startRotation(point);
            return;
        }

        // Check if clicking on an element
        const element = this.instance.getElementAtPoint(point);
        
        if (element) {
            if (shiftKey || ctrlKey) {
                // Multi-select
                this.instance.toggleElementSelection(element);
            } else if (!this.instance.isElementSelected(element)) {
                // Select single element
                this.instance.selectElement(element);
            }
            
            // Start dragging if element is selected
            if (this.instance.isElementSelected(element)) {
                this.startDrag(point);
            }
        } else {
            // Click on empty space
            if (!shiftKey && !ctrlKey) {
                this.instance.clearSelection();
            }
            
            // Start selection box
            this.startSelectionBox(point);
        }
    }

    onPointerMove(data) {
        const { point, isDown } = data;
        
        if (!isDown || !this.startPoint) return;

        const distance = distanceBetweenPoints(this.startPoint, point);
        
        if (this.isResizing) {
            this.updateResize(point);
        } else if (this.isRotating) {
            this.updateRotation(point);
        } else if (this.isDragging) {
            this.updateDrag(point);
        } else if (this.isCreatingSelectionBox) {
            this.updateSelectionBox(point);
        } else if (distance > this.dragThreshold) {
            // Start appropriate action based on what was clicked
            const element = this.instance.getElementAtPoint(this.startPoint);
            if (element && this.instance.isElementSelected(element)) {
                this.startDrag(this.startPoint);
            } else {
                this.startSelectionBox(this.startPoint);
            }
        }
    }

    onPointerUp(data) {
        const { point } = data;
        
        if (this.isResizing) {
            this.finishResize();
        } else if (this.isRotating) {
            this.finishRotation();
        } else if (this.isDragging) {
            this.finishDrag();
        } else if (this.isCreatingSelectionBox) {
            this.finishSelectionBox(point);
        }
        
        this.resetState();
    }

    onDoubleClick(data) {
        const { point } = data;
        const element = this.instance.getElementAtPoint(point);
        
        if (element && element.type === 'text') {
            this.instance.startTextEditing(element);
        }
    }

    onKeyDown(data) {
        const { code, key } = data;
        
        switch (code) {
            case 'Delete':
            case 'Backspace':
                this.instance.deleteSelectedElements();
                break;
            case 'Escape':
                this.instance.clearSelection();
                break;
        }
    }

    // Drag operations

    startDrag(point) {
        this.isDragging = true;
        this.dragStartPoint = point;
        this.instance.canvas.svg.style.cursor = 'move';
        
        // Save initial positions for undo
        this.instance.saveStateToHistory('dragStart');
    }

    updateDrag(point) {
        if (!this.isDragging || !this.dragStartPoint) return;
        
        const deltaX = point.x - this.dragStartPoint.x;
        const deltaY = point.y - this.dragStartPoint.y;
        
        // Snap to grid if enabled
        let snappedDelta = { x: deltaX, y: deltaY };
        if (this.instance.options.snapToGrid) {
            const gridSize = this.instance.options.gridSize;
            snappedDelta.x = Math.round(deltaX / gridSize) * gridSize;
            snappedDelta.y = Math.round(deltaY / gridSize) * gridSize;
        }
        
        this.instance.moveSelectedElements(snappedDelta.x, snappedDelta.y);
        this.dragStartPoint = {
            x: this.dragStartPoint.x + snappedDelta.x,
            y: this.dragStartPoint.y + snappedDelta.y
        };
    }

    finishDrag() {
        if (this.isDragging) {
            this.instance.canvas.svg.style.cursor = 'default';
            this.instance.saveStateToHistory('dragEnd');
        }
    }

    // Selection box operations

    startSelectionBox(point) {
        this.isCreatingSelectionBox = true;
        this.selectionBoxStart = point;
        this.selectionBox = this.instance.createSelectionBoxElement(point);
    }

    updateSelectionBox(point) {
        if (!this.isCreatingSelectionBox || !this.selectionBoxStart) return;
        
        this.instance.updateSelectionBoxElement(this.selectionBox, this.selectionBoxStart, point);
    }

    finishSelectionBox(point) {
        if (!this.isCreatingSelectionBox || !this.selectionBoxStart) return;
        
        const box = {
            x: Math.min(this.selectionBoxStart.x, point.x),
            y: Math.min(this.selectionBoxStart.y, point.y),
            width: Math.abs(point.x - this.selectionBoxStart.x),
            height: Math.abs(point.y - this.selectionBoxStart.y)
        };
        
        // Select elements within the box
        const elementsInBox = this.instance.getElementsInBox(box);
        if (elementsInBox.length > 0) {
            this.instance.selectElements(elementsInBox);
        }
        
        // Remove selection box
        this.instance.removeSelectionBoxElement(this.selectionBox);
    }

    // Resize operations

    startResize(handle, point) {
        this.isResizing = true;
        this.resizeHandle = handle;
        this.dragStartPoint = point;
        this.instance.canvas.svg.style.cursor = this.getResizeCursor(handle);
        
        this.instance.saveStateToHistory('resizeStart');
    }

    updateResize(point) {
        if (!this.isResizing || !this.resizeHandle) return;
        
        this.instance.resizeSelectedElements(this.resizeHandle, point, this.dragStartPoint);
    }

    finishResize() {
        if (this.isResizing) {
            this.instance.canvas.svg.style.cursor = 'default';
            this.instance.saveStateToHistory('resizeEnd');
        }
    }

    // Rotation operations

    startRotation(point) {
        this.isRotating = true;
        this.dragStartPoint = point;
        this.instance.canvas.svg.style.cursor = 'grab';
        
        this.instance.saveStateToHistory('rotateStart');
    }

    updateRotation(point) {
        if (!this.isRotating) return;
        
        this.instance.rotateSelectedElements(point, this.dragStartPoint);
    }

    finishRotation() {
        if (this.isRotating) {
            this.instance.canvas.svg.style.cursor = 'default';
            this.instance.saveStateToHistory('rotateEnd');
        }
    }

    // Helper methods

    getResizeHandleAtPoint(point) {
        // Implementation depends on how resize handles are rendered
        // This would check if the point is over a resize handle
        return this.instance.getResizeHandleAtPoint(point);
    }

    isRotationHandle(point) {
        // Check if point is over rotation handle
        return this.instance.isRotationHandleAtPoint(point);
    }

    getResizeCursor(handle) {
        const cursors = {
            'nw': 'nw-resize',
            'n': 'n-resize',
            'ne': 'ne-resize',
            'e': 'e-resize',
            'se': 'se-resize',
            's': 's-resize',
            'sw': 'sw-resize',
            'w': 'w-resize'
        };
        return cursors[handle] || 'default';
    }

    resetState() {
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
        this.isCreatingSelectionBox = false;
        this.dragStartPoint = null;
        this.resizeHandle = null;
        this.selectionBox = null;
        this.selectionBoxStart = null;
        
        if (this.instance) {
            this.instance.canvas.svg.style.cursor = 'default';
        }
    }

    getCursor() {
        return 'default';
    }
}

/**
 * Shape Tools
 * Tools for creating geometric shapes (rectangle, ellipse, diamond)
 */


class RectangleTool extends BaseTool {
    constructor() {
        super('rectangle', 'far fa-square');
    }

    onPointerDown(data) {
        const point = this.snapToGrid(data.point);
        this.currentElement = this.createElement('rectangle', point);
        this.addElement(this.currentElement);
    }

    onPointerMove(data) {
        if (!this.isDrawing()) return;

        const point = this.snapToGrid(data.point);
        const width = point.x - this.startPoint.x;
        const height = point.y - this.startPoint.y;

        // Handle negative dimensions
        this.currentElement.x = Math.min(this.startPoint.x, point.x);
        this.currentElement.y = Math.min(this.startPoint.y, point.y);
        this.currentElement.width = Math.abs(width);
        this.currentElement.height = Math.abs(height);

        this.updateElement(this.currentElement);
    }

    onPointerUp(data) {
        if (this.isDrawing()) {
            // Minimum size check
            if (this.currentElement.width < 5 || this.currentElement.height < 5) {
                this.currentElement.width = Math.max(this.currentElement.width, 50);
                this.currentElement.height = Math.max(this.currentElement.height, 50);
                this.updateElement(this.currentElement);
            }
            
            this.finishElement();
        }
    }

    onKeyDown(data) {
        if (data.shiftKey && this.isDrawing()) {
            // Make square when shift is held
            const size = Math.min(this.currentElement.width, this.currentElement.height);
            this.currentElement.width = size;
            this.currentElement.height = size;
            this.updateElement(this.currentElement);
        }
    }
}

class EllipseTool extends BaseTool {
    constructor() {
        super('ellipse', 'far fa-circle');
    }

    onPointerDown(data) {
        const point = this.snapToGrid(data.point);
        this.currentElement = this.createElement('ellipse', point);
        this.addElement(this.currentElement);
    }

    onPointerMove(data) {
        if (!this.isDrawing()) return;

        const point = this.snapToGrid(data.point);
        const width = point.x - this.startPoint.x;
        const height = point.y - this.startPoint.y;

        // Handle negative dimensions
        this.currentElement.x = Math.min(this.startPoint.x, point.x);
        this.currentElement.y = Math.min(this.startPoint.y, point.y);
        this.currentElement.width = Math.abs(width);
        this.currentElement.height = Math.abs(height);

        this.updateElement(this.currentElement);
    }

    onPointerUp(data) {
        if (this.isDrawing()) {
            // Minimum size check
            if (this.currentElement.width < 5 || this.currentElement.height < 5) {
                this.currentElement.width = Math.max(this.currentElement.width, 50);
                this.currentElement.height = Math.max(this.currentElement.height, 50);
                this.updateElement(this.currentElement);
            }
            
            this.finishElement();
        }
    }

    onKeyDown(data) {
        if (data.shiftKey && this.isDrawing()) {
            // Make circle when shift is held
            const size = Math.min(this.currentElement.width, this.currentElement.height);
            this.currentElement.width = size;
            this.currentElement.height = size;
            this.updateElement(this.currentElement);
        }
    }
}

class DiamondTool extends BaseTool {
    constructor() {
        super('diamond', 'far fa-gem');
    }

    onPointerDown(data) {
        const point = this.snapToGrid(data.point);
        this.currentElement = this.createElement('diamond', point);
        this.addElement(this.currentElement);
    }

    onPointerMove(data) {
        if (!this.isDrawing()) return;

        const point = this.snapToGrid(data.point);
        const width = point.x - this.startPoint.x;
        const height = point.y - this.startPoint.y;

        // Handle negative dimensions
        this.currentElement.x = Math.min(this.startPoint.x, point.x);
        this.currentElement.y = Math.min(this.startPoint.y, point.y);
        this.currentElement.width = Math.abs(width);
        this.currentElement.height = Math.abs(height);

        this.updateElement(this.currentElement);
    }

    onPointerUp(data) {
        if (this.isDrawing()) {
            // Minimum size check
            if (this.currentElement.width < 5 || this.currentElement.height < 5) {
                this.currentElement.width = Math.max(this.currentElement.width, 50);
                this.currentElement.height = Math.max(this.currentElement.height, 50);
                this.updateElement(this.currentElement);
            }
            
            this.finishElement();
        }
    }

    onKeyDown(data) {
        if (data.shiftKey && this.isDrawing()) {
            // Make square diamond when shift is held
            const size = Math.min(this.currentElement.width, this.currentElement.height);
            this.currentElement.width = size;
            this.currentElement.height = size;
            this.updateElement(this.currentElement);
        }
    }
}

/**
 * Main SWW Instance Class
 * Core drawing application instance
 */


class SWWInstance {
    constructor(container, options = {}) {
        this.container = container;
        this.options = { ...DEFAULT_OPTIONS, ...options };
        
        // Core managers
        this.canvas = new CanvasManager(container, this.options);
        this.elementFactory = ElementFactory; // Use as static class
        this.history = new HistoryManager(this.options.maxHistorySize);
        this.renderer = new SVGRenderer(this.canvas);
        this.events = new EventManager();
        this.input = new InputHandler(this.canvas, this.events);
        this.export = new ExportManager(this);
        
        // Application state
        this.elements = [];
        this.selectedElements = new Set();
        this.toolSettings = { ...DEFAULT_TOOL_SETTINGS };
        
        // Tools
        this.tools = new Map();
        this.currentTool = null;
        this.currentToolName = 'select';
        
        // Initialize
        this.initializeTools();
        this.setupEventListeners();
        this.setTool('select');
        
        // Save initial state
        this.saveStateToHistory('init');
    }

    initializeTools() {
        // Register built-in tools
        this.registerTool(new SelectTool());
        this.registerTool(new RectangleTool());
        this.registerTool(new EllipseTool());
        this.registerTool(new DiamondTool());
        
        // TODO: Add other tools (Line, Arrow, Draw, Text, etc.)
    }

    registerTool(tool) {
        this.tools.set(tool.name, tool);
    }

    setupEventListeners() {
        // Input events
        this.events.on('pointerDown', (data) => {
            if (this.currentTool) {
                this.currentTool.handlePointerDown(data);
            }
        });

        this.events.on('pointerMove', (data) => {
            if (this.currentTool) {
                this.currentTool.handlePointerMove(data);
            }
        });

        this.events.on('pointerUp', (data) => {
            if (this.currentTool) {
                this.currentTool.handlePointerUp(data);
            }
        });

        this.events.on('doubleClick', (data) => {
            if (this.currentTool) {
                this.currentTool.handleDoubleClick(data);
            }
        });

        this.events.on('keyDown', (data) => {
            this.handleGlobalKeyDown(data);
            if (this.currentTool) {
                this.currentTool.handleKeyDown(data);
            }
        });

        this.events.on('wheel', (data) => {
            this.handleWheel(data);
        });
    }

    handleGlobalKeyDown(data) {
        const { code, ctrlKey, shiftKey } = data;

        // Global shortcuts
        if (ctrlKey) {
            switch (code) {
                case 'KeyZ':
                    if (shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    data.originalEvent.preventDefault();
                    break;
                case 'KeyY':
                    this.redo();
                    data.originalEvent.preventDefault();
                    break;
                case 'KeyA':
                    this.selectAll();
                    data.originalEvent.preventDefault();
                    break;
                case 'KeyC':
                    this.copySelected();
                    data.originalEvent.preventDefault();
                    break;
                case 'KeyV':
                    this.pasteClipboard();
                    data.originalEvent.preventDefault();
                    break;
            }
        }
    }

    handleWheel(data) {
        const { deltaY, ctrlKey, point } = data;
        
        if (ctrlKey) {
            // Zoom
            const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
            const newZoom = this.canvas.zoom * zoomFactor;
            this.canvas.setZoom(newZoom);
        } else {
            // Pan
            const panSpeed = 30;
            this.canvas.pan(0, deltaY > 0 ? panSpeed : -panSpeed);
        }
    }

    // Tool management

    setTool(toolName) {
        if (this.currentTool) {
            this.currentTool.deactivate();
        }

        const tool = this.tools.get(toolName);
        if (!tool) {
            console.warn(`Tool "${toolName}" not found`);
            return false;
        }

        this.currentTool = tool;
        this.currentToolName = toolName;
        this.currentTool.activate(this);
        
        // Update cursor
        this.canvas.svg.style.cursor = this.currentTool.getCursor();
        
        this.events.emit(EVENT_TYPES.TOOL_CHANGED, { toolName });
        return true;
    }

    getCurrentTool() {
        return this.currentToolName;
    }

    // Element management

    addElement(element) {
        if (!ElementFactory.validateElement(element)) {
            console.warn('Invalid element:', element);
            return false;
        }

        this.elements.push(element);
        this.renderElement(element);
        this.events.emit(EVENT_TYPES.ELEMENT_CREATED, { element });
        return true;
    }

    updateElement(element) {
        this.renderElement(element);
        this.events.emit(EVENT_TYPES.ELEMENT_UPDATED, { element });
    }

    removeElement(element) {
        const index = this.elements.findIndex(el => el.id === element.id);
        if (index !== -1) {
            this.elements.splice(index, 1);
            this.removeElementFromDOM(element);
            this.selectedElements.delete(element);
            this.events.emit(EVENT_TYPES.ELEMENT_DELETED, { element });
            return true;
        }
        return false;
    }

    finishElement(element) {
        this.saveStateToHistory('elementCreated');
    }

    // Selection management

    selectElement(element) {
        this.clearSelection();
        this.selectedElements.add(element);
        this.updateSelectionDisplay();
        this.events.emit(EVENT_TYPES.SELECTION_CHANGED, { 
            selected: Array.from(this.selectedElements) 
        });
    }

    selectElements(elements) {
        this.clearSelection();
        elements.forEach(element => this.selectedElements.add(element));
        this.updateSelectionDisplay();
        this.events.emit(EVENT_TYPES.SELECTION_CHANGED, { 
            selected: Array.from(this.selectedElements) 
        });
    }

    toggleElementSelection(element) {
        if (this.selectedElements.has(element)) {
            this.selectedElements.delete(element);
        } else {
            this.selectedElements.add(element);
        }
        this.updateSelectionDisplay();
        this.events.emit(EVENT_TYPES.SELECTION_CHANGED, { 
            selected: Array.from(this.selectedElements) 
        });
    }

    clearSelection() {
        this.selectedElements.clear();
        this.updateSelectionDisplay();
        this.events.emit(EVENT_TYPES.SELECTION_CHANGED, { selected: [] });
    }

    selectAll() {
        this.elements.forEach(element => this.selectedElements.add(element));
        this.updateSelectionDisplay();
        this.events.emit(EVENT_TYPES.SELECTION_CHANGED, { 
            selected: Array.from(this.selectedElements) 
        });
    }

    isElementSelected(element) {
        return this.selectedElements.has(element);
    }

    deleteSelectedElements() {
        if (this.selectedElements.size > 0) {
            this.saveStateToHistory('deleteElements');
            const elementsToDelete = Array.from(this.selectedElements);
            elementsToDelete.forEach(element => this.removeElement(element));
            this.clearSelection();
        }
    }

    // Clipboard operations

    copySelected() {
        if (this.selectedElements.size > 0) {
            this.clipboard = Array.from(this.selectedElements).map(element => 
                ElementFactory.cloneElement(element)
            );
        }
    }

    pasteClipboard() {
        if (this.clipboard && this.clipboard.length > 0) {
            this.saveStateToHistory('pasteElements');
            this.clearSelection();
            
            this.clipboard.forEach(element => {
                const cloned = ElementFactory.cloneElement(element);
                this.addElement(cloned);
                this.selectedElements.add(cloned);
            });
            
            this.updateSelectionDisplay();
        }
    }

    // History management

    saveStateToHistory(actionType) {
        const state = {
            elements: this.elements.map(el => ({ ...el })),
            selectedElements: Array.from(this.selectedElements).map(el => el.id),
            viewBox: { ...this.canvas.viewBox },
            zoom: this.canvas.zoom
        };
        
        this.history.saveState(actionType, state);
    }

    undo() {
        const state = this.history.undo();
        if (state) {
            this.restoreState(state);
        }
    }

    redo() {
        const state = this.history.redo();
        if (state) {
            this.restoreState(state);
        }
    }

    restoreState(state) {
        this.history.setPerformingAction(true);
        
        // Clear current state
        this.elements = [];
        this.selectedElements.clear();
        this.canvas.clear();
        
        // Restore elements
        this.elements = state.elements.map(el => ({ ...el }));
        this.elements.forEach(element => this.renderElement(element));
        
        // Restore selection
        state.selectedElements.forEach(id => {
            const element = this.elements.find(el => el.id === id);
            if (element) {
                this.selectedElements.add(element);
            }
        });
        
        // Restore view
        this.canvas.setViewBox(state.viewBox.x, state.viewBox.y, state.viewBox.width, state.viewBox.height);
        this.canvas.zoom = state.zoom;
        
        this.updateSelectionDisplay();
        this.history.setPerformingAction(false);
        
        this.events.emit(EVENT_TYPES.CANVAS_UPDATED);
    }

    // Scene management

    getScene() {
        return {
            elements: this.elements.map(el => ({ ...el })),
            viewBox: { ...this.canvas.viewBox },
            zoom: this.canvas.zoom,
            options: { ...this.options }
        };
    }

    loadScene(sceneData) {
        this.saveStateToHistory('loadScene');
        
        this.elements = [];
        this.selectedElements.clear();
        this.canvas.clear();
        
        if (sceneData.elements) {
            this.elements = sceneData.elements.map(el => ({ ...el }));
            this.elements.forEach(element => this.renderElement(element));
        }
        
        if (sceneData.viewBox) {
            const { x, y, width, height } = sceneData.viewBox;
            this.canvas.setViewBox(x, y, width, height);
        }
        
        if (sceneData.zoom) {
            this.canvas.zoom = sceneData.zoom;
        }
        
        this.events.emit(EVENT_TYPES.CANVAS_UPDATED);
    }

    clearAll() {
        this.saveStateToHistory('clearAll');
        this.elements = [];
        this.selectedElements.clear();
        this.canvas.clear();
        this.events.emit(EVENT_TYPES.CANVAS_UPDATED);
    }

    // Rendering (stub methods - implement based on your rendering system)

    renderElement(element) {
        // Render element using SVG renderer
        this.renderer.renderElement(element);
    }

    removeElementFromDOM(element) {
        // Remove element using SVG renderer
        this.renderer.removeElement(element);
    }

    updateSelectionDisplay() {
        // TODO: Implement selection handles display
        console.log('Updating selection display');
    }

    // Utility methods

    getElementAtPoint(point) {
        // TODO: Implement hit testing
        return null;
    }

    getElementsInBox(box) {
        // TODO: Implement box selection
        return [];
    }

    moveSelectedElements(deltaX, deltaY) {
        // TODO: Implement element movement
    }

    // Public API

    exportToSVG() {
        return this.export.exportToSVG();
    }

    exportToPNG(scale) {
        return this.export.exportToPNG(scale);
    }

    exportToJSON() {
        return this.export.exportToJSON();
    }

    dispose() {
        this.input.dispose();
        this.canvas.dispose();
        this.events.removeAllListeners();
    }
}

/**
 * SenangWebs Works (SWW) - Main Entry Point
 * Version: 2.0.0
 * 
 * A modular JavaScript library for creating digital whiteboards and vector drawings
 * Completely rewritten with modern architecture and better developer experience
 */


// Main SWW namespace
const SWW = {
    version: VERSION,
    instances: new Map(),
    
    /**
     * Initialize SWW in a container
     * @param {HTMLElement} container - The container element
     * @param {Object} options - Configuration options
     * @returns {SWWInstance} The SWW instance
     */
    init(container, options = {}) {
        if (!container) {
            throw new Error('Container element is required');
        }
        
        if (typeof container === 'string') {
            container = document.querySelector(container);
            if (!container) {
                throw new Error('Container element not found');
            }
        }
        
        // Remove existing instance if any
        if (this.instances.has(container)) {
            this.instances.get(container).dispose();
        }
        
        const instance = new SWWInstance(container, options);
        this.instances.set(container, instance);
        return instance;
    },
    
    /**
     * Get existing instance by container
     * @param {HTMLElement} container - The container element
     * @returns {SWWInstance|null} The SWW instance or null
     */
    getInstance(container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        return this.instances.get(container) || null;
    },
    
    /**
     * Destroy instance
     * @param {HTMLElement} container - The container element
     * @returns {boolean} True if instance was found and destroyed
     */
    destroy(container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        const instance = this.instances.get(container);
        if (instance) {
            instance.dispose();
            this.instances.delete(container);
            return true;
        }
        return false;
    },
    
    /**
     * Get all active instances
     * @returns {SWWInstance[]} Array of all instances
     */
    getAllInstances() {
        return Array.from(this.instances.values());
    },
    
    /**
     * Destroy all instances
     */
    destroyAll() {
        this.instances.forEach(instance => instance.dispose());
        this.instances.clear();
    }
};

// Auto-inject CSS styles
function injectCSS() {
    if (document.getElementById('sww-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'sww-styles';
    style.textContent = `
        .sww-container {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
        
        .sww-container svg {
            display: block;
            width: 100%;
            height: 100%;
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
        }
        
        .sww-selection-box {
            fill: rgba(0, 123, 255, 0.1);
            stroke: #007bff;
            stroke-width: 1;
            stroke-dasharray: 5,5;
            pointer-events: none;
        }
        
        .sww-selection-handle {
            fill: #007bff;
            stroke: #ffffff;
            stroke-width: 1;
            cursor: pointer;
        }
        
        .sww-selection-handle:hover {
            fill: #0056b3;
        }
        
        .sww-rotation-handle {
            fill: #28a745;
            stroke: #ffffff;
            stroke-width: 1;
            cursor: grab;
        }
        
        .sww-rotation-handle:hover {
            fill: #1e7e34;
        }
        
        .sww-element {
            pointer-events: all;
        }
        
        .sww-element.selected {
            filter: drop-shadow(0 0 3px rgba(0, 123, 255, 0.5));
        }
        
        .sww-element.locked {
            opacity: 0.7;
            pointer-events: none;
        }
        
        .sww-grid {
            pointer-events: none;
        }
        
        .sww-background {
            pointer-events: all;
        }
        
        .sww-toolbar {
            position: absolute;
            top: 10px;
            left: 10px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            padding: 8px;
            z-index: 1000;
        }
        
        .sww-tool-button {
            width: 32px;
            height: 32px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
        }
        
        .sww-tool-button:hover {
            background: #f0f0f0;
            border-color: #007bff;
        }
        
        .sww-tool-button.active {
            background: #007bff;
            color: white;
            border-color: #007bff;
        }
        
        .sww-properties-panel {
            position: absolute;
            top: 10px;
            right: 10px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 12px;
            min-width: 200px;
            z-index: 1000;
        }
        
        .sww-property-group {
            margin-bottom: 12px;
        }
        
        .sww-property-group:last-child {
            margin-bottom: 0;
        }
        
        .sww-property-label {
            display: block;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 4px;
            color: #333;
        }
        
        .sww-property-input {
            width: 100%;
            padding: 4px 8px;
            border: 1px solid #ddd;
            border-radius: 3px;
            font-size: 12px;
        }
        
        .sww-color-input {
            width: 100%;
            height: 32px;
            border: 1px solid #ddd;
            border-radius: 3px;
            cursor: pointer;
        }
        
        .sww-context-menu {
            position: fixed;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 4px 0;
            min-width: 120px;
            z-index: 2000;
        }
        
        .sww-context-menu-item {
            padding: 8px 16px;
            font-size: 13px;
            cursor: pointer;
            border: none;
            background: none;
            width: 100%;
            text-align: left;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .sww-context-menu-item:hover {
            background: #f0f0f0;
        }
        
        .sww-context-menu-item:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .sww-context-menu-separator {
            height: 1px;
            background: #eee;
            margin: 4px 0;
        }
    `;
    
    document.head.appendChild(style);
}

// Automatically inject CSS when the module loads
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectCSS);
    } else {
        injectCSS();
    }
}

// Also expose globally if in browser environment
if (typeof window !== 'undefined') {
    window.SWW = SWW;
    // Maintain backward compatibility
    window.sww = SWW;
}

export { SWWInstance, SWW as default };
//# sourceMappingURL=sww.esm.js.map
