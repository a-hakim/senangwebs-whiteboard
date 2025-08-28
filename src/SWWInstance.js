/**
 * Main SWW Instance Class
 * Core drawing application instance
 */

import { CanvasManager } from './core/CanvasManager.js';
import { ElementFactory } from './core/ElementFactory.js';
import { HistoryManager } from './core/HistoryManager.js';
import { SVGRenderer } from './core/SVGRenderer.js';
import { EventManager, InputHandler } from './events/EventManager.js';
import { ExportManager } from './export/ExportManager.js';
import { SelectTool } from './tools/SelectTool.js';
import { RectangleTool, EllipseTool, DiamondTool } from './tools/ShapeTools.js';
import { DEFAULT_OPTIONS, DEFAULT_TOOL_SETTINGS, TOOL_TYPES, EVENT_TYPES } from './core/config.js';

export class SWWInstance {
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
