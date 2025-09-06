# SenangWebs Whiteboard (SWW)

A powerful, client-side JavaScript drawing library for creating digital whiteboards and vector drawings. Similar to Excalidraw but entirely self-contained with no external dependencies.

## 🚀 Features

### Drawing Tools
- **Basic Shapes**: Rectangle, Ellipse, Diamond, Parallelogram, Star
- **Lines & Arrows**: Directional arrows with customizable arrowheads
- **Text Elements**: Rich text with customizable fonts, sizes, colors, and alignment
- **Media Elements**: Embed websites, images, and markdown documents with live preview
- **Free Drawing**: Pen tool for freehand sketching with path optimization

### Advanced Capabilities
- **Layer Management**: Full layer control with visibility, locking, ordering, and selection
- **Selection Tools**: Multi-select, selection boxes, bulk operations, and group management
- **Undo/Redo System**: Complete history management with 50-step history
- **Performance Optimized**: Spatial indexing and Level of Detail (LOD) for handling thousands of elements
- **Export Options**: SVG and PNG export functionality
- **Grid System**: Snap-to-grid functionality with customizable grid sizes and toggle
- **Zoom Controls**: Smooth zooming, panning, and fit-to-elements functionality
- **Clipboard Operations**: Copy, paste, duplicate, and cross-session clipboard support
- **Read-Only Mode**: Presentation mode with locked editing capabilities

### Styling & Customization
- **Fill Styles**: Solid colors, gradients (linear/radial), hatch patterns, and transparency
- **Stroke Customization**: Color, width, and style options
- **Gradient Editor**: Multi-stop gradient creation with color and position controls
- **Element Properties**: Real-time property editing with instant feedback
- **Rotation & Resize**: Visual handles for element transformation
- **Font Management**: Multiple font families with size and alignment controls

### User Interface
- **Control Panel**: Organized tool selection and layer management with expand/dock options
- **Properties Panel**: Real-time property editing for selected elements
- **Context Menus**: Right-click operations for quick actions
- **Keyboard Shortcuts**: Standard shortcuts for common operations
- **Responsive Design**: Works on desktop and tablet devices
- **Preview Mode**: Fullscreen presentation mode with optional read-only access

### Markdown Support
- **Comprehensive Parser**: Full markdown specification support
- **Rich Formatting**: Headers (H1-H6), emphasis, lists, tables, code blocks
- **Advanced Features**: Blockquotes (nested), footnotes, task lists, definition lists
- **Media Support**: Images, links with titles, automatic link detection
- **Special Syntax**: Strikethrough, highlighting, emoji shortcodes
- **Live Editing**: Real-time markdown rendering with edit/preview toggle

## 📦 Installation

Simply include the SWW files in your HTML:

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
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
    backgroundColor: "#ffffff",    // Canvas background color
    gridSize: 20,                 // Grid cell size in pixels
    showGrid: true,               // Show/hide grid
    width: "100%",                // Canvas width (CSS value)
    height: "100%",               // Canvas height (CSS value)
    readOnly: false,              // Enable read-only mode (locks editing)
    enableSnapToGrid: true,       // Enable snap-to-grid (syncs with showGrid)
    maxHistorySteps: 50,          // Maximum undo/redo steps
    performanceMode: false,       // Enable performance optimizations
    enableSpatialIndex: true,     // Use spatial indexing for large scenes
    lodThreshold: 100            // Element count threshold for LOD
};

const swwInstance = sww.init(container, options);
```

### Read-Only Mode
When `readOnly: true` is set:
- Application automatically enters preview mode
- Escape key is disabled (cannot exit preview mode)
- All editing functionality is locked
- Perfect for presentations, embedded displays, or kiosks

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

### Preview Mode Methods

#### `togglePreviewMode()`
Toggle between edit and preview modes.

#### `enterPreviewMode()`
Enter fullscreen preview mode (read-only if `readOnly: true`).

#### `exitPreviewMode()`
Exit preview mode and return to editing.

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

SWW includes a built-in control panel for managing tools and layers:

```javascript
// Initialize control panel
const controlPanel = new SWWControlPanel(swwInstance);

// The control panel automatically handles:
// - Tool selection with visual feedback
// - Layer management with drag-and-drop
// - Element properties with real-time updates
// - Scene operations and export functions
// - Panel docking and width expansion
```

### Control Panel Features
- **Tool Selection**: Visual grid with icons and labels
- **Layer Management**: List view with visibility, lock, and selection controls
- **Properties Panel**: Real-time editing of selected element properties
- **Expandable Width**: Toggle between normal (20rem) and expanded (36rem) width
- **Docking System**: Dock/undock panel for flexible workspace layout

### Layer Management

```javascript
// Access through the control panel instance
const controlPanel = new SWWControlPanel(swwInstance);

