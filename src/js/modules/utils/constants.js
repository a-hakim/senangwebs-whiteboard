/**
 * Font families list used across the application
 */
export const FONT_FAMILIES = [
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
];

/**
 * Default tool settings
 */
export const DEFAULT_TOOL_SETTINGS = {
    strokeColor: '#000000',
    strokeWidth: 2,
    fillColor: 'transparent',
    fillStyle: 'solid',
    opacity: 1,
    fontSize: 16,
    fontFamily: 'Arial',
    textAlign: 'left',
    textColor: '#000000',
    gradientType: 'linear',
    gradientStops: [
        { offset: 0, color: '#000000' },
        { offset: 100, color: '#ffffff' }
    ]
};

/**
 * Default theme colors
 */
export const THEME_COLORS = {
    dark: {
        panelBackgroundColor: '#18181b',
        panelTextColor: '#ffffff',
        accentColor: '#00FF99',
        secondaryAccentColor: '#007370'
    },
    light: {
        panelBackgroundColor: '#ffffff',
        panelTextColor: '#1f2937',
        accentColor: '#3b82f6',
        secondaryAccentColor: '#2563eb'
    }
};

/**
 * Performance thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
    SPATIAL_INDEX_THRESHOLD: 100,
    LOD_THRESHOLD: 100,
    HISTORY_REDUCTION_THRESHOLD: 500,
    MAX_HISTORY_SIZE: 50,
    REDUCED_HISTORY_SIZE: 20
};
