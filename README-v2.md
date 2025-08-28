# SenangWebs Works (SWW) v2.0

A modern, modular JavaScript library for creating digital whiteboards and vector drawings. Complete rewrite with better architecture, developer experience, and maintainability.

## 🚀 Features

- **Modular Architecture**: Clean separation of concerns with pluggable components
- **Modern ES6+ Code**: Written with modern JavaScript features and best practices  
- **Event-Driven**: Comprehensive event system for extensibility
- **Tool System**: Extensible tool architecture for adding new drawing tools
- **History Management**: Full undo/redo support with configurable history size
- **Export Support**: Export to SVG, PNG, and JSON formats
- **No Dependencies**: Pure JavaScript with no external dependencies
- **TypeScript Ready**: Well-structured code ready for TypeScript definitions

## 📦 Installation

### NPM (Coming Soon)
```bash
npm install senangworks-sww
```

### CDN (Coming Soon)
```html
<script src="https://cdn.jsdelivr.net/npm/senangworks-sww@2.0.0/dist/sww.min.js"></script>
```

### Manual Download
Download the files from this repository and include them in your project.

## 🎯 Quick Start

### ES Modules (Recommended)
```html
<div id="drawing-canvas" style="width: 100%; height: 500px;"></div>

<script type="module">
import SWW from './src/main.js';

const canvas = document.getElementById('drawing-canvas');
const sww = SWW.init(canvas, {
    backgroundColor: '#ffffff',
    gridSize: 20,
    showGrid: true,
    snapToGrid: true
});

// Set tool
sww.setTool('rectangle');

// Listen to events
sww.events.on('elementCreated', (data) => {
    console.log('Element created:', data.element);
});
</script>
```

### UMD (Browser Global)
```html
<div id="drawing-canvas" style="width: 100%; height: 500px;"></div>

<script src="dist/sww.js"></script>
<script>
const canvas = document.getElementById('drawing-canvas');
const sww = SWW.init(canvas, {
    backgroundColor: '#ffffff',
    gridSize: 20,
    showGrid: true
});
</script>
```

## 🏗️ Architecture

### Project Structure
```
src/
├── core/                 # Core system components
│   ├── config.js        # Configuration and constants
│   ├── CanvasManager.js # Canvas and viewport management
│   ├── ElementFactory.js # Element creation and validation
│   └── HistoryManager.js # Undo/redo functionality
├── tools/               # Drawing tools
│   ├── BaseTool.js      # Abstract base tool class
│   ├── SelectTool.js    # Selection and manipulation
│   └── ShapeTools.js    # Shape drawing tools
├── ui/                  # User interface components
├── utils/               # Utility functions
│   └── helpers.js       # Common helper functions
├── events/              # Event handling
│   └── EventManager.js  # Event system and input handling
├── export/              # Export functionality
│   └── ExportManager.js # SVG, PNG, JSON export
├── SWWInstance.js       # Main application instance
└── main.js              # Entry point and public API
```

### Core Components

#### SWWInstance
The main application instance that coordinates all components:
- Manages tools, elements, and application state
- Handles user input and tool switching
- Provides public API for external interaction

#### CanvasManager
Handles SVG canvas creation and viewport management:
- Creates and manages SVG elements
- Handles zoom and pan operations
- Manages coordinate transformations

#### ElementFactory
Creates and validates drawing elements:
- Standardized element creation
- Element validation and cloning
- Bounding box calculations

#### HistoryManager
Manages undo/redo functionality:
- Configurable history size
- State serialization and restoration
- Action-based history tracking

#### EventManager
Comprehensive event system:
- DOM event handling (mouse, keyboard, touch)
- Custom application events
- Event listener management

### Tool System

Tools are modular and extensible. Each tool extends the `BaseTool` class:

```javascript
import { BaseTool } from './BaseTool.js';

export class CustomTool extends BaseTool {
    constructor() {
        super('custom', 'fas fa-star');
    }
    
    onPointerDown(data) {
        // Handle pointer down
    }
    
    onPointerMove(data) {
        // Handle pointer move
    }
    
    onPointerUp(data) {
        // Handle pointer up
    }
}

// Register the tool
sww.registerTool(new CustomTool());
```

## 🛠️ API Reference

### Initialization
```javascript
const sww = SWW.init(container, options);
```

**Options:**
- `width`: Canvas width (default: '100%')
- `height`: Canvas height (default: '100%')
- `backgroundColor`: Background color (default: '#ffffff')
- `gridSize`: Grid size in pixels (default: 20)
- `showGrid`: Show grid (default: true)
- `snapToGrid`: Enable grid snapping (default: true)
- `maxHistorySize`: Maximum undo history (default: 50)

### Tools
```javascript
// Set active tool
sww.setTool('rectangle');

// Get current tool
const currentTool = sww.getCurrentTool();

// Register custom tool
sww.registerTool(new CustomTool());
```

**Built-in Tools:**
- `select`: Selection and manipulation
- `rectangle`: Rectangle shapes
- `ellipse`: Ellipse/circle shapes  
- `diamond`: Diamond shapes

### Scene Management
```javascript
// Get scene data
const scene = sww.getScene();

// Load scene
sww.loadScene(sceneData);

// Clear canvas
sww.clearAll();
```

### Selection
```javascript
// Select all elements
sww.selectAll();

// Clear selection
sww.clearSelection();

// Delete selected elements
sww.deleteSelectedElements();
```

### History
```javascript
// Undo last action
sww.undo();

// Redo last undone action
sww.redo();
```

### Export
```javascript
// Export to SVG
const svgData = sww.exportToSVG();

// Export to PNG
sww.exportToPNG(2); // 2x scale

// Export to JSON
const jsonData = sww.exportToJSON();
```

### Events
```javascript
// Listen to events
sww.events.on('elementCreated', (data) => {
    console.log('Element created:', data.element);
});

sww.events.on('selectionChanged', (data) => {
    console.log('Selection changed:', data.selected);
});

sww.events.on('toolChanged', (data) => {
    console.log('Tool changed:', data.toolName);
});
```

**Available Events:**
- `elementCreated`: When an element is created
- `elementUpdated`: When an element is modified
- `elementDeleted`: When an element is deleted
- `selectionChanged`: When selection changes
- `toolChanged`: When active tool changes
- `canvasUpdated`: When canvas is updated

## 🔧 Development

### Setup
```bash
# Install dependencies
npm install

# Build the library
npm run build

# Watch for changes
npm run build:watch

# Start development server
npm run serve
```

### Building
The build process creates multiple output formats:
- `dist/sww.esm.js`: ES Module build
- `dist/sww.js`: UMD build for browsers
- `dist/sww.min.js`: Minified UMD build

### Project Scripts
- `npm run build`: Build for production
- `npm run build:watch`: Build and watch for changes
- `npm run dev`: Development build with watching
- `npm run serve`: Start HTTP server for examples
- `npm run lint`: Run ESLint

## 📱 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔄 Migration from v1.x

SWW v2.0 is a complete rewrite with breaking changes. See [MIGRATION.md](docs/MIGRATION.md) for detailed migration guide.

## 📚 Examples

- [Basic Usage](examples/basic.html)
- [Advanced Demo](demo.html)

## 🎯 Roadmap

- [ ] Line and Arrow tools
- [ ] Freehand drawing tool
- [ ] Text editing tool
- [ ] Image and website embedding
- [ ] Collaborative editing
- [ ] Touch/mobile support improvements
- [ ] TypeScript definitions
- [ ] Plugin system
- [ ] Performance optimizations
