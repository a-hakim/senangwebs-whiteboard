/**
 * Element Factory
 * Handles creation and management of drawing elements
 */

import { ELEMENT_TYPES, DEFAULT_TOOL_SETTINGS } from './config.js';
import { generateId } from '../utils/helpers.js';

export class ElementFactory {
    static createElement(type, point, settings = {}) {
        const id = generateId();
        const baseElement = {
            id,
            type,
            x: point.x,
            y: point.y,
            width: 0,
            height: 0,
            rotation: 0,
            locked: false,
            visible: true,
            zIndex: Date.now(),
            ...DEFAULT_TOOL_SETTINGS,
            ...settings
        };

        switch (type) {
            case 'rectangle':
            case 'ellipse':
            case 'diamond':
                return {
                    ...baseElement,
                    width: 100,
                    height: 80
                };

            case 'arrow':
            case 'line':
                return {
                    ...baseElement,
                    width: 100,
                    height: 0,
                    points: [
                        { x: point.x, y: point.y },
                        { x: point.x + 100, y: point.y }
                    ]
                };

            case 'draw':
                return {
                    ...baseElement,
                    points: [{ x: point.x, y: point.y }],
                    fillColor: 'transparent'
                };

            case 'text':
                return {
                    ...baseElement,
                    text: 'Type here...',
                    fontSize: settings.fontSize || 16,
                    fontFamily: settings.fontFamily || 'Arial',
                    textAlign: settings.textAlign || 'left',
                    width: 0,
                    height: 0,
                    fillColor: 'transparent'
                };

            case 'website':
                return {
                    ...baseElement,
                    url: 'https://example.com',
                    width: 300,
                    height: 200,
                    fillColor: 'transparent'
                };

            case 'image':
                return {
                    ...baseElement,
                    src: '',
                    width: 200,
                    height: 150,
                    fillColor: 'transparent'
                };

            case 'markdown':
                return {
                    ...baseElement,
                    content: '# Markdown Content',
                    width: 300,
                    height: 200,
                    fillColor: 'transparent'
                };

            default:
                throw new Error(`Unknown element type: ${type}`);
        }
    }

    static cloneElement(element) {
        return {
            ...element,
            id: generateId(),
            x: element.x + 20,
            y: element.y + 20,
            zIndex: Date.now()
        };
    }

    static validateElement(element) {
        if (!element.id || !element.type) {
            return false;
        }

        if (!ELEMENT_TYPES.includes(element.type)) {
            return false;
        }

        if (typeof element.x !== 'number' || typeof element.y !== 'number') {
            return false;
        }

        return true;
    }

    static getBoundingBox(element) {
        switch (element.type) {
            case 'line':
            case 'arrow':
                if (element.points && element.points.length >= 2) {
                    const xs = element.points.map(p => p.x);
                    const ys = element.points.map(p => p.y);
                    return {
                        x: Math.min(...xs),
                        y: Math.min(...ys),
                        width: Math.max(...xs) - Math.min(...xs),
                        height: Math.max(...ys) - Math.min(...ys)
                    };
                }
                break;

            case 'draw':
                if (element.points && element.points.length > 0) {
                    const xs = element.points.map(p => p.x);
                    const ys = element.points.map(p => p.y);
                    return {
                        x: Math.min(...xs),
                        y: Math.min(...ys),
                        width: Math.max(...xs) - Math.min(...xs) || 1,
                        height: Math.max(...ys) - Math.min(...ys) || 1
                    };
                }
                break;

            default:
                return {
                    x: element.x,
                    y: element.y,
                    width: element.width || 0,
                    height: element.height || 0
                };
        }

        return { x: 0, y: 0, width: 0, height: 0 };
    }
}
