/**
 * Element Management Mixin for SWWInstance
 * Handles adding, removing, and updating elements in the scene
 */

export const ElementManagementMixin = {
    /**
     * Add element to the scene and spatial index
     * @param {Object} element - Element object to add
     */
    addElement(element, { emit = false } = {}) {
        if (!element || this.elementsById.has(element.id)) return element;
        this.elements.push(element);
        this.elementsById.set(element.id, element);
        const bounds = this.getElementBounds(element);
        this.spatialIndex.insert(element, bounds);
        
        // Add SVG element to DOM (critical for visibility!)
        if (element.svgElement && element.svgElement.parentNode !== this.elementsGroup) {
            this.addSVGElementToDOM(element);
        }

        this.applyElementVisibility(element);
        
        // Update viewport if needed
        if (this.elements.length > 100) {
            this.debouncedViewportUpdate();
        }
        
        this.updateControlPanelLayers();
        if (emit) this.emitSceneChanged("addElement", [element.id]);
        return element;
    },

    /**
     * Remove element from the scene and spatial index
     * @param {Object} element - Element object to remove
     */
    removeElement(element) {
        const index = this.elements.indexOf(element);
        if (index !== -1) {
            this.elements.splice(index, 1);
            this.elementsById.delete(element.id);
            this.spatialIndex.remove(element);
            this.syncTableTools?.();
            
            // Clean up SVG element
            if (element.svgElement && element.svgElement.parentNode) {
                element.svgElement.parentNode.removeChild(element.svgElement);
            }
            
            this.updateControlPanelLayers();
        }
    },

    /**
     * Add SVG element to DOM and handle pending boundary rects
     * @param {Object} element - Element with svgElement to add to DOM
     */
    addSVGElementToDOM(element) {
        this.elementsGroup.appendChild(element.svgElement);
        
        // Handle pending boundary rect for text elements
        if (element.pendingBoundaryRect) {
            this.elementsGroup.insertBefore(element.pendingBoundaryRect, element.svgElement);
            element.boundaryRect = element.pendingBoundaryRect;
            delete element.pendingBoundaryRect;
        }
    },

    /**
     * Update element's position in spatial index
     * @param {Object} element - Element that moved or changed size
     */
    updateElementInSpatialIndex(element) {
        // Remove from old position and add to new position
        this.spatialIndex.remove(element);
        const bounds = this.getElementBounds(element);
        this.spatialIndex.insert(element, bounds);
    },

    applyElementVisibility(element) {
        if (!element || !element.svgElement) return;
        const isVisible = element.visible !== false;
        element.svgElement.style.display = isVisible ? "block" : "none";
        element.svgElement.classList.toggle("sww-hidden", !isVisible);
    },

    updateControlPanelLayers() {
        const controlPanel = this.controlPanel || this.options.controlPanel;
        if (controlPanel && typeof controlPanel.updateLayers === "function") {
            controlPanel.updateLayers();
        }
    },

    emitSceneChanged(actionType, affectedElementIds = []) {
        if (this.isDestroyed || !this.container) return;
        this.sceneRevision += 1;
        this.container.dispatchEvent(new CustomEvent("sww:sceneChanged", {
            detail: {
                actionType,
                affectedElementIds,
                revision: this.sceneRevision,
            },
        }));
    },

    emitSelectionChanged() {
        if (this.isDestroyed || !this.container) return;
        this.container.dispatchEvent(new CustomEvent("sww:selectionChanged", {
            detail: {
                selectedElements: Array.from(this.selectedElements),
                selectedElementIds: Array.from(this.selectedElements, (element) => element.id),
            },
        }));
    },

    /**
     * Create a new element object with default properties
     * @param {String} type - Element type (rectangle, ellipse, etc.)
     * @param {Object} point - Starting point {x, y}
     * @returns {Object} New element object
     */
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
        } else if (['website', 'image', 'markdown', 'table'].includes(type)) {
            defaultStrokeWidth = 2;  // Website, image, markdown, and table elements have 2px default stroke width
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
            width: ['website', 'image', 'markdown'].includes(type) ? 300 : (type === 'table' ? 400 : 0),
            height: ['website', 'image', 'markdown'].includes(type) ? 200 : (type === 'table' ? 200 : 0),
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
        } else if (type === 'table') {
            element.tableData = {
                headers: ['Header 1', 'Header 2', 'Header 3'],
                rows: [['', '', ''], ['', '', '']],
            };
            element.text = 'Table';
        }
        
        element.svgElement = this.createSVGElement(element);
        return element;
    }
};
