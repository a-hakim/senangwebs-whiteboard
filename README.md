# SenangWebs Whiteboard (SWW)

A powerful, client-side JavaScript drawing library for creating interactive digital whiteboards and vector drawings with advanced performance optimizations and modern UI components.


| Preview                                   | Examples          |
| ------------------------------------------- | ------------------- |
| ![SenangWebs Preview 1](sww_preview1.png) | sww.html          |
| ![SenangWebs Preview 2](sww_preview2.png) | sww-tailwind.html |

## 🚀 Features

### Drawing Tools

- **Basic Shapes**: Rectangle, Ellipse, Diamond, Parallelogram, Star
- **Lines & Arrows**: Directional arrows with customizable arrowheads
- **Text Elements**: Rich text with customizable fonts, sizes, colors, and alignment
- **Media Elements**: Embed websites, images, and markdown documents with live preview
- **Free Drawing**: Pen tool for freehand sketching with path optimization

### Advanced Capabilities

- **Layer Management**: Full layer control with visibility, locking, ordering, selection, and programmatic access
- **Element Management API**: Direct element manipulation with `getElementById()`, `selectElementById()`, `deleteElementById()`, and `toggleElementVisibility()`
- **Selection Tools**: Multi-select, selection boxes, bulk operations, group management, and smart selection
- **Undo/Redo System**: Complete history management with 50-step history and keyboard shortcuts
- **Performance Optimized**: Spatial indexing, Level of Detail (LOD), and optimized rendering for handling thousands of elements
- **Dark Theme Support**: Built-in dark mode with customizable color palettes and modern UI aesthetics
- **Export Options**: SVG and PNG export functionality with high-quality output
- **Grid System**: Snap-to-grid functionality with customizable grid sizes and visual toggle
- **Zoom Controls**: Smooth zooming (10% increments), panning, fit-to-elements, and 1:1 reset functionality
- **Clipboard Operations**: Copy, paste, duplicate, and cross-session clipboard support with keyboard shortcuts
- **Preview Mode**: Enhanced fullscreen presentation mode with dark background and locked editing
- **Read-Only Mode**: Presentation mode with completely locked editing capabilities and automatic preview activation

### Styling & Customization

- **Fill Styles**: Solid colors, gradients (linear/radial), hatch patterns, and transparency
- **Stroke Customization**: Color, width, and style options
- **Gradient Editor**: Multi-stop gradient creation with color and position controls
- **Element Properties**: Real-time property editing with instant feedback
- **Rotation & Resize**: Visual handles for element transformation
- **Font Management**: Multiple font families with size and alignment controls

### User Interface

