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
            
            // Context menu state
            this.contextMenu = null;
            this.clipboard = []; // For copy/paste functionality
            
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
                fontFamily: 'Arial',
                textAlign: 'left',
                textColor: '#000000'  // Separate text color property
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
            
            // Add Font Awesome CSS if not already present
            if (!document.querySelector('link[href*="font-awesome"]') && !document.getElementById('sww-fontawesome')) {
                const fontAwesome = document.createElement('link');
                fontAwesome.id = 'sww-fontawesome';
                fontAwesome.rel = 'stylesheet';
                fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
                document.head.appendChild(fontAwesome);
            }
            
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
                
                .sww-tool-button i {
                    font-size: 16px;
                    color: #333;
                    transition: color 0.2s;
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
                
                .sww-tool-button.active i {
                    color: white;
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
                
                /* Prevent selection styles from affecting arrow lines - preserve original width */
                .sww-element.selected[marker-end] {
                    stroke-width: var(--original-stroke-width, 2) !important;
                }
                
                /* Arrow markers should maintain their original appearance */
                marker polygon {
                    stroke: none !important;
                    stroke-width: 0 !important;
                    stroke-dasharray: none !important;
                }
                
                /* Ensure marker visibility */
                marker {
                    overflow: visible;
                }
                
                /* Text boundary styling */
                .sww-text-boundary {
                    pointer-events: none;
                    opacity: 0.8;
                }
                
                .sww-element.selected .sww-text-boundary {
                    opacity: 1;
                    stroke: #007bff;
                    stroke-width: 1.5;
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
                
                .sww-align-button {
                    padding: 4px 8px;
                    border: 1px solid #ddd;
                    background: #f8f9fa;
                    cursor: pointer;
                    font-size: 12px;
                    border-radius: 3px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    margin-right: 2px;
                }
                
                .sww-align-button:hover {
                    background: #e9ecef;
                    border-color: #adb5bd;
                }
                
                .sww-align-button.active {
                    background: #007bff;
                    color: white;
                    border-color: #0056b3;
                }
                
                .sww-align-button i {
                    font-size: 12px;
                }
                
                /* Locked and Grouped elements styling */
                .sww-locked {
                    opacity: 0.7 !important;
                    filter: grayscale(50%) !important;
                }
                
                .sww-grouped {
                    stroke-dasharray: 2,2 !important;
                    stroke-dashoffset: 0 !important;
                }
                
                /* Context Menu Styles */
                .sww-context-menu {
                    position: absolute;
                    background: white;
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 2000;
                    min-width: 150px;
                    padding: 4px 0;
                    font-size: 14px;
                    display: none;
                }
                
                .sww-context-menu-item {
                    padding: 8px 16px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    color: #333;
                    border: none;
                    background: none;
                    width: 100%;
                    text-align: left;
                    font-size: 14px;
                }
                
                .sww-context-menu-item:hover {
                    background: #f8f9fa;
                }
                
                .sww-context-menu-item:disabled {
                    color: #aaa;
                    cursor: not-allowed;
                }
                
                .sww-context-menu-item:disabled:hover {
                    background: none;
                }
                
                .sww-context-menu-item i {
                    margin-right: 10px;
                    width: 16px;
                    text-align: center;
                    font-size: 13px;
                }
                
                .sww-context-menu-separator {
                    height: 1px;
                    background: #e9ecef;
                    margin: 4px 0;
                }
                
                /* Hidden properties panel by default */
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
                    display: none;
                }
                
                .sww-properties-panel.visible {
                    display: block;
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
                { id: 'diamond', icon: 'far fa-gem', title: 'Diamond' },
                { id: 'line', icon: 'fas fa-minus', title: 'Line' },
                { id: 'arrow', icon: 'fas fa-arrow-right', title: 'Arrow' },
                { id: 'draw', icon: 'fas fa-pen', title: 'Draw' },
                { id: 'text', icon: 'fas fa-font', title: 'Text' }
            ];
            
            const toolGroup = document.createElement('div');
            toolGroup.className = 'sww-tool-group';
            
            tools.forEach(tool => {
                const button = document.createElement('button');
                button.className = 'sww-tool-button';
                button.setAttribute('data-tool', tool.id);
                
                const icon = document.createElement('i');
                icon.className = tool.icon;
                button.appendChild(icon);
                
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
                { id: 'lock', icon: 'fas fa-lock', title: 'Lock/Unlock Selected', action: () => this.toggleLockSelected() },
                { id: 'group', icon: 'fas fa-object-group', title: 'Group Selected', action: () => this.groupSelected() },
                { id: 'ungroup', icon: 'fas fa-object-ungroup', title: 'Ungroup Selected', action: () => this.ungroupSelected() },
                { id: 'snap-grid', icon: 'fas fa-border-all', title: 'Toggle Grid Snap', action: () => this.toggleGridSnapButton() },
                { id: 'clear', icon: 'fas fa-trash', title: 'Clear All', action: () => this.clearAll() },
                { id: 'export-svg', icon: 'fas fa-file-code', title: 'Export SVG', action: () => this.exportToSVG() },
                { id: 'export-png', icon: 'fas fa-file-image', title: 'Export PNG', action: () => this.exportToPNG() }
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
                // Update only strokeColor property for selected elements
                this.updateSelectedElementProperty('strokeColor', e.target.value);
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
                // Update only strokeWidth property for selected elements
                this.updateSelectedElementProperty('strokeWidth', parseInt(e.target.value));
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
                // Update only fillColor property for selected elements
                this.updateSelectedElementProperty('fillColor', e.target.value);
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
                // Update only fillStyle property for selected elements
                this.updateSelectedElementProperty('fillStyle', e.target.value);
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
                // Update only opacity property for selected elements
                this.updateSelectedElementProperty('opacity', parseFloat(e.target.value));
            });
            
            opacityGroup.appendChild(opacityLabel);
            opacityGroup.appendChild(opacityInput);
            
            // Text properties section
            const textSection = document.createElement('div');
            textSection.className = 'sww-text-properties';
            textSection.style.borderTop = '1px solid #ddd';
            textSection.style.marginTop = '10px';
            textSection.style.paddingTop = '10px';
            textSection.style.display = 'none'; // Initially hidden
            
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
            
            const fontSizeValue = document.createElement('span');
            fontSizeValue.className = 'sww-value-display';
            fontSizeValue.textContent = this.toolSettings.fontSize + 'px';
            fontSizeValue.style.marginLeft = '5px';
            fontSizeValue.style.fontSize = '11px';
            fontSizeValue.style.color = '#666';
            
            fontSizeInput.addEventListener('input', (e) => {
                const newFontSize = parseInt(e.target.value);
                this.toolSettings.fontSize = newFontSize;
                fontSizeValue.textContent = newFontSize + 'px';
                
                // Update only fontSize property for selected elements
                this.updateSelectedElementProperty('fontSize', newFontSize);
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
            textColorInput.addEventListener('change', (e) => {
                this.toolSettings.textColor = e.target.value;
                // Update only textColor property for selected elements
                this.updateSelectedElementProperty('textColor', e.target.value);
            });
            
            textColorGroup.appendChild(textColorLabel);
            textColorGroup.appendChild(textColorInput);
            
            // Text alignment
            const textAlignGroup = document.createElement('div');
            textAlignGroup.className = 'sww-property-group';
            
            const textAlignLabel = document.createElement('label');
            textAlignLabel.className = 'sww-property-label';
            textAlignLabel.textContent = 'Text Align';
            
            const textAlignContainer = document.createElement('div');
            textAlignContainer.className = 'sww-align-buttons';
            textAlignContainer.style.display = 'flex';
            textAlignContainer.style.gap = '4px';
            
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
            
            panel.appendChild(strokeGroup);
            panel.appendChild(widthGroup);
            panel.appendChild(fillGroup);
            panel.appendChild(fillStyleGroup);
            panel.appendChild(opacityGroup);
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
            // Mouse events
            this.svg.addEventListener('mousedown', (e) => this.handlePointerDown(e));
            this.svg.addEventListener('mousemove', (e) => this.handlePointerMove(e));
            this.svg.addEventListener('mouseup', (e) => this.handlePointerUp(e));
            this.svg.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
            
            // Context menu (right-click)
            this.svg.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showContextMenu(e);
            });
            
            // Touch events
            this.svg.addEventListener('touchstart', (e) => this.handlePointerDown(e));
            this.svg.addEventListener('touchmove', (e) => this.handlePointerMove(e));
            this.svg.addEventListener('touchend', (e) => this.handlePointerUp(e));
            
            // Keyboard events
            document.addEventListener('keydown', (e) => this.handleKeyDown(e));
            
            // Global click to hide context menu
            document.addEventListener('click', (e) => {
                if (!this.contextMenu.contains(e.target)) {
                    this.hideContextMenu();
                }
            });
            
            // Wheel event for zooming
            this.svg.addEventListener('wheel', (e) => this.handleWheel(e));
        }
        
        // Event handlers will be implemented in the next part...
        handlePointerDown(e) {
            e.preventDefault();
            
            // Hide context menu on any click
            this.hideContextMenu();
            
            const point = this.getPointerPosition(e);
            this.lastPointerPosition = point;
            
            // Debug: Show click position (remove in production)
            if (window.SWW_DEBUG) {
                console.log('Click at:', point);
                this.showDebugPoint(point);
            }
            
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
            
            // Use SVG's built-in coordinate transformation for more accuracy
            if (this.svg.getScreenCTM) {
                const point = this.svg.createSVGPoint();
                point.x = clientX;
                point.y = clientY;
                const transformedPoint = point.matrixTransform(this.svg.getScreenCTM().inverse());
                return { x: transformedPoint.x, y: transformedPoint.y };
            }
            
            // Fallback method with improved calculation
            const relativeX = clientX - rect.left;
            const relativeY = clientY - rect.top;
            
            // Transform from screen coordinates to SVG coordinates
            const x = (relativeX / rect.width) * this.viewBox.width + this.viewBox.x;
            const y = (relativeY / rect.height) * this.viewBox.height + this.viewBox.y;
            
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
            
            // Don't set width/height initially - let it auto-size
            element.width = undefined;
            element.height = undefined;
            
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
                textAlign: this.toolSettings.textAlign,
                textColor: this.toolSettings.textColor,
                rotation: 0,
                locked: false,
                groupId: null
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
                        const markerId = this.createArrowMarker(element.strokeColor);
                        svg.setAttribute('marker-end', `url(#${markerId})`);
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
                    // Handle multi-line text with proper positioning
                    const textContent = element.text || '';
                    const lines = textContent.split('\n');
                    
                    // Position text within boundary if it has been resized
                    let textX = element.x;
                    let textY = element.y;
                    
                    if (element.width && element.height) {
                        // Position text with padding inside the boundary
                        textX = element.x + 10; // Left padding
                        textY = element.y + element.fontSize + 10; // Top padding + baseline
                    }
                    
                    svg.setAttribute('x', textX);
                    svg.setAttribute('y', textY);
                    svg.setAttribute('font-size', element.fontSize);
                    svg.setAttribute('font-family', element.fontFamily);
                    svg.setAttribute('fill', element.textColor || element.strokeColor); // Use textColor for fill
                    
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
                        if (element.width && element.height && element.textAlign) {
                            const lineWidth = this.measureText(line, element.fontSize, element.fontFamily).width;
                            const availableWidth = element.width - 20; // Account for padding
                            
                            switch (element.textAlign) {
                                case 'center':
                                    lineX = element.x + (element.width / 2) - (lineWidth / 2);
                                    break;
                                case 'right':
                                    lineX = element.x + element.width - 10 - lineWidth;
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
                    
                    // Add text boundary visualization if text has been resized
                    if (element.width && element.height) {
                        // Remove existing boundary rect
                        if (element.boundaryRect) {
                            element.boundaryRect.remove();
                        }
                        
                        // Create new boundary rect
                        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        rect.setAttribute('x', element.x);
                        rect.setAttribute('y', element.y);
                        rect.setAttribute('width', element.width);
                        rect.setAttribute('height', element.height);
                        rect.setAttribute('fill', 'rgba(240, 240, 240, 0.05)');
                        rect.setAttribute('stroke', 'rgba(200, 200, 200, 0.3)');
                        rect.setAttribute('stroke-width', '1');
                        rect.setAttribute('stroke-dasharray', '3,3');
                        rect.setAttribute('class', 'sww-text-boundary');
                        
                        // Insert the rect before the text
                        svg.parentNode.insertBefore(rect, svg);
                        element.boundaryRect = rect;
                    }
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
        
        createArrowMarker(strokeColor = '#000000') {
            // Create unique marker ID for each color
            const markerId = `arrowhead-${strokeColor.replace('#', '')}`;
            
            if (document.getElementById(markerId)) return markerId;
            
            const defs = this.svg.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            if (!this.svg.querySelector('defs')) {
                this.svg.appendChild(defs);
            }
            
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
            
            // Select the newly created element and switch to select tool
            this.clearSelection();
            this.selectElement(this.currentElement);
            
            // Clean up
            this.currentElement = null;
            this.isDrawing = false;
            
            // Auto-switch to select tool for better UX
            this.setTool('select');
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
                
                // Special handling for lines and arrows
                if (element.type === 'line' || element.type === 'arrow') {
                    // For lines/arrows, we need to handle resize differently
                    // The element represents a line from (x,y) to (x+width, y+height)
                    switch (this.resizeHandle) {
                        case 'se': // Moving end point
                            element.width = startWidth + dx;
                            element.height = startHeight + dy;
                            break;
                        case 'nw': // Moving start point
                            element.x = startX + dx;
                            element.y = startY + dy;
                            element.width = startWidth - dx;
                            element.height = startHeight - dy;
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
                                element.x = startX + dx;
                                element.y = startY + dy;
                                element.width = startWidth - dx;
                                element.height = startHeight - dy;
                            } else {
                                // Move end point
                                element.width = startWidth + dx;
                                element.height = startHeight + dy;
                            }
                            break;
                    }
                } else {
                    // Standard resize for rectangles, ellipses, diamonds, etc.
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
                
                // Special handling for text elements
                if (element.type === 'text') {
                    this.adjustTextToFitBounds(element);
                }
                
                this.updateSVGElement(element);
            });
            
            this.updateSelectionHandles();
        }
        
        adjustTextToFitBounds(element) {
            if (element.type !== 'text') return;
            
            const originalText = element.originalText || element.text || 'Text';
            element.originalText = originalText; // Store original text for re-wrapping
            
            const targetWidth = Math.abs(element.width) - 20; // Leave padding
            const targetHeight = Math.abs(element.height) - 20; // Leave padding
            
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
            
            // Hide properties panel if no selection, multiple elements, or grouped elements
            const hasGroupedSelection = Array.from(this.selectedElements).some(el => el.groupId);
            const hasMultipleSelection = this.selectedElements.size > 1;
            
            if (this.selectedElements.size === 0 || hasMultipleSelection || hasGroupedSelection) {
                this.propertiesPanel.classList.remove('visible');
                return;
            }
            
            // Show properties panel for single, non-grouped element
            this.propertiesPanel.classList.add('visible');
            
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
                    if (textColorInput) textColorInput.value = firstElement.textColor || firstElement.strokeColor;
                    
                    // Update text alignment buttons
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
            }
            
            // Update text properties visibility based on current selection
            this.updateTextPropertiesVisibility();
        }
        
        deleteSelectedElements() {
            // Filter out locked elements
            const elementsToDelete = Array.from(this.selectedElements).filter(element => !element.locked);
            
            elementsToDelete.forEach(element => {
                const index = this.elements.indexOf(element);
                if (index > -1) {
                    this.elements.splice(index, 1);
                }
                element.svgElement.remove();
                this.selectedElements.delete(element);
            });
            
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
            const hasTextSelection = Array.from(this.selectedElements).some(el => el.type === 'text');
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
            if (editItem) editItem.disabled = !hasTextSelection;
        }
        
        // Clipboard Methods
        copySelected() {
            if (this.selectedElements.size === 0) return;
            
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
            
            console.log(`Copied ${this.clipboard.length} elements to clipboard`);
        }
        
        pasteClipboard() {
            if (this.clipboard.length === 0) return;
            
            // Clear current selection
            this.clearSelection();
            
            // Create new elements from clipboard
            this.clipboard.forEach(elementData => {
                const newElement = {
                    ...elementData,
                    id: this.generateId(),
                    x: elementData.x + 20, // Additional offset each time
                    y: elementData.y + 20
                };
                
                // Create SVG element and add to canvas
                const svgElement = this.createSVGElement(newElement);
                newElement.svgElement = svgElement;
                this.elements.push(newElement);
                this.elementsGroup.appendChild(svgElement);
                
                // Select the new element
                this.selectElement(newElement);
            });
            
            console.log(`Pasted ${this.clipboard.length} elements from clipboard`);
        }
        
        editSelected() {
            // Find first text element in selection
            const textElement = Array.from(this.selectedElements).find(el => el.type === 'text');
            if (textElement) {
                this.startTextEditing(textElement);
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
            
            console.log(`Locked ${this.selectedElements.size} elements`);
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
            
            console.log(`Unlocked ${this.selectedElements.size} elements`);
        }
        
        // Layer Management Methods
        bringToFront() {
            if (this.selectedElements.size === 0) return;
            
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
                element.svgElement.remove();
                this.elementsGroup.appendChild(element.svgElement);
            }
            
            // Add elements to the end of the array (top layer)
            elementsToMove.forEach(({ element }) => {
                this.elements.push(element);
            });
            
            console.log(`Brought ${selectedArray.length} elements to front`);
        }
        
        sendToBack() {
            if (this.selectedElements.size === 0) return;
            
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
                element.svgElement.remove();
                this.elementsGroup.insertBefore(element.svgElement, this.elementsGroup.firstChild);
            });
            
            // Add elements to the beginning of the array (bottom layer)
            elementsToMove.reverse().forEach(({ element }) => {
                this.elements.unshift(element);
            });
            
            console.log(`Sent ${selectedArray.length} elements to back`);
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
                
                // Add appropriate resize handles based on element type
                if (element.type === 'line' || element.type === 'arrow') {
                    this.addLineResizeHandles(element);
                } else {
                    this.addResizeHandles(bounds);
                }
            });
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
                    // For text elements, initialize width/height if not set
                    if (!element.width || !element.height) {
                        const bounds = this.measureText(element.text || 'Text', element.fontSize, element.fontFamily);
                        element.width = bounds.width + 20; // Add padding
                        element.height = bounds.height + 10; // Add padding
                    }
                }
                
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
                // Use resized dimensions if available, otherwise calculate from text
                if (element.width && element.height) {
                    // Text element has been resized - use the defined bounds
                    return {
                        x: element.x,
                        y: element.y,
                        width: Math.abs(element.width),
                        height: Math.abs(element.height)
                    };
                } else {
                    // Text element hasn't been resized - calculate bounds from content
                    const text = element.text || 'Text';
                    const bounds = this.measureText(text, element.fontSize, element.fontFamily);
                    
                    // Simplified padding for better visibility and selection
                    const padding = element.fontSize * 0.15;
                    
                    return {
                        x: element.x - padding,
                        y: element.y - bounds.height - padding,
                        width: bounds.width + (padding * 2),
                        height: bounds.height + (padding * 2)
                    };
                }
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
                
                return {
                    x: minX - padding,
                    y: minY - padding,
                    width: (maxX - minX) + (padding * 2),
                    height: (maxY - minY) + (padding * 2)
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
                    // For lines, use increased tolerance for easier selection
                    const lineSelectionTolerance = Math.max(element.strokeWidth / 2 + 8, 12); // Minimum 12px for easy clicking
                    return this.distanceToLine(point, 
                        { x: element.x, y: element.y }, 
                        { x: element.x + element.width, y: element.y + element.height }
                    ) <= lineSelectionTolerance;
                    
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
            this.selectedElements.forEach(element => {
                // Only update the specific property
                if (propertyName === 'fontSize' && element.type === 'text') {
                    element.fontSize = value;
                } else if (propertyName === 'fontFamily' && element.type === 'text') {
                    element.fontFamily = value;
                } else if (propertyName === 'textAlign' && element.type === 'text') {
                    element.textAlign = value;
                } else if (propertyName === 'textColor' && element.type === 'text') {
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
                }
                
                this.updateSVGElement(element);
            });
        }
        
        updateTextPropertiesVisibility() {
            if (!this.propertiesPanel) return;
            
            const textPropertiesSection = this.propertiesPanel.querySelector('.sww-text-properties');
            if (!textPropertiesSection) return;
            
            // Check if any selected elements are text elements
            const hasTextElements = Array.from(this.selectedElements).some(element => element.type === 'text');
            
            // Show or hide text properties based on selection
            if (hasTextElements) {
                textPropertiesSection.style.display = 'block';
            } else {
                textPropertiesSection.style.display = 'none';
            }
        }
        
        // Text editing
        startTextEditing(element) {
            const textEditor = document.createElement('textarea');
            textEditor.className = 'sww-text-editor';
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
            
            textEditor.style.position = 'fixed';
            textEditor.style.left = `${screenPoint.x}px`;
            textEditor.style.top = `${screenPoint.y}px`;
            textEditor.style.width = `${editorWidth}px`;
            textEditor.style.height = `${editorHeight}px`;
            textEditor.style.fontSize = `${element.fontSize}px`;
            textEditor.style.fontFamily = element.fontFamily;
            textEditor.style.border = '2px solid #007bff';
            textEditor.style.background = 'rgba(255, 255, 255, 0.9)';
            textEditor.style.resize = 'none';
            textEditor.style.overflow = 'hidden';
            textEditor.style.whiteSpace = 'pre-wrap'; // Preserve line breaks
            textEditor.style.wordWrap = 'break-word';
            textEditor.style.padding = '10px'; // Match text boundary padding
            textEditor.style.boxSizing = 'border-box';
            textEditor.style.zIndex = '10000'; // Ensure it's on top
            
            // Set text alignment to match element alignment
            if (element.textAlign) {
                textEditor.style.textAlign = element.textAlign;
            }
            
            document.body.appendChild(textEditor);
            textEditor.focus();
            textEditor.select();
            
            let isEditing = true; // Flag to prevent double cleanup
            
            // Declare click-outside handler first
            let handleClickOutside;
            
            const finishEditing = () => {
                if (!isEditing) return; // Prevent double execution
                isEditing = false;
                
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
                
                // Safely remove the textarea
                if (textEditor.parentNode) {
                    textEditor.remove();
                }
                
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
            };
            
            const cancelEditing = () => {
                if (!isEditing) return; // Prevent double execution
                isEditing = false;
                
                // Safely remove the textarea without saving changes
                if (textEditor.parentNode) {
                    textEditor.remove();
                }
                
                // Clean up click-outside listener
                if (handleClickOutside) {
                    document.removeEventListener('click', handleClickOutside);
                }
                
                // Auto-switch to select tool even when canceling for better UX
                if (this.currentTool === 'text') {
                    this.setTool('select');
                }
            };
            
            // Enhanced auto-resize function
            const autoResize = () => {
                if (!textEditor.parentNode) return;
                
                // Reset dimensions to get accurate measurements
                textEditor.style.height = 'auto';
                textEditor.style.width = 'auto';
                
                // Calculate required dimensions
                const content = textEditor.value || textEditor.placeholder || '';
                const lines = content.split('\n');
                const maxLineLength = Math.max(...lines.map(line => line.length));
                
                // Calculate width based on content
                const charWidth = element.fontSize * 0.6; // Approximate character width
                const contentWidth = Math.max(maxLineLength * charWidth, 100); // Minimum 100px
                const finalWidth = Math.min(contentWidth, 400); // Maximum 400px
                
                // Calculate height based on scroll height
                const finalHeight = Math.max(textEditor.scrollHeight, element.fontSize * 1.2);
                
                // Apply calculated dimensions
                textEditor.style.width = finalWidth + 'px';
                textEditor.style.height = finalHeight + 'px';
            };
            
            // Add input event listener for real-time resizing
            textEditor.addEventListener('input', autoResize);
            
            textEditor.addEventListener('blur', finishEditing);
            textEditor.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    finishEditing();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelEditing();
                }
                
                // Auto-resize on keydown for immediate feedback
                setTimeout(autoResize, 0);
            });
            
            // Add click-outside listener for intuitive editing
            handleClickOutside = (e) => {
                // Check if click is outside the textarea
                if (!textEditor.contains(e.target) && textEditor.parentNode) {
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
            
            // Initial resize to fit existing content
            autoResize();
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
            
            const groupId = this.generateId();
            
            this.selectedElements.forEach(element => {
                element.groupId = groupId;
                // Add visual indication for grouped elements using CSS class
                const currentClass = element.svgElement.getAttribute('class') || '';
                if (!currentClass.includes('sww-grouped')) {
                    element.svgElement.setAttribute('class', currentClass + ' sww-grouped');
                }
            });
            
            console.log(`Grouped ${this.selectedElements.size} elements with ID: ${groupId}`);
        }
        
        ungroupSelected() {
            if (this.selectedElements.size === 0) return;
            
            this.selectedElements.forEach(element => {
                if (element.groupId) {
                    // Find all elements in the same group
                    const groupElements = this.elements.filter(el => el.groupId === element.groupId);
                    
                    // Remove group from all elements in the group
                    groupElements.forEach(groupEl => {
                        groupEl.groupId = null;
                        // Remove visual indication using CSS class
                        const currentClass = groupEl.svgElement.getAttribute('class') || '';
                        groupEl.svgElement.setAttribute('class', currentClass.replace('sww-grouped', '').trim());
                    });
                }
            });
            
            console.log('Ungrouped selected elements');
        }
        
        clearAll() {
            this.elements = [];
            this.selectedElements.clear();
            this.elementsGroup.innerHTML = '';
            this.clearSelectionHandles();
            this.updateTextPropertiesVisibility();
        }
        
        // Debug method to visualize click positions
        showDebugPoint(point) {
            // Remove previous debug point
            const existingDebug = this.svg.querySelector('.debug-point');
            if (existingDebug) existingDebug.remove();
            
            // Create debug point
            const debugPoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            debugPoint.setAttribute('class', 'debug-point');
            debugPoint.setAttribute('cx', point.x);
            debugPoint.setAttribute('cy', point.y);
            debugPoint.setAttribute('r', '3');
            debugPoint.setAttribute('fill', 'red');
            debugPoint.setAttribute('stroke', 'white');
            debugPoint.setAttribute('stroke-width', '1');
            this.svg.appendChild(debugPoint);
            
            // Remove after 2 seconds
            setTimeout(() => {
                if (debugPoint.parentNode) debugPoint.remove();
            }, 2000);
        }
    }
    
    // Expose to global scope
    global.sww = SWW;
    
})(typeof window !== 'undefined' ? window : this);
