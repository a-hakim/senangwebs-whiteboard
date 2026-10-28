/**
 * Theme Manager
 * 
 * Handles dark/light theme switching and color management
 */

import { THEME_COLORS } from '../utils/constants.js';

export const ThemeManagerMixin = {
    /**
     * Set panel display mode (dark/light theme)
     * @param {string} mode - 'light' or 'dark'
     * @returns {string} Current panel mode
     */
    setPanelMode(mode) {
        if (mode !== 'light' && mode !== 'dark') {
            console.warn('Invalid panel mode. Use "light" or "dark".');
            return;
        }
        
        const previousColors = THEME_COLORS[this.options.panelMode] || THEME_COLORS.dark;
        this.options.panelMode = mode;
        
        // Update default colors based on the new mode if custom colors weren't explicitly set
        const defaultColors = THEME_COLORS[mode];
        
        // Only update colors if they match the previous mode's defaults
        // This preserves custom colors that were explicitly set
        for (const [key, value] of Object.entries(defaultColors)) {
            if (this.options[key] === undefined || this.options[key] === previousColors[key]) {
                this.options[key] = value;
            }
        }
        
        // Re-apply theme colors
        this.applyThemeColors();
        
        return this.options.panelMode;
    },

    /**
     * Apply theme colors to UI elements
     * @private
     */
    applyThemeColors() {
        if (!this.container) return;
        
        const root = this.container;
        
        // Set CSS custom properties for theming
        root.style.setProperty('--sww-panel-bg', this.options.panelBackgroundColor);
        root.style.setProperty('--sww-panel-text', this.options.panelTextColor);
        root.style.setProperty('--sww-accent-color', this.options.accentColor);
        root.style.setProperty('--sww-secondary-accent', this.options.secondaryAccentColor);
        root.style.setProperty('--sww-panel-border', this.options.panelBorder || (this.options.panelMode === 'light' ? '#e5e7eb' : '#27272a'));
        root.style.setProperty('--sww-panel-hover', this.options.panelHover || (this.options.panelMode === 'light' ? '#f3f4f6' : '#27272a'));
        root.style.setProperty('--sww-panel-active', this.options.panelActive || (this.options.panelMode === 'light' ? '#e5e7eb' : '#3f3f46'));
        
        // Update panel backgrounds if they exist
        const panels = [
            this.propertiesPanel,
            this.layersPanel,
            this.exportDialog
        ].filter(Boolean);
        
        panels.forEach(panel => {
            if (panel) {
                panel.style.backgroundColor = this.options.panelBackgroundColor;
                panel.style.color = this.options.panelTextColor;
            }
        });
        
        // Update toolbar if it exists
        if (this.toolbar) {
            this.toolbar.style.backgroundColor = this.options.panelBackgroundColor;
            
            // Update tool buttons
            const toolButtons = this.toolbar.querySelectorAll('.sww-tool-btn');
            toolButtons.forEach(btn => {
                btn.style.color = this.options.panelTextColor;
                if (btn.classList.contains('active')) {
                    btn.style.backgroundColor = this.options.accentColor;
                }
            });
        }
    },

    /**
     * Get current theme mode
     * @returns {string} 'light' or 'dark'
     */
    getThemeMode() {
        return this.options.panelMode || 'dark';
    },

    /**
     * Toggle between light and dark themes
     * @returns {string} New theme mode
     */
    toggleTheme() {
        const currentMode = this.getThemeMode();
        const newMode = currentMode === 'dark' ? 'light' : 'dark';
        return this.setPanelMode(newMode);
    }
};