- **Control Panel**: Organized tool selection and layer management with expand/dock options and tabbed interface
- **Modern Dark Theme**: Professional dark UI with accent colors (#00FF99 primary, #007370 secondary) and smooth transitions
- **Properties Panel**: Real-time property editing for selected elements with instant visual feedback
- **Context Menus**: Right-click operations for quick actions and element manipulation
- **Keyboard Shortcuts**: Standard shortcuts for common operations (Ctrl+Z/Y, Ctrl+A/C/V, Delete, Arrow keys)
- **Responsive Design**: Works seamlessly on desktop and tablet devices with touch support
- **Enhanced Preview Mode**: Fullscreen presentation mode with ESC key support and dark background
- **Floating Tool Palette**: Minimizable and repositionable tool palette with tab organization
- **Smart UI Hiding**: All editor UI elements automatically hide in preview mode for distraction-free presentation

### Markdown Support

- **Comprehensive Parser**: Full markdown specification support
- **Rich Formatting**: Headers (H1-H6), emphasis, lists, tables, code blocks
- **Advanced Features**: Blockquotes (nested), footnotes, task lists, definition lists
- **Media Support**: Images, links with titles, automatic link detection
- **Special Syntax**: Strikethrough, highlighting, emoji shortcodes
- **Live Editing**: Real-time markdown rendering with edit/preview toggle

## 📦 Installation

### Production Use (Recommended)

Simply include the built SWW files in your HTML - FontAwesome and Marked are pre-bundled:

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="sww.css" />
    <script src="sww.js"></script>
</head>
<body>
    <div id="drawing-container"></div>
  
    <script>
        const container = document.getElementById('drawing-container');
        const whiteboard = sww.init(container, {
            backgroundColor: "#ffffff",
            gridSize: 20,
            showGrid: true
        });
    </script>
</body>
</html>
```

### Development Setup

For development or customization, you'll need to build the library from source:

```bash
# Clone the repository
git clone https://github.com/a-hakim/senangwebs-whiteboard.git
cd senangwebs-whiteboard

# Install dependencies
npm install

# Build for production
npm run build

# Or build with watch mode for development
npm run dev
```

### Dependencies

The library includes these dependencies that are bundled during the build process:

- **@fortawesome/fontawesome-free** (^6.4.0) - Icon library for UI elements
- **marked** (^9.0.0) - Markdown parser for document elements

### Build Output

After running `npm run build`, you'll find in the `dist/` folder:

- `sww.js` (150 KB) - Main library bundle with all dependencies and latest features
- `sww.css` (135 KB) - Stylesheet including FontAwesome icons and dark theme support
- `fonts/` - FontAwesome font files (232 KB total)
- `styles.js` - Additional style utilities for theme management

## 🎯 Quick Start

### Basic Initialization

```javascript
// Initialize SWW in a container
const container = document.getElementById('my-container');
const swwInstance = sww.init(container, {
    backgroundColor: "#ffffff",
    gridSize: 20,
    showGrid: true,
    enableSnapToGrid: true
});
```

### Setting Drawing Tools

```javascript
// Set the current drawing tool
swwInstance.setTool('rectangle');
swwInstance.setTool('ellipse');
swwInstance.setTool('text');
swwInstance.setTool('arrow');
```

### Managing Elements

```javascript
// Select all elements
swwInstance.selectAll();

// Clear the canvas
swwInstance.clearAll();

// Get scene data
const sceneData = swwInstance.getScene();

// Load scene data
swwInstance.loadScene(sceneData);
```

## 🔧 Configuration Options

```javascript
const options = {
    backgroundColor: "#ffffff", // Canvas background color
    gridSize: 20,                 // Grid cell size in pixels
    showGrid: true,               // Show/hide grid
    width: "100%",                // Canvas width (CSS value)
    height: "100%",               // Canvas height (CSS value)
    readOnly: false,              // Enable read-only mode (locks editing and auto-enters preview)
    enableSnapToGrid: true,       // Enable snap-to-grid (syncs with showGrid)
    maxHistorySteps: 50,          // Maximum undo/redo steps
    performanceMode: false,       // Enable performance optimizations for large scenes
    enableSpatialIndex: true,     // Use spatial indexing for efficient hit testing
    lodThreshold: 100             // Element count threshold for Level of Detail optimization
};

const swwInstance = sww.init(container, options);
```

### Read-Only Mode

When `readOnly: true` is set:

- Application automatically enters preview mode on initialization
- Escape key is disabled (cannot exit preview mode)
- All editing functionality is completely locked
- Perfect for presentations, embedded displays, kiosks, or read-only viewers
- UI elements are hidden to provide distraction-free viewing experience

## 🎨 Drawing Tools

### Shape Tools

- `rectangle` - Draw rectangles and squares with customizable borders and fills
- `ellipse` - Draw circles and ellipses with gradient support
- `diamond` - Draw diamond shapes with rotation capabilities
- `parallelogram` - Draw parallelograms with skew transformations
- `star` - Draw 5-pointed star shapes with inner/outer radius control
- `arrow` - Draw directional arrows with customizable arrowheads

### Content Tools

- `text` - Add text elements with font customization, color, and alignment
- `website` - Embed website previews with URL configuration
- `image` - Add image elements with source URL and alt text support
- `markdown` - Add markdown documents with comprehensive syntax support

### Utility Tools

- `select` - Selection and manipulation tool with multi-select capabilities
- `draw` - Freehand drawing tool with path optimization

### Tool Settings

All tools support these customizable properties:

- **Stroke**: Color, width, and style
- **Fill**: Solid colors, gradients (linear/radial), hatch patterns, transparency
- **Opacity**: Element transparency (0-1)
- **Text**: Font family, size, color, alignment
- **Gradients**: Multi-stop gradients with color and position controls

## 📋 API Reference

### Core Methods

#### `sww.init(container, options)`

Initializes a new SWW instance in the specified container.

```javascript
const instance = sww.init(document.getElementById('container'), {
    backgroundColor: "#ffffff",
    gridSize: 20
});
```

#### `setTool(toolName)`

Sets the current drawing tool.

```javascript
instance.setTool('rectangle');
instance.setTool('text');
```

#### `getScene()`

Returns the current scene data as a JSON object.

```javascript
const sceneData = instance.getScene();
console.log(sceneData.elements.length); // Number of elements
```

#### `loadScene(sceneData)`

Loads a scene from JSON data.

```javascript
const sceneData = {
    elements: [
        {
            id: "rect-1",
            type: "rectangle",
            x: 100, y: 100,
            width: 200, height: 150,
            strokeColor: "#007bff",
            fillColor: "#e3f2fd"
        }
    ]
};
instance.loadScene(sceneData);
```

### Element Management Methods

#### `getElementById(elementId)`

Finds and returns an element by its ID.

```javascript
const element = instance.getElementById('my-element-id');
if (element) {
    console.log('Element found:', element);
}
```

#### `toggleElementVisibility(elementId)`

Toggles the visibility of an element by its ID.

```javascript
// Hide or show an element
const success = instance.toggleElementVisibility('my-element-id');
console.log('Visibility toggled:', success);
```

#### `selectElementById(elementId)`

Selects a specific element by its ID, clearing any previous selection.

```javascript
// Select a specific element
const success = instance.selectElementById('my-element-id');
console.log('Element selected:', success);
```

#### `deleteElementById(elementId)`

Deletes a specific element by its ID.

```javascript
// Delete a specific element
const success = instance.deleteElementById('my-element-id');
console.log('Element deleted:', success);
```

### Selection Methods

#### `selectAll()`

Selects all elements in the scene.

#### `clearSelection()`

Clears the current selection.

#### `deleteSelectedElements()`

Deletes all currently selected elements.

#### `copySelected()`

Copies selected elements to clipboard.

#### `pasteClipboard()`

Pastes clipboard contents to canvas.

#### `moveSelectedElements(direction, isShiftPressed)`

Moves selected elements using arrow keys with optional grid snapping.

### Zoom and View Methods

#### `zoomIn()` / `zoomOut()`

Zoom in or out of the canvas (10% increments).

#### `resetZoom()`

Reset zoom to 100%.

#### `toggleGrid()`

Toggle grid visibility and snap-to-grid functionality.

#### `fitCanvasToElements()`

Automatically fit the view to show all elements.

### Performance and Optimization Methods

#### `performOptimizedRender()`

Triggers an optimized rendering update for better performance.

```javascript
// Manually trigger optimized rendering
instance.performOptimizedRender();
```

#### `rebuildSpatialIndex()`

Rebuilds the spatial index for improved hit testing performance.

```javascript
// Rebuild spatial index after bulk operations
instance.rebuildSpatialIndex();
```

#### `updateElementInSpatialIndex(element)`

Updates a specific element's position in the spatial index.

```javascript
// Update spatial index for a modified element
instance.updateElementInSpatialIndex(modifiedElement);
```

#### `getLevelOfDetail(element)`

Returns the appropriate level of detail for an element based on zoom level.

```javascript
// Get LOD for performance optimization
const lod = instance.getLevelOfDetail(element);
```

### Preview Mode Methods

#### `togglePreviewMode()`

Toggle between edit and preview modes with enhanced dark background.

#### `enterPreviewMode()`

Enter fullscreen preview mode with dark background and hidden UI elements.

#### `exitPreviewMode()`

Exit preview mode and return to editing (disabled in read-only mode).

### Theme and UI Methods

#### `generateId()`

Generates a unique ID for new elements.

```javascript
const newId = instance.generateId();
console.log('New ID:', newId); // e.g., 'sww-abc123def'
```

### History Methods

#### `undo()` / `redo()`

Undo or redo the last action.

### Export Methods

#### `exportToSVG()`

Export the current scene as SVG.

```javascript
const svgData = instance.exportToSVG();
```

#### `exportToPNG()`

Export the current scene as PNG.

```javascript
const pngData = instance.exportToPNG();
```

## 🎛️ Control Panel Integration

SWW includes a comprehensive built-in control panel with modern dark theme support:

```javascript
// Initialize control panel with tabbed interface
const controlPanel = new SWWControlPanel(swwInstance);

// The control panel automatically handles:
// - Tool selection with visual feedback and hover effects
// - Layer management with drag-and-drop and bulk operations  
// - Element properties with real-time updates and live preview
// - Scene operations and export functions with keyboard shortcuts
// - Panel docking, width expansion, and responsive layout
// - Dark theme integration with accent colors and smooth transitions
```

### Control Panel Features

- **Modern Dark Theme**: Professional dark UI with #00FF99 primary and #007370 secondary accent colors
- **Tabbed Interface**: Organized tabs for Tools and Layers with smooth transitions
- **Tool Selection Grid**: Visual grid with FontAwesome icons, labels, and hover effects
- **Layer Management**: Advanced list view with visibility, lock, selection, and deletion controls
- **Properties Panel**: Real-time editing of selected element properties with instant feedback
- **Expandable Width**: Toggle between normal (280px) and expanded width for more workspace
- **Floating Design**: Minimizable and repositionable tool palette that doesn't interfere with canvas
- **Smart Hiding**: Automatically hides in preview mode for distraction-free presentation
- **Keyboard Integration**: Full keyboard shortcut support (1-5 for tools, Ctrl+Z/Y, etc.)

### Layer Management

```javascript
// Access through the control panel instance with enhanced functionality
const controlPanel = new SWWControlPanel(swwInstance);

// Advanced layer operations:
controlPanel.toggleLayerSelection('layer-id');    // Select/deselect layer with visual feedback
controlPanel.toggleLayerVisibility('layer-id');   // Show/hide layer with smooth transitions
controlPanel.toggleLayerLock('layer-id');         // Lock/unlock layer with status indicators
controlPanel.focusOnLayer('layer-id');            // Focus camera on layer with smooth zoom

// Direct element management:
swwInstance.getElementById('element-id');          // Find element by ID
swwInstance.selectElementById('element-id');       // Select specific element
swwInstance.deleteElementById('element-id');       // Delete specific element
swwInstance.toggleElementVisibility('element-id'); // Toggle element visibility

// Bulk operations with undo support:
swwInstance.selectAll();                           // Select all layers
swwInstance.clearSelection();                      // Clear selection
swwInstance.copySelected();                        // Copy selected with clipboard
swwInstance.pasteClipboard();                     // Paste clipboard with positioning
swwInstance.deleteSelectedElements();              // Delete selected with confirmation
```

## 📝 Markdown Support

SWW includes a comprehensive markdown parser that supports the full markdown specification:

### Basic Syntax

- **Headers**: `# H1` through `###### H6`
- **Emphasis**: `*italic*`, `**bold**`, `***bold italic***`
- **Strikethrough**: `~~strikethrough~~`
- **Highlighting**: `==highlighted text==`
- **Inline Code**: `` `code` ``

### Lists

- **Unordered**: `- item` or `* item` or `+ item`
- **Ordered**: `1. item`
- **Task Lists**: `- [ ] unchecked` and `- [x] checked`
- **Definition Lists**: `Term: Definition`

### Links & Images

- **Links**: `[text](https://github.com/a-hakim/senangwebs-whiteboard)` or `[text](https://github.com/a-hakim/senangwebs-whiteboard "title")`
- **Images**: `![alt](url)` or `![alt](url "title")`
- **Automatic Links**: `<https://example.com>`
- **Email Links**: `<email@example.com>`

### Code & Quotes

- **Code Blocks**: ``` or indented (4 spaces)
- **Language Syntax**: ```javascript
- **Blockquotes**: `> quote` (supports nesting with `>>`)

### Tables

```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
```

### Advanced Features

- **Horizontal Rules**: `---`, `***`, or `___`
- **Footnotes**: `[^1]` with `[^1]: definition`
- **Line Breaks**: Double space at end of line or double newline
- **Escaping**: `\` before special characters
- **Emoji**: `:smile:`, `:heart:`, `:thumbsup:` (basic set)

### Usage in SWW

```javascript
// Create markdown element
swwInstance.setTool('markdown');
// Click to place element, then double-click to edit

// Programmatic creation
const markdownElement = {
    type: "markdown",
    markdown: "# Hello World\n\nThis is **bold** text.",
    x: 100, y: 100, width: 300, height: 200
};
```

## ⚡ Performance Features

### Spatial Indexing

For scenes with many elements, SWW uses advanced spatial indexing for ultra-efficient hit testing:

```javascript
// Automatically enabled for scenes with 100+ elements
// Provides O(1) average case hit testing performance
// Supports up to 10,000+ elements with smooth interaction

// Manual spatial index management for optimization
swwInstance.rebuildSpatialIndex();                 // Rebuild after bulk operations
swwInstance.updateElementInSpatialIndex(element);  // Update specific element
```

### Level of Detail (LOD)

Intelligent rendering optimization that reduces complexity for distant or small elements:

```javascript
// Automatically adjusts element detail based on zoom level
// Maintains 60fps performance with thousands of elements
// Smart LOD thresholds prevent visual artifacts

const lod = swwInstance.getLevelOfDetail(element); // Get current LOD level
```

### Optimized Rendering

```javascript
// Enable performance monitoring and optimization
const options = {
    performanceMode: true,        // Enable all performance features
    enableSpatialIndex: true,     // Enable spatial indexing for large scenes
    lodThreshold: 100,            // Start LOD optimization at 100 elements
    maxHistorySteps: 50           // Limit undo history for memory optimization
};

// Manual optimization triggers
swwInstance.performOptimizedRender(); // Trigger optimized render cycle
```

## 🎯 Element Properties

### Common Properties

All elements support these properties:

```javascript
{
    id: "unique-id",
    type: "rectangle",
    x: 100,                    // X position
    y: 100,                    // Y position
    width: 200,                // Width
    height: 150,               // Height
    strokeColor: "#007bff",    // Border color
    strokeWidth: 2,            // Border width
    fillColor: "#e3f2fd",      // Fill color
    fillStyle: "solid",        // Fill style: solid, gradient, hatch, transparent
    gradientType: "linear",    // Gradient type: linear, radial
    gradientStops: [           // Gradient color stops
        { offset: 0, color: "#000000" },
        { offset: 100, color: "#ffffff" }
    ],
    opacity: 1.0,              // Opacity (0-1)
    rotation: 0,               // Rotation in degrees
    locked: false,             // Lock element
    visible: true,             // Visibility
    groupId: null              // Group identifier
}
```

### Text Properties

Text elements have additional properties:

```javascript
{
    type: "text",
    text: "Sample text",
    fontSize: 16,
    fontFamily: "Arial",       // Arial, Helvetica, Times New Roman, etc.
    textAlign: "left",         // left, center, right
    textColor: "#000000"       // Separate from strokeColor for clarity
}
```

### Website Properties

Website elements for embedding:

```javascript
{
    type: "website", 
    url: "https://example.com",
    text: "Website Title"      // Display text when URL is not set
}
```

### Image Properties

Image elements:

```javascript
{
    type: "image",
    src: "image-url-or-data",
    alt: "Alt text",
    text: "Image placeholder text"
}
```

### Markdown Properties

Markdown document elements:

```javascript
{
    type: "markdown",
    markdown: "# Title\n\nContent...",
    text: "Rendered HTML content"
}
```

## 🎮 Keyboard Shortcuts

### Basic Operations

- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo
- `Ctrl+A` - Select All
- `Ctrl+C` - Copy
- `Ctrl+V` - Paste
- `Delete` / `Backspace` - Delete selected
- `Escape` - Clear selection / Exit preview mode (if not read-only)

### Navigation & Zoom

- `Ctrl + Scroll` - Zoom in/out (10% increments)
- `Space + Drag` - Pan view smoothly (or Alt+Drag)
- `Arrow Keys` - Move selected elements (1px precise movement)
- `Shift + Arrow Keys` - Move selected elements (grid-aligned movement)
- `+/-` - Zoom in/out when canvas is focused
- `0` - Reset zoom to 100% (1:1 ratio)

### Tools & View

- `G` - Toggle grid visibility and snap-to-grid
- `P` - Toggle preview mode (fullscreen presentation)
- `H` - Fit canvas to show all elements
- `1-5` - Quick tool selection (Select, Rectangle, Circle, Arrow, Text)
- `Alt+H` - Show keyboard shortcuts help dialog

### Element Manipulation

- `Double-click` - Edit text/markdown elements inline
- `Right-click` - Context menu with element-specific actions
- `Drag` - Move elements with real-time feedback
- `Resize handles` - Resize elements with aspect ratio support
- `Rotation handle` - Rotate elements with angle snapping

## 🌟 Advanced Usage

### Custom Element Creation

```javascript
// Create custom element programmatically
const customElement = {
    id: swwInstance.generateId(),
    type: "rectangle",
    x: 100, y: 100,
    width: 200, height: 150,
    strokeColor: "#ff0000",
    fillColor: "#ffcccc",
    fillStyle: "solid",
    gradientType: "linear",
    gradientStops: [
        { offset: 0, color: "#ff0000" },
        { offset: 100, color: "#ffcccc" }
    ]
};

// Add to scene
swwInstance.elements.push(customElement);
swwInstance.addSVGElementToDOM(customElement);
swwInstance.updateSVGElement(customElement);
```

### Gradient Management

```javascript
// Create gradient stops
const gradientStops = [
    { offset: 0, color: "#ff0000" },
    { offset: 50, color: "#00ff00" },
    { offset: 100, color: "#0000ff" }
];

// Apply to element
element.fillStyle = "gradient";
element.gradientType = "radial"; // or "linear"
element.gradientStops = gradientStops;
swwInstance.updateSVGElement(element);
```

### Event Handling

```javascript
// Listen for scene changes
container.addEventListener('sww:sceneChanged', (event) => {
    console.log('Scene updated:', event.detail);
});

// Listen for selection changes
container.addEventListener('sww:selectionChanged', (event) => {
    console.log('Selection:', event.detail.selectedElements);
});

// Listen for preview mode changes
container.addEventListener('previewModeEntered', (event) => {
    console.log('Entered preview mode');
});

container.addEventListener('previewModeExited', (event) => {
    console.log('Exited preview mode');
});
```

### Performance Optimization

```javascript
// Enable performance features for large scenes
const options = {
    performanceMode: true,
    enableSpatialIndex: true,
    lodThreshold: 100          // Start LOD at 100 elements
};

const swwInstance = sww.init(container, options);

// Manual spatial index management
swwInstance.rebuildSpatialIndex();
swwInstance.updateVisibleElements();
```

### Save/Load System

```javascript
// Save to localStorage
const sceneData = swwInstance.getScene();
localStorage.setItem('my-drawing', JSON.stringify(sceneData));

// Load from localStorage  
const savedData = JSON.parse(localStorage.getItem('my-drawing'));
swwInstance.loadScene(savedData);

// Export scene data
const exportData = {
    version: "1.0.0",
    elements: swwInstance.elements,
    viewBox: swwInstance.viewBox,
    zoom: swwInstance.zoom
};
```

### Element Property Updates

```javascript
// Update specific property for selected elements
swwInstance.updateSelectedElementProperty('fillColor', '#ff0000');
swwInstance.updateSelectedElementProperty('strokeWidth', 5);
swwInstance.updateSelectedElementProperty('opacity', 0.5);

// Sync properties panel with current selection
swwInstance.syncPropertiesPanel();

// Real-time property updates during manipulation
swwInstance.updatePropertiesPanelRealTime(['width', 'height', 'rotation']);
```

## 🎨 Styling and Themes

SWW features comprehensive theming support with CSS custom properties and built-in dark mode:

### Dark Theme Integration

```css
:root {
    /* Primary brand colors */
    --sww-primary-color: #00FF99;        /* Bright green accent */
    --sww-secondary-color: #007370;      /* Teal secondary */
  
    /* Dark theme palette */
    --sww-background-color: #18181B;      /* Light dark background */
    --sww-panel-background: #09090B;     /* Deep dark panels */
    --sww-text-color: #ffffff;           /* High contrast text */
    --sww-accent-color: #00FF99;         /* Interactive elements */
  
    /* State colors */
    --sww-hover-color: #00e689;          /* Hover states */
    --sww-border-color: #374151;         /* Subtle borders */
    --sww-success-color: #10b981;        /* Success feedback */
    --sww-warning-color: #f59e0b;        /* Warning states */
}
```

### Tailwind CSS Integration

The library works seamlessly with Tailwind CSS for rapid UI development:

```html
<!-- Modern dark theme with Tailwind classes -->
<div class="bg-dark-bg text-white border border-neutral-700">
    <button class="bg-primary-500 hover:bg-primary-600 text-dark-bg 
                   px-4 py-2 rounded-lg transition-all duration-200 
                   hover:-translate-y-0.5 glow-primary">
        Primary Action
    </button>
</div>
```

### Custom Theme Configuration

```javascript
// Configure Tailwind with SWW color palette
tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: {
                    500: '#00FF99',
                    600: '#00e689',
                    700: '#00cc7a'
                },
                secondary: {
                    500: '#007370',
                    600: '#006562'
                },
                dark: {
                    bg: '#18181B',
                    panel: '#09090B'
                }
            }
        }
    }
}
```

## 🔧 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 📄 License

This project is available for educational and demonstration purposes.

## 🤝 Contributing

SenangWebs Whiteboard is actively maintained. For bugs, feature requests, or contributions, please contact the development team.

## 📚 Examples

### Complete HTML Example with Dark Theme

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SWW Dark Theme App</title>
  
    <!-- Tailwind CSS with SWW theme configuration -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: { 500: '#00FF99', 600: '#00e689', 700: '#00cc7a' },
                        secondary: { 500: '#007370', 600: '#006562', 700: '#005854' },
                        dark: { bg: '#18181B', panel: '#09090B' }
                    }
                }
            }
        }
    </script>
  
    <!-- SWW includes FontAwesome and Marked built-in -->
    <link rel="stylesheet" href="sww.css">
    <script src="sww.js"></script>
  
    <style>
        /* Dark theme enhancements */
        .preview-mode {
            background: #000 !important;
            cursor: pointer;
        }
        .preview-mode #sww-drawing-canvas {
            background: white;
            border-radius: 8px;
            box-shadow: 0 20px 25px -5px rgba(0, 255, 153, 0.1);
        }
        .glow-primary {
            box-shadow: 0 0 20px rgba(0, 255, 153, 0.3);
        }
    </style>
</head>
<body class="font-sans h-screen overflow-hidden bg-dark-bg">
    <!-- Dark themed header -->
    <header class="bg-secondary-500 text-white px-5 py-3 flex justify-between items-center shadow-lg z-50">
        <h1 class="text-xl font-semibold flex items-center gap-2.5">
            <i class="fas fa-palette"></i>
            SenangWebs Whiteboard
        </h1>
        <div class="flex gap-2">
            <button onclick="togglePreview()" 
                    class="bg-white/10 hover:bg-primary-500/20 border border-white/20 
                           hover:border-primary-500/50 text-white px-3 py-2 rounded-md 
                           transition-all duration-200 hover:-translate-y-0.5"
                    title="Preview Mode">
                <i class="fas fa-eye"></i>
            </button>
            <button onclick="exportCanvas()" 
                    class="bg-white/10 hover:bg-primary-500/20 border border-white/20 
                           hover:border-primary-500/50 text-white px-3 py-2 rounded-md 
                           transition-all duration-200 hover:-translate-y-0.5"
                    title="Export">
                <i class="fas fa-download"></i>
            </button>
        </div>
    </header>

    <!-- Main content with floating tool palette -->
    <div class="flex flex-1 relative bg-dark-panel">
        <!-- Floating Tool Palette -->
        <div id="toolPalette" class="absolute top-5 left-5 bg-dark-bg border border-neutral-700 
                                    rounded-xl shadow-2xl p-4 z-40 min-w-[280px] transition-all duration-300">
        
            <!-- Tool tabs -->
            <div class="flex mb-4 bg-dark-panel rounded-lg p-1">
                <button onclick="switchTab('tools')" 
                        class="flex-1 bg-primary-500 text-dark-bg px-3 py-2 rounded-md 
                               text-xs font-medium transition-all duration-200">
                    <i class="fas fa-tools"></i> Tools
                </button>
                <button onclick="switchTab('layers')" 
                        class="flex-1 bg-transparent text-neutral-400 px-3 py-2 rounded-md 
                               text-xs font-medium transition-all duration-200 hover:text-primary-500">
                    <i class="fas fa-layer-group"></i> Layers
                </button>
            </div>
        
            <!-- Tools grid with dark theme -->
            <div id="toolsGrid" class="grid grid-cols-2 gap-2">
                <button onclick="selectTool('select')" 
                        class="bg-primary-500/20 border-2 border-primary-500 text-primary-500 
                               p-3 rounded-lg transition-all duration-200 hover:-translate-y-0.5">
                    <i class="fas fa-mouse-pointer"></i><br>Select
                </button>
                <!-- Additional tool buttons... -->
            </div>
        </div>

        <!-- Canvas Area -->
        <div class="sww-canvas-area flex-1" id="whiteboard-container"></div>
    </div>
  
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const container = document.getElementById('whiteboard-container');
        
            // Initialize whiteboard with dark theme support
            const whiteboard = sww.init(container, {
                backgroundColor: "#ffffff",
                gridSize: 20,
                showGrid: true,
                readOnly: false,           // Set to true for presentation mode
                performanceMode: true,     // Enable performance optimizations
                enableSpatialIndex: true,  // Large scene support
                lodThreshold: 100          // LOD optimization threshold
            });
        
            // Initialize control panel with dark theme
            const controlPanel = new SWWControlPanel(whiteboard);
        
            // Enhanced keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
                if (e.ctrlKey || e.metaKey) {
                    switch (e.key) {
                        case 'z': e.preventDefault(); e.shiftKey ? whiteboard.redo() : whiteboard.undo(); break;
                        case 'y': e.preventDefault(); whiteboard.redo(); break;
                        case 'a': e.preventDefault(); whiteboard.selectAll(); break;
                        case 'c': e.preventDefault(); whiteboard.copySelected(); break;
                        case 'v': e.preventDefault(); whiteboard.pasteClipboard(); break;
                    }
                } else {
                    switch (e.key) {
                        case 'Delete': case 'Backspace': whiteboard.deleteSelectedElements(); break;
                        case 'Escape': whiteboard.clearSelection(); break;
                        case '1': whiteboard.setTool('select'); break;
                        case '2': whiteboard.setTool('rectangle'); break;
                        case 'p': case 'P': whiteboard.togglePreviewMode(); break;
                        case 'g': case 'G': whiteboard.toggleGrid(); break;
                    }
                }
            });
        
            console.log('SWW with dark theme initialized successfully!');
        });
    </script>
</body>
</html>
```

