# 🚀 Getting Started with SWW v2.0

Welcome to SenangWebs Works v2.0! Here's how to start using the new modular drawing library.

## Quick Start (3 Options)

### Option 1: Direct ES Module Usage (Recommended)
Perfect for modern development with ES6 modules.

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Drawing App</title>
    <style>
        #canvas { width: 100%; height: 500px; border: 1px solid #ccc; }
    </style>
</head>
<body>
    <div id="canvas"></div>
    
    <script type="module">
        import SWW from './src/main.js';
        
        // Initialize SWW
        const canvas = document.getElementById('canvas');
        const sww = SWW.init(canvas, {
            backgroundColor: '#ffffff',
            gridSize: 20,
            showGrid: true,
            snapToGrid: true
        });
        
        // Set drawing tool
        sww.setTool('rectangle');
        
        // Listen to events
        sww.events.on('elementCreated', (data) => {
            console.log('Element created:', data.element);
        });
        
        // Change tools programmatically
        setTimeout(() => sww.setTool('ellipse'), 3000);
    </script>
</body>
</html>
```

### Option 2: Built UMD Version
Use the built version for broader browser compatibility.

**First, build the library:**
```bash
npm run build
```

**Then use it:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>My Drawing App</title>
    <style>
        #canvas { width: 100%; height: 500px; border: 1px solid #ccc; }
    </style>
</head>
<body>
    <div id="canvas"></div>
    
    <script src="dist/sww.js"></script>
    <script>
        // Initialize SWW
        const canvas = document.getElementById('canvas');
        const sww = SWW.init(canvas, {
            backgroundColor: '#ffffff',
            gridSize: 20,
            showGrid: true
        });
        
        sww.setTool('rectangle');
    </script>
</body>
</html>
```

### Option 3: Try the Examples
Start with our ready-made examples:

```bash
# Start the development server
npm run serve
# or use the Node.js server
node scripts/dev-server.js
```

Then open:
- http://localhost:8000/examples/basic.html
- http://localhost:8000/index-v2.html

## 📋 Available Tools

Currently implemented:
- `select` - Selection and manipulation
- `rectangle` - Draw rectangles
- `ellipse` - Draw ellipses/circles  
- `diamond` - Draw diamond shapes

## 🎯 Basic API Usage

### Initialization
```javascript
const sww = SWW.init(containerElement, options);
```

**Options:**
```javascript
{
    width: '100%',           // Canvas width
    height: '100%',          // Canvas height
    backgroundColor: '#fff', // Background color
    gridSize: 20,           // Grid size in pixels
    showGrid: true,         // Show grid
    snapToGrid: true,       // Enable grid snapping
    maxHistorySize: 50      // Undo history size
}
```

### Tool Management
```javascript
// Set active tool
sww.setTool('rectangle');

// Get current tool
const currentTool = sww.getCurrentTool();
```

### Event Handling
```javascript
// Listen for element creation
sww.events.on('elementCreated', (data) => {
    console.log('New element:', data.element);
});

// Listen for selection changes
sww.events.on('selectionChanged', (data) => {
    console.log('Selected elements:', data.selected);
});

// Listen for tool changes
sww.events.on('toolChanged', (data) => {
    console.log('Active tool:', data.toolName);
});
```

### Scene Management
```javascript
// Get scene data
const scene = sww.getScene();

// Load scene
sww.loadScene(sceneData);

// Clear everything
sww.clearAll();
```

### Selection and Manipulation
```javascript
// Select all elements
sww.selectAll();

// Clear selection
sww.clearSelection();

// Delete selected elements
sww.deleteSelectedElements();
```

### History (Undo/Redo)
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

// Export to PNG (downloads automatically)
sww.exportToPNG(2); // 2x scale

// Export scene as JSON
const jsonData = sww.exportToJSON();
```

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Build and watch for changes
npm run build:watch

# Development build
npm run dev

# Start development server
npm run serve

# Run linting
npm run lint
```

## 🎨 Creating Custom Tools

```javascript
import { BaseTool } from './src/tools/BaseTool.js';

class MyCustomTool extends BaseTool {
    constructor() {
        super('mycustom', 'fas fa-star');
    }
    
    onPointerDown(data) {
        console.log('Pointer down at:', data.point);
        // Create your custom element
        this.currentElement = this.createElement('myCustomType', data.point);
        this.addElement(this.currentElement);
    }
    
    onPointerMove(data) {
        if (this.isDrawing()) {
            // Update your element
            this.currentElement.width = data.point.x - this.startPoint.x;
            this.currentElement.height = data.point.y - this.startPoint.y;
            this.updateElement(this.currentElement);
        }
    }
    
    onPointerUp(data) {
        if (this.isDrawing()) {
            this.finishElement();
        }
    }
}

// Register your tool
sww.registerTool(new MyCustomTool());
sww.setTool('mycustom');
```

## 📱 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🔍 Troubleshooting

### Module Loading Issues
If you get "Cannot use import statement outside a module":
```html
<script type="module" src="..."></script>
```

### CORS Issues
If loading from file://, use a local server:
```bash
npm run serve
```

### Build Issues
Make sure dependencies are installed:
```bash
npm install
npm run build
```

## 📚 Next Steps

1. **Check out examples**: Look at `examples/basic.html`
2. **Read documentation**: See `README-v2.md` for full API
3. **Migration guide**: See `docs/MIGRATION.md` if migrating from v1.x
4. **Explore source**: The modular source in `src/` is well-documented

## 💡 Tips

- Use ES modules for the best development experience
- The event system is powerful - use it for custom functionality
- Tools are easily extensible - create your own!
- Grid snapping helps with precise drawing
- Export options preserve your work in multiple formats

## 🆘 Need Help?

- Check the `examples/` directory for working code
- Read the `docs/` directory for detailed guides
- Look at the source code - it's well-documented
- The modular structure makes it easy to understand each component

Happy drawing! 🎨
