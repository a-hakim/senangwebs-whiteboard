/**
 * SenangWebs Whiteboard (SWW) - A client-side drawing library
 * Version: 1.0.0
 * 
 * A JavaScript library for creating digital whiteboards and vector drawings
 * with built-in FontAwesome and Marked dependencies
 */

// Import dependencies
import { marked } from 'marked';

(function(global) {
    'use strict';

    // Make marked available globally for the library
    global.marked = marked;

    /**
     * Performance utility classes for handling large number of elements
     */
    class PerformanceUtils {
        static throttle(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
        
        static debounce(func, delay) {
            let timeoutId;
            return function(...args) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => func.apply(this, args), delay);
            };
        }
        
        static requestAnimationFrame(func) {
            return window.requestAnimationFrame(func);
        }
    }

    /**
     * Spatial indexing for efficient hit testing with large numbers of elements
     */
    class SpatialIndex {
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

    // Main SWW object
    const SWW = {
        version: '1.0.0',
        instances: new Map(),
        
        // Initialize SWW in a container
        init: function(container, options = {}) {
            if (!container) {
                throw new Error('Container element is required');
            }
            
            const instance = new SWWInstance(container, options);
            this.instances.set(container, instance);
            return instance;
        },
        
        // Get instance by container
        getInstance: function(container) {
            return this.instances.get(container);
        }
    };

    // SWW Instance class
    class SWWInstance {
        constructor(container, options = {}) {
            this.container = container;
            this.options = {
                width: options.width || '100%',
                height: options.height || '100%',
                backgroundColor: options.backgroundColor || '#ffffff',
                gridSize: options.gridSize || 20,
                showGrid: options.showGrid !== false,
                ...options
            };
            
            // State
            this.elements = [];
            this.selectedElements = new Set();
            this.currentTool = 'select';
            this.isDrawing = false;
            this.isPanning = false;
            this.currentElement = null;
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
            this.manipulationMode = null; // 'move', 'resize', 'rotate'
            this.resizeHandle = null;
            
            // Grid snapping
            this.snapToGrid = this.options.showGrid; // Sync with grid visibility by default
            
            // Context menu state
            this.contextMenu = null;
            this.clipboard = []; // For copy/paste functionality
            
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
            this.toolSettings = {
                strokeColor: '#000000',
                strokeWidth: 2,
                fillColor: 'transparent',
                fillStyle: 'solid',
                opacity: 1,
                fontSize: 16,
                fontFamily: 'Arial',
                textAlign: 'left',
                textColor: '#000000',  // Separate text color property
                // Gradient settings
                gradientType: 'linear',  // 'linear' or 'radial'
                gradientStops: [
                    { offset: 0, color: '#000000' },
                    { offset: 100, color: '#ffffff' }
                ]
            };
            
            // Performance optimization properties
            this.spatialIndex = new SpatialIndex(100);
            this.selectionUpdateScheduled = false;
            this.visibleElements = new Set();
            this.viewportUpdateScheduled = false;
            
            this.init();
        }
        
        init() {
            this.createUI();
            this.setupEventListeners();
            
            // Initialize performance optimizations
            this.initPerformanceOptimizations();
            
            // Save initial empty state
            this.saveStateToHistory('init');
            
            // Update button states initially
            this.updateHistoryButtons();
            
            // Set initial grid button state
            setTimeout(() => {
                this.updateGridButtonState();
                
                // If readOnly mode is enabled, automatically enter preview mode
                if (this.options.readOnly) {
                    this.enterPreviewMode();
                }
            }, 100); // Small delay to ensure DOM is ready
        }
        
        initPerformanceOptimizations() {
            // Set up viewport update observer
            this.setupViewportObserver();
            
            // Initialize spatial index
            this.rebuildSpatialIndex();
            
            // Set up performance monitoring
            this.setupPerformanceMonitoring();
            
            // Create throttled properties panel update for real-time feedback
            this.throttledPropertiesPanelUpdate = PerformanceUtils.throttle(() => {
                this.syncPropertiesPanel();
            }, 50); // Update every 50ms for smooth real-time feedback
            
            // Create throttled real-time property updates for specific properties during manipulation
            this.throttledRealTimeUpdate = PerformanceUtils.throttle((properties) => {
                this.updatePropertiesPanelRealTime(properties);
            }, 16); // ~60fps for very smooth updates
        }
        
        setupViewportObserver() {
            // Debounced viewport update function
            this.debouncedViewportUpdate = PerformanceUtils.debounce(() => {
                this.updateVisibleElements();
            }, 100);
            
            // Set up resize observer
            if (window.ResizeObserver) {
                const observer = new ResizeObserver(() => {
                    this.debouncedViewportUpdate();
                });
                observer.observe(this.container);
            }
        }
        
        setupPerformanceMonitoring() {
            if (this.elements.length > 200) {
                this.setupOptimizedRenderLoop();
            }
        }
        
        setupOptimizedRenderLoop() {
            let lastRenderTime = 0;
            const targetFPS = 30; // Lower FPS for large scenes
            const frameTime = 1000 / targetFPS;
            
            const renderLoop = (currentTime) => {
                if (currentTime - lastRenderTime >= frameTime) {
                    this.performOptimizedRender();
                    lastRenderTime = currentTime;
                }
                
                if (this.elements.length > 200) {
                    requestAnimationFrame(renderLoop);
                }
            };
            
            requestAnimationFrame(renderLoop);
        }
        
        performOptimizedRender() {
            // Only render visible elements with LOD
            this.visibleElements.forEach(element => {
                this.updateSVGElementWithLOD(element);
            });
        }
        
        rebuildSpatialIndex() {
            this.spatialIndex.clear();
            this.elements.forEach(element => {
                const bounds = this.getElementBounds(element);
                this.spatialIndex.insert(element, bounds);
            });
        }
        
        updateVisibleElements() {
            if (this.viewportUpdateScheduled) return;
            
            this.viewportUpdateScheduled = true;
            PerformanceUtils.requestAnimationFrame(() => {
                const buffer = 100; // Extra pixels around viewport
                const viewBounds = {
                    x: this.viewBox.x - buffer,
                    y: this.viewBox.y - buffer,
                    width: this.viewBox.width + (buffer * 2),
                    height: this.viewBox.height + (buffer * 2)
                };
                
                this.visibleElements.clear();
                
                this.elements.forEach(element => {
                    const bounds = this.getElementBounds(element);
                    const isInViewport = this.isElementInBounds(bounds, viewBounds);
                    
                    if (isInViewport) {
                        this.visibleElements.add(element);
                    }
                    
                    if (element.svgElement) {
                        // Respect user's visibility setting - only show if element is not explicitly hidden
                        if (element.visible === false) {
                            // Element is intentionally hidden by user
                            element.svgElement.style.display = 'none';
                        } else {
                            // Element is visible, apply viewport optimization
                            element.svgElement.style.display = isInViewport ? 'block' : 'none';
                        }
                    }
                });
                
                this.viewportUpdateScheduled = false;
            });
        }
        
        isElementInBounds(elementBounds, viewBounds) {
            return !(elementBounds.x > viewBounds.x + viewBounds.width ||
                     elementBounds.x + elementBounds.width < viewBounds.x ||
                     elementBounds.y > viewBounds.y + viewBounds.height ||
                     elementBounds.y + elementBounds.height < viewBounds.y);
        }
        
        // Element management helpers for spatial index updates
        addElement(element) {
            this.elements.push(element);
            const bounds = this.getElementBounds(element);
            this.spatialIndex.insert(element, bounds);
            
            // Update viewport if needed
            if (this.elements.length > 100) {
                this.debouncedViewportUpdate();
            }
            
            // Update control panel if available
            if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
                window.swwControlPanel.updateLayers();
            }
        }
        
        removeElement(element) {
            const index = this.elements.indexOf(element);
            if (index !== -1) {
                this.elements.splice(index, 1);
                this.spatialIndex.remove(element);
                
                // Clean up SVG element
                if (element.svgElement && element.svgElement.parentNode) {
                    element.svgElement.parentNode.removeChild(element.svgElement);
                }
                
                // Update control panel if available
                if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
                    window.swwControlPanel.updateLayers();
                }
            }
        }
        
        // Helper method to add SVG element to DOM and handle pending boundary rects
        addSVGElementToDOM(element) {
            this.elementsGroup.appendChild(element.svgElement);
            
            // Handle pending boundary rect for text elements
            if (element.pendingBoundaryRect) {
                this.elementsGroup.insertBefore(element.pendingBoundaryRect, element.svgElement);
                element.boundaryRect = element.pendingBoundaryRect;
                delete element.pendingBoundaryRect;
            }
        }
        
        updateElementInSpatialIndex(element) {
            // Remove from old position and add to new position
            this.spatialIndex.remove(element);
            const bounds = this.getElementBounds(element);
            this.spatialIndex.insert(element, bounds);
        }
        
        // Level of Detail (LOD) system for performance
        getLevelOfDetail(element) {
            const elementSize = Math.max(
                Math.abs(element.width || 0), 
                Math.abs(element.height || 0)
            );
            const screenSize = elementSize * this.zoom;
            
            if (screenSize < 5) return 'hidden';
            if (screenSize < 20) return 'simple';
            if (screenSize < 100) return 'medium';
            return 'full';
        }
        
        updateSVGElementWithLOD(element) {
            if (!element.svgElement) return;
            
            const lod = this.getLevelOfDetail(element);
            
            if (lod === 'hidden') {
                element.svgElement.style.display = 'none';
                return;
            }
            
            element.svgElement.style.display = 'block';
            
            // Apply LOD optimizations for small elements
            switch (lod) {
                case 'simple':
                    // Simplify rendering - use solid colors, remove gradients
                    if (element.svgElement.setAttribute) {
                        element.svgElement.setAttribute('fill', element.strokeColor);
                        element.svgElement.setAttribute('stroke', 'none');
                        element.svgElement.style.filter = 'none';
                    }
                    break;
                case 'medium':
                    // Reduced detail - simpler strokes
                    this.updateSVGElementMediumDetail(element);
                    break;
                case 'full':
                default:
                    // Full detail rendering
                    this.updateSVGElement(element);
                    break;
            }
        }
        
        updateSVGElementMediumDetail(element) {
            // Medium LOD - simplified but recognizable
            if (element.svgElement.setAttribute) {
                element.svgElement.setAttribute('stroke', element.strokeColor);
                element.svgElement.setAttribute('stroke-width', Math.max(1, element.strokeWidth / 2));
                element.svgElement.setAttribute('fill', element.fillColor);
                element.svgElement.setAttribute('opacity', element.opacity);
            }
        }
        
        createUI() {
            // Clear container
            this.container.innerHTML = '';
            this.container.className = 'sww-container';            // Create SVG canvas
            this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            this.svg.setAttribute('class', 'sww-canvas');
            this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);
            this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            
            // Create background
            this.createBackground();
            
            // Create main group for elements
            this.elementsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            this.elementsGroup.setAttribute('class', 'sww-elements');
            this.svg.appendChild(this.elementsGroup);
            
            // Create selection group
            this.selectionGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            this.selectionGroup.setAttribute('class', 'sww-selection');
            this.svg.appendChild(this.selectionGroup);
            
            this.container.appendChild(this.svg);
            
            // Create toolbar
            this.createToolbar();
            
            // Create properties panel
            this.createPropertiesPanel();
            
            // Create context menu
            this.createContextMenu();
        }
        
        createBackground() {
            // Background rect
            const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bg.setAttribute('x', this.viewBox.x - 5000);
            bg.setAttribute('y', this.viewBox.y - 5000);
            bg.setAttribute('width', 10000);
            bg.setAttribute('height', 10000);
            bg.setAttribute('fill', this.options.backgroundColor);
            this.svg.appendChild(bg);
            
            // Create grid pattern but only show if snap is enabled
            this.createGrid();
            this.updateGridVisibility();
        }
        
        createGrid() {
            // Remove existing grid if it exists
            if (this.gridPattern) {
                this.gridPattern.remove();
            }
            if (this.gridRect) {
                this.gridRect.remove();
            }
            if (this.gridDefs) {
                this.gridDefs.remove();
            }
            
            this.gridDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            this.gridPattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
            this.gridPattern.setAttribute('id', 'sww-grid');
            this.gridPattern.setAttribute('width', this.options.gridSize);
            this.gridPattern.setAttribute('height', this.options.gridSize);
            this.gridPattern.setAttribute('patternUnits', 'userSpaceOnUse');
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M ${this.options.gridSize} 0 L 0 0 0 ${this.options.gridSize}`);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', '#e0e0e0');
            path.setAttribute('stroke-width', '1');
            
            this.gridPattern.appendChild(path);
            this.gridDefs.appendChild(this.gridPattern);
            this.svg.appendChild(this.gridDefs);
            
            this.gridRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            this.gridRect.setAttribute('x', this.viewBox.x - 5000);
            this.gridRect.setAttribute('y', this.viewBox.y - 5000);
            this.gridRect.setAttribute('width', 10000);
            this.gridRect.setAttribute('height', 10000);
            this.gridRect.setAttribute('fill', 'url(#sww-grid)');
            this.svg.appendChild(this.gridRect);
        }
        
        createToolbar() {
            const toolbar = document.createElement('div');
            toolbar.className = 'sww-toolbar';
            
            // Tool groups
            const tools = [
                { id: 'select', icon: 'fas fa-mouse-pointer', title: 'Select' },
                { id: 'rectangle', icon: 'far fa-square', title: 'Rectangle' },
                { id: 'ellipse', icon: 'far fa-circle', title: 'Ellipse' },
                { id: 'line', icon: 'fas fa-minus', title: 'Line' },
                { id: 'arrow', icon: 'fas fa-arrow-right', title: 'Arrow' },
                { id: 'text', icon: 'fas fa-font', title: 'Text' },
                { id: 'website', icon: 'fas fa-globe', title: 'Website (iframe)' },
                { id: 'image', icon: 'fas fa-image', title: 'Image' },
                { id: 'markdown', icon: 'fab fa-markdown', title: 'Markdown Document' }
            ];
            
            const actionGroup = document.createElement('div');
            actionGroup.className = 'sww-tool-group';
            
            const actions = [
                { id: 'lock', icon: 'fas fa-lock', title: 'Lock/Unlock Selected', action: () => this.toggleLockSelected() },
                { id: 'group', icon: 'fas fa-object-group', title: 'Group Selected', action: () => this.groupSelected() },
                { id: 'ungroup', icon: 'fas fa-object-ungroup', title: 'Ungroup Selected', action: () => this.ungroupSelected() },
                { id: 'select', icon: 'fas fa-check-square', title: 'Select All', action: () => this.selectAll() },
                { id: 'clear', icon: 'fas fa-trash', title: 'Clear All', action: () => this.clearAll() }
            ];
            
            actions.forEach(action => {
                const button = document.createElement('button');
                button.className = 'sww-tool-button';
                button.setAttribute('data-action', action.id);
                
                const icon = document.createElement('i');
                icon.className = action.icon;
                button.appendChild(icon);
                
                button.title = action.title;
                button.addEventListener('click', action.action);
                
                actionGroup.appendChild(button);
            });
            
            toolbar.appendChild(actionGroup);
        }
        
        createPropertiesPanel() {
            const panel = document.createElement('div');
            panel.className = 'sww-properties-panel';

            const panelHeader = document.createElement('div');
            panelHeader.className = 'sww-panel-header';

            const panelHeaderTitle = document.createElement('span');
            panelHeaderTitle.textContent = 'Properties';

            const panelHeaderCloseButton = document.createElement('button');
            panelHeaderCloseButton.className = 'sww-panel-header-button';
            panelHeaderCloseButton.innerHTML = '<i class="fas fa-times"></i>';
            panelHeaderCloseButton.title = 'Close Properties Panel';

            panelHeaderCloseButton.addEventListener('click', () => {
                panel.classList.remove('visible');
            });

            panelHeader.appendChild(panelHeaderTitle);
            panelHeader.appendChild(panelHeaderCloseButton);
            
            // Stroke color
            const strokeGroup = document.createElement('div');
            strokeGroup.className = 'sww-property-group';
            
            const strokeLabel = document.createElement('label');
            strokeLabel.className = 'sww-property-label';
            strokeLabel.textContent = 'Stroke Color';
            
            const strokeInput = document.createElement('input');
            strokeInput.type = 'color';
            strokeInput.className = 'sww-color-input';
            strokeInput.value = this.toolSettings.strokeColor;
            
            const strokeHexInput = document.createElement('input');
            strokeHexInput.type = 'text';
            strokeHexInput.className = 'sww-hex-input';
            strokeHexInput.placeholder = '#000000';
            strokeHexInput.value = this.toolSettings.strokeColor;
            strokeHexInput.maxLength = 7;
            
            const updateStrokeColor = (value) => {
                // Validate hex color
                if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
                    this.toolSettings.strokeColor = value;
                    strokeInput.value = value;
                    strokeHexInput.value = value;
                    this.updateSelectedElementProperty('strokeColor', value);
                }
            };
            
            strokeInput.addEventListener('change', (e) => {
                updateStrokeColor(e.target.value);
            });
            strokeInput.addEventListener('input', (e) => {
                updateStrokeColor(e.target.value);
            });
            
            strokeHexInput.addEventListener('change', (e) => {
                let value = e.target.value.trim();
                if (!value.startsWith('#')) {
                    value = '#' + value;
                }
                updateStrokeColor(value);
            });
            strokeHexInput.addEventListener('input', (e) => {
                let value = e.target.value.trim();
                if (!value.startsWith('#')) {
                    value = '#' + value;
                }
                if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
                    updateStrokeColor(value);
                }
            });
            
            const strokeInputGroup = document.createElement('div');
            strokeInputGroup.className = 'sww-property-input-group';
            strokeInputGroup.appendChild(strokeInput);
            strokeInputGroup.appendChild(strokeHexInput);
            
            strokeGroup.appendChild(strokeLabel);
            strokeGroup.appendChild(strokeInputGroup);
            
            // Stroke width
            const widthGroup = document.createElement('div');
            widthGroup.className = 'sww-property-group';
            
            const widthLabel = document.createElement('label');
            widthLabel.className = 'sww-property-label';
            widthLabel.textContent = 'Stroke Width';
            
            const widthInput = document.createElement('input');
            widthInput.type = 'number';
            widthInput.className = 'sww-number-input';
            widthInput.min = '0';
            widthInput.max = '20';
            widthInput.step = '1';
            widthInput.value = this.toolSettings.strokeWidth;
            widthInput.addEventListener('input', (e) => {
                let value = parseInt(e.target.value);
                // Validate input range
                if (value < 0) value = 0;
                if (value > 20) value = 20;
                e.target.value = value;
                
                this.toolSettings.strokeWidth = value;
                // Update only strokeWidth property for selected elements
                this.updateSelectedElementProperty('strokeWidth', value);
            });
            
            const widthUnit = document.createElement('span');
            widthUnit.className = 'sww-property-unit';
            widthUnit.textContent = 'px';
            
            widthGroup.appendChild(widthLabel);
            
            const widthInputGroup = document.createElement('div');
            widthInputGroup.className = 'sww-property-input-group';
            widthInputGroup.appendChild(widthInput);
            widthInputGroup.appendChild(widthUnit);
            
            widthGroup.appendChild(widthInputGroup);
            
            // Fill color
            const fillGroup = document.createElement('div');
            fillGroup.className = 'sww-property-group';
            
            const fillLabel = document.createElement('label');
            fillLabel.className = 'sww-property-label';
            fillLabel.textContent = 'Fill Color';
            
            const fillInput = document.createElement('input');
            fillInput.type = 'color';
            fillInput.className = 'sww-color-input';
            fillInput.value = this.toolSettings.fillColor === 'transparent' ? '#ffffff' : this.toolSettings.fillColor;
            
            const fillHexInput = document.createElement('input');
            fillHexInput.type = 'text';
            fillHexInput.className = 'sww-hex-input';
            fillHexInput.placeholder = '#ffffff';
            fillHexInput.value = this.toolSettings.fillColor === 'transparent' ? '#ffffff' : this.toolSettings.fillColor;
            fillHexInput.maxLength = 7;
            
            const updateFillColor = (value) => {
                // Validate hex color
                if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
                    this.toolSettings.fillColor = value;
                    fillInput.value = value;
                    fillHexInput.value = value;
                    this.updateSelectedElementProperty('fillColor', value);
                }
            };
            
            fillInput.addEventListener('change', (e) => {
                updateFillColor(e.target.value);
            });
            fillInput.addEventListener('input', (e) => {
                updateFillColor(e.target.value);
            });
            
            fillHexInput.addEventListener('change', (e) => {
                let value = e.target.value.trim();
                if (!value.startsWith('#')) {
                    value = '#' + value;
                }
                updateFillColor(value);
            });
            fillHexInput.addEventListener('input', (e) => {
                let value = e.target.value.trim();
                if (!value.startsWith('#')) {
                    value = '#' + value;
                }
                if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
                    updateFillColor(value);
                }
            });
            
            const fillInputGroup = document.createElement('div');
            fillInputGroup.className = 'sww-property-input-group';
            fillInputGroup.appendChild(fillInput);
            fillInputGroup.appendChild(fillHexInput);
            
            fillGroup.appendChild(fillLabel);
            fillGroup.appendChild(fillInputGroup);
            
            // Fill style
            const fillStyleGroup = document.createElement('div');
            fillStyleGroup.className = 'sww-property-group';
            
            const fillStyleLabel = document.createElement('label');
            fillStyleLabel.className = 'sww-property-label';
            fillStyleLabel.textContent = 'Fill Style';
            
            const fillStyleSelect = document.createElement('select');
            fillStyleSelect.className = 'sww-select-input';
            
            const fillStyles = [
                { value: 'transparent', text: 'Transparent' },
                { value: 'solid', text: 'Solid' },
                { value: 'gradient', text: 'Gradient' }
            ];
            
            fillStyles.forEach(style => {
                const option = document.createElement('option');
                option.value = style.value;
                option.textContent = style.text;
                fillStyleSelect.appendChild(option);
            });
            
            fillStyleSelect.value = this.toolSettings.fillStyle;
            fillStyleSelect.addEventListener('change', (e) => {
                this.toolSettings.fillStyle = e.target.value;
                // Update only fillStyle property for selected elements
                this.updateSelectedElementProperty('fillStyle', e.target.value);
                // Show/hide gradient controls
                this.updateGradientControlsVisibility();
            });
            
            fillStyleGroup.appendChild(fillStyleLabel);
            fillStyleGroup.appendChild(fillStyleSelect);
            
            // Gradient Controls
            const gradientGroup = document.createElement('div');
            gradientGroup.className = 'sww-property-group sww-gradient-group';
            gradientGroup.classList.toggle('visible', this.toolSettings.fillStyle === 'gradient');
            gradientGroup.classList.toggle('hidden', this.toolSettings.fillStyle !== 'gradient');
            
            // Gradient Type
            const gradientTypeGroup = document.createElement('div');
            gradientTypeGroup.className = 'sww-property-subgroup';
            
            const gradientTypeLabel = document.createElement('label');
            gradientTypeLabel.className = 'sww-property-label';
            gradientTypeLabel.textContent = 'Gradient Type';
            
            const gradientTypeSelect = document.createElement('select');
            gradientTypeSelect.className = 'sww-select-input';
            
            const gradientTypes = [
                { value: 'linear', text: 'Linear' },
                { value: 'radial', text: 'Radial' }
            ];
            
            gradientTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type.value;
                option.textContent = type.text;
                gradientTypeSelect.appendChild(option);
            });
            
            gradientTypeSelect.value = this.toolSettings.gradientType;
            gradientTypeSelect.addEventListener('change', (e) => {
                this.toolSettings.gradientType = e.target.value;
                this.updateSelectedElementProperty('gradientType', e.target.value);
            });
            
            gradientTypeGroup.appendChild(gradientTypeLabel);
            gradientTypeGroup.appendChild(gradientTypeSelect);
            
            // Gradient Stops
            const gradientStopsGroup = document.createElement('div');
            gradientStopsGroup.className = 'sww-property-subgroup';
            
            const gradientStopsLabel = document.createElement('label');
            gradientStopsLabel.className = 'sww-property-label';
            gradientStopsLabel.textContent = 'Gradient Stops';
            
            const gradientStopsContainer = document.createElement('div');
            gradientStopsContainer.className = 'sww-gradient-stops-container';
            
            // Add Gradient Stop Button
            const addStopButton = document.createElement('button');
            addStopButton.className = 'sww-gradient-add-stop';
            addStopButton.textContent = '+ Add Stop';
            addStopButton.addEventListener('click', () => {
                this.addGradientStop();
            });
            
            gradientStopsGroup.appendChild(gradientStopsLabel);
            gradientStopsGroup.appendChild(gradientStopsContainer);
            gradientStopsGroup.appendChild(addStopButton);
            
            gradientGroup.appendChild(gradientTypeGroup);
            gradientGroup.appendChild(gradientStopsGroup);
            
            // Initialize gradient stops UI
            this.updateGradientStopsUI();
            
            // Opacity
            const opacityGroup = document.createElement('div');
            opacityGroup.className = 'sww-property-group';
            
            const opacityLabel = document.createElement('label');
            opacityLabel.className = 'sww-property-label';
            opacityLabel.textContent = 'Opacity';
            
            const opacityInput = document.createElement('input');
            opacityInput.type = 'number';
            opacityInput.className = 'sww-number-input';
            opacityInput.min = '0';
            opacityInput.max = '100';
            opacityInput.step = '5';
            opacityInput.value = Math.round(this.toolSettings.opacity * 100);
            opacityInput.addEventListener('input', (e) => {
                let value = parseInt(e.target.value);
                // Validate input range
                if (value < 0) value = 0;
                if (value > 100) value = 100;
                e.target.value = value;
                
                // Convert percentage to decimal for internal use
                const decimalValue = value / 100;
                this.toolSettings.opacity = decimalValue;
                // Update only opacity property for selected elements
                this.updateSelectedElementProperty('opacity', decimalValue);
            });
            
            const opacityPercentage = document.createElement('span');
            opacityPercentage.className = 'sww-property-unit';
            opacityPercentage.textContent = '%';
            
            opacityGroup.appendChild(opacityLabel);
            
            const opacityInputGroup = document.createElement('div');
            opacityInputGroup.className = 'sww-property-input-group';
            opacityInputGroup.appendChild(opacityInput);
            opacityInputGroup.appendChild(opacityPercentage);
            
            opacityGroup.appendChild(opacityInputGroup);
            
            // Width property
            const elementWidthGroup = document.createElement('div');
            elementWidthGroup.className = 'sww-property-group';
            
            const elementWidthLabel = document.createElement('label');
            elementWidthLabel.className = 'sww-property-label';
            elementWidthLabel.textContent = 'Width';
            
            const elementWidthInput = document.createElement('input');
            elementWidthInput.type = 'number';
            elementWidthInput.className = 'sww-number-input';
            elementWidthInput.min = '1';
            elementWidthInput.step = '1';
            elementWidthInput.value = '100';
            
            const elementWidthUnit = document.createElement('span');
            elementWidthUnit.className = 'sww-property-unit';
            elementWidthUnit.textContent = 'px';
            
            elementWidthInput.addEventListener('input', (e) => {
                let value = parseInt(e.target.value);
                if (value < 1) value = 1;
                e.target.value = value;
                
                // Update width property for selected elements
                this.updateSelectedElementProperty('width', value);
            });
            
            elementWidthGroup.appendChild(elementWidthLabel);
            
            const elementWidthInputGroup = document.createElement('div');
            elementWidthInputGroup.className = 'sww-property-input-group';
            elementWidthInputGroup.appendChild(elementWidthInput);
            elementWidthInputGroup.appendChild(elementWidthUnit);
            
            elementWidthGroup.appendChild(elementWidthInputGroup);
            
            // Height property
            const elementHeightGroup = document.createElement('div');
            elementHeightGroup.className = 'sww-property-group';
            
            const elementHeightLabel = document.createElement('label');
            elementHeightLabel.className = 'sww-property-label';
            elementHeightLabel.textContent = 'Height';
            
            const elementHeightInput = document.createElement('input');
            elementHeightInput.type = 'number';
            elementHeightInput.className = 'sww-number-input';
            elementHeightInput.min = '1';
            elementHeightInput.step = '1';
            elementHeightInput.value = '100';
            
            const elementHeightUnit = document.createElement('span');
            elementHeightUnit.className = 'sww-property-unit';
            elementHeightUnit.textContent = 'px';
            
            elementHeightInput.addEventListener('input', (e) => {
                let value = parseInt(e.target.value);
                if (value < 1) value = 1;
                e.target.value = value;
                
                // Update height property for selected elements
                this.updateSelectedElementProperty('height', value);
            });
            
            elementHeightGroup.appendChild(elementHeightLabel);
            
            const elementHeightInputGroup = document.createElement('div');
            elementHeightInputGroup.className = 'sww-property-input-group';
            elementHeightInputGroup.appendChild(elementHeightInput);
            elementHeightInputGroup.appendChild(elementHeightUnit);
            
            elementHeightGroup.appendChild(elementHeightInputGroup);
            
            // Rotation property
            const rotationGroup = document.createElement('div');
            rotationGroup.className = 'sww-property-group';
            
            const rotationLabel = document.createElement('label');
            rotationLabel.className = 'sww-property-label';
            rotationLabel.textContent = 'Rotation';
            
            const rotationInput = document.createElement('input');
            rotationInput.type = 'number';
            rotationInput.className = 'sww-number-input';
            rotationInput.min = '-360';
            rotationInput.max = '360';
            rotationInput.step = '1';
            rotationInput.value = '0';
            
            const rotationUnit = document.createElement('span');
            rotationUnit.className = 'sww-property-unit';
            rotationUnit.textContent = '°';
            
            rotationInput.addEventListener('input', (e) => {
                let value = parseInt(e.target.value);
                // Normalize rotation to -360 to 360 range
                if (value < -360) value = -360;
                if (value > 360) value = 360;
                e.target.value = value;
                
                // Update rotation property for selected elements
                this.updateSelectedElementProperty('rotation', value);
            });
            
            rotationGroup.appendChild(rotationLabel);
            
            const rotationInputGroup = document.createElement('div');
            rotationInputGroup.className = 'sww-property-input-group';
            rotationInputGroup.appendChild(rotationInput);
            rotationInputGroup.appendChild(rotationUnit);
            
            rotationGroup.appendChild(rotationInputGroup);
            
            // Text properties section
            const textSection = document.createElement('div');
            textSection.className = 'sww-text-properties sww-text-section hidden';
            
            const fontSizeGroup = document.createElement('div');
            fontSizeGroup.className = 'sww-property-group';
            
            const fontSizeLabel = document.createElement('label');
            fontSizeLabel.className = 'sww-property-label';
            fontSizeLabel.textContent = 'Font Size';
            
            const fontSizeInput = document.createElement('input');
            fontSizeInput.type = 'number';
            fontSizeInput.className = 'sww-number-input';
            fontSizeInput.min = '8';
            fontSizeInput.max = '72';
            fontSizeInput.step = '1';
            fontSizeInput.value = this.toolSettings.fontSize;
            
            const fontSizeUnit = document.createElement('span');
            fontSizeUnit.className = 'sww-property-unit';
            fontSizeUnit.textContent = 'px';
            
            fontSizeInput.addEventListener('input', (e) => {
                let value = parseInt(e.target.value);
                // Validate input range
                if (value < 8) value = 8;
                if (value > 72) value = 72;
                e.target.value = value;
                
                this.toolSettings.fontSize = value;
                fontSizeUnit.textContent = 'px';
                
                // Update only fontSize property for selected elements
                this.updateSelectedElementProperty('fontSize', value);
            });
            
            fontSizeGroup.appendChild(fontSizeLabel);
            
            const fontSizeInputGroup = document.createElement('div');
            fontSizeInputGroup.className = 'sww-property-input-group';
            fontSizeInputGroup.appendChild(fontSizeInput);
            fontSizeInputGroup.appendChild(fontSizeUnit);
            
            fontSizeGroup.appendChild(fontSizeInputGroup);
            
            // Font family
            const fontFamilyGroup = document.createElement('div');
            fontFamilyGroup.className = 'sww-property-group';
            
            const fontFamilyLabel = document.createElement('label');
            fontFamilyLabel.className = 'sww-property-label';
            fontFamilyLabel.textContent = 'Font Family';
            
            const fontFamilySelect = document.createElement('select');
            fontFamilySelect.className = 'sww-select-input';
            
            const fontFamilies = [
                { value: 'Arial', text: 'Arial' },
                { value: 'Helvetica', text: 'Helvetica' },
                { value: 'Times New Roman', text: 'Times New Roman' },
                { value: 'Georgia', text: 'Georgia' },
                { value: 'Verdana', text: 'Verdana' },
                { value: 'Courier New', text: 'Courier New' },
                { value: 'Monaco', text: 'Monaco' },
                { value: 'Comic Sans MS', text: 'Comic Sans MS' },
                { value: 'Impact', text: 'Impact' },
                { value: 'Trebuchet MS', text: 'Trebuchet MS' }
            ];
            
            fontFamilies.forEach(font => {
                const option = document.createElement('option');
                option.value = font.value;
                option.textContent = font.text;
                option.className = 'sww-font-family-option';
                option.style.fontFamily = font.value; // This needs to stay dynamic
                fontFamilySelect.appendChild(option);
            });
            
            fontFamilySelect.value = this.toolSettings.fontFamily;
            fontFamilySelect.addEventListener('change', (e) => {
                this.toolSettings.fontFamily = e.target.value;
                // Update only fontFamily property for selected elements
                this.updateSelectedElementProperty('fontFamily', e.target.value);
            });
            
            fontFamilyGroup.appendChild(fontFamilyLabel);
            fontFamilyGroup.appendChild(fontFamilySelect);
            
            // Text color (separate from stroke color for clarity)
            const textColorGroup = document.createElement('div');
            textColorGroup.className = 'sww-property-group';
            
            const textColorLabel = document.createElement('label');
            textColorLabel.className = 'sww-property-label';
            textColorLabel.textContent = 'Text Color';
            
            const textColorInput = document.createElement('input');
            textColorInput.type = 'color';
            textColorInput.className = 'sww-color-input';
            textColorInput.value = this.toolSettings.textColor; // Use dedicated textColor property
            
            const textColorHexInput = document.createElement('input');
            textColorHexInput.type = 'text';
            textColorHexInput.className = 'sww-hex-input';
            textColorHexInput.placeholder = '#000000';
            textColorHexInput.value = this.toolSettings.textColor;
            textColorHexInput.maxLength = 7;
            
            const updateTextColor = (value) => {
                // Validate hex color
                if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
                    this.toolSettings.textColor = value;
                    textColorInput.value = value;
                    textColorHexInput.value = value;
                    this.updateSelectedElementProperty('textColor', value);
                }
            };
            
            textColorInput.addEventListener('change', (e) => {
                updateTextColor(e.target.value);
            });
            textColorInput.addEventListener('input', (e) => {
                updateTextColor(e.target.value);
            });
            
            textColorHexInput.addEventListener('change', (e) => {
                let value = e.target.value.trim();
                if (!value.startsWith('#')) {
                    value = '#' + value;
                }
                updateTextColor(value);
            });
            textColorHexInput.addEventListener('input', (e) => {
                let value = e.target.value.trim();
                if (!value.startsWith('#')) {
                    value = '#' + value;
                }
                if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
                    updateTextColor(value);
                }
            });
            
            const textColorInputGroup = document.createElement('div');
            textColorInputGroup.className = 'sww-property-input-group';
            textColorInputGroup.appendChild(textColorInput);
            textColorInputGroup.appendChild(textColorHexInput);
            
            textColorGroup.appendChild(textColorLabel);
            textColorGroup.appendChild(textColorInputGroup);
            
            // Text alignment
            const textAlignGroup = document.createElement('div');
            textAlignGroup.className = 'sww-property-group';
            
            const textAlignLabel = document.createElement('label');
            textAlignLabel.className = 'sww-property-label';
            textAlignLabel.textContent = 'Text Align';
            
            const textAlignContainer = document.createElement('div');
            textAlignContainer.className = 'sww-align-buttons sww-text-align-container';
            
            const alignments = [
                { value: 'left', icon: 'fas fa-align-left', title: 'Align Left' },
                { value: 'center', icon: 'fas fa-align-center', title: 'Align Center' },
                { value: 'right', icon: 'fas fa-align-right', title: 'Align Right' }
            ];
            
            alignments.forEach(align => {
                const button = document.createElement('button');
                button.className = 'sww-align-button';
                button.setAttribute('data-align', align.value);
                
                const icon = document.createElement('i');
                icon.className = align.icon;
                button.appendChild(icon);
                
                button.title = align.title;
                
                if (align.value === (this.toolSettings.textAlign || 'left')) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
                
                button.addEventListener('click', () => {
                    // Update all align buttons
                    textAlignContainer.querySelectorAll('.sww-align-button').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    
                    // Highlight selected button
                    button.classList.add('active');
                    
                    // Update setting
                    this.toolSettings.textAlign = align.value;
                    // Update only textAlign property for selected elements
                    this.updateSelectedElementProperty('textAlign', align.value);
                });
                
                textAlignContainer.appendChild(button);
            });
            
            textAlignGroup.appendChild(textAlignLabel);
            textAlignGroup.appendChild(textAlignContainer);
            
            textSection.appendChild(fontSizeGroup);
            textSection.appendChild(fontFamilyGroup);
            textSection.appendChild(textColorGroup);
            textSection.appendChild(textAlignGroup);
            
            panel.appendChild(panelHeader);
            panel.appendChild(strokeGroup);
            panel.appendChild(widthGroup);
            panel.appendChild(fillGroup);
            panel.appendChild(fillStyleGroup);
            panel.appendChild(gradientGroup);
            panel.appendChild(opacityGroup);
            panel.appendChild(elementWidthGroup);
            panel.appendChild(elementHeightGroup);
            panel.appendChild(rotationGroup);
            panel.appendChild(textSection);
            
            this.container.appendChild(panel);
            this.propertiesPanel = panel;
        }
        
        createContextMenu() {
            const menu = document.createElement('div');
            menu.className = 'sww-context-menu';
            
            const menuItems = [
                { id: 'copy', icon: 'fas fa-copy', text: 'Copy', action: () => this.copySelected() },
                { id: 'paste', icon: 'fas fa-paste', text: 'Paste', action: () => this.pasteClipboard() },
                { id: 'separator1', type: 'separator' },
                { id: 'group', icon: 'fas fa-object-group', text: 'Group', action: () => this.groupSelected() },
                { id: 'ungroup', icon: 'fas fa-object-ungroup', text: 'Ungroup', action: () => this.ungroupSelected() },
                { id: 'separator2', type: 'separator' },
                { id: 'lock', icon: 'fas fa-lock', text: 'Lock', action: () => this.lockSelected() },
                { id: 'unlock', icon: 'fas fa-unlock', text: 'Unlock', action: () => this.unlockSelected() },
                { id: 'separator3', type: 'separator' },
                { id: 'bring-to-front', icon: 'fas fa-arrow-up', text: 'Bring to Front', action: () => this.bringToFront() },
                { id: 'send-to-back', icon: 'fas fa-arrow-down', text: 'Send to Back', action: () => this.sendToBack() },
                { id: 'separator4', type: 'separator' },
                { id: 'edit', icon: 'fas fa-edit', text: 'Edit', action: () => this.editSelected() }
            ];
            
            menuItems.forEach(item => {
                if (item.type === 'separator') {
                    const separator = document.createElement('div');
                    separator.className = 'sww-context-menu-separator';
                    menu.appendChild(separator);
                } else {
                    const menuItem = document.createElement('button');
                    menuItem.className = 'sww-context-menu-item';
                    menuItem.innerHTML = `<i class="${item.icon}"></i>${item.text}`;
                    menuItem.onclick = () => {
                        this.hideContextMenu();
                        item.action();
                    };
                    menuItem.dataset.action = item.id;
                    menu.appendChild(menuItem);
                }
            });
            
            this.container.appendChild(menu);
            this.contextMenu = menu;
        }
        
        setupEventListeners() {
            // Throttled event handlers for performance
            const throttledMouseMove = PerformanceUtils.throttle(
                (e) => this.handlePointerMove(e), 16 // ~60fps
            );
            
            const debouncedViewportUpdate = PerformanceUtils.debounce(
                () => this.updateVisibleElements(), 100
            );
            
            // Mouse events
            this.svg.addEventListener('mousedown', (e) => this.handlePointerDown(e));
            this.svg.addEventListener('mousemove', throttledMouseMove);
            this.svg.addEventListener('mouseup', (e) => this.handlePointerUp(e));
            this.svg.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
            
            // Context menu (right-click)
            this.svg.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showContextMenu(e);
            });
            
            // Touch events
            this.svg.addEventListener('touchstart', (e) => this.handlePointerDown(e));
            this.svg.addEventListener('touchmove', throttledMouseMove);
            this.svg.addEventListener('touchend', (e) => this.handlePointerUp(e));
            
            // Keyboard events
            document.addEventListener('keydown', (e) => this.handleKeyDown(e));
            
            // Global click to hide context menu
            document.addEventListener('click', (e) => {
                if (!this.contextMenu.contains(e.target)) {
                    this.hideContextMenu();
                }
            });
            
            // Wheel event for zooming with viewport updates
            this.svg.addEventListener('wheel', (e) => {
                this.handleWheel(e);
                debouncedViewportUpdate();
            });
        }
        
        // Event handlers will be implemented in the next part...
        handlePointerDown(e) {
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
            }
        }
        
        handlePointerMove(e) {
            e.preventDefault();
            const point = this.getPointerPosition(e);
            
            if (this.isPanning) {
                const dx = point.x - this.lastPointerPosition.x;
                const dy = point.y - this.lastPointerPosition.y;
                this.viewBox.x -= dx;
                this.viewBox.y -= dy;
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
        }
        
        handlePointerUp(e) {
            e.preventDefault();
            const point = this.getPointerPosition(e);
            
            if (this.isPanning) {
                this.isPanning = false;
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
        }
        
        handleKeyDown(e) {
            const activeElement = document.activeElement;
            const isEditingInput = activeElement && (
                activeElement.tagName === 'INPUT' || 
                activeElement.tagName === 'TEXTAREA' || 
                activeElement.tagName === 'SELECT' ||
                activeElement.contentEditable === 'true'
            );
            
            if (isEditingInput) {
                return;
            }
            
            if (this.isPreviewMode) {
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
                // Copy selected elements
                e.preventDefault();
                this.copySelected();
            } else if (e.ctrlKey && e.key === 'v') {
                // Paste from clipboard
                e.preventDefault();
                this.pasteClipboard();
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                // Arrow keys to move selected elements
                e.preventDefault();
                this.moveSelectedElements(e.key, e.shiftKey);
            }
        }
        
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
        }
        
        setCursor(cursorType) {
            this.svg.classList.remove('grabbing', 'grab', 'crosshair', 'default');
            if (cursorType !== 'default') {
                this.svg.classList.add(cursorType);
            }
        }
        
        getPointerPosition(e) {
            const rect = this.svg.getBoundingClientRect();
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            
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
        }
        
        updateViewBox() {
            this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);
        }
        
        updateHoverCursor(point) {
            // Skip cursor updates in preview mode
            if (this.isPreviewMode) {
                return;
            }
            
            // First check if we're over the rotation handle (highest priority)
            if (this.isPointOverRotationHandle(point)) {
                this.svg.style.cursor = 'crosshair'; // Curved arrow cursor that suggests rotation
                return;
            }
            
            // Check if we're over an element for different cursor styles based on current tool
            const elementAtPoint = this.getElementAtPoint(point);
            
            if (this.currentTool === 'select') {
                if (elementAtPoint) {
                    // Over an element in select mode - show grab cursor
                    this.svg.style.cursor = 'grab';
                } else {
                    // Not over an element in select mode - show default cursor
                    this.svg.style.cursor = 'default';
                }
            } else {
                // In drawing modes, check if over an element to show interaction possibility
                if (elementAtPoint) {
                    // Over an element while drawing - show pointer to indicate it's clickable
                    this.svg.style.cursor = 'pointer';
                } else {
                    // Not over an element while drawing - show crosshair for drawing
                    this.svg.style.cursor = 'crosshair';
                }
            }
        }
        
        isPointOverRotationHandle(point) {
            // Only check if we have selected elements and are in select mode
            if (this.selectedElements.size === 0 || this.currentTool !== 'select') {
                return false;
            }
            
            // Get the bounds of selected elements to determine rotation handle position
            const bounds = this.getCombinedSelectionBounds();
            if (!bounds) return false;
            
            // Rotation handle position (same as in addResizeHandles)
            const rotateHandleX = bounds.x + bounds.width / 2;
            const rotateHandleY = bounds.y - 20;
            const rotateHandleRadius = 6;
            const tolerance = 12; // Same tolerance as element selection
            
            // Check if point is within rotation handle area
            const distance = Math.sqrt(
                Math.pow(point.x - rotateHandleX, 2) + 
                Math.pow(point.y - rotateHandleY, 2)
            );
            
            return distance <= (rotateHandleRadius + tolerance);
        }
        
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
                    const textarea = element.svgElement.querySelector('.sww-markdown-editor');
                    const renderedView = element.svgElement.querySelector('.sww-markdown-rendered');
                    const hint = element.svgElement.querySelector('.sww-markdown-hint');
                    
                    if (textarea && renderedView) {
                        // Toggle to editing mode using CSS classes
                        element.svgElement.classList.add('sww-markdown-editing');
                        element.svgElement.classList.remove('sww-markdown-readonly');
                        
                        textarea.readOnly = false;
                        textarea.style.cursor = 'text';
                        textarea.focus();
                        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
                        
                        // Add blur handler to switch back to rendered view
                        const handleBlur = () => {
                            // Switch back to rendered view using CSS classes
                            element.svgElement.classList.remove('sww-markdown-editing');
                            element.svgElement.classList.add('sww-markdown-readonly');
                            
                            textarea.readOnly = true;
                            textarea.style.cursor = 'default';
                            textarea.removeEventListener('blur', handleBlur);
                        };
                        textarea.addEventListener('blur', handleBlur);
                    }
                }
            }
        }
        
        // Tool-specific handlers
        handleSelectStart(point, e) {
            const element = this.getElementAtPoint(point);
            
            if (element) {
                // Check if element is locked
                if (element.locked) {
                    // Allow selection but prevent manipulation
                    if (!e.shiftKey && !this.selectedElements.has(element)) {
                        this.clearSelection();
                    }
                    this.selectElement(element);
                    return; // Don't start dragging
                }
                
                if (!e.shiftKey && !this.selectedElements.has(element)) {
                    this.clearSelection();
                }
                this.selectElement(element);
                
                // Check if any selected elements are locked
                const hasLockedElements = Array.from(this.selectedElements).some(el => el.locked);
                if (hasLockedElements) {
                    return; // Don't start dragging if any elements are locked
                }
                
                // Start dragging the selected element(s)
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
            } else {
                if (!e.shiftKey) {
                    this.clearSelection();
                }
                // Start selection box
                this.startSelectionBox(point);
            }
        }
        
        handleShapeStart(point) {
            const snappedPoint = this.snapToGridPoint(point);
            const element = this.createElement(this.currentTool, snappedPoint);
            this.currentElement = element;
            this.isDrawing = true;
            this.addSVGElementToDOM(element);
        }
        
        handleLineStart(point) {
            const snappedPoint = this.snapToGridPoint(point);
            const element = this.createElement(this.currentTool, snappedPoint);
            this.currentElement = element;
            this.isDrawing = true;
            this.addSVGElementToDOM(element);
        }
        
        handleDrawStart(point) {
            const snappedPoint = this.snapToGridPoint(point);
            const element = this.createElement('path', snappedPoint);
            element.points = [snappedPoint];
            this.currentElement = element;
            this.isDrawing = true;
            this.addSVGElementToDOM(element);
        }
        
        handleTextStart(point) {
            const snappedPoint = this.snapToGridPoint(point);
            const element = this.createElement('text', snappedPoint);
            element.text = ''; // Start with empty text for better UX
            
            // Calculate initial dimensions for consistent boundary behavior
            const padding = 10;
            const minWidth = 200; // Minimum comfortable width for typing
            const minHeight = element.fontSize * 2 + (padding * 2); // At least 2 lines
            
            // Set initial width and height
            element.width = minWidth;
            element.height = minHeight;
            
            // Add element to the scene immediately
            this.addSVGElementToDOM(element);
            this.elements.push(element);
            this.updateSVGElement(element);
            
            // Save state for undo/redo
            this.saveStateToHistory('createElement');
            
            // Select the element
            this.clearSelection();
            this.selectElement(element);
            
            // Immediately start editing for intuitive UX
            setTimeout(() => {
                this.startTextEditing(element);
            }, 50);
            
            // Switch to select tool (will activate after editing finishes)
            this.setTool('select');
        }
        
        handleWebsiteStart(point) {
            // Position element at cursor location for better UI/UX
            // Offset by half the element size so it's centered on the cursor
            const elementPoint = {
                x: point.x - 150, // Half of default width (300/2)
                y: point.y - 100  // Half of default height (200/2)
            };
            const snappedPoint = this.snapToGridPoint(elementPoint);
            const element = this.createElement('website', snappedPoint);
            
            // Add element to the scene
            this.addSVGElementToDOM(element);
            this.elements.push(element);
            this.updateSVGElement(element);
            
            // Save state for undo/redo
            this.saveStateToHistory('createElement');
            
            // Select the element and show configuration dialog
            this.clearSelection();
            this.selectElement(element);
            this.editWebsiteElement(element);
            
            // Switch back to select tool
            this.setTool('select');
        }
        
        handleImageStart(point) {
            // Position element at cursor location for better UI/UX
            // Offset by half the element size so it's centered on the cursor
            const elementPoint = {
                x: point.x - 150, // Half of default width (300/2)
                y: point.y - 100  // Half of default height (200/2)
            };
            const snappedPoint = this.snapToGridPoint(elementPoint);
            const element = this.createElement('image', snappedPoint);
            
            // Add element to the scene
            this.addSVGElementToDOM(element);
            this.elements.push(element);
            this.updateSVGElement(element);
            
            // Save state for undo/redo
            this.saveStateToHistory('createElement');
            
            // Select the element and show configuration dialog
            this.clearSelection();
            this.selectElement(element);
            this.editImageElement(element);
            
            // Switch back to select tool
            this.setTool('select');
        }
        
        handleMarkdownStart(point) {
            // Position element at cursor location for better UI/UX
            // Offset by half the element size so it's centered on the cursor
            const elementPoint = {
                x: point.x - 150, // Half of default width (300/2)
                y: point.y - 100  // Half of default height (200/2)
            };
            const snappedPoint = this.snapToGridPoint(elementPoint);
            const element = this.createElement('markdown', snappedPoint);
            
            // Add element to the scene
            this.addSVGElementToDOM(element);
            this.elements.push(element);
            this.updateSVGElement(element);
            
            // Save state for undo/redo
            this.saveStateToHistory('createElement');
            
            // Select the element
            this.clearSelection();
            this.selectElement(element);
            
            // Switch back to select tool
            this.setTool('select');
        }
        
        // Element creation and manipulation
        createElement(type, point) {
            // Set default stroke width based on element type
            let defaultStrokeWidth;
            let defaultFillColor;
            let defaultFillStyle;
            
            if (type === 'text') {
                defaultStrokeWidth = 0;  // Text elements have 0px stroke width
                defaultFillColor = this.toolSettings.fillColor;
                defaultFillStyle = this.toolSettings.fillStyle;
            } else if (['rectangle', 'ellipse', 'diamond', 'parallelogram', 'star', 'arrow'].includes(type)) {
                defaultStrokeWidth = 2;  // Shape elements have 2px stroke width
                defaultFillColor = '#ffffff';  // White fill for shapes
                defaultFillStyle = 'solid';  // Solid fill for shapes
            } else if (['website', 'image', 'markdown'].includes(type)) {
                defaultStrokeWidth = 2;  // Website, image, and markdown elements have 2px default stroke width
                defaultFillColor = this.toolSettings.fillColor;
                defaultFillStyle = this.toolSettings.fillStyle;
            } else {
                defaultStrokeWidth = this.toolSettings.strokeWidth;  // Use tool settings for other elements
                defaultFillColor = this.toolSettings.fillColor;
                defaultFillStyle = this.toolSettings.fillStyle;
            }
            
            const element = {
                id: this.generateId(),
                type: type,
                x: point.x,
                y: point.y,
                width: type === 'website' || type === 'image' || type === 'markdown' ? 300 : 0,
                height: type === 'website' || type === 'image' || type === 'markdown' ? 200 : 0,
                strokeColor: this.toolSettings.strokeColor,
                strokeWidth: defaultStrokeWidth,
                fillColor: defaultFillColor,
                fillStyle: defaultFillStyle,
                gradientType: this.toolSettings.gradientType,
                gradientStops: [...this.toolSettings.gradientStops],
                opacity: this.toolSettings.opacity,
                fontSize: this.toolSettings.fontSize,
                fontFamily: this.toolSettings.fontFamily,
                textAlign: this.toolSettings.textAlign,
                textColor: this.toolSettings.textColor,
                rotation: 0,
                locked: false,
                groupId: null
            };
            
            // Add specific properties for new element types
            if (type === 'website') {
                element.url = '';
                element.text = 'Click to set URL';
            } else if (type === 'image') {
                element.imageUrl = '';
                element.text = 'Click to set image';
            } else if (type === 'markdown') {
                element.markdown = '# Markdown Document\n\nClick to edit...';
                element.text = 'Markdown Document';
            }
            
            element.svgElement = this.createSVGElement(element);
            return element;
        }
        
        createSVGElement(element) {
            let svgElement;
            
            switch (element.type) {
                case 'rectangle':
                    svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    break;
                case 'ellipse':
                    svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                    break;
                case 'diamond':
                    svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    break;
                case 'parallelogram':
                    svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    break;
                case 'star':
                    svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    break;
                case 'line':
                case 'arrow':
                    svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    break;
                case 'path':
                    svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    break;
                case 'text':
                    svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    break;
                case 'website':
                case 'image':
                case 'markdown':
                    svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
                    break;
                default:
                    svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            }
            
            svgElement.setAttribute('data-element-id', element.id);
            svgElement.setAttribute('class', 'sww-element');
            
            // Set the svgElement reference before calling updateSVGElement
            element.svgElement = svgElement;
            this.updateSVGElement(element);
            
            return svgElement;
        }
        
        updateSVGElement(element) {
            const svg = element.svgElement;
            
            // Safety check
            if (!svg) {
                console.warn('SVG element not found for element:', element);
                return;
            }
            
            // Common attributes
            svg.setAttribute('stroke', element.strokeColor);
            svg.setAttribute('stroke-width', element.strokeWidth);
            svg.setAttribute('opacity', element.opacity);
            
            // Store original stroke width for selection styling
            svg.style.setProperty('--original-stroke-width', element.strokeWidth);
            
            // Fill handling
            if (element.fillStyle === 'transparent') {
                svg.setAttribute('fill', 'none');
            } else if (element.fillStyle === 'solid') {
                svg.setAttribute('fill', element.fillColor);
            } else if (element.fillStyle === 'hachure') {
                // Create hatch pattern
                svg.setAttribute('fill', 'url(#hatch)');
                this.createHatchPattern(element.fillColor);
            } else if (element.fillStyle === 'gradient') {
                // Create gradient
                const gradientId = this.createGradient(element);
                svg.setAttribute('fill', `url(#${gradientId})`);
            }
            
            // Type-specific attributes
            switch (element.type) {
                case 'rectangle':
                    // Handle negative dimensions for northwest direction
                    const rectX = element.width < 0 ? element.x + element.width : element.x;
                    const rectY = element.height < 0 ? element.y + element.height : element.y;
                    svg.setAttribute('x', rectX);
                    svg.setAttribute('y', rectY);
                    svg.setAttribute('width', Math.abs(element.width));
                    svg.setAttribute('height', Math.abs(element.height));
                    break;
                    
                case 'ellipse':
                    const ellipseCx = element.x + element.width / 2;
                    const ellipseCy = element.y + element.height / 2;
                    svg.setAttribute('cx', ellipseCx);
                    svg.setAttribute('cy', ellipseCy);
                    svg.setAttribute('rx', Math.abs(element.width) / 2);
                    svg.setAttribute('ry', Math.abs(element.height) / 2);
                    break;
                    
                case 'diamond':
                    const diamondCx = element.x + element.width / 2;
                    const diamondCy = element.y + element.height / 2;
                    const diamondW = Math.abs(element.width) / 2;
                    const diamondH = Math.abs(element.height) / 2;
                    const diamondPoints = `${diamondCx},${diamondCy - diamondH} ${diamondCx + diamondW},${diamondCy} ${diamondCx},${diamondCy + diamondH} ${diamondCx - diamondW},${diamondCy}`;
                    svg.setAttribute('points', diamondPoints);
                    break;
                    
                case 'parallelogram':
                    const skew = element.width * 0.2;
                    const parallelogramPoints = `${element.x + skew},${element.y} ${element.x + element.width},${element.y} ${element.x + element.width - skew},${element.y + element.height} ${element.x},${element.y + element.height}`;
                    svg.setAttribute('points', parallelogramPoints);
                    break;
                    
                case 'star':
                    const starPoints = this.createStarPoints(element.x, element.y, element.width, element.height);
                    svg.setAttribute('points', starPoints);
                    break;
                    
                case 'line':
                case 'arrow':
                    svg.setAttribute('x1', element.x);
                    svg.setAttribute('y1', element.y);
                    svg.setAttribute('x2', element.x + element.width);
                    svg.setAttribute('y2', element.y + element.height);
                    
                    if (element.type === 'arrow') {
                        const markerId = this.createArrowMarker(element.strokeColor);
                        svg.setAttribute('marker-end', `url(#${markerId})`);
                    }
                    break;
                    
                case 'path':
                    if (element.points && element.points.length > 0) {
                        let pathData;
                        
                        if (this.currentElement && this.currentElement.id === element.id) {
                            pathData = this.pointsToPath(element.points);
                        } else {
                            const absolutePoints = element.points.map(point => ({
                                x: point.x + element.x,
                                y: point.y + element.y
                            }));
                            pathData = this.pointsToPath(absolutePoints);
                        }
                        
                        svg.setAttribute('d', pathData);
                        svg.setAttribute('fill', 'none');
                    }
                    break;
                    
                case 'text':
                    const textContent = element.text || 'Text';
                    const lines = textContent.split('\n');
                    
                    // Always position text with padding inside the boundary
                    const padding = 10;
                    const textX = element.x + padding; // Left padding
                    const textY = element.y + element.fontSize + padding; // Top padding + baseline
                    
                    svg.setAttribute('x', textX);
                    svg.setAttribute('y', textY);
                    svg.setAttribute('font-size', element.fontSize);
                    svg.setAttribute('font-family', element.fontFamily);
                    svg.setAttribute('fill', element.textColor || element.strokeColor); // Use textColor for fill
                    
                    // Show placeholder styling for empty text
                    if (!element.text || element.text.trim() === '') {
                        svg.setAttribute('opacity', '0.4');
                        svg.setAttribute('font-style', 'italic');
                    } else {
                        svg.setAttribute('font-style', 'normal');
                    }
                    
                    // Text can have stroke for outline effect
                    if (element.strokeWidth > 0) {
                        svg.setAttribute('stroke', element.strokeColor);
                        svg.setAttribute('stroke-width', element.strokeWidth);
                    } else {
                        svg.removeAttribute('stroke');
                        svg.removeAttribute('stroke-width');
                    }
                    
                    // Clear existing content
                    svg.innerHTML = '';
                    
                    // Add each line as a tspan with proper alignment
                    lines.forEach((line, index) => {
                        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                        
                        // Calculate X position based on alignment
                        let lineX = textX;
                        if (element.textAlign && element.width) {
                            const lineWidth = this.measureText(line, element.fontSize, element.fontFamily).width;
                            const availableWidth = element.width - (padding * 2); // Account for padding
                            
                            switch (element.textAlign) {
                                case 'center':
                                    lineX = element.x + (element.width / 2) - (lineWidth / 2);
                                    break;
                                case 'right':
                                    lineX = element.x + element.width - padding - lineWidth;
                                    break;
                                case 'left':
                                default:
                                    lineX = textX; // Already set above
                                    break;
                            }
                        }
                        
                        tspan.setAttribute('x', lineX);
                        tspan.setAttribute('dy', index === 0 ? '0' : `${element.fontSize * 1.3}px`);
                        tspan.textContent = line;
                        svg.appendChild(tspan);
                    });
                    
                    // Add subtle boundary visualization for text elements
                    if (element.width && element.height) {
                        // Remove existing boundary rect
                        if (element.boundaryRect) {
                            element.boundaryRect.remove();
                        }
                        
                        // Create new boundary rect
                        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        rect.setAttribute('x', element.x);
                        rect.setAttribute('y', element.y);
                        rect.setAttribute('width', Math.abs(element.width));
                        rect.setAttribute('height', Math.abs(element.height));
                        rect.setAttribute('fill', 'rgba(240, 240, 240, 0.02)');
                        rect.setAttribute('stroke', 'rgba(200, 200, 200, 0.15)');
                        rect.setAttribute('stroke-width', '1');
                        rect.setAttribute('stroke-dasharray', '3,3');
                        rect.setAttribute('class', 'sww-text-boundary');
                        
                        // Insert the rect before the text (only if svg has a parent)
                        if (svg.parentNode) {
                            svg.parentNode.insertBefore(rect, svg);
                            element.boundaryRect = rect;
                        } else {
                            // Store the rect to be inserted later when the element is added to DOM
                            element.pendingBoundaryRect = rect;
                        }
                    }
                    break;
                    
                case 'website':
                    svg.setAttribute('x', element.x);
                    svg.setAttribute('y', element.y);
                    svg.setAttribute('width', Math.abs(element.width));
                    svg.setAttribute('height', Math.abs(element.height));
                    
                    // Clear existing content
                    svg.innerHTML = '';
                    
                    if (element.url && element.url.trim()) {
                        // Create website container with address bar
                        const container = document.createElement('div');
                        container.className = 'sww-website-element';
                        container.style.width = '100%';
                        container.style.height = '100%';
                        
                        // Apply stroke properties to the container
                        if (element.strokeWidth > 0) {
                            container.style.border = `${element.strokeWidth}px solid ${element.strokeColor}`;
                        } else {
                            container.style.border = 'none';
                        }
                        
                        // Apply fill style as background
                        if (element.fillStyle === 'solid' && element.fillColor !== 'transparent') {
                            container.style.backgroundColor = element.fillColor;
                            container.style.backgroundImage = 'none';
                        } else if (element.fillStyle === 'gradient') {
                            const cssGradient = this.createCSSGradient(element);
                            container.style.backgroundImage = cssGradient;
                            container.style.backgroundColor = 'transparent';
                        } else if (element.fillStyle === 'transparent') {
                            container.style.backgroundColor = 'transparent';
                            container.style.backgroundImage = 'none';
                        } else {
                            container.style.backgroundColor = 'white';
                            container.style.backgroundImage = 'none';
                        }
                        
                        // Apply opacity
                        container.style.opacity = element.opacity;
                        
                        // Create address bar
                        const addressBar = document.createElement('div');
                        addressBar.className = 'sww-website-address-bar';
                        
                        // Window controls
                        const controls = document.createElement('div');
                        controls.className = 'sww-website-controls';
                        
                        const closeBtn = document.createElement('div');
                        closeBtn.className = 'sww-website-control close';
                        const minimizeBtn = document.createElement('div');
                        minimizeBtn.className = 'sww-website-control minimize';
                        const maximizeBtn = document.createElement('div');
                        maximizeBtn.className = 'sww-website-control maximize';
                        
                        controls.appendChild(closeBtn);
                        controls.appendChild(minimizeBtn);
                        controls.appendChild(maximizeBtn);
                        
                        // URL display
                        const urlDisplay = document.createElement('div');
                        urlDisplay.className = 'sww-website-url';
                        urlDisplay.textContent = element.url;
                        urlDisplay.title = 'Double-click to edit URL';
                        // Remove single-click handler for better UX
                        // Users need to double-click to edit
                        
                        // addressBar.appendChild(controls);
                        addressBar.appendChild(urlDisplay);
                        
                        // Create content area
                        const content = document.createElement('div');
                        content.className = 'sww-website-content';
                        
                        const iframe = document.createElement('iframe');
                        iframe.src = element.url;
                        iframe.style.width = '100%';
                        iframe.style.height = '100%';
                        iframe.style.border = 'none';
                        
                        content.appendChild(iframe);
                        container.appendChild(addressBar);
                        container.appendChild(content);
                        svg.appendChild(container);
                    } else {
                        // Show placeholder
                        const div = document.createElement('div');
                        div.className = 'sww-website-placeholder';
                        div.style.width = '100%';
                        div.style.height = '100%';
                        
                        // Apply stroke properties to the placeholder
                        if (element.strokeWidth > 0) {
                            div.style.border = `${element.strokeWidth}px solid ${element.strokeColor}`;
                        } else {
                            div.style.border = 'none';
                        }
                        
                        // Apply fill style as background
                        if (element.fillStyle === 'solid' && element.fillColor !== 'transparent') {
                            div.style.backgroundColor = element.fillColor;
                            div.style.backgroundImage = 'none';
                        } else if (element.fillStyle === 'gradient') {
                            const cssGradient = this.createCSSGradient(element);
                            div.style.backgroundImage = cssGradient;
                            div.style.backgroundColor = 'transparent';
                        } else if (element.fillStyle === 'transparent') {
                            div.style.backgroundColor = 'transparent';
                            div.style.backgroundImage = 'none';
                        } else {
                            div.style.backgroundColor = 'white';
                            div.style.backgroundImage = 'none';
                        }
                        
                        // Apply opacity
                        div.style.opacity = element.opacity;
                        
                        div.innerHTML = '<i class="fas fa-globe"></i><br>Double-click to set URL';
                        // Remove single-click handler for better UX
                        // Users need to double-click to edit
                        svg.appendChild(div);
                    }
                    break;
                    
                case 'image':
                    svg.setAttribute('x', element.x);
                    svg.setAttribute('y', element.y);
                    svg.setAttribute('width', Math.abs(element.width));
                    svg.setAttribute('height', Math.abs(element.height));
                    
                    // Clear existing content
                    svg.innerHTML = '';
                    
                    if (element.imageUrl && element.imageUrl.trim()) {
                        // Create image container
                        const div = document.createElement('div');
                        div.className = 'sww-image-element';
                        div.style.width = '100%';
                        div.style.height = '100%';
                        
                        // Apply stroke properties to the container
                        if (element.strokeWidth > 0) {
                            div.style.border = `${element.strokeWidth}px solid ${element.strokeColor}`;
                        } else {
                            div.style.border = 'none';
                        }
                        
                        // Apply fill style as background
                        if (element.fillStyle === 'solid' && element.fillColor !== 'transparent') {
                            div.style.backgroundColor = element.fillColor;
                            div.style.backgroundImage = 'none';
                        } else if (element.fillStyle === 'gradient') {
                            const cssGradient = this.createCSSGradient(element);
                            div.style.backgroundImage = cssGradient;
                            div.style.backgroundColor = 'transparent';
                        } else if (element.fillStyle === 'transparent') {
                            div.style.backgroundColor = 'transparent';
                            div.style.backgroundImage = 'none';
                        } else {
                            div.style.backgroundColor = 'white';
                            div.style.backgroundImage = 'none';
                        }
                        
                        // Apply opacity
                        div.style.opacity = element.opacity;
                        
                        const img = document.createElement('img');
                        img.src = element.imageUrl;
                        img.style.width = '100%';
                        img.style.height = '100%';
                        img.style.objectFit = 'cover';
                        // Remove single click handler - only allow double-click and right-click edit
                        
                        div.appendChild(img);
                        svg.appendChild(div);
                    } else {
                        // Show placeholder (keep click for initial setup)
                        const div = document.createElement('div');
                        div.className = 'sww-image-placeholder';
                        div.style.width = '100%';
                        div.style.height = '100%';
                        
                        // Apply stroke properties to the placeholder as well
                        if (element.strokeWidth > 0) {
                            div.style.border = `${element.strokeWidth}px solid ${element.strokeColor}`;
                        } else {
                            div.style.border = 'none';
                        }
                        
                        // Apply fill style as background
                        if (element.fillStyle === 'solid' && element.fillColor !== 'transparent') {
                            div.style.backgroundColor = element.fillColor;
                            div.style.backgroundImage = 'none';
                        } else if (element.fillStyle === 'gradient') {
                            const cssGradient = this.createCSSGradient(element);
                            div.style.backgroundImage = cssGradient;
                            div.style.backgroundColor = 'transparent';
                        } else if (element.fillStyle === 'transparent') {
                            div.style.backgroundColor = 'transparent';
                            div.style.backgroundImage = 'none';
                        } else {
                            div.style.backgroundColor = 'white';
                            div.style.backgroundImage = 'none';
                        }
                        
                        // Apply opacity
                        div.style.opacity = element.opacity;
                        
                        div.innerHTML = '<i class="fas fa-image"></i><br>Double-click to set image';
                        // Remove single-click handler for consistency with website elements
                        // Users need to double-click to edit
                        svg.appendChild(div);
                    }
                    break;
                    
                case 'markdown':
                    svg.setAttribute('x', element.x);
                    svg.setAttribute('y', element.y);
                    svg.setAttribute('width', Math.abs(element.width));
                    svg.setAttribute('height', Math.abs(element.height));
                    
                    // Clear existing content
                    svg.innerHTML = '';
                    
                    // Create markdown container
                    const div = document.createElement('div');
                    div.className = 'sww-markdown-element-container sww-markdown-readonly';
                    div.style.width = '100%';
                    div.style.height = '100%';
                    div.style.position = 'relative';
                    div.style.overflow = 'auto';
                    
                    // Apply stroke and fill properties to the container
                    if (element.strokeWidth > 0) {
                        div.style.border = `${element.strokeWidth}px solid ${element.strokeColor}`;
                    } else {
                        div.style.border = 'none';
                    }
                    
                    // Apply fill color as background
                    if (element.fillStyle === 'solid' && element.fillColor !== 'transparent') {
                        div.style.backgroundColor = element.fillColor;
                        div.style.backgroundImage = 'none';
                    } else if (element.fillStyle === 'gradient') {
                        // Convert gradient to CSS gradient
                        const cssGradient = this.createCSSGradient(element);
                        div.style.backgroundImage = cssGradient;
                        div.style.backgroundColor = 'transparent';
                    } else if (element.fillStyle === 'transparent') {
                        div.style.backgroundColor = 'transparent';
                        div.style.backgroundImage = 'none';
                    } else {
                        div.style.backgroundColor = 'white'; // Default background
                        div.style.backgroundImage = 'none';
                    }
                    
                    // Apply opacity
                    div.style.opacity = element.opacity;
                    
                    // Create rendered markdown view
                    const renderedView = document.createElement('div');
                    renderedView.className = 'sww-markdown-rendered';
                    renderedView.style.width = '100%';
                    renderedView.style.height = '100%';
                    renderedView.style.padding = '8px';
                    renderedView.style.color = element.textColor || element.strokeColor;
                    renderedView.style.fontSize = (element.fontSize || 12) + 'px';
                    renderedView.style.fontFamily = element.fontFamily || 'Arial, sans-serif';
                    renderedView.style.lineHeight = '1.4';
                    renderedView.style.boxSizing = 'border-box';
                    
                    // Parse and render markdown
                    const markdownText = element.markdown || '# Markdown Document\n\nDouble-click to edit...';
                    renderedView.innerHTML = this.parseMarkdown(markdownText);
                    
                    // Create markdown editor (hidden by default)
                    const textarea = document.createElement('textarea');
                    textarea.className = 'sww-markdown-editor';
                    textarea.value = markdownText;
                    textarea.placeholder = 'Enter markdown here...';
                    textarea.style.width = '100%';
                    textarea.style.height = '100%';
                    textarea.style.padding = '8px';
                    textarea.style.backgroundColor = 'transparent';
                    textarea.style.color = element.textColor || element.strokeColor;
                    textarea.style.border = 'none';
                    textarea.style.fontSize = (element.fontSize || 12) + 'px';
                    textarea.style.fontFamily = 'Monaco, Menlo, Ubuntu Mono, monospace';
                    textarea.style.resize = 'none';
                    textarea.style.outline = 'none';
                    textarea.style.boxSizing = 'border-box';
                    
                    // Handle textarea events
                    textarea.addEventListener('input', (e) => {
                        element.markdown = e.target.value;
                        // Update rendered view in real-time
                        renderedView.innerHTML = this.parseMarkdown(e.target.value);
                    });
                    
                    textarea.addEventListener('blur', () => {
                        // Switch back to rendered view using CSS classes
                        div.classList.remove('sww-markdown-editing');
                        div.classList.add('sww-markdown-readonly');
                        textarea.readOnly = true;
                        textarea.style.cursor = 'default';
                        
                        // Update element text for display purposes
                        const lines = textarea.value.split('\n');
                        element.text = lines[0] || 'Markdown Document';
                    });
                    
                    // Prevent event bubbling to allow proper text editing
                    textarea.addEventListener('mousedown', (e) => {
                        e.stopPropagation();
                    });
                    
                    textarea.addEventListener('mouseup', (e) => {
                        e.stopPropagation();
                    });
                    
                    // Add double-click handler to textarea for editing
                    textarea.addEventListener('dblclick', (e) => {
                        e.stopPropagation();
                        if (textarea.readOnly && this.currentTool === 'select') {
                            // Switch to editing mode
                            div.classList.add('sww-markdown-editing');
                            div.classList.remove('sww-markdown-readonly');
                            
                            textarea.readOnly = false;
                            textarea.style.cursor = 'text';
                            textarea.focus();
                            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
                        }
                    });
                    
                    // Add double-click handler to rendered view for editing
                    renderedView.addEventListener('dblclick', (e) => {
                        e.stopPropagation();
                        if (this.currentTool === 'select') {
                            // Switch to editing mode
                            div.classList.add('sww-markdown-editing');
                            div.classList.remove('sww-markdown-readonly');
                            
                            textarea.readOnly = false;
                            textarea.style.cursor = 'text';
                            textarea.focus();
                            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
                        }
                    });
                    
                    // Make textarea read-only initially
                    textarea.readOnly = true;
                    textarea.style.cursor = 'default';
                    
                    // Add edit hint
                    const hint = document.createElement('div');
                    hint.className = 'sww-markdown-hint';
                    hint.innerHTML = '<small>Double-click to edit</small>';
                    hint.style.position = 'absolute';
                    hint.style.top = '4px';
                    hint.style.right = '4px';
                    hint.style.background = 'rgba(255, 255, 255, 0.9)';
                    hint.style.padding = '2px 6px';
                    hint.style.borderRadius = '3px';
                    hint.style.fontSize = '10px';
                    hint.style.color = '#6c757d';
                    hint.style.pointerEvents = 'none';
                    hint.style.zIndex = '10';
                    
                    // div.appendChild(hint);
                    div.appendChild(renderedView);
                    div.appendChild(textarea);
                    svg.appendChild(div);
                    break;
            }
            
            // Apply rotation
            if (element.rotation !== 0) {
                // Calculate center point correctly for negative dimensions
                let centerX, centerY;
                if (element.type === 'line' || element.type === 'arrow') {
                    // For lines and arrows, center is midpoint between start and end
                    centerX = element.x + element.width / 2;
                    centerY = element.y + element.height / 2;
                } else {
                    // For shapes, handle negative dimensions
                    const elementX = element.width < 0 ? element.x + element.width : element.x;
                    const elementY = element.height < 0 ? element.y + element.height : element.y;
                    centerX = elementX + Math.abs(element.width) / 2;
                    centerY = elementY + Math.abs(element.height) / 2;
                }
                svg.setAttribute('transform', `rotate(${element.rotation} ${centerX} ${centerY})`);
            } else {
                // Remove transform attribute when rotation is 0
                svg.removeAttribute('transform');
            }
            
            // Update spatial index when element properties change
            this.updateElementInSpatialIndex(element);
        }
        
        createHatchPattern(color) {
            if (document.getElementById('hatch')) return;
            
            // Ensure we have a dedicated defs element for markers and patterns (not the grid defs)
            if (!this.markerDefs) {
                this.markerDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                this.markerDefs.setAttribute('id', 'sww-marker-defs');
                this.svg.appendChild(this.markerDefs);
            }
            const defs = this.markerDefs;
            
            const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
            pattern.setAttribute('id', 'hatch');
            pattern.setAttribute('patternUnits', 'userSpaceOnUse');
            pattern.setAttribute('width', '8');
            pattern.setAttribute('height', '8');
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M0,8 l8,-8 M-2,2 l4,-4 M6,10 l4,-4');
            path.setAttribute('stroke', color);
            path.setAttribute('stroke-width', '1');
            
            pattern.appendChild(path);
            defs.appendChild(pattern);
        }
        
        createArrowMarker(strokeColor = '#000000') {
            // Create unique marker ID for each color
            const markerId = `arrowhead-${strokeColor.replace('#', '')}`;
            
            if (document.getElementById(markerId)) return markerId;
            
            // Ensure we have a dedicated defs element for markers (not the grid defs)
            if (!this.markerDefs) {
                this.markerDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                this.markerDefs.setAttribute('id', 'sww-marker-defs');
                this.svg.appendChild(this.markerDefs);
            }
            const defs = this.markerDefs;
            
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', markerId);
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '7');
            marker.setAttribute('refX', '9');
            marker.setAttribute('refY', '3.5');
            marker.setAttribute('orient', 'auto');
            marker.setAttribute('markerUnits', 'strokeWidth');
            
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
            polygon.setAttribute('fill', strokeColor);
            
            marker.appendChild(polygon);
            defs.appendChild(marker);
            
            return markerId;
        }
        
        createGradient(element) {
            const gradientId = `gradient-${element.id}`;
            
            // Ensure we have a dedicated defs element for markers and patterns (not the grid defs)
            if (!this.markerDefs) {
                this.markerDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                this.markerDefs.setAttribute('id', 'sww-marker-defs');
                this.svg.appendChild(this.markerDefs);
            }
            const defs = this.markerDefs;
            
            // Remove existing gradient if it exists
            const existingGradient = defs.querySelector(`#${gradientId}`);
            if (existingGradient) {
                existingGradient.remove();
            }
            
            // Create gradient element based on type
            let gradient;
            if (element.gradientType === 'radial') {
                gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
                gradient.setAttribute('cx', '50%');
                gradient.setAttribute('cy', '50%');
                gradient.setAttribute('r', '50%');
            } else {
                // Default to linear gradient
                gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                gradient.setAttribute('x1', '0%');
                gradient.setAttribute('y1', '0%');
                gradient.setAttribute('x2', '100%');
                gradient.setAttribute('y2', '0%');
            }
            
            gradient.setAttribute('id', gradientId);
            
            // Add gradient stops
            const stops = element.gradientStops || this.toolSettings.gradientStops;
            stops.forEach(stop => {
                const stopElement = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stopElement.setAttribute('offset', `${stop.offset}%`);
                stopElement.setAttribute('stop-color', stop.color);
                gradient.appendChild(stopElement);
            });
            
            defs.appendChild(gradient);
            return gradientId;
        }
        
        createCSSGradient(element) {
            // Convert SVG gradient to CSS gradient for HTML elements
            const stops = element.gradientStops || this.toolSettings.gradientStops;
            const gradientType = element.gradientType || 'linear';
            
            // Create color stops string
            const colorStops = stops
                .sort((a, b) => a.offset - b.offset) // Sort by offset
                .map(stop => `${stop.color} ${stop.offset}%`)
                .join(', ');
            
            if (gradientType === 'radial') {
                return `radial-gradient(circle, ${colorStops})`;
            } else {
                // Linear gradient (default direction: left to right)
                return `linear-gradient(to right, ${colorStops})`;
            }
        }
        
        parseMarkdown(text) {
            if (!text) return '';
            
            // Use marked.js library for parsing markdown
            if (typeof marked !== 'undefined') {
                try {
                    // Configure marked options for security and functionality
                    marked.setOptions({
                        breaks: true,        // Support single line breaks
                        gfm: true,          // GitHub flavored markdown
                        sanitize: false,    // We'll trust the input since it's user content
                        smartLists: true,   // Better list handling
                        smartypants: false  // Don't convert quotes
                    });
                    
                    return marked.parse(text);
                } catch (error) {
                    return text.replace(/\n/g, '<br>');
                }
            } else {
                return text.replace(/\n/g, '<br>');
            }
        }
        
        createStarPoints(x, y, width, height) {
            // Handle negative dimensions properly by using absolute values for calculations
            // but maintaining the correct center position
            const absWidth = Math.abs(width);
            const absHeight = Math.abs(height);
            
            // Calculate center based on actual position and dimensions
            const cx = width >= 0 ? x + width / 2 : x + width / 2;
            const cy = height >= 0 ? y + height / 2 : y + height / 2;
            
            // Use separate radii for width and height to allow proper scaling
            const outerRadiusX = absWidth / 2;
            const outerRadiusY = absHeight / 2;
            const innerRadiusX = outerRadiusX * 0.4; // Inner radius is 40% of outer
            const innerRadiusY = outerRadiusY * 0.4;
            
            const points = [];
            
            // Create 5-pointed star with elliptical shape support
            for (let i = 0; i < 10; i++) {
                const angle = (i * Math.PI) / 5 - Math.PI / 2; // Start from top
                const radiusX = i % 2 === 0 ? outerRadiusX : innerRadiusX;
                const radiusY = i % 2 === 0 ? outerRadiusY : innerRadiusY;
                const pointX = cx + radiusX * Math.cos(angle);
                const pointY = cy + radiusY * Math.sin(angle);
                points.push(`${pointX},${pointY}`);
            }
            
            return points.join(' ');
        }
        
        pointsToPath(points) {
            if (points.length === 0) return '';
            
            let path = `M ${points[0].x} ${points[0].y}`;
            for (let i = 1; i < points.length; i++) {
                path += ` L ${points[i].x} ${points[i].y}`;
            }
            return path;
        }
        
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
        }
        
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
        }
        
        // Element manipulation methods
        updateElementDrag(point) {
            if (!this.isDraggingElement || !this.dragStartPoint) return;
            
            const dx = point.x - this.dragStartPoint.x;
            const dy = point.y - this.dragStartPoint.y;
            
            // Move all selected elements
            this.selectedElements.forEach(element => {
                const newX = element.dragStartX + dx;
                const newY = element.dragStartY + dy;
                
                // Apply grid snapping
                if (this.snapToGrid) {
                    const snappedPoint = this.snapToGridPoint({ x: newX, y: newY });
                    element.x = snappedPoint.x;
                    element.y = snappedPoint.y;
                } else {
                    element.x = newX;
                    element.y = newY;
                }
                
                this.updateSVGElement(element);
            });
            
            this.updateSelectionHandles();
        }
        
        finishElementDrag() {
            if (!this.isDraggingElement) return;
            
            // Save state after the drag operation is complete
            this.saveStateToHistory('moveElements');
            
            // Clean up drag state
            this.selectedElements.forEach(element => {
                delete element.dragStartX;
                delete element.dragStartY;
            });
            
            this.isDraggingElement = false;
            this.dragStartPoint = null;
            this.manipulationMode = null;
            
            // Reset cursor - will be updated by next pointer move
            this.svg.style.cursor = 'grab';
        }
        
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
                    // For lines/arrows, we need to handle resize differently
                    // The element represents a line from (x,y) to (x+width, y+height)
                    // Negative width/height indicates direction (northwest, southwest, etc.)
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
                        // For lines, we only allow two handles: start and end
                        case 'sw':
                        case 'ne':
                        case 'e':
                        case 'w':
                        case 'n':
                        case 's':
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
                    // Scale the relative points based on the resize
                    const scaleX = (startWidth + dx) / startWidth;
                    const scaleY = (startHeight + dy) / startHeight;
                    
                    // Only allow proportional scaling for paths to maintain shape
                    const scale = Math.min(scaleX, scaleY);
                    
                    newWidth = startWidth * scale;
                    newHeight = startHeight * scale;
                    
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
                    
                    // For text elements: prevent flipping and enforce minimum size with anchor-based position adjustment
                    if (isTextElement) {
                        // Calculate minimum size based on text content
                        const textContent = element.originalText || element.text || 'Text';
                        const measuredBounds = this.measureText(textContent, element.fontSize, element.fontFamily);
                        const padding = 20; // Padding around text
                        
                        const minWidth = Math.max(100, measuredBounds.width + padding);
                        const minHeight = Math.max(40, element.fontSize * 1.5 + padding);
                        
                        // For handles that would cause flipping (W, NW, N, NE, SW sides):
                        // Enforce minimum size and adjust position to keep anchor point fixed
                        
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
                
                // Ensure minimum size and prevent negative values (except for lines/arrows which can have negative dimensions for direction)
                const minSize = 10;
                
                if (element.type === 'line' || element.type === 'arrow') {
                    // For lines and arrows, allow negative dimensions to preserve direction
                    // Just ensure the absolute value meets minimum size
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
                    // For shapes, we need to ensure minimum absolute size while preserving direction
                    const minSize = 10;
                    const currentAbsWidth = Math.abs(newWidth);
                    const currentAbsHeight = Math.abs(newHeight);
                    
                    // Handle width constraints - only apply if absolute width is too small
                    if (currentAbsWidth < minSize) {
                        // Preserve the sign (direction) but enforce minimum absolute size
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
                    
                    // Handle height constraints - only apply if absolute height is too small
                    if (currentAbsHeight < minSize) {
                        // Preserve the sign (direction) but enforce minimum absolute size
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
        }
        
        adjustTextToFitBounds(element) {
            if (element.type !== 'text') return;
            
            const originalText = element.originalText || element.text || 'Text';
            element.originalText = originalText; // Store original text for re-wrapping
            
            const padding = 10; // Consistent padding
            const targetWidth = Math.abs(element.width) - (padding * 2); // Leave padding
            const targetHeight = Math.abs(element.height) - (padding * 2); // Leave padding
            
            if (targetWidth <= 0 || targetHeight <= 0) return;
            
            // Maintain the current font size - don't scale it down
            const fontSize = element.fontSize;
            
            // Just wrap the text to fit the width, maintaining font size
            const wrappedText = this.wrapText(originalText, targetWidth, fontSize, element.fontFamily);
            
            // Update element text with wrapped version
            element.text = wrappedText;
        }
        
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
                    
                    // If single word is too long, try to break it
                    if (this.measureText(currentLine, fontSize, fontFamily).width > maxWidth) {
                        // For very long words, just keep them (better than breaking)
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
        }
        
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
            
            // Update properties panel in real-time during rotation (only rotation)
            if (this.throttledRealTimeUpdate) {
                this.throttledRealTimeUpdate(['rotation']);
            }
        }
        
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
        }
        
        finishRotation() {
            if (!this.isRotating) return;
            
            // Save state after the rotation operation is complete
            this.saveStateToHistory('rotateElements');
            
            // Clean up rotation state
            this.selectedElements.forEach(element => {
                delete element.rotateStartAngle;
            });
            
            this.isRotating = false;
            this.dragStartPoint = null;
            this.manipulationMode = null;
            
            // Reset cursor - will be updated by next pointer move
            this.svg.style.cursor = 'default';
        }
        
        // Selection methods
        selectElement(element) {
            // If element is in a group, select all elements in the group
            if (element.groupId) {
                const groupElements = this.elements.filter(el => el.groupId === element.groupId);
                groupElements.forEach(groupElement => {
                    this.selectedElements.add(groupElement);
                    const currentClass = groupElement.svgElement.getAttribute('class') || '';
                    if (!currentClass.includes('selected')) {
                        groupElement.svgElement.setAttribute('class', currentClass + ' selected');
                    }
                });
            } else {
                this.selectedElements.add(element);
                const currentClass = element.svgElement.getAttribute('class') || '';
                if (!currentClass.includes('selected')) {
                    element.svgElement.setAttribute('class', currentClass + ' selected');
                }
            }
            this.updateSelectionHandles();
            this.syncPropertiesPanel();
            
            // Ensure UI state is properly updated after selection change
            setTimeout(() => {
                this.updateTextPropertiesVisibility();
                
                // Update layers panel to reflect selection changes
                if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
                    window.swwControlPanel.updateLayers();
                }
            }, 0);
        }
        
        commitPropertiesPanelChanges() {
            if (!this.propertiesPanel) return;
            
            // Force any focused input to trigger its change event
            const activeElement = document.activeElement;
            if (activeElement && activeElement.closest('.sww-properties-panel')) {
                // If an input in the properties panel is active, blur it to trigger change event
                activeElement.blur();
                // Give a brief moment for the change event to process
                setTimeout(() => {
                    // Re-focus the canvas or appropriate element if needed
                    if (this.svg) {
                        this.svg.focus();
                    }
                }, 10);
            }
        }
        
        clearSelection() {
            // Commit any pending changes in properties panel before clearing selection
            this.commitPropertiesPanelChanges();
            
            this.selectedElements.forEach(element => {
                const currentClass = element.svgElement.getAttribute('class') || '';
                element.svgElement.setAttribute('class', currentClass.replace('selected', '').trim());
            });
            this.selectedElements.clear();
            this.clearSelectionHandles();
            this.syncPropertiesPanel();
            
            // Update layers panel to reflect selection changes
            if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
                window.swwControlPanel.updateLayers();
            }
        }
        
        selectAll() {
            this.clearSelection();
            this.elements.forEach(element => {
                this.selectElement(element);
            });
        }
        
        moveSelectedElements(arrowKey, isShiftPressed = false) {
            if (this.selectedElements.size === 0) return;
            
            // Check if any selected elements are locked
            const hasLockedElements = Array.from(this.selectedElements).some(element => element.locked);
            if (hasLockedElements) return;
            
            // Determine movement distance based on grid snapping
            let moveDistance;
            if (this.snapToGrid) {
                // When grid snapping is on, move by grid units
                moveDistance = isShiftPressed ? this.options.gridSize * 5 : this.options.gridSize;
            } else {
                // When grid snapping is off, move by pixels
                moveDistance = isShiftPressed ? 10 : 1;
            }
            
            // Determine movement direction
            let dx = 0, dy = 0;
            switch (arrowKey) {
                case 'ArrowUp':
                    dy = -moveDistance;
                    break;
                case 'ArrowDown':
                    dy = moveDistance;
                    break;
                case 'ArrowLeft':
                    dx = -moveDistance;
                    break;
                case 'ArrowRight':
                    dx = moveDistance;
                    break;
                default:
                    return;
            }
            
            // Save state for undo functionality
            this.saveStateToHistory('moveElements');
            
            // Move all selected elements
            this.selectedElements.forEach(element => {
                element.x += dx;
                element.y += dy;
                
                // Update the SVG element
                this.updateSVGElement(element);
                
                // Update spatial index
                this.updateElementInSpatialIndex(element);
            });
            
            // Update selection handles to reflect new positions
            this.updateSelectionHandles();
            
            // Update properties panel with new position values
            this.syncPropertiesPanel();
        }
        
        syncPropertiesPanel() {
            if (!this.propertiesPanel) return;
            
            // Hide properties panel if no selection, multiple elements, or grouped elements
            const hasGroupedSelection = Array.from(this.selectedElements).some(el => el.groupId);
            const hasMultipleSelection = this.selectedElements.size > 1;
            
            if (this.selectedElements.size === 0 || hasMultipleSelection || hasGroupedSelection) {
                this.propertiesPanel.classList.remove('visible');
                
                // When no selection, ensure properties panel shows current tool settings
                if (this.selectedElements.size === 0) {
                    // Update stroke color input to current tool setting
                    const strokeInput = this.propertiesPanel.querySelector('input[type="color"]');
                    if (strokeInput && strokeInput.value !== this.toolSettings.strokeColor) {
                        strokeInput.value = this.toolSettings.strokeColor;
                    }
                    
                    // Update stroke hex input
                    const strokeHexInput = this.propertiesPanel.querySelector('.sww-hex-input');
                    if (strokeHexInput && strokeHexInput.value !== this.toolSettings.strokeColor) {
                        strokeHexInput.value = this.toolSettings.strokeColor;
                    }
                    
                    // Update fill color input to current tool setting
                    const fillInputs = this.propertiesPanel.querySelectorAll('input[type="color"]');
                    if (fillInputs[1] && this.toolSettings.fillColor !== 'transparent') {
                        const expectedFillValue = this.toolSettings.fillColor;
                        if (fillInputs[1].value !== expectedFillValue) {
                            fillInputs[1].value = expectedFillValue;
                        }
                    }
                    
                    // Update fill hex input
                    const fillHexInputs = this.propertiesPanel.querySelectorAll('.sww-hex-input');
                    if (fillHexInputs[1] && this.toolSettings.fillColor !== 'transparent') {
                        const expectedFillValue = this.toolSettings.fillColor;
                        if (fillHexInputs[1].value !== expectedFillValue) {
                            fillHexInputs[1].value = expectedFillValue;
                        }
                    }
                }
                
                // Update gradient controls visibility for no selection (use tool settings)
                this.updateGradientControlsVisibility();
                return;
            }
            
            // Show properties panel for single, non-grouped element
            this.propertiesPanel.classList.add('visible');
            
            // Get the first selected element to sync properties
            const firstElement = this.selectedElements.values().next().value;
            
            if (firstElement) {
                // Update stroke color input (first color input)
                const strokeInput = this.propertiesPanel.querySelector('input[type="color"]');
                if (strokeInput) {
                    strokeInput.value = firstElement.strokeColor || '#000000';
                }
                
                // Update stroke hex input
                const strokeHexInput = this.propertiesPanel.querySelector('.sww-hex-input');
                if (strokeHexInput) {
                    strokeHexInput.value = firstElement.strokeColor || '#000000';
                }
                
                // Update stroke width input (number input)
                const strokeWidthInput = this.propertiesPanel.querySelector('input[type="number"][min="0"][max="20"]');
                if (strokeWidthInput) {
                    strokeWidthInput.value = firstElement.strokeWidth || 0;
                }
                
                // Update fill color input (second color input)
                const fillInputs = this.propertiesPanel.querySelectorAll('input[type="color"]');
                if (fillInputs[1]) {
                    fillInputs[1].value = firstElement.fillColor === 'transparent' ? '#ffffff' : (firstElement.fillColor || '#ffffff');
                }
                
                // Update fill hex input
                const fillHexInputs = this.propertiesPanel.querySelectorAll('.sww-hex-input');
                if (fillHexInputs[1]) {
                    fillHexInputs[1].value = firstElement.fillColor === 'transparent' ? '#ffffff' : (firstElement.fillColor || '#ffffff');
                }
                
                // Update fill style select
                const fillStyleSelect = this.propertiesPanel.querySelector('select.sww-select-input');
                if (fillStyleSelect) {
                    fillStyleSelect.value = firstElement.fillStyle || 'transparent';
                }
                
                // Update gradient properties
                if (firstElement.gradientType) {
                    const gradientTypeSelect = this.propertiesPanel.querySelector('.sww-gradient-group select');
                    if (gradientTypeSelect) {
                        gradientTypeSelect.value = firstElement.gradientType;
                    }
                }
                
                // Update gradient controls visibility and stops
                this.updateGradientControlsVisibility();
                this.updateGradientStopsUI();
                
                // Update opacity input (number input with max 100)
                const opacityInput = this.propertiesPanel.querySelector('input[type="number"][min="0"][max="100"]');
                if (opacityInput) {
                    opacityInput.value = Math.round((firstElement.opacity || 1) * 100);
                }
                
                // Update width input
                const widthInputs = this.propertiesPanel.querySelectorAll('input[type="number"][min="1"]');
                const widthInput = widthInputs[0]; // First input with min="1" should be width
                if (widthInput) {
                    widthInput.value = Math.abs(firstElement.width) || 100;
                }
                
                // Update height input
                const heightInput = widthInputs[1]; // Second input with min="1" should be height
                if (heightInput) {
                    heightInput.value = Math.abs(firstElement.height) || 100;
                }
                
                // Update rotation input
                const rotationInput = this.propertiesPanel.querySelector('input[type="number"][min="-360"][max="360"]');
                if (rotationInput) {
                    rotationInput.value = firstElement.rotation || 0;
                }
                
                // Update text properties visibility and values
                this.updateTextPropertiesVisibility();
                
                // Update text-specific properties if it's a text or markdown element
                if (firstElement.type === 'text' || firstElement.type === 'markdown') {
                    // Update font family select (for both text and markdown elements)
                    const fontFamilySelect = this.propertiesPanel.querySelector('.sww-text-properties select');
                    if (fontFamilySelect) {
                        fontFamilySelect.value = firstElement.fontFamily || 'Arial';
                    }
                    
                    // Only show text color for markdown elements, all text properties for text elements
                    if (firstElement.type === 'text') {
                        // Update font size input
                        const fontSizeInput = this.propertiesPanel.querySelector('.sww-text-properties input[type="number"][min="8"][max="72"]');
                        if (fontSizeInput) {
                            fontSizeInput.value = firstElement.fontSize || 16;
                        }
                        
                        // Update text alignment buttons (only for text elements)
                        const alignButtons = this.propertiesPanel.querySelectorAll('.sww-align-button');
                        alignButtons.forEach(button => {
                            const align = button.getAttribute('data-align');
                            if (align === (firstElement.textAlign || 'left')) {
                                button.classList.add('active');
                            } else {
                                button.classList.remove('active');
                            }
                        });
                    }
                    
                    // Update text color input (for both text and markdown elements)
                    const textColorInput = this.propertiesPanel.querySelector('.sww-text-properties input[type="color"]');
                    if (textColorInput) {
                        const textColorValue = firstElement.textColor || firstElement.strokeColor || '#000000';
                        textColorInput.value = textColorValue;
                    }
                    
                    // Update text color hex input (for both text and markdown elements)
                    const textColorHexInputs = this.propertiesPanel.querySelectorAll('.sww-text-properties .sww-hex-input');
                    const textColorHexInput = textColorHexInputs[textColorHexInputs.length - 1]; // Last hex input should be text color
                    if (textColorHexInput) {
                        const textColorValue = firstElement.textColor || firstElement.strokeColor || '#000000';
                        textColorHexInput.value = textColorValue;
                    }
                }
            }
            
        // Update text properties visibility based on current selection
        this.updateTextPropertiesVisibility();
    }
    
    // Real-time update of specific properties during manipulation (resize/rotate)
    // This is more efficient than full syncPropertiesPanel for live updates
    updatePropertiesPanelRealTime(properties = []) {
        if (!this.propertiesPanel || this.selectedElements.size !== 1) return;
        
        const firstElement = this.selectedElements.values().next().value;
        if (!firstElement) return;
        
        // Update width if requested or if no specific properties specified
        if (properties.length === 0 || properties.includes('width')) {
            const widthInputs = this.propertiesPanel.querySelectorAll('input[type="number"][min="1"]');
            const widthInput = widthInputs[0]; // First input with min="1" should be width
            if (widthInput) {
                widthInput.value = Math.abs(firstElement.width) || 100;
            }
        }
        
        // Update height if requested or if no specific properties specified
        if (properties.length === 0 || properties.includes('height')) {
            const widthInputs = this.propertiesPanel.querySelectorAll('input[type="number"][min="1"]');
            const heightInput = widthInputs[1]; // Second input with min="1" should be height
            if (heightInput) {
                heightInput.value = Math.abs(firstElement.height) || 100;
            }
        }
        
        // Update rotation if requested or if no specific properties specified
        if (properties.length === 0 || properties.includes('rotation')) {
            const rotationInput = this.propertiesPanel.querySelector('input[type="number"][min="-360"][max="360"]');
            if (rotationInput) {
                rotationInput.value = Math.round(firstElement.rotation || 0);
            }
        }
    }        deleteSelectedElements() {
            if (this.selectedElements.size === 0) return;
            
            // Filter out locked elements
            const elementsToDelete = Array.from(this.selectedElements).filter(element => !element.locked);
            
            elementsToDelete.forEach(element => {
                this.removeElement(element);
                this.selectedElements.delete(element);
            });
            
            // Save state after deletion
            this.saveStateToHistory('deleteElements');
            
            // Update selection handles for remaining elements
            if (this.selectedElements.size > 0) {
                this.updateSelectionHandles();
            } else {
                this.clearSelectionHandles();
            }
            this.updateTextPropertiesVisibility();
        }
        
        // Context Menu Methods
        showContextMenu(e) {
            // Prevent context menu in preview mode
            if (this.isPreviewMode) {
                return;
            }
            
            const rect = this.container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Update menu item states based on current selection and clipboard
            this.updateContextMenuState();
            
            // Position and show the context menu
            this.contextMenu.style.left = x + 'px';
            this.contextMenu.style.top = y + 'px';
            this.contextMenu.style.display = 'block';
            
            // Ensure menu doesn't go off screen
            const menuRect = this.contextMenu.getBoundingClientRect();
            const containerRect = this.container.getBoundingClientRect();
            
            if (x + menuRect.width > containerRect.width) {
                this.contextMenu.style.left = (x - menuRect.width) + 'px';
            }
            
            if (y + menuRect.height > containerRect.height) {
                this.contextMenu.style.top = (y - menuRect.height) + 'px';
            }
        }
        
        hideContextMenu() {
            if (this.contextMenu) {
                this.contextMenu.style.display = 'none';
            }
        }
        
        updateContextMenuState() {
            const hasSelection = this.selectedElements.size > 0;
            const hasClipboard = this.clipboard.length > 0;
            const hasEditableSelection = Array.from(this.selectedElements).some(el => 
                el.type === 'text' || el.type === 'website' || el.type === 'image' || el.type === 'markdown'
            );
            const canGroup = this.selectedElements.size > 1;
            const hasGroupedSelection = Array.from(this.selectedElements).some(el => el.groupId);
            const hasLockedSelection = Array.from(this.selectedElements).some(el => el.locked);
            const hasUnlockedSelection = Array.from(this.selectedElements).some(el => !el.locked);
            
            // Update menu item states
            const copyItem = this.contextMenu.querySelector('[data-action="copy"]');
            const pasteItem = this.contextMenu.querySelector('[data-action="paste"]');
            const groupItem = this.contextMenu.querySelector('[data-action="group"]');
            const ungroupItem = this.contextMenu.querySelector('[data-action="ungroup"]');
            const lockItem = this.contextMenu.querySelector('[data-action="lock"]');
            const unlockItem = this.contextMenu.querySelector('[data-action="unlock"]');
            const bringToFrontItem = this.contextMenu.querySelector('[data-action="bring-to-front"]');
            const sendToBackItem = this.contextMenu.querySelector('[data-action="send-to-back"]');
            const editItem = this.contextMenu.querySelector('[data-action="edit"]');
            
            if (copyItem) copyItem.disabled = !hasSelection;
            if (pasteItem) pasteItem.disabled = !hasClipboard;
            if (groupItem) groupItem.disabled = !canGroup;
            if (ungroupItem) ungroupItem.disabled = !hasGroupedSelection;
            if (lockItem) lockItem.disabled = !hasSelection || !hasUnlockedSelection;
            if (unlockItem) unlockItem.disabled = !hasSelection || !hasLockedSelection;
            if (bringToFrontItem) bringToFrontItem.disabled = !hasSelection;
            if (sendToBackItem) sendToBackItem.disabled = !hasSelection;
            if (editItem) editItem.disabled = !hasEditableSelection;
        }
        
        // Clipboard Methods
        copySelected() {
            if (this.selectedElements.size === 0) {
                this.showNotification('No elements selected to copy', 'warning');
                return;
            }
            
            this.clipboard = [];
            this.selectedElements.forEach(element => {
                // Create a deep copy of the element
                const elementCopy = {
                    ...element,
                    id: this.generateId(), // Generate new ID for paste
                    x: element.x + 20, // Offset for paste
                    y: element.y + 20
                };
                delete elementCopy.svgElement; // Remove SVG reference
                this.clipboard.push(elementCopy);
            });
            
            this.showNotification(`Copied ${this.clipboard.length} element${this.clipboard.length > 1 ? 's' : ''}`, 'copy');
        }
        
        pasteClipboard() {
            if (this.clipboard.length === 0) {
                this.showNotification('Nothing to paste', 'warning');
                return;
            }
            
            // Save state before pasting
            this.saveStateToHistory('pasteElements');
            
            // Clear current selection
            this.clearSelection();
            
            // Calculate paste position - center of current viewport
            const centerX = this.viewBox.x + this.viewBox.width / 2;
            const centerY = this.viewBox.y + this.viewBox.height / 2;
            
            // Find the center of the clipboard elements to maintain relative positioning
            let minX = Infinity, minY = Infinity;
            this.clipboard.forEach(element => {
                minX = Math.min(minX, element.x);
                minY = Math.min(minY, element.y);
            });
            
            // Calculate offset to center the pasted elements
            const offsetX = centerX - minX;
            const offsetY = centerY - minY;
            
            // Create new elements from clipboard
            this.clipboard.forEach(elementData => {
                const newElement = {
                    ...elementData,
                    id: this.generateId(),
                    x: elementData.x + offsetX,
                    y: elementData.y + offsetY
                };
                
                // Create SVG element and add to canvas
                const svgElement = this.createSVGElement(newElement);
                newElement.svgElement = svgElement;
                this.elements.push(newElement);
                this.addSVGElementToDOM(newElement);
                
                // Select the new element
                this.selectElement(newElement);
            });
            
            // Update clipboard positions for next paste (add small offset)
            this.clipboard.forEach(element => {
                element.x += 20;
                element.y += 20;
            });
            
            this.showNotification(`Pasted ${this.clipboard.length} element${this.clipboard.length > 1 ? 's' : ''}`, 'paste');
        }
        
        editSelected() {
            if (this.selectedElements.size === 0) return;
            
            // Find first editable element in selection
            const editableElement = Array.from(this.selectedElements).find(el => 
                el.type === 'text' || el.type === 'website' || el.type === 'image' || el.type === 'markdown'
            );
            
            if (editableElement) {
                switch (editableElement.type) {
                    case 'text':
                        this.startTextEditing(editableElement);
                        break;
                    case 'website':
                        this.editWebsiteElement(editableElement);
                        break;
                    case 'image':
                        this.editImageElement(editableElement);
                        break;
                    case 'markdown':
                        // For markdown, enable editing and focus the textarea
                        const textarea = editableElement.svgElement.querySelector('.sww-markdown-editor');
                        const hint = editableElement.svgElement.querySelector('.sww-markdown-hint');
                        if (textarea) {
                            textarea.readOnly = false;
                            textarea.style.cursor = 'text';
                            textarea.focus();
                            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
                            
                            // Hide the hint when editing
                            if (hint) hint.style.display = 'none';
                            
                            // Add blur handler to make it read-only again when done editing
                            const handleBlur = () => {
                                textarea.readOnly = true;
                                textarea.style.cursor = 'default';
                                if (hint) hint.style.display = 'block';
                                textarea.removeEventListener('blur', handleBlur);
                            };
                            textarea.addEventListener('blur', handleBlur);
                        }
                        break;
                }
            }
        }
        
        // Lock/Unlock specific methods for context menu
        lockSelected() {
            if (this.selectedElements.size === 0) return;
            
            this.selectedElements.forEach(element => {
                if (!element.locked) {
                    element.locked = true;
                    // Update visual indication using CSS classes
                    const currentClass = element.svgElement.getAttribute('class') || '';
                    if (!currentClass.includes('sww-locked')) {
                        element.svgElement.setAttribute('class', currentClass + ' sww-locked');
                    }
                }
            });
        }
        
        unlockSelected() {
            if (this.selectedElements.size === 0) return;
            
            this.selectedElements.forEach(element => {
                if (element.locked) {
                    element.locked = false;
                    // Remove visual indication using CSS classes
                    const currentClass = element.svgElement.getAttribute('class') || '';
                    element.svgElement.setAttribute('class', currentClass.replace('sww-locked', '').trim());
                }
            });
        }
        
        // Edit methods for new element types
        editWebsiteElement(element) {
            // Prevent editing in preview mode
            if (this.isPreviewMode) {
                return;
            }
            
            this.showConfigDialog('Website', [
                { label: 'URL:', type: 'text', key: 'url', value: element.url || '', placeholder: 'https://example.com' }
            ], (values) => {
                element.url = values.url;
                this.updateSVGElement(element);
            });
        }
        
        editImageElement(element) {
            // Prevent editing in preview mode
            if (this.isPreviewMode) {
                return;
            }
            
            this.showConfigDialog('Image', [
                { label: 'URL:', type: 'text', key: 'imageUrl', value: element.imageUrl || '', placeholder: 'https://example.com/image.jpg' }
            ], (values) => {
                element.imageUrl = values.imageUrl;
                this.updateSVGElement(element);
            });
        }
        
        showConfigDialog(title, fields, onSave) {
            // Create overlay
            const overlay = document.createElement('div');
            overlay.className = 'sww-config-overlay';
            
            // Create dialog
            const dialog = document.createElement('div');
            dialog.className = 'sww-config-dialog';
            
            // Title
            const titleEl = document.createElement('h3');
            titleEl.textContent = title;
            dialog.appendChild(titleEl);
            
            // Fields
            const form = document.createElement('div');
            const inputs = {};
            
            fields.forEach(field => {
                const label = document.createElement('label');
                label.textContent = field.label;
                form.appendChild(label);
                
                let input;
                if (field.type === 'textarea') {
                    input = document.createElement('textarea');
                } else {
                    input = document.createElement('input');
                    input.type = field.type || 'text';
                }
                
                input.value = field.value || '';
                input.placeholder = field.placeholder || '';
                inputs[field.key] = input;
                form.appendChild(input);
            });
            
            dialog.appendChild(form);
            
            // Buttons
            const buttons = document.createElement('div');
            buttons.className = 'sww-config-dialog-buttons';
            
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancel';
            cancelBtn.onclick = () => {
                overlay.remove();
            };
            
            const saveBtn = document.createElement('button');
            saveBtn.textContent = 'Save';
            saveBtn.className = 'primary';
            saveBtn.onclick = () => {
                const values = {};
                Object.keys(inputs).forEach(key => {
                    values[key] = inputs[key].value;
                });
                onSave(values);
                overlay.remove();
            };
            
            buttons.appendChild(cancelBtn);
            buttons.appendChild(saveBtn);
            dialog.appendChild(buttons);
            
            // Add to page
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
            
            // Focus first input
            const firstInput = Object.values(inputs)[0];
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
            
            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                }
            });
        }
        
        // Layer Management Methods
        bringToFront() {
            if (this.selectedElements.size === 0) return;
            
            this.saveStateToHistory('bringToFront');
            
            // Convert to array and sort by current position in elements array
            const selectedArray = Array.from(this.selectedElements);
            const elementsToMove = selectedArray.map(element => {
                const index = this.elements.indexOf(element);
                return { element, index };
            }).sort((a, b) => a.index - b.index);
            
            // Remove elements from their current positions (from back to front to maintain indices)
            for (let i = elementsToMove.length - 1; i >= 0; i--) {
                const { element, index } = elementsToMove[i];
                this.elements.splice(index, 1);
                
                // Move SVG element to end (top layer)
                const svgElement = this.svg.querySelector(`[data-element-id="${element.id}"]`);
                if (svgElement) {
                    svgElement.remove();
                    this.elementsGroup.appendChild(svgElement);
                }
            }
            
            // Add elements to the end of the array (top layer)
            elementsToMove.forEach(({ element }) => {
                this.elements.push(element);
            });
        }
        
        sendToBack() {
            if (this.selectedElements.size === 0) return;
            
            this.saveStateToHistory('sendToBack');
            
            // Convert to array and sort by current position in elements array
            const selectedArray = Array.from(this.selectedElements);
            const elementsToMove = selectedArray.map(element => {
                const index = this.elements.indexOf(element);
                return { element, index };
            }).sort((a, b) => b.index - a.index); // Sort in reverse order
            
            // Remove elements from their current positions (from front to back to maintain indices)
            elementsToMove.forEach(({ element, index }) => {
                this.elements.splice(index, 1);
                
                // Move SVG element to beginning (bottom layer)
                const svgElement = this.svg.querySelector(`[data-element-id="${element.id}"]`);
                if (svgElement) {
                    svgElement.remove();
                    this.elementsGroup.insertBefore(svgElement, this.elementsGroup.firstChild);
                }
            });
            
            // Add elements to the beginning of the array (bottom layer)
            elementsToMove.reverse().forEach(({ element }) => {
                this.elements.unshift(element);
            });
        }
        
        startSelectionBox(startPoint) {
            // Create a selection box for multi-select
            this.selectionBoxStart = startPoint;
            this.isCreatingSelectionBox = true;
            
            // Create the selection box element
            this.currentSelectionBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            this.currentSelectionBox.setAttribute('class', 'sww-selection-box');
            this.currentSelectionBox.setAttribute('x', startPoint.x);
            this.currentSelectionBox.setAttribute('y', startPoint.y);
            this.currentSelectionBox.setAttribute('width', 0);
            this.currentSelectionBox.setAttribute('height', 0);
            this.selectionGroup.appendChild(this.currentSelectionBox);
        }
        
        updateSelectionBox(currentPoint) {
            if (!this.isCreatingSelectionBox || !this.currentSelectionBox) return;
            
            const startPoint = this.selectionBoxStart;
            const x = Math.min(startPoint.x, currentPoint.x);
            const y = Math.min(startPoint.y, currentPoint.y);
            const width = Math.abs(currentPoint.x - startPoint.x);
            const height = Math.abs(currentPoint.y - startPoint.y);
            
            this.currentSelectionBox.setAttribute('x', x);
            this.currentSelectionBox.setAttribute('y', y);
            this.currentSelectionBox.setAttribute('width', width);
            this.currentSelectionBox.setAttribute('height', height);
        }
        
        finishSelectionBox(endPoint) {
            if (!this.isCreatingSelectionBox) return;
            
            const startPoint = this.selectionBoxStart;
            const x = Math.min(startPoint.x, endPoint.x);
            const y = Math.min(startPoint.y, endPoint.y);
            const width = Math.abs(endPoint.x - startPoint.x);
            const height = Math.abs(endPoint.y - startPoint.y);
            
            // Select all elements within the selection box
            if (width > 5 && height > 5) { // Only if selection box is big enough
                this.elements.forEach(element => {
                    if (this.isElementInSelectionBox(element, x, y, width, height)) {
                        this.selectElement(element);
                    }
                });
            }
            
            // Clean up
            if (this.currentSelectionBox) {
                this.currentSelectionBox.remove();
                this.currentSelectionBox = null;
            }
            this.isCreatingSelectionBox = false;
            this.selectionBoxStart = null;
        }
        
        isElementInSelectionBox(element, boxX, boxY, boxWidth, boxHeight) {
            const bounds = this.getElementBounds(element);
            
            // Check if element bounds intersect with selection box
            return !(bounds.x > boxX + boxWidth || 
                    bounds.x + bounds.width < boxX || 
                    bounds.y > boxY + boxHeight || 
                    bounds.y + bounds.height < boxY);
        }
        
        updateSelectionHandles() {
            // Only update if selection update isn't already scheduled
            if (this.selectionUpdateScheduled) return;
            
            this.selectionUpdateScheduled = true;
            PerformanceUtils.requestAnimationFrame(() => {
                this.clearSelectionHandles();
                
                if (this.selectedElements.size === 0) {
                    this.selectionUpdateScheduled = false;
                    return;
                }
                
                // For performance with many selected elements, group selection bounds
                if (this.selectedElements.size > 10) {
                    const combinedBounds = this.getCombinedSelectionBounds();
                    this.addResizeHandles(combinedBounds);
                } else {
                    // Show selection boxes and handles for each selected element
                    this.selectedElements.forEach(element => {
                        const bounds = this.getElementBounds(element);
                        
                        // Selection box
                        const selectionBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        selectionBox.setAttribute('class', 'sww-selection-box');
                        selectionBox.setAttribute('x', bounds.x - 2);
                        selectionBox.setAttribute('y', bounds.y - 2);
                        selectionBox.setAttribute('width', bounds.width + 4);
                        selectionBox.setAttribute('height', bounds.height + 4);
                        this.selectionGroup.appendChild(selectionBox);
                        
                        // Add appropriate resize handles based on element type
                        if (element.type === 'line' || element.type === 'arrow') {
                            this.addLineResizeHandles(element);
                        } else {
                            // Use standard 8-handle resize for all elements including text
                            this.addResizeHandles(bounds);
                        }
                    });
                }
                
                this.selectionUpdateScheduled = false;
                
                // Update control panel if available
                if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
                    window.swwControlPanel.updateLayers();
                }
            });
        }
        
        getCombinedSelectionBounds() {
            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;
            
            this.selectedElements.forEach(element => {
                const bounds = this.getElementBounds(element);
                minX = Math.min(minX, bounds.x);
                minY = Math.min(minY, bounds.y);
                maxX = Math.max(maxX, bounds.x + bounds.width);
                maxY = Math.max(maxY, bounds.y + bounds.height);
            });
            
            return {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY
            };
        }
        
        addLineResizeHandles(element) {
            const handleSize = 8;
            
            // For lines and arrows, only show start and end point handles
            const startX = element.x;
            const startY = element.y;
            const endX = element.x + element.width;
            const endY = element.y + element.height;
            
            const handles = [
                { x: startX - handleSize/2, y: startY - handleSize/2, cursor: 'move', type: 'nw' }, // Start point
                { x: endX - handleSize/2, y: endY - handleSize/2, cursor: 'move', type: 'se' }    // End point
            ];
            
            handles.forEach(handle => {
                const handleRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                handleRect.setAttribute('class', 'sww-handle');
                handleRect.setAttribute('x', handle.x);
                handleRect.setAttribute('y', handle.y);
                handleRect.setAttribute('width', handleSize);
                handleRect.setAttribute('height', handleSize);
                handleRect.setAttribute('data-handle-type', handle.type);
                handleRect.style.cursor = handle.cursor;
                
                // Add event listeners for resize
                handleRect.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.startResize(handle.type, this.getPointerPosition(e));
                });
                
                handleRect.addEventListener('touchstart', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const touch = e.touches[0];
                    this.startResize(handle.type, this.getPointerPosition(touch));
                });
                
                this.selectionGroup.appendChild(handleRect);
            });
        }
        
        addResizeHandles(bounds) {
            const handleSize = 8;
            const handles = [
                { x: bounds.x - handleSize/2, y: bounds.y - handleSize/2, cursor: 'nw-resize', type: 'nw' },
                { x: bounds.x + bounds.width/2 - handleSize/2, y: bounds.y - handleSize/2, cursor: 'n-resize', type: 'n' },
                { x: bounds.x + bounds.width - handleSize/2, y: bounds.y - handleSize/2, cursor: 'ne-resize', type: 'ne' },
                { x: bounds.x + bounds.width - handleSize/2, y: bounds.y + bounds.height/2 - handleSize/2, cursor: 'e-resize', type: 'e' },
                { x: bounds.x + bounds.width - handleSize/2, y: bounds.y + bounds.height - handleSize/2, cursor: 'se-resize', type: 'se' },
                { x: bounds.x + bounds.width/2 - handleSize/2, y: bounds.y + bounds.height - handleSize/2, cursor: 's-resize', type: 's' },
                { x: bounds.x - handleSize/2, y: bounds.y + bounds.height - handleSize/2, cursor: 'sw-resize', type: 'sw' },
                { x: bounds.x - handleSize/2, y: bounds.y + bounds.height/2 - handleSize/2, cursor: 'w-resize', type: 'w' }
            ];
            
            handles.forEach(handle => {
                const handleRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                handleRect.setAttribute('class', 'sww-handle');
                handleRect.setAttribute('x', handle.x);
                handleRect.setAttribute('y', handle.y);
                handleRect.setAttribute('width', handleSize);
                handleRect.setAttribute('height', handleSize);
                handleRect.setAttribute('data-handle-type', handle.type);
                handleRect.style.cursor = handle.cursor;
                
                // Add event listeners for resize
                handleRect.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.startResize(handle.type, this.getPointerPosition(e));
                });
                
                handleRect.addEventListener('touchstart', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.startResize(handle.type, this.getPointerPosition(e));
                });
                
                this.selectionGroup.appendChild(handleRect);
            });
            
            // Add rotation handle
            const rotateHandle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            rotateHandle.setAttribute('class', 'sww-handle rotate');
            rotateHandle.setAttribute('cx', bounds.x + bounds.width/2);
            rotateHandle.setAttribute('cy', bounds.y - 20);
            rotateHandle.setAttribute('r', 6);
            rotateHandle.style.cursor = 'crosshair'; // Rotation cursor instead of crosshair
            
            rotateHandle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.startRotation(this.getPointerPosition(e));
            });
            
            rotateHandle.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.startRotation(this.getPointerPosition(e));
            });
            
            this.selectionGroup.appendChild(rotateHandle);
        }
        
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
        }
        
        startRotation(point) {
            this.isRotating = true;
            this.manipulationMode = 'rotate';
            this.dragStartPoint = point;
            
            this.svg.style.cursor = 'crosshair';
            
            this.selectedElements.forEach(element => {
                element.rotateStartAngle = element.rotation || 0;
            });
        }
        
        clearSelectionHandles() {
            this.selectionGroup.innerHTML = '';
        }
        
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
                // This must match the createStarPoints calculation for proper bounding box
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
        }
        
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
        }
        
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
        }
        
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
        }
        
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
        }
        
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
        
        updateSelectedElements() {
            this.selectedElements.forEach(element => {
                // Update properties
                element.strokeColor = this.toolSettings.strokeColor;
                element.strokeWidth = this.toolSettings.strokeWidth;
                element.fillColor = this.toolSettings.fillColor;
                element.fillStyle = this.toolSettings.fillStyle;
                element.opacity = this.toolSettings.opacity;
                
                // Update text-specific properties
                if (element.type === 'text') {
                    element.fontSize = this.toolSettings.fontSize;
                    element.fontFamily = this.toolSettings.fontFamily;
                    element.textAlign = this.toolSettings.textAlign;
                    element.textColor = this.toolSettings.textColor;
                }
                
                this.updateSVGElement(element);
            });
            
            // Update text properties visibility
            this.updateTextPropertiesVisibility();
        }

        // Update only a specific property for selected elements
        updateSelectedElementProperty(propertyName, value) {
            if (this.selectedElements.size === 0) return;
            
            this.selectedElements.forEach(element => {
                // Only update the specific property
                if (propertyName === 'fontSize' && element.type === 'text') {
                    element.fontSize = value;
                } else if (propertyName === 'fontFamily' && (element.type === 'text' || element.type === 'markdown')) {
                    element.fontFamily = value;
                } else if (propertyName === 'textAlign' && element.type === 'text') {
                    element.textAlign = value;
                } else if (propertyName === 'textColor' && (element.type === 'text' || element.type === 'markdown')) {
                    element.textColor = value;
                } else if (propertyName === 'strokeColor') {
                    element.strokeColor = value;
                } else if (propertyName === 'strokeWidth') {
                    element.strokeWidth = value;
                } else if (propertyName === 'fillColor') {
                    element.fillColor = value;
                } else if (propertyName === 'fillStyle') {
                    element.fillStyle = value;
                } else if (propertyName === 'opacity') {
                    element.opacity = value;
                } else if (propertyName === 'width') {
                    element.width = Math.abs(value); // Ensure positive width
                } else if (propertyName === 'height') {
                    element.height = Math.abs(value); // Ensure positive height
                } else if (propertyName === 'rotation') {
                    element.rotation = value;
                } else if (propertyName === 'gradientType') {
                    element.gradientType = value;
                } else if (propertyName === 'gradientStops') {
                    element.gradientStops = value;
                }
                
                this.updateSVGElement(element);
            });
            
            // Update selection handles after property change to reflect new dimensions
            this.updateSelectionHandles();
            
            // Save state after property change
            this.saveStateToHistory('updateProperty');
            
            // Update layers panel to reflect any changes
            if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
                window.swwControlPanel.updateLayers();
            }
        }
        
        updateTextPropertiesVisibility() {
            if (!this.propertiesPanel) return;
            
            const textPropertiesSection = this.propertiesPanel.querySelector('.sww-text-properties');
            if (!textPropertiesSection) return;
            
            // Check if any selected elements are text, markdown, or image elements
            const hasTextElements = Array.from(this.selectedElements).some(element => 
                element.type === 'text'
            );
            const hasMarkdownElements = Array.from(this.selectedElements).some(element => 
                element.type === 'markdown'
            );
            const hasImageElements = Array.from(this.selectedElements).some(element => 
                element.type === 'image'
            );
            const hasWebsiteElements = Array.from(this.selectedElements).some(element => 
                element.type === 'website'
            );
            
            // Show or hide text properties based on selection
            if (hasTextElements || hasMarkdownElements) {
                textPropertiesSection.classList.remove('hidden');
                textPropertiesSection.classList.add('visible');
                
                // Find property groups by their labels
                const propertyGroups = textPropertiesSection.querySelectorAll('.sww-property-group');
                
                propertyGroups.forEach(group => {
                    const label = group.querySelector('.sww-property-label');
                    if (label) {
                        const labelText = label.textContent.trim();
                        
                        if (hasMarkdownElements && !hasTextElements) {
                            // For markdown elements only, hide font size and text align, but keep font family
                            if (labelText === 'Font Size' || labelText === 'Text Align') {
                                group.style.display = 'none';
                            } else {
                                group.style.display = 'flex';
                            }
                        } else {
                            // For text elements or mixed selection, show all properties
                            group.style.display = 'flex';
                        }
                    }
                });
            } else {
                textPropertiesSection.classList.remove('visible');
                textPropertiesSection.classList.add('hidden');
            }
            
            // Handle fill properties visibility for image and website elements
            // Look for fill property groups directly in the main panel
            if ((hasImageElements || hasWebsiteElements || hasTextElements) && !hasMarkdownElements) {
                // For image, website, and text elements, hide fill color and fill style properties
                const allPropertyGroups = this.propertiesPanel.querySelectorAll('.sww-property-group');
                
                allPropertyGroups.forEach(group => {
                    const label = group.querySelector('.sww-property-label');
                    if (label) {
                        const labelText = label.textContent.trim();
                        
                        if (labelText === 'Fill Color' || labelText === 'Fill Style') {
                            group.style.display = 'none';
                        }
                    }
                });
                
                // For text elements, also hide gradient controls since they don't apply
                if (hasTextElements) {
                    const gradientGroup = this.propertiesPanel.querySelector('.sww-gradient-group');
                    if (gradientGroup) {
                        gradientGroup.style.display = 'none';
                    }
                }
            } else {
                // For other elements or mixed selection, show fill style but handle fill color based on gradient
                const allPropertyGroups = this.propertiesPanel.querySelectorAll('.sww-property-group');
                
                allPropertyGroups.forEach(group => {
                    const label = group.querySelector('.sww-property-label');
                    if (label) {
                        const labelText = label.textContent.trim();
                        
                        if (labelText === 'Fill Style') {
                            group.style.display = 'flex';
                        }
                        // Fill Color visibility will be handled by updateGradientControlsVisibility
                    }
                });
                
                // Update gradient controls visibility (this will also handle fill color visibility)
                // Only call this for non-text, non-image, non-website elements
                if (!hasTextElements && !hasImageElements && !hasWebsiteElements) {
                    this.updateGradientControlsVisibility();
                } else {
                    // For text/image/website elements, ensure gradient controls are hidden
                    const gradientGroup = this.propertiesPanel.querySelector('.sww-gradient-group');
                    if (gradientGroup) {
                        gradientGroup.style.display = 'none';
                    }
                }
            }
        }
        
        // Gradient Controls Management
        updateGradientControlsVisibility() {
            if (!this.propertiesPanel) return;
            
            const gradientGroup = this.propertiesPanel.querySelector('.sww-gradient-group');
            if (!gradientGroup) return;
            
            // Check if we have text elements selected (they don't support gradients)
            const hasTextElements = Array.from(this.selectedElements).some(element => 
                element.type === 'text'
            );
            
            // Hide gradient controls for text elements
            if (hasTextElements) {
                gradientGroup.style.display = 'none';
                // Also hide fill color for text elements
                this.updateFillColorVisibility(false);
                return;
            }
            
            // Check the actual fill style of selected elements or tool settings
            let isGradientStyle = false;
            
            if (this.selectedElements.size > 0) {
                // If elements are selected, check their fill style
                isGradientStyle = Array.from(this.selectedElements).some(element => 
                    element.fillStyle === 'gradient'
                );
            } else {
                // If no elements selected, use tool settings
                isGradientStyle = this.toolSettings.fillStyle === 'gradient';
            }
            
            gradientGroup.style.display = isGradientStyle ? 'block' : 'none';
            
            // Hide/show fill color controls based on gradient selection
            this.updateFillColorVisibility(!isGradientStyle);
        }
        
        updateFillColorVisibility(shouldShow) {
            if (!this.propertiesPanel) return;
            
            // Check if we have image, website, or text elements selected (they should hide fill color)
            const hasImageElements = Array.from(this.selectedElements).some(element => 
                element.type === 'image'
            );
            const hasWebsiteElements = Array.from(this.selectedElements).some(element => 
                element.type === 'website'
            );
            const hasTextElements = Array.from(this.selectedElements).some(element => 
                element.type === 'text'
            );
            const hasMarkdownElements = Array.from(this.selectedElements).some(element => 
                element.type === 'markdown'
            );
            
            // Hide fill color for image/website/text elements, or when gradient is selected for other elements
            const shouldHideFillColor = (hasImageElements || hasWebsiteElements || hasTextElements) && !hasMarkdownElements;
            const finalShouldShow = shouldHideFillColor ? false : shouldShow;
            
            // Find the fill color property group by looking for the "Fill Color" label
            const allPropertyGroups = this.propertiesPanel.querySelectorAll('.sww-property-group');
            
            allPropertyGroups.forEach(group => {
                const label = group.querySelector('.sww-property-label');
                if (label && label.textContent.trim() === 'Fill Color') {
                    group.style.display = finalShouldShow ? 'flex' : 'none';
                }
            });
        }
        
        updateGradientStopsUI() {
            if (!this.propertiesPanel) return;
            
            const container = this.propertiesPanel.querySelector('.sww-gradient-stops-container');
            if (!container) return;
            
            // Clear existing stops
            container.innerHTML = '';
            
            // Get gradient stops from tool settings or selected element
            let gradientStops = this.toolSettings.gradientStops;
            if (this.selectedElements.size === 1) {
                const selectedElement = Array.from(this.selectedElements)[0];
                if (selectedElement.gradientStops) {
                    gradientStops = selectedElement.gradientStops;
                }
            }
            
            // Create UI for each gradient stop
            gradientStops.forEach((stop, index) => {
                const stopElement = this.createGradientStopElement(stop, index);
                container.appendChild(stopElement);
            });
        }
        
        createGradientStopElement(stop, index) {
            const stopDiv = document.createElement('div');
            stopDiv.className = 'sww-gradient-stop';
            
            // Color input
            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.className = 'sww-color-input';
            colorInput.value = stop.color;
            colorInput.addEventListener('change', (e) => {
                this.updateGradientStop(index, 'color', e.target.value);
            });
            
            // Offset input (0-100%)
            const offsetInput = document.createElement('input');
            offsetInput.type = 'number';
            offsetInput.className = 'sww-number-input';
            offsetInput.min = '0';
            offsetInput.max = '100';
            offsetInput.value = stop.offset;
            offsetInput.addEventListener('input', (e) => {
                this.updateGradientStop(index, 'offset', parseInt(e.target.value));
            });
            
            // Offset label
            const offsetLabel = document.createElement('span');
            offsetLabel.className = 'sww-gradient-stop-label';
            offsetLabel.textContent = '%';
            
            // Remove button (only show if more than 2 stops)
            const removeButton = document.createElement('button');
            removeButton.className = 'sww-gradient-remove-stop';
            removeButton.textContent = '×';
            removeButton.addEventListener('click', () => {
                this.removeGradientStop(index);
            });
            
            stopDiv.appendChild(colorInput);
            stopDiv.appendChild(offsetInput);
            stopDiv.appendChild(offsetLabel);
            
            // Only show remove button if we have more than 2 stops
            const gradientStops = this.selectedElements.size === 1 ? 
                Array.from(this.selectedElements)[0].gradientStops || this.toolSettings.gradientStops :
                this.toolSettings.gradientStops;
            
            if (gradientStops.length > 2) {
                stopDiv.appendChild(removeButton);
            }
            
            return stopDiv;
        }
        
        addGradientStop() {
            // Determine which gradient stops to modify
            let gradientStops;
            if (this.selectedElements.size === 1) {
                const selectedElement = Array.from(this.selectedElements)[0];
                if (selectedElement.gradientStops) {
                    gradientStops = [...selectedElement.gradientStops];
                } else {
                    gradientStops = [...this.toolSettings.gradientStops];
                }
            } else {
                gradientStops = [...this.toolSettings.gradientStops];
            }
            
            // Find a good position for the new stop (middle of the largest gap)
            gradientStops.sort((a, b) => a.offset - b.offset);
            let newOffset = 50;
            
            if (gradientStops.length >= 2) {
                let maxGap = 0;
                let maxGapMidpoint = 50;
                
                for (let i = 0; i < gradientStops.length - 1; i++) {
                    const gap = gradientStops[i + 1].offset - gradientStops[i].offset;
                    if (gap > maxGap) {
                        maxGap = gap;
                        maxGapMidpoint = gradientStops[i].offset + gap / 2;
                    }
                }
                
                newOffset = Math.round(maxGapMidpoint);
            }
            
            // Add new stop
            const newStop = {
                offset: newOffset,
                color: '#808080' // Gray as default
            };
            
            gradientStops.push(newStop);
            gradientStops.sort((a, b) => a.offset - b.offset);
            
            // Update tool settings and selected elements
            this.toolSettings.gradientStops = gradientStops;
            if (this.selectedElements.size > 0) {
                this.updateSelectedElementProperty('gradientStops', gradientStops);
            }
            
            // Update UI
            this.updateGradientStopsUI();
        }
        
        removeGradientStop(index) {
            // Don't allow removing if only 2 stops remain
            let gradientStops = this.selectedElements.size === 1 ? 
                Array.from(this.selectedElements)[0].gradientStops || this.toolSettings.gradientStops :
                this.toolSettings.gradientStops;
            
            if (gradientStops.length <= 2) return;
            
            gradientStops = [...gradientStops];
            gradientStops.splice(index, 1);
            
            // Update tool settings and selected elements
            this.toolSettings.gradientStops = gradientStops;
            if (this.selectedElements.size > 0) {
                this.updateSelectedElementProperty('gradientStops', gradientStops);
            }
            
            // Update UI
            this.updateGradientStopsUI();
        }
        
        updateGradientStop(index, property, value) {
            // Get current gradient stops
            let gradientStops = this.selectedElements.size === 1 ? 
                Array.from(this.selectedElements)[0].gradientStops || this.toolSettings.gradientStops :
                this.toolSettings.gradientStops;
            
            gradientStops = [...gradientStops];
            gradientStops[index] = { ...gradientStops[index], [property]: value };
            
            // Sort by offset after updating
            if (property === 'offset') {
                gradientStops.sort((a, b) => a.offset - b.offset);
            }
            
            // Update tool settings and selected elements
            this.toolSettings.gradientStops = gradientStops;
            if (this.selectedElements.size > 0) {
                this.updateSelectedElementProperty('gradientStops', gradientStops);
            }
            
            // Update UI if offset changed (to maintain correct order)
            if (property === 'offset') {
                this.updateGradientStopsUI();
            }
        }
        
        // Text editing
        startTextEditing(element) {
            // Prevent editing in preview mode
            if (this.isPreviewMode) {
                return;
            }
            
            // Create an elegant, seamless text editor
            const textEditor = document.createElement('textarea');
            textEditor.className = 'sww-text-editor-elegant';
            textEditor.value = element.originalText || element.text || '';
            
            // Get accurate screen coordinates using SVG transformation
            let svgPoint, screenPoint;
            
            if (element.width && element.height) {
                // Text has a boundary - position editor to match the boundary
                svgPoint = { x: element.x, y: element.y };
            } else {
                // Text without boundary - use text position with some adjustments for baseline
                const bounds = this.getElementBounds(element);
                svgPoint = { x: bounds.x, y: bounds.y };
            }
            
            // Convert SVG coordinates to screen coordinates
            if (this.svg.getScreenCTM) {
                const matrix = this.svg.getScreenCTM();
                screenPoint = {
                    x: matrix.a * svgPoint.x + matrix.c * svgPoint.y + matrix.e,
                    y: matrix.b * svgPoint.x + matrix.d * svgPoint.y + matrix.f
                };
            } else {
                // Fallback method
                const rect = this.svg.getBoundingClientRect();
                screenPoint = {
                    x: (svgPoint.x - this.viewBox.x) / this.viewBox.width * rect.width + rect.left,
                    y: (svgPoint.y - this.viewBox.y) / this.viewBox.height * rect.height + rect.top
                };
            }
            
            // Calculate editor dimensions
            let editorWidth, editorHeight;
            
            if (element.width && element.height) {
                // Use boundary dimensions
                if (this.svg.getScreenCTM) {
                    const matrix = this.svg.getScreenCTM();
                    editorWidth = Math.abs(element.width * matrix.a);
                    editorHeight = Math.abs(element.height * matrix.d);
                } else {
                    const rect = this.svg.getBoundingClientRect();
                    editorWidth = Math.abs(element.width) / this.viewBox.width * rect.width;
                    editorHeight = Math.abs(element.height) / this.viewBox.height * rect.height;
                }
            } else {
                // Default dimensions for unbounded text
                editorWidth = Math.max(200, element.fontSize * 10);
                editorHeight = element.fontSize * 1.5;
            }
            
            // Apply elegant, seamless styling
            textEditor.style.position = 'fixed';
            textEditor.style.left = `${screenPoint.x}px`;
            textEditor.style.top = `${screenPoint.y}px`;
            textEditor.style.width = `${editorWidth}px`;
            textEditor.style.height = `${editorHeight}px`;
            textEditor.style.fontSize = `${element.fontSize}px`;
            textEditor.style.fontFamily = element.fontFamily;
            
            // Elegant styling - seamless integration
            textEditor.style.border = '2px solid rgba(0, 255, 153, 0.5)'; // Subtle teal border
            textEditor.style.borderRadius = '8px';
            textEditor.style.background = 'rgba(255, 255, 255, 0.95)';
            textEditor.style.backdropFilter = 'blur(8px)';
            textEditor.style.boxShadow = '0 8px 32px rgba(0, 255, 153, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
            
            // Typography and interaction
            textEditor.style.resize = 'none';
            textEditor.style.overflow = 'hidden';
            textEditor.style.whiteSpace = 'pre-wrap';
            textEditor.style.wordWrap = 'break-word';
            textEditor.style.padding = '12px';
            textEditor.style.boxSizing = 'border-box';
            textEditor.style.zIndex = '10000';
            textEditor.style.outline = 'none';
            textEditor.style.color = element.textColor || element.strokeColor || '#333';
            textEditor.style.lineHeight = '1.3';
            
            // Smooth transitions
            textEditor.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
            
            // Set text alignment to match element alignment
            if (element.textAlign) {
                textEditor.style.textAlign = element.textAlign;
            }
            
            // Improved placeholder with helpful hint
            textEditor.placeholder = '✏️ Type your text here... (Ctrl+Enter to save, Esc to cancel)';
            
            document.body.appendChild(textEditor);
            
            // Create keyboard shortcuts hint overlay
            const hintOverlay = document.createElement('div');
            hintOverlay.className = 'sww-text-editor-hint';
            hintOverlay.innerHTML = `
                <div class="sww-text-editor-hint-item">
                    <kbd>Ctrl</kbd>+<kbd>Enter</kbd> <span>Save</span>
                </div>
                <div class="sww-text-editor-hint-separator"></div>
                <div class="sww-text-editor-hint-item">
                    <kbd>Esc</kbd> <span>Cancel</span>
                </div>
                <div class="sww-text-editor-hint-separator"></div>
                <div class="sww-text-editor-hint-item">
                    <kbd>Tab</kbd> <span>Indent</span>
                </div>
            `;
            document.body.appendChild(hintOverlay);
            
            // Create formatting toolbar
            const formatToolbar = this.createTextFormatToolbar(element, textEditor);
            document.body.appendChild(formatToolbar);
            
            // Position toolbar above the text editor
            const positionToolbar = () => {
                const editorRect = textEditor.getBoundingClientRect();
                const toolbarRect = formatToolbar.getBoundingClientRect();
                
                let toolbarLeft = editorRect.left + (editorRect.width / 2) - (toolbarRect.width / 2);
                let toolbarTop = editorRect.top - toolbarRect.height - 10;
                
                // Keep toolbar on screen
                if (toolbarLeft < 10) toolbarLeft = 10;
                if (toolbarLeft + toolbarRect.width > window.innerWidth - 10) {
                    toolbarLeft = window.innerWidth - toolbarRect.width - 10;
                }
                if (toolbarTop < 10) {
                    toolbarTop = editorRect.bottom + 10; // Position below if not enough space above
                }
                
                formatToolbar.style.left = `${toolbarLeft}px`;
                formatToolbar.style.top = `${toolbarTop}px`;
            };
            
            // Add focus styling with animation
            setTimeout(() => {
                textEditor.style.borderColor = 'rgba(0, 255, 153, 0.8)';
                textEditor.style.transform = 'scale(1.02)';
                textEditor.focus();
                textEditor.select();
                positionToolbar();
            }, 50);
            
            let isEditing = true; // Flag to prevent double cleanup
            
            // Declare click-outside handler first
            let handleClickOutside;
            
            const finishEditing = () => {
                if (!isEditing) return; // Prevent double execution
                isEditing = false;
                
                // Smooth exit animation
                textEditor.style.transform = 'scale(0.98)';
                textEditor.style.opacity = '0.8';
                textEditor.style.borderColor = 'rgba(0, 255, 153, 0.3)';
                formatToolbar.style.opacity = '0';
                formatToolbar.style.transform = 'scale(0.9)';
                hintOverlay.style.opacity = '0';
                
                setTimeout(() => {
                    const newText = textEditor.value || 'Text';
                    element.originalText = newText; // Store original text for future wrapping
                    
                    // If element has boundary, adjust text to fit and wrap
                    if (element.width && element.height) {
                        element.text = newText; // Store original first
                        this.adjustTextToFitBounds(element); // Then wrap it
                    } else {
                        element.text = newText;
                    }
                    
                    this.updateSVGElement(element);
                    
                    // Safely remove the elements
                    if (textEditor.parentNode) textEditor.remove();
                    if (formatToolbar.parentNode) formatToolbar.remove();
                    if (hintOverlay.parentNode) hintOverlay.remove();
                    
                    // Clean up click-outside listener
                    if (handleClickOutside) {
                        document.removeEventListener('click', handleClickOutside);
                    }
                    
                    // Update selection handles if element is selected
                    if (this.selectedElements.has(element)) {
                        this.updateSelectionHandles();
                    }
                    
                    // Auto-switch to select tool after text editing for better UX
                    if (this.currentTool === 'text') {
                        this.setTool('select');
                    }
                }, 150); // Small delay for animation
            };
            
            const cancelEditing = () => {
                if (!isEditing) return; // Prevent double execution
                isEditing = false;
                
                // Smooth exit animation for cancel
                textEditor.style.transform = 'scale(0.95)';
                textEditor.style.opacity = '0.5';
                textEditor.style.borderColor = 'rgba(255, 0, 0, 0.3)';
                formatToolbar.style.opacity = '0';
                formatToolbar.style.transform = 'scale(0.9)';
                hintOverlay.style.opacity = '0';
                
                setTimeout(() => {
                    // Safely remove the elements without saving changes
                    if (textEditor.parentNode) textEditor.remove();
                    if (formatToolbar.parentNode) formatToolbar.remove();
                    if (hintOverlay.parentNode) hintOverlay.remove();
                    
                    // Clean up click-outside listener
                    if (handleClickOutside) {
                        document.removeEventListener('click', handleClickOutside);
                    }
                    
                    // Auto-switch to select tool even when canceling for better UX
                    if (this.currentTool === 'text') {
                        this.setTool('select');
                    }
                }, 150);
            };
            
            // Enhanced auto-resize function with smooth animations
            const autoResize = () => {
                if (!textEditor.parentNode) return;
                
                // Only auto-resize for unbounded text elements
                if (!(element.width && element.height)) {
                    // Reset dimensions to get accurate measurements
                    const currentWidth = textEditor.style.width;
                    const currentHeight = textEditor.style.height;
                    
                    textEditor.style.height = 'auto';
                    textEditor.style.width = 'auto';
                    
                    // Calculate required dimensions
                    const content = textEditor.value || textEditor.placeholder || '';
                    const lines = content.split('\n');
                    const maxLineLength = Math.max(...lines.map(line => line.length), 1);
                    
                    // Calculate width based on content with better accuracy
                    const charWidth = element.fontSize * 0.65; // More accurate character width
                    const contentWidth = Math.max(maxLineLength * charWidth + 24, 120); // Padding + minimum
                    const finalWidth = Math.min(contentWidth, 500); // Reasonable maximum
                    
                    // Calculate height based on scroll height
                    const finalHeight = Math.max(textEditor.scrollHeight + 4, element.fontSize * 1.4);
                    
                    // Smooth resize animation
                    textEditor.style.width = currentWidth;
                    textEditor.style.height = currentHeight;
                    
                    // Animate to new size
                    requestAnimationFrame(() => {
                        textEditor.style.width = finalWidth + 'px';
                        textEditor.style.height = finalHeight + 'px';
                        positionToolbar();
                    });
                }
            };
            
            // Enhanced keyboard interactions
            textEditor.addEventListener('keydown', (e) => {
                // Enhanced keyboard shortcuts
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    finishEditing();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelEditing();
                } else if (e.key === 'Tab') {
                    e.preventDefault();
                    // Insert tab character for better formatting
                    const start = textEditor.selectionStart;
                    const end = textEditor.selectionEnd;
                    const value = textEditor.value;
                    textEditor.value = value.substring(0, start) + '    ' + value.substring(end);
                    textEditor.selectionStart = textEditor.selectionEnd = start + 4;
                    autoResize();
                }
            });
            
            // Add input event listener for real-time resizing with debouncing
            let resizeTimeout;
            textEditor.addEventListener('input', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(autoResize, 50); // Debounced resize
            });
            
            textEditor.addEventListener('blur', (e) => {
                // Don't finish editing if clicking on the toolbar
                if (formatToolbar.contains(e.relatedTarget)) {
                    return;
                }
                finishEditing();
            });
            
            // Add click-outside listener for intuitive editing
            handleClickOutside = (e) => {
                // Check if click is outside the textarea and toolbar
                if (!textEditor.contains(e.target) && 
                    !formatToolbar.contains(e.target) && 
                    textEditor.parentNode) {
                    // Don't finish editing if clicking on toolbar buttons or other UI elements
                    const isToolbarClick = e.target.closest('.sww-toolbar') || 
                                         e.target.closest('button') || 
                                         e.target.classList.contains('sww-toolbar-button');
                    
                    if (!isToolbarClick) {
                        finishEditing();
                        // Remove this listener after use
                        document.removeEventListener('click', handleClickOutside);
                    }
                }
            };
            
            // Add the listener with a slight delay to prevent immediate triggering
            setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
            }, 100);
            
            // Fade out hint after a few seconds
            setTimeout(() => {
                if (hintOverlay.parentNode) {
                    hintOverlay.style.opacity = '0';
                    setTimeout(() => {
                        if (hintOverlay.parentNode) hintOverlay.remove();
                    }, 300);
                }
            }, 5000);
            
            // Initial resize to fit existing content
            autoResize();
        }
        
        createTextFormatToolbar(element, textEditor) {
            const toolbar = document.createElement('div');
            toolbar.className = 'sww-text-format-toolbar';
            
            // Font size control
            const fontSizeLabel = document.createElement('span');
            fontSizeLabel.textContent = 'Size:';
            fontSizeLabel.style.color = '#aaa';
            fontSizeLabel.style.fontSize = '12px';
            fontSizeLabel.style.marginRight = '4px';
            
            const fontSizeInput = document.createElement('input');
            fontSizeInput.type = 'number';
            fontSizeInput.value = element.fontSize;
            fontSizeInput.min = '8';
            fontSizeInput.max = '200';
            fontSizeInput.title = 'Font Size';
            
            fontSizeInput.addEventListener('change', () => {
                const newSize = parseInt(fontSizeInput.value);
                if (newSize >= 8 && newSize <= 200) {
                    element.fontSize = newSize;
                    textEditor.style.fontSize = newSize + 'px';
                    this.updateSVGElement(element);
                }
            });
            
            // Divider
            const divider1 = document.createElement('div');
            divider1.className = 'sww-text-format-toolbar-divider';
            
            // Alignment buttons
            const alignLeft = document.createElement('button');
            alignLeft.innerHTML = '<i class="fas fa-align-left"></i>';
            alignLeft.title = 'Align Left';
            alignLeft.addEventListener('click', () => {
                element.textAlign = 'left';
                textEditor.style.textAlign = 'left';
                this.updateSVGElement(element);
            });
            
            const alignCenter = document.createElement('button');
            alignCenter.innerHTML = '<i class="fas fa-align-center"></i>';
            alignCenter.title = 'Align Center';
            alignCenter.addEventListener('click', () => {
                element.textAlign = 'center';
                textEditor.style.textAlign = 'center';
                this.updateSVGElement(element);
            });
            
            const alignRight = document.createElement('button');
            alignRight.innerHTML = '<i class="fas fa-align-right"></i>';
            alignRight.title = 'Align Right';
            alignRight.addEventListener('click', () => {
                element.textAlign = 'right';
                textEditor.style.textAlign = 'right';
                this.updateSVGElement(element);
            });
            
            // Divider
            const divider2 = document.createElement('div');
            divider2.className = 'sww-text-format-toolbar-divider';
            
            // Color picker
            const colorLabel = document.createElement('span');
            colorLabel.textContent = 'Color:';
            colorLabel.style.color = '#aaa';
            colorLabel.style.fontSize = '12px';
            colorLabel.style.marginRight = '4px';
            
            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.value = element.textColor || element.strokeColor || '#000000';
            colorInput.title = 'Text Color';
            
            colorInput.addEventListener('change', () => {
                element.textColor = colorInput.value;
                textEditor.style.color = colorInput.value;
                this.updateSVGElement(element);
            });
            
            // Assemble toolbar
            toolbar.appendChild(fontSizeLabel);
            toolbar.appendChild(fontSizeInput);
            toolbar.appendChild(divider1);
            toolbar.appendChild(alignLeft);
            toolbar.appendChild(alignCenter);
            toolbar.appendChild(alignRight);
            toolbar.appendChild(divider2);
            toolbar.appendChild(colorLabel);
            toolbar.appendChild(colorInput);
            
            return toolbar;
        }
        
        // Utility methods
        generateId() {
            return 'sww-' + Math.random().toString(36).substr(2, 9);
        }
        
        getElementById(elementId) {
            return this.elements.find(element => element.id === elementId) || null;
        }
        
        toggleElementVisibility(elementId) {
            const element = this.getElementById(elementId);
            if (element) {
                element.hidden = !element.hidden;
                
                // Update the SVG element visibility
                if (element.svgElement) {
                    element.svgElement.style.display = element.hidden ? 'none' : '';
                }
                
                // Trigger an optimized render update
                this.performOptimizedRender();
                return true;
            }
            return false;
        }
        
        selectElementById(elementId) {
            const element = this.getElementById(elementId);
            if (element) {
                this.clearSelection();
                this.selectElement(element);
                return true;
            }
            return false;
        }
        
        deleteElementById(elementId) {
            const element = this.getElementById(elementId);
            if (element) {
                this.clearSelection();
                this.selectElement(element);
                this.deleteSelectedElements();
                return true;
            }
            return false;
        }
        
        snapToGridPoint(point) {
            if (!this.snapToGrid) return point;
            
            const gridSize = this.options.gridSize;
            return {
                x: Math.round(point.x / gridSize) * gridSize,
                y: Math.round(point.y / gridSize) * gridSize
            };
        }
        
        snapToGridValue(value) {
            if (!this.snapToGrid) return value;
            
            const gridSize = this.options.gridSize;
            return Math.round(value / gridSize) * gridSize;
        }
        
        toggleGridSnap() {
            this.snapToGrid = !this.snapToGrid;
            return this.snapToGrid;
        }
        
        toggleGridSnapButton() {
            const isSnapping = this.toggleGridSnap();
            const button = this.container.querySelector('[data-action="snap-grid"]');
            if (button) {
                if (isSnapping) {
                    button.classList.add('active');
                    button.title = 'Grid Snap: ON (Click to disable)';
                } else {
                    button.classList.remove('active');
                    button.title = 'Grid Snap: OFF (Click to enable)';
                }
            }
            
            // Show/hide grid based on snap state
            this.updateGridVisibility();
        }
        
        updateGridVisibility() {
            if (this.snapToGrid) {
                this.showGrid();
            } else {
                this.hideGrid();
            }
        }
        
        showGrid() {
            if (!this.gridRect && !this.gridDefs && !this.gridPattern) {
                this.createGrid();
            } else if (this.gridRect && this.gridDefs) {
                this.gridRect.style.display = 'block';
                this.gridDefs.style.display = 'block';
            }
        }
        
        hideGrid() {
            if (this.gridRect) {
                this.gridRect.style.display = 'none';
            }
            if (this.gridDefs) {
                this.gridDefs.style.display = 'none';
            }
        }
        
        // Public API methods
        setTool(toolName) {
            this.currentTool = toolName;
            
            // Update toolbar buttons - only target tool buttons, not action buttons
            this.container.querySelectorAll('.sww-tool-button[data-tool]').forEach(button => {
                button.classList.remove('active');
                if (button.getAttribute('data-tool') === toolName) {
                    button.classList.add('active');
                }
            });
            
            // Update element tool buttons in the control panel
            document.querySelectorAll('.sww-action-button').forEach(button => {
                const onclick = button.getAttribute('onclick');
                if (onclick && onclick.includes('setTool(')) {
                    // Extract tool name from onclick attribute like "swwInstance.setTool('rectangle')"
                    const match = onclick.match(/setTool\(['"](.*?)['"]\)/);
                    if (match && match[1] === toolName) {
                        button.classList.add('active');
                    } else {
                        button.classList.remove('active');
                    }
                }
            });
            
            // Update cursor
            this.setCursor(toolName === 'select' ? 'default' : 'crosshair');
        }
        
        getScene() {
            return {
                elements: this.elements.map(element => ({
                    id: element.id,
                    type: element.type,
                    x: element.x,
                    y: element.y,
                    width: element.width,
                    height: element.height,
                    strokeColor: element.strokeColor,
                    strokeWidth: element.strokeWidth,
                    fillColor: element.fillColor,
                    fillStyle: element.fillStyle,
                    opacity: element.opacity,
                    fontSize: element.fontSize,
                    fontFamily: element.fontFamily,
                    rotation: element.rotation,
                    text: element.text,
                    points: element.points
                })),
                viewBox: { ...this.viewBox },
                zoom: this.zoom
            };
        }
        
        loadScene(sceneData) {
            this.clearAll();
            
            if (sceneData.viewBox) {
                this.viewBox = { ...sceneData.viewBox };
                this.updateViewBox();
            }
            
            if (sceneData.zoom) {
                this.zoom = sceneData.zoom;
            }
            
            if (sceneData.elements) {
                sceneData.elements.forEach(elementData => {
                    const element = { ...elementData };
                    element.svgElement = this.createSVGElement(element);
                    this.elements.push(element);
                    this.addSVGElementToDOM(element);
                });
            }
        }
        
        exportToSVG() {
            const clonedSVG = this.svg.cloneNode(true);
            
            // Remove UI elements
            clonedSVG.querySelector('.sww-selection')?.remove();
            
            // Create blob and download
            const svgData = new XMLSerializer().serializeToString(clonedSVG);
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = 'sww-drawing.svg';
            link.click();
            
            URL.revokeObjectURL(url);
            
            return svgData;
        }
        
        exportToPNG() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            const svgData = this.exportToSVG();
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob((blob) => {
                    const pngUrl = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = pngUrl;
                    link.download = 'sww-drawing.png';
                    link.click();
                    
                    URL.revokeObjectURL(url);
                    URL.revokeObjectURL(pngUrl);
                });
            };
            
            img.src = url;
        }
        
        // Lock/Unlock functionality
        toggleLockSelected() {
            if (this.selectedElements.size === 0) return;
            
            // Check if any elements are unlocked
            const hasUnlocked = Array.from(this.selectedElements).some(element => !element.locked);
            
            // If any are unlocked, lock all. If all are locked, unlock all.
            const shouldLock = hasUnlocked;
            
            this.selectedElements.forEach(element => {
                element.locked = shouldLock;
                // Update visual indication using CSS classes
                const currentClass = element.svgElement.getAttribute('class') || '';
                if (element.locked) {
                    if (!currentClass.includes('sww-locked')) {
                        element.svgElement.setAttribute('class', currentClass + ' sww-locked');
                    }
                } else {
                    element.svgElement.setAttribute('class', currentClass.replace('sww-locked', '').trim());
                }
            });
            
            // Update lock button state
            const lockButton = this.container.querySelector('[data-action="lock"]');
            if (lockButton) {
                const icon = lockButton.querySelector('i');
                if (shouldLock) {
                    icon.className = 'fas fa-lock';
                    lockButton.title = 'Unlock Selected';
                    lockButton.classList.add('active');
                } else {
                    icon.className = 'fas fa-unlock';
                    lockButton.title = 'Lock Selected';
                    lockButton.classList.remove('active');
                }
            }
        }
        
        // Group functionality
        groupSelected() {
            if (this.selectedElements.size < 2) return;
            
            this.saveStateToHistory('groupElements');
            
            const groupId = this.generateId();
            
            this.selectedElements.forEach(element => {
                element.groupId = groupId;
            });
        }
        
        ungroupSelected() {
            if (this.selectedElements.size === 0) return;
            
            this.saveStateToHistory('ungroupElements');
            
            this.selectedElements.forEach(element => {
                if (element.groupId) {
                    // Find all elements in the same group
                    const groupElements = this.elements.filter(el => el.groupId === element.groupId);
                    
                    // Remove group from all elements in the group
                    groupElements.forEach(groupEl => {
                        groupEl.groupId = null;
                    });
                }
            });
        }
        
        // Zoom functionality
        zoomIn() {
            const zoomFactor = 1.1;
            this.zoom *= zoomFactor;
            this.zoom = Math.max(0.1, Math.min(5, this.zoom));
            
            // Center zoom
            const centerX = this.viewBox.x + this.viewBox.width / 2;
            const centerY = this.viewBox.y + this.viewBox.height / 2;
            
            const newWidth = this.viewBox.width / zoomFactor;
            const newHeight = this.viewBox.height / zoomFactor;
            
            this.viewBox.x = centerX - newWidth / 2;
            this.viewBox.y = centerY - newHeight / 2;
            this.viewBox.width = newWidth;
            this.viewBox.height = newHeight;
            
            this.updateViewBox();
            
            // Update visible elements for performance
            if (this.elements.length > 100) {
                this.updateVisibleElements();
            }
        }
        
        zoomOut() {
            const zoomFactor = 0.9;
            this.zoom *= zoomFactor;
            this.zoom = Math.max(0.1, Math.min(5, this.zoom));
            
            // Center zoom
            const centerX = this.viewBox.x + this.viewBox.width / 2;
            const centerY = this.viewBox.y + this.viewBox.height / 2;
            
            const newWidth = this.viewBox.width / zoomFactor;
            const newHeight = this.viewBox.height / zoomFactor;
            
            this.viewBox.x = centerX - newWidth / 2;
            this.viewBox.y = centerY - newHeight / 2;
            this.viewBox.width = newWidth;
            this.viewBox.height = newHeight;
            
            this.updateViewBox();
            
            // Update visible elements for performance
            if (this.elements.length > 100) {
                this.updateVisibleElements();
            }
        }
        
        resetZoom() {
            this.zoom = 1;
            this.viewBox = { x: 0, y: 0, width: 1000, height: 1000 };
            this.updateViewBox();
            
            // Update visible elements for performance
            if (this.elements.length > 100) {
                this.updateVisibleElements();
            }
        }
        
        toggleGrid() {
            this.options.showGrid = !this.options.showGrid;
            // Also toggle grid snapping when toggling grid visibility
            this.snapToGrid = this.options.showGrid;
            
            if (this.options.showGrid) {
                this.showGrid();
            } else {
                this.hideGrid();
            }
            
            // Update toggle grid button visual state
            this.updateGridButtonState();
            
            return this.options.showGrid;
        }
        
        updateGridButtonState() {
            // Find the toggle grid button and update its active state
            const gridButton = document.querySelector('#toggle-grid-btn');
            if (gridButton) {
                if (this.options.showGrid) {
                    gridButton.classList.add('active');
                } else {
                    gridButton.classList.remove('active');
                }
            }
        }
        
        // Layer ordering methods
        bringSelectedToFront() {
            this.bringToFront();
        }
        
        sendSelectedToBack() {
            this.sendToBack();
        }
        
        clearAll() {
            this.saveStateToHistory('clearAll');
            this.elements = [];
            this.selectedElements.clear();
            this.elementsGroup.innerHTML = '';
            this.clearSelectionHandles();
            this.updateTextPropertiesVisibility();
            
            // Clear the spatial index to prevent ghost element detection
            if (this.spatialIndex) {
                this.spatialIndex.clear();
            }
        }
        
        // Preview Mode functionality
        enterPreviewMode() {
            if (this.isPreviewMode) return;
            
            this.isPreviewMode = true;
            this.previewModeOriginalTool = this.currentTool;
            
            // Clear selection and set to select tool
            this.clearSelection();
            this.setTool('select');
            
            // Store original states
            this.previewModeOriginalViewBox = { ...this.viewBox };
            this.previewModeOriginalZoom = this.zoom;
            
            // Calculate bounds of all elements to fit canvas optimally
            this.fitCanvasToElements();
            
            // Lock all elements (disable editing)
            this.lockAllElements();
            
            // Add ESC key listener - only if not in readOnly mode
            if (!this.options.readOnly) {
                this.previewModeKeyHandler = (e) => {
                    if (e.key === 'Escape') {
                        this.exitPreviewMode();
                    }
                };
                document.addEventListener('keydown', this.previewModeKeyHandler);
                
                // Add fullscreen change listener to handle browser ESC
                this.fullscreenChangeHandler = (e) => {
                    if (e.key === 'Escape' && this.isPreviewMode) {
                        this.exitPreviewMode();
                    }
                };
                document.addEventListener('keydown', this.fullscreenChangeHandler);
            }
            
            // Enable browser-frame fullscreen (not native fullscreen)
            this.enableBrowserFrameFullscreen();
            
            // Dispatch preview mode event
            this.container.dispatchEvent(new CustomEvent('previewModeEntered'));
            
            // Update button state
            this.updatePreviewButtonState();
        }
        
        exitPreviewMode() {
            if (!this.isPreviewMode) return;
            
            this.isPreviewMode = false;
            
            // Disable browser-frame fullscreen
            this.disableBrowserFrameFullscreen();
            
            // Remove ESC key listener
            if (this.previewModeKeyHandler) {
                document.removeEventListener('keydown', this.previewModeKeyHandler);
                this.previewModeKeyHandler = null;
            }
            
            // Remove fullscreen change listeners
            if (this.fullscreenChangeHandler) {
                document.removeEventListener('keydown', this.fullscreenChangeHandler);
                this.fullscreenChangeHandler = null;
            }
            
            // Restore original tool
            if (this.previewModeOriginalTool) {
                this.setTool(this.previewModeOriginalTool);
            }
            
            // Restore original view
            if (this.previewModeOriginalViewBox) {
                this.viewBox = { ...this.previewModeOriginalViewBox };
                this.zoom = this.previewModeOriginalZoom;
                this.updateViewBox();
            }
            
            // Unlock all elements
            this.unlockAllElements();
            
            setTimeout(() => {
                if (this.isBrowserFrameFullscreen) {
                    this.disableBrowserFrameFullscreen();
                }
                
                // Reset container styles if needed
                this.container.style.position = '';
                this.container.style.top = '';
                this.container.style.left = '';
                this.container.style.width = '';
                this.container.style.height = '';
                this.container.style.zIndex = '';
                this.container.style.background = '';
            }, 100);
            
            // Dispatch preview mode event
            this.container.dispatchEvent(new CustomEvent('previewModeExited'));
            
            // Update button state
            this.updatePreviewButtonState();
        }
        
        fitCanvasToElements() {
            if (this.elements.length === 0) return;
            
            // Calculate bounds of only visible elements (not hidden ones)
            const visibleElements = this.elements.filter(element => element.visible !== false);
            if (visibleElements.length === 0) return; // No visible elements to fit
            
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            
            visibleElements.forEach(element => {
                const bounds = this.getElementBounds(element);
                minX = Math.min(minX, bounds.x);
                minY = Math.min(minY, bounds.y);
                maxX = Math.max(maxX, bounds.x + bounds.width);
                maxY = Math.max(maxY, bounds.y + bounds.height);
            });
            
            // Add padding
            const padding = 50;
            minX -= padding;
            minY -= padding;
            maxX += padding;
            maxY += padding;
            
            // Calculate aspect ratio and fit to container
            const containerRect = this.container.getBoundingClientRect();
            const contentWidth = maxX - minX;
            const contentHeight = maxY - minY;
            const containerAspect = containerRect.width / containerRect.height;
            const contentAspect = contentWidth / contentHeight;
            
            if (contentAspect > containerAspect) {
                // Content is wider, fit to width
                this.viewBox.width = contentWidth;
                this.viewBox.height = contentWidth / containerAspect;
                this.viewBox.x = minX;
                this.viewBox.y = minY - (this.viewBox.height - contentHeight) / 2;
            } else {
                // Content is taller, fit to height
                this.viewBox.height = contentHeight;
                this.viewBox.width = contentHeight * containerAspect;
                this.viewBox.x = minX - (this.viewBox.width - contentWidth) / 2;
                this.viewBox.y = minY;
            }
            
            this.updateViewBox();
        }
        
        lockAllElements() {
            this.previewModeLockedElements = [];
            this.elements.forEach(element => {
                if (!element.locked) {
                    element.locked = true;
                    this.previewModeLockedElements.push(element.id);
                }
            });
        }
        
        enablePseudoFullscreen() {
            // Add pseudo-fullscreen class to body for styling
            document.body.classList.add('sww-pseudo-fullscreen');
            this.isPseudoFullscreen = true;
        }
        
        disablePseudoFullscreen() {
            document.body.classList.remove('sww-pseudo-fullscreen');
            this.isPseudoFullscreen = false;
            
            // Force style reset on body
            document.body.style.background = '';
            document.body.style.overflow = '';
            
            // Reset any styles on the editor container
            const editorContainer = document.querySelector('.sww-editor-container');
            if (editorContainer) {
                editorContainer.style.position = '';
                editorContainer.style.top = '';
                editorContainer.style.left = '';
                editorContainer.style.width = '';
                editorContainer.style.height = '';
                editorContainer.style.zIndex = '';
                editorContainer.style.background = '';
            }
        }
        
        enableBrowserFrameFullscreen() {
            // Add browser-frame fullscreen class to body for styling
            document.body.classList.add('sww-browser-fullscreen');
            this.isBrowserFrameFullscreen = true;
        }
        
        disableBrowserFrameFullscreen() {
            document.body.classList.remove('sww-browser-fullscreen');
            this.isBrowserFrameFullscreen = false;
            
            // Force style reset on body
            document.body.style.background = '';
            document.body.style.overflow = '';
            
            // Reset any styles on the editor container
            const editorContainer = document.querySelector('.sww-editor-container');
            if (editorContainer) {
                editorContainer.style.position = '';
                editorContainer.style.top = '';
                editorContainer.style.left = '';
                editorContainer.style.width = '';
                editorContainer.style.height = '';
                editorContainer.style.zIndex = '';
                editorContainer.style.background = '';
            }
        }
        
        unlockAllElements() {
            if (this.previewModeLockedElements) {
                this.elements.forEach(element => {
                    if (this.previewModeLockedElements.includes(element.id)) {
                        element.locked = false;
                    }
                });
                this.previewModeLockedElements = [];
            }
        }
        
        // Toggle preview mode
        togglePreviewMode() {
            // In readOnly mode, prevent exiting preview mode
            if (this.isPreviewMode && this.options.readOnly) {
                return; // Do nothing - stay in preview mode
            }
            
            if (this.isPreviewMode) {
                this.exitPreviewMode();
            } else {
                this.enterPreviewMode();
            }
            
            this.updatePreviewButtonState();
        }
        
        updatePreviewButtonState() {
            // Find the preview button and update its active state
            const previewButtons = document.querySelectorAll('button[onclick*="togglePreviewMode"]');
            previewButtons.forEach(button => {
                if (this.isPreviewMode) {
                    button.classList.add('active');
                    button.title = 'Exit Preview Mode';
                    const icon = button.querySelector('i');
                    if (icon) {
                        icon.className = 'fas fa-times';
                    }
                } else {
                    button.classList.remove('active');
                    button.title = 'Preview Mode';
                    const icon = button.querySelector('i');
                    if (icon) {
                        icon.className = 'far fa-window-maximize';
                    }
                }
            });
        }
        
        // Undo/Redo History Management
        saveStateToHistory(actionType, beforeState = null) {
            if (this.isPerformingHistoryAction) return;
            if (!this.elements) return;
            
            const maxSize = this.elements.length > 500 ? 20 : this.maxHistorySize;
            
            // Create optimized state copy - only store essential data
            const currentState = {
                elements: this.elements.map(el => ({
                    id: el.id,
                    type: el.type,
                    x: el.x,
                    y: el.y,
                    width: el.width,
                    height: el.height,
                    strokeColor: el.strokeColor,
                    strokeWidth: el.strokeWidth,
                    fillColor: el.fillColor,
                    fillStyle: el.fillStyle,
                    opacity: el.opacity,
                    fontSize: el.fontSize,
                    fontFamily: el.fontFamily,
                    textAlign: el.textAlign,
                    textColor: el.textColor,
                    text: el.text,
                    points: el.points,
                    url: el.url,
                    imageUrl: el.imageUrl,
                    markdown: el.markdown,
                    // Only store properties that change from defaults
                    ...(el.rotation !== 0 && { rotation: el.rotation }),
                    ...(el.locked && { locked: el.locked }),
                    ...(el.groupId && { groupId: el.groupId })
                })),
                selectedElements: Array.from(this.selectedElements).map(el => el.id),
                actionType: actionType,
                timestamp: Date.now()
            };
            
            // If beforeState is provided, use it as the previous state
            if (beforeState) {
                currentState.beforeState = beforeState;
            }
            
            // Remove any history beyond current index (when undoing then making new changes)
            this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
            
            // Add new state to history
            this.historyStack.push(currentState);
            this.historyIndex = this.historyStack.length - 1;
            
            // Limit history size
            if (this.historyStack.length > maxSize) {
                this.historyStack.shift();
                this.historyIndex--;
            }
            
            this.updateHistoryButtons();
        }
        
        undo() {
            if (this.historyIndex <= 0) {
                return;
            }
            
            this.isPerformingHistoryAction = true;
            this.historyIndex--;
            
            const previousState = this.historyStack[this.historyIndex];
            this.restoreState(previousState);
            
            this.isPerformingHistoryAction = false;
            this.updateHistoryButtons();
        }
        
        redo() {
            if (this.historyIndex >= this.historyStack.length - 1) {
                return;
            }
            
            this.isPerformingHistoryAction = true;
            this.historyIndex++;
            
            const nextState = this.historyStack[this.historyIndex];
            console.log(`Restoring state with ${nextState.elements.length} elements`);
            this.restoreState(nextState);
            
            this.isPerformingHistoryAction = false;
            this.updateHistoryButtons();
        }
        
        restoreState(state) {
            // Clear current state
            this.elements = [];
            this.selectedElements.clear();
            this.elementsGroup.innerHTML = '';
            this.spatialIndex.clear();
            
            // Restore elements with proper data structure
            this.elements = state.elements.map(elementData => {
                // Create a complete element object with all properties
                const element = {
                    id: elementData.id,
                    type: elementData.type,
                    x: elementData.x,
                    y: elementData.y,
                    width: elementData.width,
                    height: elementData.height,
                    strokeColor: elementData.strokeColor,
                    strokeWidth: elementData.strokeWidth,
                    fillColor: elementData.fillColor,
                    fillStyle: elementData.fillStyle,
                    opacity: elementData.opacity,
                    fontSize: elementData.fontSize,
                    fontFamily: elementData.fontFamily,
                    textAlign: elementData.textAlign,
                    textColor: elementData.textColor,
                    text: elementData.text,
                    points: elementData.points,
                    url: elementData.url,
                    imageUrl: elementData.imageUrl,
                    markdown: elementData.markdown,
                    rotation: elementData.rotation || 0,
                    locked: elementData.locked || false,
                    groupId: elementData.groupId || null
                };
                
                return element;
            });
            
            // Recreate SVG elements and add them to the DOM with spatial index
            this.elements.forEach(element => {
                const svgElement = this.createSVGElement(element);
                element.svgElement = svgElement;
                this.addSVGElementToDOM(element);
                
                // Add to spatial index
                const bounds = this.getElementBounds(element);
                this.spatialIndex.insert(element, bounds);
            });
            
            // Restore selection based on element IDs
            this.selectedElements.clear();
            if (state.selectedElements && state.selectedElements.length > 0) {
                state.selectedElements.forEach(elementId => {
                    const element = this.elements.find(el => el.id === elementId);
                    if (element) {
                        this.selectedElements.add(element);
                    }
                });
            }
            
            // Update UI with performance optimization
            this.updateSelectionHandles();
            this.syncPropertiesPanel();
            this.updateTextPropertiesVisibility();
            
            // Update visible elements for performance
            if (this.elements.length > 100) {
                this.updateVisibleElements();
            }
        }
        
        updateHistoryButtons() {
            const undoBtn = this.container.querySelector('[data-action="undo"]');
            const redoBtn = this.container.querySelector('[data-action="redo"]');
            
            if (undoBtn) {
                // Can undo if we have history and historyIndex > 0 (can go back to previous states)
                undoBtn.disabled = this.historyStack.length <= 1 || this.historyIndex <= 0;
                undoBtn.style.opacity = (this.historyStack.length <= 1 || this.historyIndex <= 0) ? '0.5' : '1';
            }
            
            if (redoBtn) {
                redoBtn.disabled = this.historyIndex >= this.historyStack.length - 1;
                redoBtn.style.opacity = this.historyIndex >= this.historyStack.length - 1 ? '0.5' : '1';
            }
        }
        
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
        }
        
        // Notification system for user feedback
        showNotification(message, type = 'info', duration = 2000) {
            // Remove any existing notifications
            const existingNotification = this.container.querySelector('.sww-notification');
            if (existingNotification) {
                existingNotification.remove();
            }
            
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `sww-notification sww-notification-${type}`;
            notification.textContent = message;
            
            // Add notification styles
            Object.assign(notification.style, {
                position: 'absolute',
                top: '20px',
                right: '20px',
                padding: '12px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                zIndex: '10000',
                pointerEvents: 'none',
                transform: 'translateY(-10px)',
                opacity: '0',
                transition: 'all 0.3s ease',
                maxWidth: '300px',
                wordWrap: 'break-word'
            });
            
            // Set colors based on type
            switch (type) {
                case 'copy':
                    notification.style.backgroundColor = '#e3f2fd';
                    notification.style.color = '#1976d2';
                    notification.style.border = '1px solid #bbdefb';
                    break;
                case 'paste':
                    notification.style.backgroundColor = '#e8f5e8';
                    notification.style.color = '#2e7d32';
                    notification.style.border = '1px solid #c8e6c9';
                    break;
                case 'warning':
                    notification.style.backgroundColor = '#fff3e0';
                    notification.style.color = '#f57c00';
                    notification.style.border = '1px solid #ffcc02';
                    break;
                default:
                    notification.style.backgroundColor = '#f5f5f5';
                    notification.style.color = '#333';
                    notification.style.border = '1px solid #ddd';
            }
            
            // Add to container
            this.container.appendChild(notification);
            
            // Animate in
            requestAnimationFrame(() => {
                notification.style.transform = 'translateY(0)';
                notification.style.opacity = '1';
            });
            
            // Auto remove after duration
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.transform = 'translateY(-10px)';
                    notification.style.opacity = '0';
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.remove();
                        }
                    }, 300);
                }
            }, duration);
        }
        
        cleanup() {
            // Clean up all elements
            this.elements.forEach(element => {
                this.cleanupElement(element);
            });
            
            // Clear collections
            this.elements = [];
            this.selectedElements.clear();
            this.visibleElements.clear();
            this.spatialIndex.clear();
            
            // Clear DOM
            if (this.elementsGroup) {
                this.elementsGroup.innerHTML = '';
            }
            if (this.selectionGroup) {
                this.selectionGroup.innerHTML = '';
            }
            
            // Clear history
            this.historyStack = [];
            this.historyIndex = -1;
        }
    }

    /**
     * SWWControlPanel - Control panel management for SWW
     * Handles menu navigation, layer management, and UI updates
     */
    class SWWControlPanel {
        constructor(swwInstance) {
            this.instance = swwInstance;
            this.currentMenu = 'elements';
            this.layers = [];
            this.selectedLayers = new Set();
            
            this.init();
        }
        
        init() {
            this.setupMenuNavigation();
            this.showCurrentMenu();
            // Remove automatic layer updates - we'll update only when needed
            // this.startLayerUpdates();
        }
        
        setupMenuNavigation() {
            const menuButtons = document.querySelectorAll('.sww-control-menu-button');
            menuButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const menuName = button.getAttribute('data-menu');
                    this.switchMenu(menuName);
                });
            });
        }
        
        switchMenu(menuName) {
            // Update active button
            document.querySelectorAll('.sww-control-menu-button').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`[data-menu="${menuName}"]`).classList.add('active');
            
            // Hide all sections
            document.querySelectorAll('.sww-control-section').forEach(section => {
                section.style.display = 'none';
            });
            
            // Show selected section
            const targetSection = document.getElementById(`sww-${menuName}-section`);
            if (targetSection) {
                targetSection.style.display = 'block';
            }
            
            this.currentMenu = menuName;
            
            // Update content based on menu
            if (menuName === 'layers') {
                this.updateLayersDisplay();
            }
        }
        
        showCurrentMenu() {
            this.switchMenu(this.currentMenu);
        }
        
        startLayerUpdates() {
            // Disabled automatic layer updates to prevent constant refreshing
            // Layers will be updated only when elements are added, removed, or modified
            // setInterval(() => this.updateLayers(), 1000);
        }
        
        updateLayers() {
            if (!this.instance) return;
            
            const scene = this.instance.getScene();
            this.layers = scene.elements.map((element, index) => ({
                ...element,
                index: index
                // Don't override the visible property - keep the actual element state
            })).reverse();
            
            if (this.currentMenu === 'layers') {
                this.updateLayersDisplay();
            }
        }
        
        updateLayersDisplay() {
            const layersList = document.getElementById('sww-layers-list');
            const layerCount = document.getElementById('layer-count');
            const noLayersMessage = document.getElementById('no-layers-message');
            
            if (!layersList) return;
            
            // Update layer count
            if (layerCount) {
                layerCount.textContent = this.layers.length;
            }
            
            // Clear existing layers except the no-layers message
            Array.from(layersList.children).forEach(child => {
                if (child.id !== 'no-layers-message') {
                    child.remove();
                }
            });
            
            if (this.layers.length === 0) {
                if (noLayersMessage) {
                    noLayersMessage.style.display = 'block';
                }
                return;
            }
            
            if (noLayersMessage) {
                noLayersMessage.style.display = 'none';
            }
            
            // Create layer items
            this.layers.forEach(layer => {
                const layerItem = this.createLayerItem(layer);
                layersList.appendChild(layerItem);
            });
        }
        
        createLayerItem(layer) {
            const layerItem = document.createElement('div');
            layerItem.className = 'sww-layer-item';
            
            // Get the actual element from the instance to ensure we have the current state
            const actualElement = this.instance.elements.find(el => el.id === layer.id);
            const currentLayer = actualElement || layer; // Use actual element if found, fallback to layer
            
            // Debug: Log the actual states to console
            if (window.SWW_DEBUG) {
                console.log(`Layer ${currentLayer.id}: visible=${currentLayer.visible}, locked=${currentLayer.locked}`);
            }
            
            // Add classes based on state
            if (this.isLayerSelected(currentLayer.id)) {
                layerItem.classList.add('selected');
            }
            if (currentLayer.locked) {
                layerItem.classList.add('locked');
            }
            
            // Add event listeners
            layerItem.addEventListener('click', () => {
                this.toggleLayerSelection(layer.id);
            });
            
            layerItem.addEventListener('dblclick', () => {
                this.focusOnLayer(layer.id);
            });
            
            // Create layer controls
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'sww-layer-controls';
            
            // Visibility button
            const visibilityBtn = document.createElement('button');
            visibilityBtn.className = 'sww-layer-control-btn';
            const isVisible = currentLayer.visible !== false; // Default to visible if not explicitly set to false
            
            visibilityBtn.classList.add(isVisible ? 'active' : 'inactive');
            visibilityBtn.title = isVisible ? 'Hide Element' : 'Show Element';
            visibilityBtn.innerHTML = `<i class="${isVisible ? 'fas fa-eye' : 'fas fa-eye-slash'}"></i>`;
            visibilityBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleLayerVisibility(currentLayer.id);
            });
            
            // Lock button
            const lockBtn = document.createElement('button');
            lockBtn.className = 'sww-layer-control-btn';
            const isLocked = currentLayer.locked === true; // Explicit check for locked state
            lockBtn.classList.add(isLocked ? 'active' : 'inactive');
            lockBtn.title = isLocked ? 'Unlock Element' : 'Lock Element';
            lockBtn.innerHTML = `<i class="${isLocked ? 'fas fa-lock' : 'fas fa-unlock'}"></i>`;
            lockBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleLayerLock(currentLayer.id);
            });
            
            controlsDiv.appendChild(visibilityBtn);
            controlsDiv.appendChild(lockBtn);
            
            // Create layer icon
            const iconDiv = document.createElement('div');
            iconDiv.className = 'sww-layer-icon';
            iconDiv.innerHTML = `<i class="${this.getLayerIcon(layer.type)}"></i>`;
            
            // Create layer name
            const nameDiv = document.createElement('div');
            nameDiv.className = 'sww-layer-name';
            nameDiv.textContent = this.getLayerName(currentLayer);
            
            // Assemble layer item
            layerItem.appendChild(controlsDiv);
            layerItem.appendChild(iconDiv);
            layerItem.appendChild(nameDiv);
            
            return layerItem;
        }
        
        updateDemoSection() {
            const demoSection = document.getElementById('sww-demo-section');
            if (!demoSection) return;
            
            demoSection.innerHTML = `
                <!-- Quick Actions -->
                <div class="sww-section">
                    <h3><i class="fas fa-palette"></i> Quick Actions</h3>
                    <button class="sww-action-button" onclick="createSampleDrawing()">
                        <i class="fas fa-magic"></i> Create Sample
                    </button>
                    <button class="sww-action-button" onclick="clearCanvas()">
                        <i class="fas fa-eraser"></i> Clear Canvas
                    </button>
                    <button class="sww-action-button" onclick="selectAllObjects()">
                        <i class="fas fa-check-double"></i> Select All
                    </button>
                    <button class="sww-action-button" onclick="randomizeColors()">
                        <i class="fas fa-random"></i> Random Colors
                    </button>
                </div>

                <!-- History Actions -->
                <div class="sww-section">
                    <h3><i class="fas fa-history"></i> Undo/Redo</h3>
                    <button class="sww-action-button" onclick="undoAction()">
                        <i class="fas fa-undo"></i> Undo
                    </button>
                    <button class="sww-action-button" onclick="redoAction()">
                        <i class="fas fa-redo"></i> Redo
                    </button>
                </div>

                <!-- Scene Info -->
                <div class="sww-section">
                    <h3><i class="fas fa-info-circle"></i> Scene Info</h3>
                    <div id="sww-scene-info" class="sww-info-text">
                        Loading scene info...
                    </div>
                </div>
            `;
        }
        
        // Helper methods
        isLayerSelected(layerId) {
            return this.instance && 
                   this.instance.selectedElements && 
                   Array.from(this.instance.selectedElements).some(el => el.id === layerId);
        }
        
        toggleLayerSelection(layerId) {
            if (!this.instance) return;
            
            const element = this.instance.elements.find(el => el.id === layerId);
            if (!element) return;
            
            if (this.instance.selectedElements.has(element)) {
                this.instance.selectedElements.delete(element);
            } else {
                this.instance.selectedElements.add(element);
            }
            
            this.instance.updateSelectionHandles();
            this.updateLayers();
        }
        
        toggleLayerVisibility(layerId) {
            if (!this.instance) return;
            
            const element = this.instance.elements.find(el => el.id === layerId);
            if (!element) return;
            
            this.instance.saveStateToHistory('visibility');
            
            // Toggle visibility state
            element.visible = element.visible !== false ? false : true;
            
            // Update SVG element display
            const svgElement = element.svgElement;
            if (svgElement) {
                if (element.visible) {
                    svgElement.style.display = 'block';
                    svgElement.style.opacity = element.opacity || 1;
                    svgElement.classList.remove('sww-hidden');
                } else {
                    svgElement.style.display = 'none';
                    svgElement.classList.add('sww-hidden');
                }
            }
            
            // If element is being hidden and is selected, deselect it
            if (!element.visible && this.instance.selectedElements.has(element)) {
                this.instance.selectedElements.delete(element);
                this.instance.updateSelectionHandles();
            }
            
            // Update the layer panel to reflect the new state
            setTimeout(() => {
                this.updateLayers();
            }, 100); // Increased delay to ensure DOM and state changes are applied
        }
        
        toggleLayerLock(layerId) {
            if (!this.instance) return;
            
            const element = this.instance.elements.find(el => el.id === layerId);
            if (!element) return;
            
            this.instance.saveStateToHistory('lock');
            
            // Toggle lock state
            element.locked = !element.locked;
            
            // Update SVG element classes
            const svgElement = element.svgElement;
            if (svgElement) {
                if (element.locked) {
                    svgElement.classList.add('sww-locked');
                } else {
                    svgElement.classList.remove('sww-locked');
                }
            }
            
            // If element is being locked and is selected, deselect it
            if (element.locked && this.instance.selectedElements.has(element)) {
                this.instance.selectedElements.delete(element);
                this.instance.updateSelectionHandles();
            }
            
            // Update the layer panel to reflect the new state
            setTimeout(() => {
                this.updateLayers();
            }, 100); // Increased delay to ensure DOM and state changes are applied
        }
        
        focusOnLayer(layerId) {
            if (!this.instance) return;
            
            const element = this.instance.elements.find(el => el.id === layerId);
            if (!element) return;

            // Clear current selection and select this element
            this.instance.clearSelection();
            this.instance.selectedElements.add(element);
            this.instance.updateSelectionHandles();

            // Focus on the element by centering the view on it
            const bounds = this.instance.getElementBounds(element);
            const centerX = bounds.x + bounds.width / 2;
            const centerY = bounds.y + bounds.height / 2;

            // Update view to center on this element
            this.instance.viewBox.x = centerX - this.instance.viewBox.width / 2;
            this.instance.viewBox.y = centerY - this.instance.viewBox.height / 2;
            this.instance.updateViewBox();
            
            this.updateLayers();
        }
        
        getLayerIcon(type) {
            const icons = {
                'rectangle': 'far fa-square',
                'ellipse': 'far fa-circle',
                'arrow': 'fas fa-arrow-right',
                'draw': 'fas fa-pen',
                'text': 'fas fa-font',
                'website': 'fas fa-globe',
                'image': 'fas fa-image',
                'markdown': 'fas fa-file-alt',
                'diamond': 'far fa-square',
                'parallelogram': 'far fa-square',
                'star': 'fas fa-star',
                'line': 'fas fa-minus'
            };
            return icons[type] || 'fas fa-question';
        }
        
        getLayerName(layer) {
            if (layer.text) {
                return `Text: ${layer.text.substring(0, 20)}${layer.text.length > 20 ? '...' : ''}`;
            }
            if (layer.url) {
                return `Website: ${layer.url.substring(0, 20)}${layer.url.length > 20 ? '...' : ''}`;
            }
            if (layer.src) {
                return `Image: ${layer.src.substring(0, 20)}${layer.src.length > 20 ? '...' : ''}`;
            }
            
            const typeName = layer.type.charAt(0).toUpperCase() + layer.type.slice(1);
            return `${typeName} ${layer.id.split('-').pop() || ''}`;
        }
    }

    // Expose to global scope
    global.sww = SWW;
    global.SWWControlPanel = SWWControlPanel;
    
})(typeof window !== 'undefined' ? window : this);