### Read-Only Presentation Mode with Dark Theme

```html
<script>
    // For presentation/display mode with dark theme
    const whiteboard = sww.init(container, {
        backgroundColor: "#ffffff",
        readOnly: true,          // Locks editing, prevents escape from preview
        showGrid: false,         // Hide grid for clean presentation
        performanceMode: true,   // Enable optimizations for smooth presentation
        enableSpatialIndex: true // Handle large presentations efficiently
    });
  
    // Load existing scene data
    const presentationData = {
        elements: [/* your presentation elements */]
    };
    whiteboard.loadScene(presentationData);
  
    // Presentation will automatically enter dark preview mode
    // All UI elements will be hidden for distraction-free viewing
</script>
```

### Advanced API Usage with New Features

```javascript
// Element management with new methods
const elementId = whiteboard.generateId();
const newElement = {
    id: elementId,
    type: "rectangle",
    x: 100, y: 100, width: 200, height: 150,
    strokeColor: "#00FF99", fillColor: "#007370"
};

// Add and manage elements
whiteboard.addElement(newElement);
whiteboard.selectElementById(elementId);           // Select specific element
whiteboard.toggleElementVisibility(elementId);    // Toggle visibility
whiteboard.deleteElementById(elementId);          // Delete specific element

// Performance optimization for large scenes
whiteboard.performOptimizedRender();              // Manual optimization
whiteboard.rebuildSpatialIndex();                 // Rebuild spatial index

// Enhanced preview mode
whiteboard.enterPreviewMode();                    // Dark background presentation
whiteboard.exitPreviewMode();                     // Return to editing
```

---

**SenangWebs Whiteboard** - Making digital drawing simple, powerful, and beautiful! 🎨✨

### Latest Updates (v1.0.0)

- ✅ **Enhanced Element Management**: Direct element manipulation with `getElementById()`, `selectElementById()`, `deleteElementById()`, and `toggleElementVisibility()`
- ✅ **Modern Dark Theme**: Professional dark UI with #00FF99 accent colors and smooth transitions
- ✅ **Advanced Performance**: Spatial indexing and Level of Detail optimizations for 10,000+ elements
- ✅ **Enhanced Preview Mode**: Fullscreen presentation with dark background and complete UI hiding
- ✅ **Improved Keyboard Shortcuts**: Full keyboard navigation with 1-5 tool selection and enhanced shortcuts
- ✅ **Tailwind CSS Integration**: Built-in support for rapid UI development with custom color palettes
- ✅ **Smart Layer Management**: Advanced layer controls with bulk operations and visual feedback
