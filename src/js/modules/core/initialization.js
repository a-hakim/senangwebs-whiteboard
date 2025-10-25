/**
 * Initialization Mixin for SWWInstance
 * Handles instance initialization, theme setup, and performance optimization setup
 */

import { PerformanceUtils } from '../utils/PerformanceUtils.js';

export const InitializationMixin = {
    /**
     * Main initialization method
     * Sets up UI, event listeners, and performance optimizations
     */
    init() {
        this.createUI();
        this.setupEventListeners();
        
        // Apply theme colors
        this.applyThemeColors();
        
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
    },

    /**
     * Initialize performance optimization systems
     * - Viewport observer for culling
     * - Spatial indexing for hit testing
     * - Throttled updates for smooth UI
     */
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
    },

    /**
     * Set up viewport observer for element culling
     * Uses ResizeObserver to trigger updates when container size changes
     */
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
    },

    /**
     * Set up performance monitoring for large scenes
     * Activates optimized render loop for scenes with >200 elements
     */
    setupPerformanceMonitoring() {
        if (this.elements.length > 200) {
            this.setupOptimizedRenderLoop();
        }
    },

    /**
     * Create optimized render loop for large scenes
     * Limits FPS to 30 and uses LOD rendering
     */
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
    },

    /**
     * Perform optimized render pass
     * Only renders visible elements with level-of-detail optimization
     */
    performOptimizedRender() {
        // Only render visible elements with LOD
        this.visibleElements.forEach(element => {
            this.updateSVGElementWithLOD(element);
        });
    },

    /**
     * Rebuild spatial index from scratch
     * Called during initialization and after bulk operations
     */
    rebuildSpatialIndex() {
        this.spatialIndex.clear();
        this.elements.forEach(element => {
            const bounds = this.getElementBounds(element);
            this.spatialIndex.insert(element, bounds);
        });
    },

    /**
     * Apply theme colors to CSS custom properties
     * Supports both light and dark modes with customizable accent colors
     */
    applyThemeColors() {
        // Apply CSS custom properties for theme colors
        if (!this.svg) return;
        
        // Helper function to convert hex to RGB
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };
        
        // Set CSS variables on the SVG container or a parent element
        const container = this.container;
        if (container) {
            container.style.setProperty('--sww-panel-bg', this.options.panelBackgroundColor);
            container.style.setProperty('--sww-panel-text', this.options.panelTextColor);
            container.style.setProperty('--sww-accent-color', this.options.accentColor);
            container.style.setProperty('--sww-secondary-accent', this.options.secondaryAccentColor);
            container.setAttribute('data-panel-mode', this.options.panelMode);
            
            // Convert secondary accent to RGB for alpha transparency usage
            const rgb = hexToRgb(this.options.secondaryAccentColor);
            if (rgb) {
                container.style.setProperty('--sww-secondary-accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
            }
            
            // Set mode-specific derived colors
            if (this.options.panelMode === 'light') {
                container.style.setProperty('--sww-panel-border', '#e5e7eb');
                container.style.setProperty('--sww-panel-hover', '#f3f4f6');
                container.style.setProperty('--sww-panel-active', '#e5e7eb');
                container.style.setProperty('--sww-panel-shadow', 'rgba(0, 0, 0, 0.1)');
            } else {
                container.style.setProperty('--sww-panel-border', '#27272a');
                container.style.setProperty('--sww-panel-hover', '#27272a');
                container.style.setProperty('--sww-panel-active', '#3f3f46');
                container.style.setProperty('--sww-panel-shadow', 'rgba(0, 0, 0, 0.3)');
            }
        }
        
        // Also set on document root for global access
        document.documentElement.style.setProperty('--sww-panel-bg', this.options.panelBackgroundColor);
        document.documentElement.style.setProperty('--sww-panel-text', this.options.panelTextColor);
        document.documentElement.style.setProperty('--sww-accent-color', this.options.accentColor);
        document.documentElement.style.setProperty('--sww-secondary-accent', this.options.secondaryAccentColor);
        document.documentElement.setAttribute('data-panel-mode', this.options.panelMode);
        
        // Convert secondary accent to RGB for alpha transparency usage
        const rgb = hexToRgb(this.options.secondaryAccentColor);
        if (rgb) {
            document.documentElement.style.setProperty('--sww-secondary-accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
        }
        
        // Set mode-specific derived colors on document root
        if (this.options.panelMode === 'light') {
            document.documentElement.style.setProperty('--sww-panel-border', '#e5e7eb');
            document.documentElement.style.setProperty('--sww-panel-hover', '#f3f4f6');
            document.documentElement.style.setProperty('--sww-panel-active', '#e5e7eb');
            document.documentElement.style.setProperty('--sww-panel-shadow', 'rgba(0, 0, 0, 0.1)');
        } else {
            document.documentElement.style.setProperty('--sww-panel-border', '#27272a');
            document.documentElement.style.setProperty('--sww-panel-hover', '#27272a');
            document.documentElement.style.setProperty('--sww-panel-active', '#3f3f46');
            document.documentElement.style.setProperty('--sww-panel-shadow', 'rgba(0, 0, 0, 0.3)');
        }
    },

    /**
     * Update visible elements based on viewport
     * Implements viewport culling for performance
     */
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
    },

    /**
     * Check if element bounds intersect with view bounds
     */
    isElementInBounds(elementBounds, viewBounds) {
        return !(elementBounds.x > viewBounds.x + viewBounds.width ||
                 elementBounds.x + elementBounds.width < viewBounds.x ||
                 elementBounds.y > viewBounds.y + viewBounds.height ||
                 elementBounds.y + elementBounds.height < viewBounds.y);
    }
};
