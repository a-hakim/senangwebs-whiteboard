/**
 * Core SWWInstance class
 * Main instance class that coordinates all whiteboard functionality
 */

import { SpatialIndex } from '../utils/SpatialIndex.js';
import { FONT_FAMILIES, DEFAULT_TOOL_SETTINGS, THEME_COLORS } from '../utils/constants.js';

export class SWWInstance {
    // Shared font families list
    static FONT_FAMILIES = FONT_FAMILIES;
    
    constructor(container, options = {}) {
        this.container = container;
        
        // Determine panel mode (light or dark)
        const panelMode = options.panelMode || 'dark';
        
        // Set default colors based on panel mode
        const defaultColors = THEME_COLORS[panelMode];
        
        this.options = {
            width: options.width || '100%',
            height: options.height || '100%',
            backgroundColor: options.backgroundColor || '#ffffff',
            gridSize: options.gridSize || 20,
            showGrid: options.showGrid !== false,
            panelMode: panelMode,
            panelBackgroundColor: options.panelBackgroundColor || defaultColors.panelBackgroundColor,
            panelTextColor: options.panelTextColor || defaultColors.panelTextColor,
            accentColor: options.accentColor || defaultColors.accentColor,
            secondaryAccentColor: options.secondaryAccentColor || defaultColors.secondaryAccentColor,
            ...options
        };
        
        // Initialize state
        this.initializeState();
        
        // Initialize UI and event listeners
        this.init();
    }
    
    initializeState() {
        // State
        this.elements = [];
        this.selectedElements = new Set();
        
        // Initialize tool system (will be extended by ToolManagerMixin)
        if (this.initializeToolSystem) {
            this.initializeToolSystem();
        } else {
            // Fallback for legacy
            this.currentTool = 'select';
            this.isDrawing = false;
            this.currentElement = null;
        }
        
        this.isPanning = false;
        this.dragOffset = { x: 0, y: 0 };
        this.lastPointerPosition = { x: 0, y: 0 };
        
        // Selection box state
        this.isCreatingSelectionBox = false;
        this.currentSelectionBox = null;
        this.selectionBoxStart = null;
        
        // Element manipulation state
        this.isDraggingElement = false;
        this.isResizing = false;
        this.isRotating = false;
        this.dragStartPoint = null;
        this.manipulationMode = null;
        this.resizeHandle = null;
        
        // Grid snapping
        this.snapToGrid = this.options.showGrid;
        
        // Context menu state
        this.contextMenu = null;
        this.clipboard = [];
        
        // Undo/Redo system
        this.historyStack = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        this.isPerformingHistoryAction = false;
        
        // Canvas properties
        this.viewBox = { x: 0, y: 0, width: 1000, height: 1000 };
        this.zoom = 1;
        
        // Preview mode state
        this.isPreviewMode = false;
        this.isPseudoFullscreen = false;
        this.isBrowserFrameFullscreen = false;
        this.previewModeOriginalTool = null;
        this.previewModeOriginalViewBox = null;
        this.previewModeOriginalZoom = 1;
        this.previewOverlay = null;
        this.previewModeKeyHandler = null;
        this.fullscreenChangeHandler = null;
        this.previewModeLockedElements = [];
        
        // Tool settings
        this.toolSettings = { ...DEFAULT_TOOL_SETTINGS };
        
        // Performance optimization properties
        this.spatialIndex = new SpatialIndex(100);
        this.selectionUpdateScheduled = false;
        this.visibleElements = new Set();
        this.viewportUpdateScheduled = false;
    }
    
    init() {
        // This will be extended by mixins
        // The actual initialization logic is in the initialization mixin
    }
}
