# SenangWebs Whiteboard (SWW)

A powerful, client-side JavaScript drawing library for creating digital whiteboards and vector drawings. Similar to Excalidraw but entirely self-contained with no external dependencies.

## 🚀 Features

### Drawing Tools
- **Basic Shapes**: Rectangle, Ellipse, Diamond, Parallelogram, Star
- **Lines & Arrows**: Directional arrows with customizable styles
- **Text Elements**: Rich text with customizable fonts and sizes
- **Media Elements**: Embed websites, images, and markdown documents
- **Free Drawing**: Pen tool for freehand sketching

### Advanced Capabilities
- **Layer Management**: Full layer control with visibility, locking, and ordering
- **Selection Tools**: Multi-select, selection boxes, and bulk operations
- **Undo/Redo System**: Complete history management
- **Performance Optimized**: Spatial indexing and Level of Detail (LOD) for handling thousands of elements
- **Export Options**: SVG and PNG export functionality
- **Grid System**: Snap-to-grid functionality with customizable grid sizes
- **Zoom Controls**: Smooth zooming and panning
- **Clipboard Operations**: Copy, paste, and duplicate functionality

### User Interface
- **Control Panel**: Organized tool selection and layer management
- **Properties Panel**: Real-time property editing for selected elements
- **Context Menus**: Right-click operations for quick actions
- **Keyboard Shortcuts**: Standard shortcuts for common operations
- **Responsive Design**: Works on desktop and tablet devices

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
    enableSnapToGrid: true,       // Enable snap-to-grid
    maxHistorySteps: 50,          // Maximum undo/redo steps
    performanceMode: false,       // Enable performance optimizations
    enableSpatialIndex: true,     // Use spatial indexing for large scenes
    lodThreshold: 100            // Element count threshold for LOD
};

const swwInstance = sww.init(container, options);
```

## 🎨 Drawing Tools

### Shape Tools
- `rectangle` - Draw rectangles and squares
- `ellipse` - Draw circles and ellipses  
- `diamond` - Draw diamond shapes
- `parallelogram` - Draw parallelograms
- `star` - Draw star shapes
- `arrow` - Draw directional arrows

### Content Tools
- `text` - Add text elements
- `website` - Embed website previews
- `image` - Add image elements
- `markdown` - Add markdown documents

### Utility Tools
- `select` - Selection and manipulation tool
- `draw` - Freehand drawing tool

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

### Zoom and View Methods

#### `zoomIn()` / `zoomOut()`
Zoom in or out of the canvas.

#### `resetZoom()`
Reset zoom to 100%.

#### `toggleGrid()`
Toggle grid visibility.

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
// - Tool selection
// - Layer management
// - Element properties
// - Scene operations
```

### Layer Management

```javascript
// Layer operations through the demo interface
SWWDemo.init(swwInstance);

// Select specific layer
SWWDemo.toggleLayerSelection('layer-id');

// Toggle layer visibility
SWWDemo.toggleLayerVisibility('layer-id');

// Lock/unlock layer
SWWDemo.toggleLayerLock('layer-id');

// Focus on specific layer
SWWDemo.focusOnLayer('layer-id');
```

## 🎪 Demo Functions

The library includes comprehensive demo functions:

```javascript
const demo = SWWDemo.init(swwInstance);

// Create sample drawing
demo.createSampleDrawing();

// Clear canvas
demo.clearCanvas();

// Select all objects
demo.selectAllObjects();

// Randomize colors
demo.randomizeColors();

// Scene management
demo.saveScene();
demo.loadLastScene();

// Export functions
demo.exportSVG();
demo.exportPNG();
demo.copySceneJSON();
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
    fillStyle: "solid",        // Fill style: solid, hachure, transparent
    opacity: 1.0,              // Opacity (0-1)
    rotation: 0,               // Rotation in degrees
    locked: false,             // Lock element
    visible: true              // Visibility
}
```

### Text Properties
Text elements have additional properties:

```javascript
{
    type: "text",
    text: "Sample text",
    fontSize: 16,
    fontFamily: "Arial",
    textAlign: "left"
}
```

### Website Properties
Website elements for embedding:

```javascript
{
    type: "website", 
    url: "https://example.com",
    title: "Website Title"
}
```

### Image Properties
Image elements:

```javascript
{
    type: "image",
    src: "image-url-or-data",
    alt: "Alt text"
}
```

## 🎮 Keyboard Shortcuts

- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo  
- `Ctrl+A` - Select All
- `Ctrl+C` - Copy
- `Ctrl+V` - Paste
- `Delete` - Delete selected
- `Escape` - Clear selection
- `+/-` - Zoom in/out
- `Space + Drag` - Pan view

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
    fillStyle: "solid"
};

// Add to scene
swwInstance.elements.push(customElement);
swwInstance.createSVGElement(customElement);
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
```

### Save/Load System

```javascript
// Save to localStorage
const sceneData = swwInstance.getScene();
localStorage.setItem('my-drawing', JSON.stringify(sceneData));

// Load from localStorage  
const savedData = JSON.parse(localStorage.getItem('my-drawing'));
swwInstance.loadScene(savedData);
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
    <div id="whiteboard-container" style="width: 100vw; height: 100vh;"></div>
    
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const container = document.getElementById('whiteboard-container');
            const whiteboard = sww.init(container, {
                backgroundColor: "#ffffff",
                gridSize: 20,
                showGrid: true
            });
            
            // Initialize demo functions
            const demo = SWWDemo.init(whiteboard);
            
            // Initialize control panel
            const controlPanel = new SWWControlPanel(whiteboard);
            
            console.log('SWW initialized successfully!');
        });
    </script>
</body>
</html>
```

---

**SenangWebs Whiteboard** - Making digital drawing simple and powerful! 🎨
