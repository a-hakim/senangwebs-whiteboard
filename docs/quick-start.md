# Quick Start

### Basic Initialization

```javascript
// Initialize SWW in a container element
const container = document.getElementById('my-container');
const swwInstance = sww.init(container, {
    backgroundColor: "#ffffff",
    gridSize: 20,
    showGrid: true
});
```

### Custom Theme Colors

```javascript
// Initialize with custom theme colors
const swwInstance = sww.init(container, {
    backgroundColor: "#ffffff",
    gridSize: 20,
    showGrid: true,
    // Customize control panel colors
    panelBackgroundColor: '#1a1f3a',  // Dark blue panel
    accentColor: '#4c9aff',            // Light blue accent
    secondaryAccentColor: '#2563eb'    // Deeper blue secondary
});
```

### Setting Drawing Tools

```javascript
// Set the current drawing tool
swwInstance.setTool('rectangle');  // Draw rectangles
swwInstance.setTool('ellipse');    // Draw circles/ellipses
swwInstance.setTool('text');       // Add text
swwInstance.setTool('arrow');      // Draw arrows
swwInstance.setTool('select');     // Selection/manipulation tool
```

### Managing Elements

```javascript
// Select all elements
swwInstance.selectAll();

// Get specific element
const element = swwInstance.getElementById('element-id');

// Select specific element
swwInstance.selectElementById('element-id');

// Toggle element visibility
swwInstance.toggleElementVisibility('element-id');

// Delete specific element
swwInstance.deleteElementById('element-id');

// Clear the canvas
swwInstance.clearAll();
```

### Working with Scenes

```javascript
// Get current scene data
const sceneData = swwInstance.getScene();
console.log(`Scene has ${sceneData.elements.length} elements`);

// Save to localStorage
localStorage.setItem('my-drawing', JSON.stringify(sceneData));

// Load scene data
const savedData = JSON.parse(localStorage.getItem('my-drawing'));
swwInstance.loadScene(savedData);
```

### Zoom and Navigation

```javascript
// Zoom controls
swwInstance.zoomIn();      // Zoom in 10%
swwInstance.zoomOut();     // Zoom out 10%
swwInstance.resetZoom();   // Reset to 100%

// Fit all elements in view
swwInstance.fitCanvasToElements();

// Toggle grid
swwInstance.toggleGrid();
```