// Layer operations:
controlPanel.toggleLayerSelection('layer-id');    // Select/deselect layer
controlPanel.toggleLayerVisibility('layer-id');   // Show/hide layer
controlPanel.toggleLayerLock('layer-id');         // Lock/unlock layer
controlPanel.focusOnLayer('layer-id');            // Focus camera on layer

// Bulk operations:
swwInstance.selectAll();                           // Select all layers
swwInstance.clearSelection();                      // Clear selection
swwInstance.copySelected();                        // Copy selected
swwInstance.pasteClipboard();                     // Paste clipboard
swwInstance.deleteSelectedElements();              // Delete selected
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
- **Links**: `[text](url)` or `[text](url "title")`
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
For scenes with many elements, SWW uses spatial indexing for efficient hit testing:

```javascript
// Automatically enabled for scenes with 100+ elements
// Provides O(1) average case hit testing performance
```

### Level of Detail (LOD)
Reduces rendering complexity for distant or small elements:

```javascript
// Automatically adjusts element detail based on zoom level
// Maintains 60fps performance with thousands of elements
```

### Performance Monitoring
```javascript
// Enable performance monitoring
const options = {
    performanceMode: true,
    enableSpatialIndex: true,
    lodThreshold: 100
};
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

### Navigation
- `Ctrl + Scroll` - Zoom in/out
- `Space + Drag` - Pan view (or Alt+Drag)
- `Arrow Keys` - Move selected elements (1px)
- `Shift + Arrow Keys` - Move selected elements (grid size)

### Tools & View
- `G` - Toggle grid visibility
- `P` - Toggle preview mode
- `+/-` - Zoom in/out (when focused)

### Element Manipulation
- `Double-click` - Edit text/markdown elements
- `Right-click` - Context menu
- `Drag` - Move elements
- `Resize handles` - Resize elements
- `Rotation handle` - Rotate elements

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

SWW uses CSS custom properties for easy theming:

```css
:root {
    --sww-primary-color: #007bff;
    --sww-background-color: #ffffff;
    --sww-panel-background: #18181b;
    --sww-text-color: #ffffff;
    --sww-accent-color: #00FF99;
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

### Complete HTML Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My SWW App</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="sww.css">
    <script src="sww.js"></script>
</head>
<body>
    <div class="sww-editor-container">
        <!-- Control Panel -->
        <div class="sww-control-panel" id="sww-control-panel">
            <div class="sww-control-header">
                <div><h4>SW Whiteboard</h4></div>
                <div class="sww-control-header-actions">
                    <button class="sww-panel-button" onclick="togglePanelWidth()">
                        <i class="fas fa-expand"></i>
                    </button>
                    <button class="sww-panel-button active" onclick="togglePanelDock()">
                        <i class="fas fa-bookmark"></i>
                    </button>
                </div>
            </div>
            
            <!-- Menu & Tools will be automatically generated -->
            <div class="sww-control-menu"></div>
            <div id="sww-elements-section" class="sww-control-section"></div>
            <div id="sww-layers-section" class="sww-control-section"></div>
            <div id="sww-customize-section" class="sww-control-section"></div>
        </div>

        <!-- Canvas Area -->
        <div class="sww-canvas-area" id="whiteboard-container"></div>
    </div>

    <!-- Toolbar -->
    <div class="sww-toolbar-container">
        <!-- Zoom, actions, and menu controls will be automatically generated -->
    </div>
    
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const container = document.getElementById('whiteboard-container');
            
            // Initialize whiteboard
            const whiteboard = sww.init(container, {
                backgroundColor: "#ffffff",
                gridSize: 20,
                showGrid: true,
                readOnly: false  // Set to true for presentation mode
            });
            
            // Initialize control panel
            const controlPanel = new SWWControlPanel(whiteboard);
            
            // Setup panel functions
            window.togglePanelWidth = () => {
                document.getElementById('sww-control-panel').classList.toggle('expanded');
            };
            
            window.togglePanelDock = () => {
                document.getElementById('sww-control-panel').classList.toggle('undocked');
            };
            
            console.log('SWW initialized successfully!');
        });
    </script>
</body>
</html>
```

### Read-Only Presentation Mode

```html
<script>
    // For presentation/display mode
    const whiteboard = sww.init(container, {
        backgroundColor: "#ffffff",
        readOnly: true,  // Locks editing, prevents escape from preview
        showGrid: false
    });
    
    // Load existing scene data
    const presentationData = {
        elements: [/* your elements */]
    };
    whiteboard.loadScene(presentationData);
</script>
```

---

**SenangWebs Whiteboard** - Making digital drawing simple and powerful! 🎨
