/**
 * Event Manager
 * Handles event listening and dispatching throughout the library
 */

export class EventManager {
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
export class InputHandler {
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
