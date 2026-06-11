/**
 * ToolManager.js
 * Handles tool switching, tool state management, and tool settings
 */

export const ToolManagerMixin = {
    /**
     * Available font families for text tool
     */
    FONT_FAMILIES: [
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
    ],

    /**
     * Initialize tool system
     * Called from constructor
     */
    initializeToolSystem() {
        // Current active tool
        this.currentTool = 'select';
        
        // Tool drawing state
        this.isDrawing = false;
        this.currentElement = null;
        
        // Tool settings - shared across all tools
        this.toolSettings = {
            // Stroke settings
            strokeColor: '#000000',
            strokeWidth: 2,
            
            // Fill settings
            fillColor: 'transparent',
            fillStyle: 'solid', // 'solid', 'gradient', 'hatch'
            opacity: 1,
            
            // Gradient settings
            gradientType: 'linear', // 'linear' or 'radial'
            gradientStops: [
                { offset: 0, color: '#000000' },
                { offset: 100, color: '#ffffff' }
            ],
            
            // Text settings
            fontSize: 16,
            fontFamily: 'Arial',
            textAlign: 'left',
            textColor: '#000000'
        };
        
        // Tool-specific state
        this.toolState = {
            // Arrow tool
            arrowStartMarker: false,
            arrowEndMarker: true,
            
            // Draw tool (freehand)
            drawSmoothing: true,
            drawSimplification: true,
            
            // Shape tools
            shapeCornerRadius: 0,
            
            // Line tool
            lineStyle: 'solid' // 'solid', 'dashed', 'dotted'
        };
    },

    /**
     * Switch to a different drawing tool
     * @param {string} toolName - Name of the tool to activate
     */
    setTool(toolName) {
        // Validate tool name
        const validTools = [
            'select', 'rectangle', 'ellipse', 'diamond', 'parallelogram', 'star',
            'arrow', 'line', 'text', 'draw', 'website', 'image', 'markdown', 'table'
        ];
        
        if (!validTools.includes(toolName)) {
            console.warn(`Invalid tool name: ${toolName}`);
            return;
        }
        
        // Clear any active drawing
        if (this.isDrawing) {
            this.cancelCurrentDrawing();
        }
        
        // Update current tool
        const previousTool = this.currentTool;
        this.currentTool = toolName;
        
        // Update toolbar button states - only target tool buttons with data-tool attribute
        this.container.querySelectorAll('.sww-tool-button[data-tool]').forEach(button => {
            button.classList.remove('active');
            if (button.getAttribute('data-tool') === toolName) {
                button.classList.add('active');
            }
        });
        
        // Update control panel action buttons (legacy support)
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
        
        // Update cursor based on tool
        const cursor = toolName === 'select' ? 'default' : 'crosshair';
        this.setCursor(cursor);
        
        // Tool-specific initialization
        this.onToolChanged(toolName, previousTool);
        
        // Trigger custom event for extensions
        this.container.dispatchEvent(new CustomEvent('sww:toolChanged', {
            detail: { tool: toolName, previousTool }
        }));
    },

    /**
     * Hook called when tool changes
     * Can be overridden by extensions or specific tool modules
     * @param {string} newTool - Newly activated tool
     * @param {string} previousTool - Previously active tool
     */
    onToolChanged(newTool, previousTool) {
        // Clear selection when switching from select tool
        if (previousTool === 'select' && newTool !== 'select') {
            // Optionally clear selection
            // this.clearSelection();
        }
        
        // Tool-specific setup
        switch (newTool) {
            case 'text':
                // Ensure text settings are initialized
                if (!this.toolSettings.fontSize) {
                    this.toolSettings.fontSize = 16;
                }
                if (!this.toolSettings.fontFamily) {
                    this.toolSettings.fontFamily = 'Arial';
                }
                break;
                
            case 'arrow':
                // Ensure arrow markers are configured
                if (this.toolState.arrowStartMarker === undefined) {
                    this.toolState.arrowStartMarker = false;
                }
                if (this.toolState.arrowEndMarker === undefined) {
                    this.toolState.arrowEndMarker = true;
                }
                break;
                
            case 'draw':
                // Ensure draw settings are initialized
                if (this.toolState.drawSmoothing === undefined) {
                    this.toolState.drawSmoothing = true;
                }
                break;
        }
    },

    /**
     * Cancel the current drawing operation
     */
    cancelCurrentDrawing() {
        if (this.currentElement && this.currentElement.svgElement) {
            // Remove the incomplete element from DOM
            this.currentElement.svgElement.remove();
        }
        
        // Reset drawing state
        this.isDrawing = false;
        this.currentElement = null;
        
        // Reset cursor
        this.setCursor(this.currentTool === 'select' ? 'default' : 'crosshair');
    },

    /**
     * Get current tool name
     * @returns {string} Current tool name
     */
    getCurrentTool() {
        return this.currentTool;
    },

    /**
     * Check if a specific tool is active
     * @param {string} toolName - Tool name to check
     * @returns {boolean} True if the tool is active
     */
    isToolActive(toolName) {
        return this.currentTool === toolName;
    },

    /**
     * Get tool settings for a specific property
     * @param {string} property - Property name
     * @returns {*} Property value
     */
    getToolSetting(property) {
        return this.toolSettings[property];
    },

    /**
     * Update tool setting
     * @param {string} property - Property name
     * @param {*} value - New value
     */
    setToolSetting(property, value) {
        if (this.toolSettings.hasOwnProperty(property)) {
            this.toolSettings[property] = value;
            
            // Update properties panel if visible
            if (this.propertiesPanel && !this.propertiesPanel.classList.contains('collapsed')) {
                this.updatePropertiesPanel();
            }
            
            // Apply to selected elements if any
            if (this.selectedElements.size > 0) {
                this.applySettingToSelectedElements(property, value);
            }
            
            // Trigger custom event
            this.container.dispatchEvent(new CustomEvent('sww:toolSettingChanged', {
                detail: { property, value }
            }));
        }
    },

    /**
     * Update multiple tool settings at once
     * @param {Object} settings - Object with property-value pairs
     */
    setToolSettings(settings) {
        Object.keys(settings).forEach(property => {
            if (this.toolSettings.hasOwnProperty(property)) {
                this.toolSettings[property] = settings[property];
            }
        });
        
        // Update UI once after all changes
        if (this.propertiesPanel && !this.propertiesPanel.classList.contains('collapsed')) {
            this.updatePropertiesPanel();
        }
        
        // Trigger custom event
        this.container.dispatchEvent(new CustomEvent('sww:toolSettingsChanged', {
            detail: { settings }
        }));
    },

    /**
     * Apply a tool setting to currently selected elements
     * @param {string} property - Property name
     * @param {*} value - New value
     */
    applySettingToSelectedElements(property, value) {
        if (this.selectedElements.size === 0) return;
        
        // Map tool setting to element property
        const propertyMap = {
            strokeColor: 'strokeColor',
            strokeWidth: 'strokeWidth',
            fillColor: 'fillColor',
            fillStyle: 'fillStyle',
            opacity: 'opacity',
            fontSize: 'fontSize',
            fontFamily: 'fontFamily',
            textColor: 'textColor',
            textAlign: 'textAlign'
        };
        
        const elementProperty = propertyMap[property];
        if (!elementProperty) return;
        
        // Update each selected element
        this.selectedElements.forEach(element => {
            element[elementProperty] = value;
            
            // Update SVG representation
            if (element.svgElement) {
                this.updateSVGElement(element);
            }
        });
        
        // Save state for undo
        this.saveStateToHistory('modify');
    },

    /**
     * Get all tool settings
     * @returns {Object} Tool settings object
     */
    getAllToolSettings() {
        return { ...this.toolSettings };
    },

    /**
     * Reset tool settings to defaults
     */
    resetToolSettings() {
        this.toolSettings = {
            strokeColor: '#000000',
            strokeWidth: 2,
            fillColor: 'transparent',
            fillStyle: 'solid',
            opacity: 1,
            gradientType: 'linear',
            gradientStops: [
                { offset: 0, color: '#000000' },
                { offset: 100, color: '#ffffff' }
            ],
            fontSize: 16,
            fontFamily: 'Arial',
            textAlign: 'left',
            textColor: '#000000'
        };
        
        // Update properties panel
        if (this.propertiesPanel && !this.propertiesPanel.classList.contains('collapsed')) {
            this.updatePropertiesPanel();
        }
    },

    /**
     * Check if current tool is a shape tool
     * @returns {boolean} True if current tool draws shapes
     */
    isShapeTool() {
        const shapeTools = ['rectangle', 'ellipse', 'diamond', 'parallelogram', 'star'];
        return shapeTools.includes(this.currentTool);
    },

    /**
     * Check if current tool is a line tool
     * @returns {boolean} True if current tool draws lines
     */
    isLineTool() {
        const lineTools = ['line', 'arrow'];
        return lineTools.includes(this.currentTool);
    },

    /**
     * Check if current tool creates text
     * @returns {boolean} True if current tool is text
     */
    isTextTool() {
        return this.currentTool === 'text';
    },

    /**
     * Check if current tool is freehand drawing
     * @returns {boolean} True if current tool is draw
     */
    isDrawTool() {
        return this.currentTool === 'draw';
    },

    /**
     * Check if current tool embeds content
     * @returns {boolean} True if current tool embeds content
     */
    isEmbedTool() {
        const embedTools = ['website', 'image', 'markdown', 'table'];
        return embedTools.includes(this.currentTool);
    },
};
