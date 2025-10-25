/**
 * SenangWebs Whiteboard (SWW) - A client-side drawing library (Modular Version)
 * Version: 1.0.1
 * 
 * This is the modular entry point that imports and assembles all components.
 * The old monolithic version is preserved as sww-legacy.js for reference.
 */

// Import dependencies
import { marked } from 'marked';

// Import utilities
import { PerformanceUtils } from './modules/utils/PerformanceUtils.js';
import { SpatialIndex } from './modules/utils/SpatialIndex.js';
import * as helpers from './modules/utils/helpers.js';
import { FONT_FAMILIES, DEFAULT_TOOL_SETTINGS, THEME_COLORS, PERFORMANCE_THRESHOLDS } from './modules/utils/constants.js';

// Make marked available globally for the library
if (typeof window !== 'undefined') {
    window.marked = marked;
}

// NOTE: The full modularization is in progress. For now, this file imports
// the refactored utilities and demonstrates the pattern. The main SWWInstance
// class still needs to be extracted from sww-legacy.js following the plan
// in MODULARIZATION_PLAN.md

/**
 * TODO: Complete modularization following MODULARIZATION_PLAN.md
 * 
 * Next steps:
 * 1. Extract SWWInstance core class to modules/core/SWWInstance.js
 * 2. Move initialization logic to modules/core/initialization.js
 * 3. Extract tool handlers to modules/tools/
 * 4. Extract UI components to modules/ui/
 * 5. Extract element management to modules/elements/
 * 6. Extract selection system to modules/selection/
 * 7. Extract history management to modules/history/
 * 8. Wire everything together here
 * 
 * For now, import the legacy version:
 */

// Temporary: Import full legacy implementation
// This will be replaced with modular imports
import SWWLegacy from './sww-legacy.js';

// Main SWW object (factory pattern)
const SWW = {
    version: '1.0.1',
    instances: new Map(),
    
    // Initialize SWW in a container
    init: function(container, options = {}) {
        if (!container) {
            throw new Error('Container element is required');
        }
        
        // TODO: Replace with modular SWWInstance
        // For now, use legacy implementation
        const instance = SWWLegacy.init(container, options);
        this.instances.set(container, instance);
        return instance;
    },
    
    // Get instance by container
    getInstance: function(container) {
        return this.instances.get(container);
    },
    
    // Expose utilities for advanced usage
    utils: {
        PerformanceUtils,
        SpatialIndex,
        helpers,
        constants: {
            FONT_FAMILIES,
            DEFAULT_TOOL_SETTINGS,
            THEME_COLORS,
            PERFORMANCE_THRESHOLDS
        }
    }
};

// Export as default for webpack UMD
export default SWW;

// Also expose to global scope for backward compatibility
if (typeof window !== 'undefined') {
    window.sww = SWW;
    window.SWW = SWW;
}
