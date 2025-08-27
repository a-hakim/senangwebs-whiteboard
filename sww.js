/**
 * SenangWebs Works (SWW) - A client-side drawing library
 * Version: 1.0.0
 * 
 * A JavaScript library for creating digital whiteboards and vector drawings
 * Similar to Excalidraw, entirely client-side with no dependencies
 */

(function(global) {
    'use strict';

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
            this.snapToGrid = true; // Enable by default
            
            // Canvas properties
            this.viewBox = { x: 0, y: 0, width: 1000, height: 1000 };
            this.zoom = 1;
            
            // Tool settings
            this.toolSettings = {
                strokeColor: '#000000',
                strokeWidth: 2,
                fillColor: 'transparent',
                fillStyle: 'solid',
                opacity: 1,
                fontSize: 16,
                fontFamily: 'Arial'
            };
            
            this.init();
        }
        
        init() {
            this.injectCSS();
            this.createUI();
            this.setupEventListeners();
        }
        
        injectCSS() {
            if (document.getElementById('sww-styles')) return;
            
            const style = document.createElement('style');
            style.id = 'sww-styles';
            style.textContent = `
                .sww-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    user-select: none;
                    background: #f8f9fa;
                }
                
                .sww-canvas {
                    width: 100%;
                    height: 100%;
                    display: block;
                    cursor: crosshair;
                }
                
                .sww-toolbar {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    background: white;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    z-index: 1000;
                }
                
                .sww-tool-group {
                    display: flex;
                    gap: 5px;
                }
                
                .sww-tool-button {
                    width: 40px;
                    height: 40px;
                    border: 1px solid #ccc;
                    background: white;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    transition: all 0.2s;
                }
                
                .sww-tool-button:hover {
                    background: #f0f0f0;
                    border-color: #999;
                }
                
                .sww-tool-button.active {
                    background: #007bff;
                    color: white;
                    border-color: #0056b3;
                }
                
                .sww-properties-panel {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    width: 200px;
                    background: white;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 15px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    z-index: 1000;
                }
                
                .sww-property-group {
                    margin-bottom: 15px;
                }
                
                .sww-property-label {
                    display: block;
                    margin-bottom: 5px;
                    font-size: 12px;
                    font-weight: bold;
                    color: #333;
                }
                
                .sww-property-input {
                    width: 100%;
                    padding: 5px;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                    font-size: 12px;
                }
                
                .sww-color-input {
                    width: 100%;
                    height: 30px;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                    cursor: pointer;
                }
                
                .sww-range-input {
                    width: 100%;
                }
                
                .sww-select-input {
                    width: 100%;
                    padding: 5px;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                    font-size: 12px;
                }
                
                .sww-element {
                    cursor: move;
                }
                
                .sww-element.selected {
                    stroke-dasharray: 5,5;
                    stroke: #007bff !important;
                    stroke-width: 2 !important;
                }
                
                .sww-selection-box {
                    fill: none;
                    stroke: #007bff;
                    stroke-width: 1;
                    stroke-dasharray: 5,5;
                    pointer-events: none;
                }
                
                .sww-handle {
                    fill: white;
                    stroke: #007bff;
                    stroke-width: 2;
                    cursor: pointer;
                }
                
                .sww-handle.rotate {
                    cursor: crosshair;
                }
                
                .sww-text-editor {
                    position: absolute;
                    border: 2px solid #007bff;
                    background: transparent;
                    resize: none;
                    outline: none;
                    padding: 2px;
                    font-family: inherit;
                    z-index: 1001;
                }
                
                .sww-text-properties {
                    background: #f8f9fa;
                    border-radius: 4px;
                    padding: 8px;
                }
                
                .sww-text-properties h4 {
                    margin: 0 0 8px 0;
                    font-size: 11px;
                    color: #6c757d;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .sww-value-display {
                    font-size: 10px;
                    color: #6c757d;
                    font-weight: 500;
                    min-width: 30px;
                    text-align: right;
                }
            `;
            document.head.appendChild(style);
        }
        
        createUI() {
            // Clear container
            this.container.innerHTML = '';
            this.container.className = 'sww-container';
            
            // Create SVG canvas
            this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            this.svg.setAttribute('class', 'sww-canvas');
            this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);
            
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
            
            // Grid pattern (if enabled)
            if (this.options.showGrid) {
                this.createGrid();
            }
        }
        
        createGrid() {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
            pattern.setAttribute('id', 'sww-grid');
            pattern.setAttribute('width', this.options.gridSize);
            pattern.setAttribute('height', this.options.gridSize);
            pattern.setAttribute('patternUnits', 'userSpaceOnUse');
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M ${this.options.gridSize} 0 L 0 0 0 ${this.options.gridSize}`);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', '#e0e0e0');
            path.setAttribute('stroke-width', '1');
            
            pattern.appendChild(path);
            defs.appendChild(pattern);
            this.svg.appendChild(defs);
            
            const gridRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            gridRect.setAttribute('x', this.viewBox.x - 5000);
            gridRect.setAttribute('y', this.viewBox.y - 5000);
            gridRect.setAttribute('width', 10000);
            gridRect.setAttribute('height', 10000);
            gridRect.setAttribute('fill', 'url(#sww-grid)');
            this.svg.appendChild(gridRect);
        }
        
        createToolbar() {
            const toolbar = document.createElement('div');
            toolbar.className = 'sww-toolbar';
            
            // Tool groups
            const tools = [
                { id: 'select', icon: '↖', title: 'Select' },
                { id: 'rectangle', icon: '▭', title: 'Rectangle' },
                { id: 'ellipse', icon: '○', title: 'Ellipse' },
                { id: 'diamond', icon: '◇', title: 'Diamond' },
                { id: 'line', icon: '/', title: 'Line' },
                { id: 'arrow', icon: '→', title: 'Arrow' },
                { id: 'draw', icon: '✏', title: 'Draw' },
                { id: 'text', icon: 'T', title: 'Text' }
            ];
            
            const toolGroup = document.createElement('div');
            toolGroup.className = 'sww-tool-group';
            
            tools.forEach(tool => {
                const button = document.createElement('button');
                button.className = 'sww-tool-button';
                button.setAttribute('data-tool', tool.id);
                button.textContent = tool.icon;
                button.title = tool.title;
                button.addEventListener('click', () => this.setTool(tool.id));
                
                if (tool.id === this.currentTool) {
                    button.classList.add('active');
                }
                
                toolGroup.appendChild(button);
            });
            
            toolbar.appendChild(toolGroup);
            
            // Action buttons
            const actionGroup = document.createElement('div');
            actionGroup.className = 'sww-tool-group';
            
            const actions = [
                { id: 'snap-grid', icon: '⊞', title: 'Toggle Grid Snap', action: () => this.toggleGridSnapButton() },
                { id: 'clear', icon: '🗑', title: 'Clear All', action: () => this.clearAll() },
                { id: 'export-svg', icon: '📄', title: 'Export SVG', action: () => this.exportToSVG() },
                { id: 'export-png', icon: '🖼', title: 'Export PNG', action: () => this.exportToPNG() }
            ];
            
            actions.forEach(action => {
                const button = document.createElement('button');
                button.className = 'sww-tool-button';
                button.setAttribute('data-action', action.id);
                button.textContent = action.icon;
                button.title = action.title;
                button.addEventListener('click', action.action);
                
                // Set initial state for grid snap button
                if (action.id === 'snap-grid' && this.snapToGrid) {
                    button.classList.add('active');
                }
                
                actionGroup.appendChild(button);
            });
            
            toolbar.appendChild(actionGroup);
            this.container.appendChild(toolbar);
        }
        
        createPropertiesPanel() {
            const panel = document.createElement('div');
            panel.className = 'sww-properties-panel';
            
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
            strokeInput.addEventListener('change', (e) => {
                this.toolSettings.strokeColor = e.target.value;
                this.updateSelectedElements();
            });
            
            strokeGroup.appendChild(strokeLabel);
            strokeGroup.appendChild(strokeInput);
            
            // Stroke width
            const widthGroup = document.createElement('div');
            widthGroup.className = 'sww-property-group';
            
            const widthLabel = document.createElement('label');
            widthLabel.className = 'sww-property-label';
            widthLabel.textContent = 'Stroke Width';
            
            const widthInput = document.createElement('input');
            widthInput.type = 'range';
            widthInput.className = 'sww-range-input';
            widthInput.min = '1';
            widthInput.max = '20';
            widthInput.value = this.toolSettings.strokeWidth;
            widthInput.addEventListener('input', (e) => {
                this.toolSettings.strokeWidth = parseInt(e.target.value);
                this.updateSelectedElements();
            });
            
            widthGroup.appendChild(widthLabel);
            widthGroup.appendChild(widthInput);
            
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
            fillInput.addEventListener('change', (e) => {
                this.toolSettings.fillColor = e.target.value;
                this.updateSelectedElements();
            });
            
            fillGroup.appendChild(fillLabel);
            fillGroup.appendChild(fillInput);
            
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
                { value: 'hachure', text: 'Hatched' }
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
                this.updateSelectedElements();
            });
            
            fillStyleGroup.appendChild(fillStyleLabel);
            fillStyleGroup.appendChild(fillStyleSelect);
            
            // Opacity
            const opacityGroup = document.createElement('div');
            opacityGroup.className = 'sww-property-group';
            
            const opacityLabel = document.createElement('label');
            opacityLabel.className = 'sww-property-label';
            opacityLabel.textContent = 'Opacity';
            
            const opacityInput = document.createElement('input');
            opacityInput.type = 'range';
            opacityInput.className = 'sww-range-input';
            opacityInput.min = '0';
            opacityInput.max = '1';
            opacityInput.step = '0.1';
            opacityInput.value = this.toolSettings.opacity;
            opacityInput.addEventListener('input', (e) => {
                this.toolSettings.opacity = parseFloat(e.target.value);
                this.updateSelectedElements();
            });
            
            opacityGroup.appendChild(opacityLabel);
            opacityGroup.appendChild(opacityInput);
            
            // Text properties section
            const textSection = document.createElement('div');
            textSection.className = 'sww-text-properties';
            textSection.style.borderTop = '1px solid #ddd';
            textSection.style.marginTop = '10px';
            textSection.style.paddingTop = '10px';
            
            const textSectionTitle = document.createElement('h4');
            textSectionTitle.textContent = 'Text Properties';
            textSectionTitle.style.margin = '0 0 10px 0';
            textSectionTitle.style.fontSize = '12px';
            textSectionTitle.style.color = '#666';
            textSection.appendChild(textSectionTitle);
            
            // Font size
            const fontSizeGroup = document.createElement('div');
            fontSizeGroup.className = 'sww-property-group';
            
            const fontSizeLabel = document.createElement('label');
            fontSizeLabel.className = 'sww-property-label';
            fontSizeLabel.textContent = 'Font Size';
            
            const fontSizeInput = document.createElement('input');
            fontSizeInput.type = 'range';
            fontSizeInput.className = 'sww-range-input';
            fontSizeInput.min = '8';
            fontSizeInput.max = '72';
            fontSizeInput.value = this.toolSettings.fontSize;
            fontSizeInput.addEventListener('input', (e) => {
                this.toolSettings.fontSize = parseInt(e.target.value);
                this.updateSelectedElements();
            });
            
            const fontSizeValue = document.createElement('span');
            fontSizeValue.className = 'sww-value-display';
            fontSizeValue.textContent = this.toolSettings.fontSize + 'px';
            fontSizeValue.style.marginLeft = '5px';
            fontSizeValue.style.fontSize = '11px';
            fontSizeValue.style.color = '#666';
            
            fontSizeInput.addEventListener('input', (e) => {
                this.toolSettings.fontSize = parseInt(e.target.value);
                fontSizeValue.textContent = e.target.value + 'px';
                this.updateSelectedElements();
            });
            
            fontSizeGroup.appendChild(fontSizeLabel);
            fontSizeGroup.appendChild(fontSizeInput);
            fontSizeGroup.appendChild(fontSizeValue);
            
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
                option.style.fontFamily = font.value;
                fontFamilySelect.appendChild(option);
            });
            
            fontFamilySelect.value = this.toolSettings.fontFamily;
            fontFamilySelect.addEventListener('change', (e) => {
                this.toolSettings.fontFamily = e.target.value;
                this.updateSelectedElements();
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
            textColorInput.value = this.toolSettings.strokeColor; // Text uses stroke color
            textColorInput.addEventListener('change', (e) => {
                this.toolSettings.strokeColor = e.target.value;
                this.updateSelectedElements();
            });
            
            textColorGroup.appendChild(textColorLabel);
            textColorGroup.appendChild(textColorInput);
            
            textSection.appendChild(fontSizeGroup);
            textSection.appendChild(fontFamilyGroup);
            textSection.appendChild(textColorGroup);
            
            panel.appendChild(strokeGroup);
            panel.appendChild(widthGroup);
            panel.appendChild(fillGroup);
            panel.appendChild(fillStyleGroup);
            panel.appendChild(opacityGroup);
            panel.appendChild(textSection);
            
            this.container.appendChild(panel);
            this.propertiesPanel = panel;
        }
        
        setupEventListeners() {
            // Mouse events
            this.svg.addEventListener('mousedown', (e) => this.handlePointerDown(e));
            this.svg.addEventListener('mousemove', (e) => this.handlePointerMove(e));
            this.svg.addEventListener('mouseup', (e) => this.handlePointerUp(e));
            this.svg.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
            
            // Touch events
            this.svg.addEventListener('touchstart', (e) => this.handlePointerDown(e));
            this.svg.addEventListener('touchmove', (e) => this.handlePointerMove(e));
            this.svg.addEventListener('touchend', (e) => this.handlePointerUp(e));
            
            // Keyboard events
            document.addEventListener('keydown', (e) => this.handleKeyDown(e));
            
            // Wheel event for zooming
            this.svg.addEventListener('wheel', (e) => this.handleWheel(e));
            
            // Prevent context menu
            this.svg.addEventListener('contextmenu', (e) => e.preventDefault());
        }
        
        // Event handlers will be implemented in the next part...
        handlePointerDown(e) {
            e.preventDefault();
            const point = this.getPointerPosition(e);
            this.lastPointerPosition = point;
            
            if (e.button === 1 || (e.button === 0 && e.altKey)) {
                // Middle mouse or Alt+click for panning
                this.isPanning = true;
                this.svg.style.cursor = 'grabbing';
                return;
            }
            
            switch (this.currentTool) {
                case 'select':
                    this.handleSelectStart(point, e);
                    break;
                case 'rectangle':
                case 'ellipse':
                case 'diamond':
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
            if (e.key === 'Delete' || e.key === 'Backspace') {
                this.deleteSelectedElements();
            } else if (e.key === 'Escape') {
                this.clearSelection();
            } else if (e.ctrlKey && e.key === 'a') {
                e.preventDefault();
                this.selectAll();
            } else if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                // TODO: Implement undo
            }
        }
        
        handleWheel(e) {
            e.preventDefault();
            const point = this.getPointerPosition(e);
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            
            this.zoom *= zoomFactor;
            this.zoom = Math.max(0.1, Math.min(5, this.zoom));
            
            // Zoom towards mouse position
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
        
        getPointerPosition(e) {
            const rect = this.svg.getBoundingClientRect();
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            
            const x = (clientX - rect.left) / rect.width * this.viewBox.width + this.viewBox.x;
            const y = (clientY - rect.top) / rect.height * this.viewBox.height + this.viewBox.y;
            
            return { x, y };
        }
        
        updateViewBox() {
            this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);
        }
        
        handleDoubleClick(e) {
            e.preventDefault();
            const point = this.getPointerPosition(e);
            const element = this.getElementAtPoint(point);
            
            // Only handle double-click for text elements when in select mode
            if (element && element.type === 'text' && this.currentTool === 'select') {
                this.startTextEditing(element);
            }
        }
        
        // Tool-specific handlers
        handleSelectStart(point, e) {
            const element = this.getElementAtPoint(point);
            
            if (element) {
                if (!e.shiftKey && !this.selectedElements.has(element)) {
                    this.clearSelection();
                }
                this.selectElement(element);
                
                // Start dragging the selected element(s)
                this.isDraggingElement = true;
                this.manipulationMode = 'move';
                this.dragStartPoint = point;
                
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
            this.elementsGroup.appendChild(element.svgElement);
        }
        
        handleLineStart(point) {
            const snappedPoint = this.snapToGridPoint(point);
            const element = this.createElement(this.currentTool, snappedPoint);
            this.currentElement = element;
            this.isDrawing = true;
            this.elementsGroup.appendChild(element.svgElement);
        }
        
        handleDrawStart(point) {
            const snappedPoint = this.snapToGridPoint(point);
            const element = this.createElement('path', snappedPoint);
            element.points = [snappedPoint];
            this.currentElement = element;
            this.isDrawing = true;
            this.elementsGroup.appendChild(element.svgElement);
        }
        
        handleTextStart(point) {
            const snappedPoint = this.snapToGridPoint(point);
            const element = this.createElement('text', snappedPoint);
            element.text = 'Click to edit text';
            
            // Add element to the scene
            this.elementsGroup.appendChild(element.svgElement);
            this.elements.push(element);
            this.updateSVGElement(element);
            
            // Select the element and start editing
            this.clearSelection();
            this.selectElement(element);
            this.startTextEditing(element);
        }
        
        // Element creation and manipulation
        createElement(type, point) {
            const element = {
                id: this.generateId(),
                type: type,
                x: point.x,
                y: point.y,
                width: 0,
                height: 0,
                strokeColor: this.toolSettings.strokeColor,
                strokeWidth: this.toolSettings.strokeWidth,
                fillColor: this.toolSettings.fillColor,
                fillStyle: this.toolSettings.fillStyle,
                opacity: this.toolSettings.opacity,
                fontSize: this.toolSettings.fontSize,
                fontFamily: this.toolSettings.fontFamily,
                rotation: 0
            };
            
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
            
            // Fill handling
            if (element.fillStyle === 'transparent') {
                svg.setAttribute('fill', 'none');
            } else if (element.fillStyle === 'solid') {
                svg.setAttribute('fill', element.fillColor);
            } else if (element.fillStyle === 'hachure') {
                // Create hatch pattern
                svg.setAttribute('fill', 'url(#hatch)');
                this.createHatchPattern(element.fillColor);
            }
            
            // Type-specific attributes
            switch (element.type) {
                case 'rectangle':
                    svg.setAttribute('x', element.x);
                    svg.setAttribute('y', element.y);
                    svg.setAttribute('width', Math.abs(element.width));
                    svg.setAttribute('height', Math.abs(element.height));
                    break;
                    
                case 'ellipse':
                    svg.setAttribute('cx', element.x + element.width / 2);
                    svg.setAttribute('cy', element.y + element.height / 2);
                    svg.setAttribute('rx', Math.abs(element.width) / 2);
                    svg.setAttribute('ry', Math.abs(element.height) / 2);
                    break;
                    
                case 'diamond':
                    const cx = element.x + element.width / 2;
                    const cy = element.y + element.height / 2;
                    const w = Math.abs(element.width) / 2;
                    const h = Math.abs(element.height) / 2;
                    const points = `${cx},${cy - h} ${cx + w},${cy} ${cx},${cy + h} ${cx - w},${cy}`;
                    svg.setAttribute('points', points);
                    break;
                    
                case 'line':
                case 'arrow':
                    svg.setAttribute('x1', element.x);
                    svg.setAttribute('y1', element.y);
                    svg.setAttribute('x2', element.x + element.width);
                    svg.setAttribute('y2', element.y + element.height);
                    
                    if (element.type === 'arrow') {
                        svg.setAttribute('marker-end', 'url(#arrowhead)');
                        this.createArrowMarker();
                    }
                    break;
                    
                case 'path':
                    if (element.points && element.points.length > 0) {
                        const pathData = this.pointsToPath(element.points);
                        svg.setAttribute('d', pathData);
                        svg.setAttribute('fill', 'none');
                    }
                    break;
                    
                case 'text':
                    svg.setAttribute('x', element.x);
                    svg.setAttribute('y', element.y);
                    svg.setAttribute('font-size', element.fontSize);
                    svg.setAttribute('font-family', element.fontFamily);
                    svg.setAttribute('fill', element.strokeColor);
                    svg.textContent = element.text || '';
                    break;
            }
            
            // Apply rotation
            if (element.rotation !== 0) {
                const centerX = element.x + element.width / 2;
                const centerY = element.y + element.height / 2;
                svg.setAttribute('transform', `rotate(${element.rotation} ${centerX} ${centerY})`);
            }
        }
        
        createHatchPattern(color) {
            if (document.getElementById('hatch')) return;
            
            const defs = this.svg.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            if (!this.svg.querySelector('defs')) {
                this.svg.appendChild(defs);
            }
            
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
        
        createArrowMarker() {
            if (document.getElementById('arrowhead')) return;
            
            const defs = this.svg.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            if (!this.svg.querySelector('defs')) {
                this.svg.appendChild(defs);
            }
            
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', 'arrowhead');
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '7');
            marker.setAttribute('refX', '9');
            marker.setAttribute('refY', '3.5');
            marker.setAttribute('orient', 'auto');
            
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
            polygon.setAttribute('fill', this.toolSettings.strokeColor);
            
            marker.appendChild(polygon);
            defs.appendChild(marker);
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
            
            // Add to elements array
            this.elements.push(this.currentElement);
            
            // Clean up
            this.currentElement = null;
            this.isDrawing = false;
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
            
            // Clean up drag state
            this.selectedElements.forEach(element => {
                delete element.dragStartX;
                delete element.dragStartY;
            });
            
            this.isDraggingElement = false;
            this.dragStartPoint = null;
            this.manipulationMode = null;
        }
        
        updateResize(point) {
            if (!this.isResizing || !this.dragStartPoint) return;
            
            const dx = point.x - this.dragStartPoint.x;
            const dy = point.y - this.dragStartPoint.y;
            
            this.selectedElements.forEach(element => {
                const startX = element.resizeStartX;
                const startY = element.resizeStartY;
                const startWidth = element.resizeStartWidth;
                const startHeight = element.resizeStartHeight;
                
                switch (this.resizeHandle) {
                    case 'se': // Southeast handle
                        element.width = startWidth + dx;
                        element.height = startHeight + dy;
                        break;
                    case 'sw': // Southwest handle
                        element.x = startX + dx;
                        element.width = startWidth - dx;
                        element.height = startHeight + dy;
                        break;
                    case 'ne': // Northeast handle
                        element.width = startWidth + dx;
                        element.y = startY + dy;
                        element.height = startHeight - dy;
                        break;
                    case 'nw': // Northwest handle
                        element.x = startX + dx;
                        element.y = startY + dy;
                        element.width = startWidth - dx;
                        element.height = startHeight - dy;
                        break;
                    case 'e': // East handle
                        element.width = startWidth + dx;
                        break;
                    case 'w': // West handle
                        element.x = startX + dx;
                        element.width = startWidth - dx;
                        break;
                    case 'n': // North handle
                        element.y = startY + dy;
                        element.height = startHeight - dy;
                        break;
                    case 's': // South handle
                        element.height = startHeight + dy;
                        break;
                }
                
                // Ensure minimum size
                const minSize = 10;
                if (Math.abs(element.width) < minSize) {
                    element.width = element.width < 0 ? -minSize : minSize;
                }
                if (Math.abs(element.height) < minSize) {
                    element.height = element.height < 0 ? -minSize : minSize;
                }
                
                // Apply grid snapping to position and size
                if (this.snapToGrid) {
                    const snappedPoint = this.snapToGridPoint({ x: element.x, y: element.y });
                    element.x = snappedPoint.x;
                    element.y = snappedPoint.y;
                    element.width = this.snapToGridValue(element.width);
                    element.height = this.snapToGridValue(element.height);
                }
                
                this.updateSVGElement(element);
            });
            
            this.updateSelectionHandles();
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
                
                element.rotation = (element.rotateStartAngle + deltaAngle) % 360;
                this.updateSVGElement(element);
            });
            
            this.updateSelectionHandles();
        }
        
        finishResize() {
            if (!this.isResizing) return;
            
            // Clean up resize state
            this.selectedElements.forEach(element => {
                delete element.resizeStartX;
                delete element.resizeStartY;
                delete element.resizeStartWidth;
                delete element.resizeStartHeight;
            });
            
            this.isResizing = false;
            this.resizeHandle = null;
            this.dragStartPoint = null;
            this.manipulationMode = null;
        }
        
        finishRotation() {
            if (!this.isRotating) return;
            
            // Clean up rotation state
            this.selectedElements.forEach(element => {
                delete element.rotateStartAngle;
            });
            
            this.isRotating = false;
            this.dragStartPoint = null;
            this.manipulationMode = null;
        }
        
        // Selection methods
        selectElement(element) {
            this.selectedElements.add(element);
            const currentClass = element.svgElement.getAttribute('class') || '';
            if (!currentClass.includes('selected')) {
                element.svgElement.setAttribute('class', currentClass + ' selected');
            }
            this.updateSelectionHandles();
            this.syncPropertiesPanel();
        }
        
        clearSelection() {
            this.selectedElements.forEach(element => {
                const currentClass = element.svgElement.getAttribute('class') || '';
                element.svgElement.setAttribute('class', currentClass.replace('selected', '').trim());
            });
            this.selectedElements.clear();
            this.clearSelectionHandles();
            this.syncPropertiesPanel();
        }
        
        selectAll() {
            this.clearSelection();
            this.elements.forEach(element => {
                this.selectElement(element);
            });
        }
        
        syncPropertiesPanel() {
            if (!this.propertiesPanel) return;
            
            // Get the first selected element to sync properties
            const firstElement = this.selectedElements.values().next().value;
            
            if (firstElement) {
                // Update stroke color input
                const strokeInput = this.propertiesPanel.querySelector('input[type="color"]');
                if (strokeInput) strokeInput.value = firstElement.strokeColor;
                
                // Update stroke width input
                const strokeWidthInput = this.propertiesPanel.querySelector('input[type="range"]');
                if (strokeWidthInput) strokeWidthInput.value = firstElement.strokeWidth;
                
                // Update fill color input
                const fillInputs = this.propertiesPanel.querySelectorAll('input[type="color"]');
                if (fillInputs[1]) fillInputs[1].value = firstElement.fillColor === 'transparent' ? '#ffffff' : firstElement.fillColor;
                
                // Update fill style select
                const fillStyleSelect = this.propertiesPanel.querySelector('select');
                if (fillStyleSelect) fillStyleSelect.value = firstElement.fillStyle;
                
                // Update opacity input
                const opacityInput = this.propertiesPanel.querySelector('input[type="range"][max="1"]');
                if (opacityInput) opacityInput.value = firstElement.opacity;
                
                // Update text-specific properties if it's a text element
                if (firstElement.type === 'text') {
                    const fontSizeInput = this.propertiesPanel.querySelector('input[type="range"][max="72"]');
                    if (fontSizeInput) {
                        fontSizeInput.value = firstElement.fontSize;
                        const fontSizeValue = fontSizeInput.parentElement.querySelector('.sww-value-display');
                        if (fontSizeValue) fontSizeValue.textContent = firstElement.fontSize + 'px';
                    }
                    
                    const fontFamilySelect = this.propertiesPanel.querySelector('.sww-text-properties select');
                    if (fontFamilySelect) fontFamilySelect.value = firstElement.fontFamily;
                    
                    const textColorInput = this.propertiesPanel.querySelector('.sww-text-properties input[type="color"]');
                    if (textColorInput) textColorInput.value = firstElement.strokeColor;
                }
            }
        }
        
        deleteSelectedElements() {
            this.selectedElements.forEach(element => {
                const index = this.elements.indexOf(element);
                if (index > -1) {
                    this.elements.splice(index, 1);
                }
                element.svgElement.remove();
            });
            this.selectedElements.clear();
            this.clearSelectionHandles();
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
            this.clearSelectionHandles();
            
            if (this.selectedElements.size === 0) return;
            
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
                
                // Add resize handles
                this.addResizeHandles(bounds);
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
            rotateHandle.style.cursor = 'crosshair';
            
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
            this.isResizing = true;
            this.manipulationMode = 'resize';
            this.resizeHandle = handleType;
            this.dragStartPoint = point;
            
            // Store initial dimensions of selected elements
            this.selectedElements.forEach(element => {
                element.resizeStartX = element.x;
                element.resizeStartY = element.y;
                element.resizeStartWidth = element.width;
                element.resizeStartHeight = element.height;
            });
            
            console.log('Resize started:', handleType);
        }
        
        startRotation(point) {
            this.isRotating = true;
            this.manipulationMode = 'rotate';
            this.dragStartPoint = point;
            
            // Store initial rotation of selected elements
            this.selectedElements.forEach(element => {
                element.rotateStartAngle = element.rotation || 0;
            });
            
            console.log('Rotation started');
        }
        
        clearSelectionHandles() {
            this.selectionGroup.innerHTML = '';
        }
        
        getElementBounds(element) {
            if (element.type === 'text') {
                // Calculate text bounds based on content and font size
                const text = element.text || 'Text';
                const bounds = this.measureText(text, element.fontSize, element.fontFamily);
                
                // Add padding for better visibility and selection
                const sidePadding = element.fontSize * 0.15; // 20% of font size for left/right
                const topPadding = element.fontSize * -0.4; // 10% of font size for top (reduced)
                const bottomPadding = element.fontSize * 0.2; // 15% of font size for bottom
                
                return {
                    x: element.x - sidePadding,
                    y: element.y - bounds.height - topPadding, // Text baseline offset with reduced top padding
                    width: bounds.width + (sidePadding * 2),
                    height: bounds.height + topPadding + bottomPadding
                };
            } else {
                // For other elements, use their width/height
                return {
                    x: element.x,
                    y: element.y,
                    width: Math.abs(element.width),
                    height: Math.abs(element.height)
                };
            }
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
            // Improved hit testing for different element types
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
            const tolerance = 5; // Pixels tolerance for better selection
            
            switch (element.type) {
                case 'text':
                    // For text, use the calculated bounds with tolerance
                    return point.x >= bounds.x - tolerance && 
                           point.x <= bounds.x + bounds.width + tolerance &&
                           point.y >= bounds.y - tolerance && 
                           point.y <= bounds.y + bounds.height + tolerance;
                           
                case 'line':
                case 'arrow':
                    // For lines, check distance from line
                    return this.distanceToLine(point, 
                        { x: element.x, y: element.y }, 
                        { x: element.x + element.width, y: element.y + element.height }
                    ) <= Math.max(element.strokeWidth / 2, tolerance);
                    
                case 'path':
                    // For paths, check if near any point in the path
                    if (element.points) {
                        for (let i = 0; i < element.points.length; i++) {
                            const pathPoint = element.points[i];
                            const distance = Math.sqrt(
                                Math.pow(point.x - pathPoint.x, 2) + 
                                Math.pow(point.y - pathPoint.y, 2)
                            );
                            if (distance <= Math.max(element.strokeWidth, tolerance)) {
                                return true;
                            }
                        }
                    }
                    return false;
                    
                default:
                    // For rectangles, ellipses, diamonds - use bounds
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
                }
                
                this.updateSVGElement(element);
            });
        }
        
        // Text editing
        startTextEditing(element) {
            const textEditor = document.createElement('textarea');
            textEditor.className = 'sww-text-editor';
            textEditor.value = element.text || '';
            
            // Position the editor
            const rect = this.svg.getBoundingClientRect();
            const x = (element.x - this.viewBox.x) / this.viewBox.width * rect.width + rect.left;
            const y = (element.y - this.viewBox.y) / this.viewBox.height * rect.height + rect.top;
            
            textEditor.style.left = `${x}px`;
            textEditor.style.top = `${y - element.fontSize}px`; // Adjust for baseline
            textEditor.style.fontSize = `${element.fontSize}px`;
            textEditor.style.fontFamily = element.fontFamily;
            textEditor.style.minWidth = '100px';
            textEditor.style.minHeight = `${element.fontSize * 1.2}px`;
            textEditor.style.border = '2px solid #007bff';
            textEditor.style.background = 'rgba(255, 255, 255, 0.9)';
            textEditor.style.resize = 'none';
            textEditor.style.overflow = 'hidden';
            
            document.body.appendChild(textEditor);
            textEditor.focus();
            textEditor.select();
            
            let isEditing = true; // Flag to prevent double cleanup
            
            const finishEditing = () => {
                if (!isEditing) return; // Prevent double execution
                isEditing = false;
                
                element.text = textEditor.value || 'Text'; // Fallback text
                this.updateSVGElement(element);
                
                // Safely remove the textarea
                if (textEditor.parentNode) {
                    textEditor.remove();
                }
                
                // Update selection handles if element is selected
                if (this.selectedElements.has(element)) {
                    this.updateSelectionHandles();
                }
            };
            
            const cancelEditing = () => {
                if (!isEditing) return; // Prevent double execution
                isEditing = false;
                
                // Safely remove the textarea without saving changes
                if (textEditor.parentNode) {
                    textEditor.remove();
                }
            };
            
            textEditor.addEventListener('blur', finishEditing);
            textEditor.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    finishEditing();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelEditing();
                } else {
                    // Auto-resize textarea
                    setTimeout(() => {
                        if (textEditor.parentNode) {
                            textEditor.style.height = 'auto';
                            textEditor.style.height = textEditor.scrollHeight + 'px';
                        }
                    }, 0);
                }
            });
            
            // Initial resize
            textEditor.style.height = 'auto';
            textEditor.style.height = textEditor.scrollHeight + 'px';
        }
        
        // Utility methods
        generateId() {
            return 'sww-' + Math.random().toString(36).substr(2, 9);
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
        }
        
        // Public API methods
        setTool(toolName) {
            this.currentTool = toolName;
            
            // Update toolbar buttons
            this.container.querySelectorAll('.sww-tool-button').forEach(button => {
                button.classList.remove('active');
                if (button.getAttribute('data-tool') === toolName) {
                    button.classList.add('active');
                }
            });
            
            // Update cursor
            this.svg.style.cursor = toolName === 'select' ? 'default' : 'crosshair';
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
                    this.elementsGroup.appendChild(element.svgElement);
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
        
        clearAll() {
            this.elements = [];
            this.selectedElements.clear();
            this.elementsGroup.innerHTML = '';
            this.clearSelectionHandles();
        }
    }
    
    // Expose to global scope
    global.sww = SWW;
    
})(typeof window !== 'undefined' ? window : this);
