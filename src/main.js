/**
 * SenangWebs Works (SWW) - Main Entry Point
 * Version: 2.0.0
 * 
 * A modular JavaScript library for creating digital whiteboards and vector drawings
 * Completely rewritten with modern architecture and better developer experience
 */

import { SWWInstance } from './SWWInstance.js';
import { VERSION } from './core/config.js';

// Main SWW namespace
const SWW = {
    version: VERSION,
    instances: new Map(),
    
    /**
     * Initialize SWW in a container
     * @param {HTMLElement} container - The container element
     * @param {Object} options - Configuration options
     * @returns {SWWInstance} The SWW instance
     */
    init(container, options = {}) {
        if (!container) {
            throw new Error('Container element is required');
        }
        
        if (typeof container === 'string') {
            container = document.querySelector(container);
            if (!container) {
                throw new Error('Container element not found');
            }
        }
        
        // Remove existing instance if any
        if (this.instances.has(container)) {
            this.instances.get(container).dispose();
        }
        
        const instance = new SWWInstance(container, options);
        this.instances.set(container, instance);
        return instance;
    },
    
    /**
     * Get existing instance by container
     * @param {HTMLElement} container - The container element
     * @returns {SWWInstance|null} The SWW instance or null
     */
    getInstance(container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        return this.instances.get(container) || null;
    },
    
    /**
     * Destroy instance
     * @param {HTMLElement} container - The container element
     * @returns {boolean} True if instance was found and destroyed
     */
    destroy(container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        const instance = this.instances.get(container);
        if (instance) {
            instance.dispose();
            this.instances.delete(container);
            return true;
        }
        return false;
    },
    
    /**
     * Get all active instances
     * @returns {SWWInstance[]} Array of all instances
     */
    getAllInstances() {
        return Array.from(this.instances.values());
    },
    
    /**
     * Destroy all instances
     */
    destroyAll() {
        this.instances.forEach(instance => instance.dispose());
        this.instances.clear();
    }
};

// Auto-inject CSS styles
function injectCSS() {
    if (document.getElementById('sww-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'sww-styles';
    style.textContent = `
        .sww-container {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
        
        .sww-container svg {
            display: block;
            width: 100%;
            height: 100%;
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
        }
        
        .sww-selection-box {
            fill: rgba(0, 123, 255, 0.1);
            stroke: #007bff;
            stroke-width: 1;
            stroke-dasharray: 5,5;
            pointer-events: none;
        }
        
        .sww-selection-handle {
            fill: #007bff;
            stroke: #ffffff;
            stroke-width: 1;
            cursor: pointer;
        }
        
        .sww-selection-handle:hover {
            fill: #0056b3;
        }
        
        .sww-rotation-handle {
            fill: #28a745;
            stroke: #ffffff;
            stroke-width: 1;
            cursor: grab;
        }
        
        .sww-rotation-handle:hover {
            fill: #1e7e34;
        }
        
        .sww-element {
            pointer-events: all;
        }
        
        .sww-element.selected {
            filter: drop-shadow(0 0 3px rgba(0, 123, 255, 0.5));
        }
        
        .sww-element.locked {
            opacity: 0.7;
            pointer-events: none;
        }
        
        .sww-grid {
            pointer-events: none;
        }
        
        .sww-background {
            pointer-events: all;
        }
        
        .sww-toolbar {
            position: absolute;
            top: 10px;
            left: 10px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            padding: 8px;
            z-index: 1000;
        }
        
        .sww-tool-button {
            width: 32px;
            height: 32px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
        }
        
        .sww-tool-button:hover {
            background: #f0f0f0;
            border-color: #007bff;
        }
        
        .sww-tool-button.active {
            background: #007bff;
            color: white;
            border-color: #007bff;
        }
        
        .sww-properties-panel {
            position: absolute;
            top: 10px;
            right: 10px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 12px;
            min-width: 200px;
            z-index: 1000;
        }
        
        .sww-property-group {
            margin-bottom: 12px;
        }
        
        .sww-property-group:last-child {
            margin-bottom: 0;
        }
        
        .sww-property-label {
            display: block;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 4px;
            color: #333;
        }
        
        .sww-property-input {
            width: 100%;
            padding: 4px 8px;
            border: 1px solid #ddd;
            border-radius: 3px;
            font-size: 12px;
        }
        
        .sww-color-input {
            width: 100%;
            height: 32px;
            border: 1px solid #ddd;
            border-radius: 3px;
            cursor: pointer;
        }
        
        .sww-context-menu {
            position: fixed;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 4px 0;
            min-width: 120px;
            z-index: 2000;
        }
        
        .sww-context-menu-item {
            padding: 8px 16px;
            font-size: 13px;
            cursor: pointer;
            border: none;
            background: none;
            width: 100%;
            text-align: left;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .sww-context-menu-item:hover {
            background: #f0f0f0;
        }
        
        .sww-context-menu-item:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .sww-context-menu-separator {
            height: 1px;
            background: #eee;
            margin: 4px 0;
        }
    `;
    
    document.head.appendChild(style);
}

// Automatically inject CSS when the module loads
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectCSS);
    } else {
        injectCSS();
    }
}

// Export both named and default exports for flexibility
export { SWW as default, SWWInstance };

// Also expose globally if in browser environment
if (typeof window !== 'undefined') {
    window.SWW = SWW;
    // Maintain backward compatibility
    window.sww = SWW;
}
