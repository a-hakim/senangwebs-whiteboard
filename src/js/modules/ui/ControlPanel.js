/**
 * ControlPanel.js
 * Control panel utilities - theme switching, preview mode, notifications
 * Part of Phase 5: UI Panels
 * 
 * Provides methods for:
 * - Theme switching (dark/light mode)
 * - Preview mode (presentation mode with locked elements)
 * - Notification system
 * - Panel state management
 */

export const ControlPanelMixin = {
    /**
     * Apply theme colors to the UI
     * Sets CSS custom properties for consistent theming
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
        
        // Set CSS variables on the container
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
     * Set the panel mode (light or dark) and update theme colors
     * @param {string} mode - 'light' or 'dark'
     * @returns {string} The current panel mode
     */
    setPanelMode(mode) {
        if (mode !== 'light' && mode !== 'dark') {
            console.warn('Invalid panel mode. Use "light" or "dark".');
            return this.options.panelMode;
        }
        
        this.options.panelMode = mode;
        
        // Update default colors based on the new mode
        const defaultColors = mode === 'light' ? {
            panelBackgroundColor: '#ffffff',
            panelTextColor: '#1f2937',
            accentColor: '#3b82f6',
            secondaryAccentColor: '#2563eb'
        } : {
            panelBackgroundColor: '#18181b',
            panelTextColor: '#ffffff',
            accentColor: '#00FF99',
            secondaryAccentColor: '#007370'
        };
        
        // Update colors
        this.options.panelBackgroundColor = defaultColors.panelBackgroundColor;
        this.options.panelTextColor = defaultColors.panelTextColor;
        this.options.accentColor = defaultColors.accentColor;
        this.options.secondaryAccentColor = defaultColors.secondaryAccentColor;
        
        // Re-apply theme colors
        this.applyThemeColors();
        
        return this.options.panelMode;
    },

    /**
     * Enter preview mode - lock all elements and fit to view
     * Useful for presentation/viewing without editing
     */
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
        
        // Enable browser-frame fullscreen
        this.enableBrowserFrameFullscreen();
        
        // Dispatch preview mode event
        this.container.dispatchEvent(new CustomEvent('previewModeEntered'));
        
        // Update button state if method exists
        if (this.updatePreviewButtonState) {
            this.updatePreviewButtonState();
        }
    },

    /**
     * Exit preview mode - restore editing capabilities
     */
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
        
        // Update button state if method exists
        if (this.updatePreviewButtonState) {
            this.updatePreviewButtonState();
        }
    },

    /**
     * Fit canvas view to show all elements optimally
     */
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
    },

    /**
     * Lock all elements (used in preview mode)
     */
    lockAllElements() {
        this.previewModeLockedElements = [];
        this.elements.forEach(element => {
            if (!element.locked) {
                element.locked = true;
                this.previewModeLockedElements.push(element.id);
            }
        });
    },

    /**
     * Unlock all elements that were locked by preview mode
     */
    unlockAllElements() {
        if (!this.previewModeLockedElements) return;
        
        this.elements.forEach(element => {
            if (this.previewModeLockedElements.includes(element.id)) {
                element.locked = false;
            }
        });
        
        this.previewModeLockedElements = [];
    },

    /**
     * Enable browser-frame fullscreen (not native fullscreen API)
     * Expands container to fill browser window
     */
    enableBrowserFrameFullscreen() {
        document.body.classList.add('sww-browser-fullscreen');
        this.isBrowserFrameFullscreen = true;
    },

    /**
     * Disable browser-frame fullscreen
     */
    disableBrowserFrameFullscreen() {
        document.body.classList.remove('sww-browser-fullscreen');
        this.isBrowserFrameFullscreen = false;
        
        // Force style reset on body
        document.body.style.background = '';
        document.body.style.overflow = '';
    },

    /**
     * Show notification toast message
     * @param {string} message - The message to display
     * @param {string} type - Notification type: 'info', 'success', 'warning', 'error', 'copy', 'paste'
     * @param {number} duration - How long to show notification in milliseconds
     */
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
            case 'success':
                notification.style.backgroundColor = '#e8f5e9';
                notification.style.color = '#2e7d32';
                notification.style.border = '1px solid #c8e6c9';
                break;
            case 'error':
                notification.style.backgroundColor = '#ffebee';
                notification.style.color = '#c62828';
                notification.style.border = '1px solid #ffcdd2';
                break;
            case 'copy':
                notification.style.backgroundColor = '#e3f2fd';
                notification.style.color = '#1976d2';
                notification.style.border = '1px solid #bbdefb';
                break;
            case 'paste':
                notification.style.backgroundColor = '#e8f5e9';
                notification.style.color = '#2e7d32';
                notification.style.border = '1px solid #c8e6c9';
                break;
            case 'warning':
                notification.style.backgroundColor = '#fff3e0';
                notification.style.color = '#f57c00';
                notification.style.border = '1px solid #ffcc80';
                break;
            default: // info
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
    },

    /**
     * Clear all elements and reset canvas
     */
    clearAll() {
        this.saveStateToHistory('clearAll');
        this.elements = [];
        this.selectedElements.clear();
        
        if (this.elementsGroup) {
            this.elementsGroup.innerHTML = '';
        }
        
        this.clearSelectionHandles();
        
        if (this.updateTextPropertiesVisibility) {
            this.updateTextPropertiesVisibility();
        }
        
        // Clear the spatial index to prevent ghost element detection
        if (this.spatialIndex) {
            this.spatialIndex.clear();
        }
        
        // Update control panel if it exists
        if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
            window.swwControlPanel.updateLayers();
        }
    },

    /**
     * Cleanup all resources and event listeners
     * Should be called when destroying the instance
     */
    cleanup() {
        // Clean up all elements
        this.elements.forEach(element => {
            if (this.cleanupElement) {
                this.cleanupElement(element);
            }
        });
        
        // Clear collections
        this.elements = [];
        this.selectedElements.clear();
        
        if (this.visibleElements) {
            this.visibleElements.clear();
        }
        
        if (this.spatialIndex) {
            this.spatialIndex.clear();
        }
        
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
        
        // Remove event listeners
        if (this.previewModeKeyHandler) {
            document.removeEventListener('keydown', this.previewModeKeyHandler);
            this.previewModeKeyHandler = null;
        }
        if (this.fullscreenChangeHandler) {
            document.removeEventListener('keydown', this.fullscreenChangeHandler);
            this.fullscreenChangeHandler = null;
        }
        
        // Exit preview mode if active
        if (this.isPreviewMode) {
            this.exitPreviewMode();
        }
        
        // Clean up fullscreen classes
        if (this.isBrowserFrameFullscreen) {
            this.disableBrowserFrameFullscreen();
        }
    }
};
