/**
 * Element Management Mixin for SWWInstance
 * Handles adding, removing, and updating elements in the scene
 */

import { PerformanceUtils } from '../utils/PerformanceUtils.js';

export const ElementManagementMixin = {
    /**
     * Add element to the scene and spatial index
     * @param {Object} element - Element object to add
     */
    addElement(element) {
        this.elements.push(element);
        const bounds = this.getElementBounds(element);
        this.spatialIndex.insert(element, bounds);
        
        // Add SVG element to DOM (critical for visibility!)
        if (element.svgElement) {
            this.addSVGElementToDOM(element);
        }
        
        // Update viewport if needed
        if (this.elements.length > 100) {
            this.debouncedViewportUpdate();
        }
        
        // Update control panel if available
        if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
            window.swwControlPanel.updateLayers();
        }
    },

    /**
     * Remove element from the scene and spatial index
     * @param {Object} element - Element object to remove
     */
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

    /**
     * Get level of detail for element based on screen size
     * @param {Object} element - Element to check
     * @returns {string} LOD level: 'hidden', 'simple', 'medium', or 'full'
     */
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
    },

    /**
     * Update SVG element with level-of-detail optimization
     * @param {Object} element - Element to update
     */
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
    },

    /**
     * Update element with medium level of detail
     * @param {Object} element - Element to update
     */
    updateSVGElementMediumDetail(element) {
        // Medium LOD - simplified but recognizable
        if (element.svgElement.setAttribute) {
            element.svgElement.setAttribute('stroke', element.strokeColor);
            element.svgElement.setAttribute('stroke-width', Math.max(1, element.strokeWidth / 2));
            element.svgElement.setAttribute('fill', element.fillColor);
            element.svgElement.setAttribute('opacity', element.opacity);
        }
    }
};
