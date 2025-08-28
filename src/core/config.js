/**
 * SWW Core Configuration
 * Contains default settings and constants for the library
 */

export const VERSION = '2.0.0';

export const DEFAULT_OPTIONS = {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    gridSize: 20,
    showGrid: true,
    snapToGrid: true,
    maxHistorySize: 50,
    enableDebug: false
};

export const DEFAULT_TOOL_SETTINGS = {
    strokeColor: '#000000',
    strokeWidth: 2,
    fillColor: 'transparent',
    fillStyle: 'solid',
    opacity: 1,
    fontSize: 16,
    fontFamily: 'Arial',
    textAlign: 'left',
    textColor: '#000000'
};

export const TOOL_TYPES = {
    SELECT: 'select',
    RECTANGLE: 'rectangle',
    ELLIPSE: 'ellipse',
    DIAMOND: 'diamond',
    ARROW: 'arrow',
    LINE: 'line',
    DRAW: 'draw',
    TEXT: 'text',
    WEBSITE: 'website',
    IMAGE: 'image',
    MARKDOWN: 'markdown'
};

export const FILL_STYLES = {
    TRANSPARENT: 'transparent',
    SOLID: 'solid',
    HACHURE: 'hachure'
};

export const ELEMENT_TYPES = Object.values(TOOL_TYPES);

export const EVENT_TYPES = {
    ELEMENT_CREATED: 'elementCreated',
    ELEMENT_UPDATED: 'elementUpdated',
    ELEMENT_DELETED: 'elementDeleted',
    SELECTION_CHANGED: 'selectionChanged',
    TOOL_CHANGED: 'toolChanged',
    CANVAS_UPDATED: 'canvasUpdated'
};

export const MANIPULATION_MODES = {
    MOVE: 'move',
    RESIZE: 'resize',
    ROTATE: 'rotate'
};

export const RESIZE_HANDLES = {
    NW: 'nw',
    N: 'n',
    NE: 'ne',
    E: 'e',
    SE: 'se',
    S: 's',
    SW: 'sw',
    W: 'w'
};
