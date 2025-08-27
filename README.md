# SenangWebs Works (SWW)

A lightweight, client-side JavaScript library for creating digital whiteboards and vector drawings, similar to Excalidraw. SWW requires no dependencies and can be used in any web project with a single JavaScript file.

## Features

### 🎨 Drawing Tools
- **Basic Shapes**: Rectangle, Ellipse, Diamond, Line
- **Arrows**: Single and double-headed arrows
- **Freehand Drawing**: Pencil tool for sketching
- **Text**: Add and edit text directly on canvas

### 🎯 Object Manipulation
- **Selection**: Single and multi-select objects
- **Movement**: Drag and drop objects
- **Resizing**: Resize objects with aspect ratio control
- **Rotation**: Rotate objects around their center
- **Layering**: Bring to front/send to back
- **Deletion**: Remove selected objects

### 🎨 Styling Options
- **Stroke Color**: Customize line/border colors
- **Stroke Width**: Adjust line thickness (1-20px)
- **Fill Style**: Transparent, Solid, or Hatched fills
- **Fill Color**: Set interior colors
- **Opacity**: Control transparency (0-1)
- **Typography**: Font family and size for text

### 🖼️ Canvas Features
- **Infinite Canvas**: No boundaries, pan and zoom freely
- **Grid System**: Optional grid for alignment
- **Zoom & Pan**: Mouse wheel zoom, Alt+drag or middle-click pan
- **Responsive**: Works on desktop and touch devices

### 💾 Export & Import
- **SVG Export**: Vector format for scalability
- **PNG Export**: Raster format for sharing
- **Scene Save/Load**: JSON serialization for persistence

## Quick Start

### 1. Include the Library

```html
<script src="sww.js"></script>
```

### 2. Create a Container

```html
<div id="drawing-canvas" style="width: 100%; height: 100vh;"></div>
```

### 3. Initialize SWW

```javascript
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('drawing-canvas');
    const swwInstance = sww.init(container);
});
```

## Complete Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SWW Drawing App</title>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
        #drawing-canvas {
            width: 100%;
            height: 100%;
        }
    </style>
</head>
<body>
    <div id="drawing-canvas"></div>
    <script src="sww.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const container = document.getElementById('drawing-canvas');
            const swwInstance = sww.init(container, {
                backgroundColor: '#ffffff',
                gridSize: 20,
                showGrid: true
            });
        });
    </script>
</body>
</html>
```

## API Reference

### Initialization

#### `sww.init(container, options)`
Initialize SWW in a DOM container.

**Parameters:**
- `container` (HTMLElement): The DOM element to render the canvas in
- `options` (Object, optional): Configuration options

**Options:**
```javascript
{
    width: '100%',              // Canvas width
    height: '100%',             // Canvas height
    backgroundColor: '#ffffff',  // Background color
    gridSize: 20,               // Grid size in pixels
    showGrid: true              // Show/hide grid
}
```

**Returns:** SWWInstance object

### Instance Methods

#### `setTool(toolName)`
Change the active drawing tool.

**Parameters:**
- `toolName` (string): Tool name ('select', 'rectangle', 'ellipse', 'diamond', 'line', 'arrow', 'draw', 'text')

```javascript
swwInstance.setTool('rectangle');
```

#### `getScene()`
Get the current scene data as JSON.

**Returns:** Object containing all elements and canvas state

```javascript
const sceneData = swwInstance.getScene();
```

#### `loadScene(sceneData)`
Load a scene from JSON data.

**Parameters:**
- `sceneData` (Object): Scene data from `getScene()`

```javascript
swwInstance.loadScene(savedScene);
```

#### `exportToSVG()`
Export the current drawing as SVG.

**Returns:** SVG string data

```javascript
const svgData = swwInstance.exportToSVG();
```

#### `exportToPNG()`
Export the current drawing as PNG (downloads automatically).

```javascript
swwInstance.exportToPNG();
```

#### `clearAll()`
Clear all elements from the canvas.

```javascript
swwInstance.clearAll();
```

## Controls & Shortcuts

### Mouse Controls
- **Left Click**: Draw/select based on active tool
- **Left Drag**: Create shapes or move objects
- **Middle Click + Drag**: Pan canvas
- **Alt + Left Click + Drag**: Pan canvas
- **Mouse Wheel**: Zoom in/out

### Keyboard Shortcuts
- **Delete/Backspace**: Delete selected objects
- **Escape**: Clear selection
- **Ctrl+A**: Select all objects
- **Shift+Click**: Multi-select objects

### Touch Controls
- **Tap**: Select/draw
- **Drag**: Move objects or create shapes
- **Two-finger gestures**: Planned for future versions

## Styling Properties

### Stroke Properties
- **Color**: Any valid CSS color value
- **Width**: 1-20 pixels

### Fill Properties
- **Style**: 'transparent', 'solid', 'hachure'
- **Color**: Any valid CSS color value
- **Opacity**: 0.0 to 1.0

### Text Properties
- **Font Family**: Any valid CSS font family
- **Font Size**: Size in pixels
- **Color**: Uses stroke color

## Browser Support

SWW works in all modern browsers that support:
- SVG manipulation
- ES6 classes
- Canvas API (for PNG export)

### Tested Browsers
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## Performance

SWW is optimized for:
- **Smooth drawing** with efficient SVG updates
- **Large canvases** with viewport-based rendering
- **Many objects** with optimized selection algorithms
- **Memory efficiency** with minimal DOM manipulation

## Architecture

### Core Components
1. **SWWInstance**: Main application instance
2. **Element System**: Object-oriented element management
3. **Tool System**: Pluggable drawing tools
4. **Event System**: Unified input handling
5. **Render System**: SVG-based rendering

### File Structure
```
sww.js                 # Complete library (single file)
├── Core Framework     # Main SWW class and utilities
├── Element System     # Shape and object management
├── Tool System        # Drawing tool implementations
├── UI Components      # Toolbar and properties panel
├── Event Handlers     # Mouse, touch, and keyboard events
├── Export System      # SVG/PNG export functionality
└── API Layer          # Public API methods
```

## Customization

### Custom Tools
SWW's architecture allows for easy tool extension:

```javascript
// Example: Custom tool implementation would go here
// (Advanced feature for future versions)
```

### Custom Styling
The CSS can be customized by overriding the injected styles:

```css
.sww-toolbar {
    /* Custom toolbar styling */
}

.sww-element.selected {
    /* Custom selection styling */
}
```

## Examples & Use Cases

### Educational Applications
- Interactive diagrams
- Mathematical illustrations
- Flowcharts and mind maps

### Business Applications
- Wireframing and mockups
- Process documentation
- Collaborative sketching

### Creative Applications
- Digital sketching
- Logo design
- Artistic illustrations

## Development

### Building from Source
SWW is designed as a single-file library. No build process required.

### Contributing
1. Fork the repository
2. Make your changes
3. Test thoroughly
4. Submit a pull request

### Testing
Open `index.html` in any modern browser to test functionality.

## License

MIT License - feel free to use in personal and commercial projects.

## Support

For issues, feature requests, or questions:
- Create an issue on the repository
- Check the examples in the `/examples` folder
- Review this documentation

## Roadmap

### Planned Features
- [ ] Layer management
- [ ] Group/ungroup objects
- [ ] Copy/paste functionality
- [ ] Undo/redo system
- [ ] Collaborative editing
- [ ] Mobile touch improvements
- [ ] Additional export formats
- [ ] Plugin system
- [ ] Advanced text editing
- [ ] Shape libraries

---

**SenangWebs Works (SWW)** - Making digital drawing simple and accessible for everyone.
