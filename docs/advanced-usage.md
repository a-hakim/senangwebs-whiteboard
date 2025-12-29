# Advanced Usage

### Custom Element Creation

```javascript
// Create custom element programmatically
const customElement = {
    id: swwInstance.generateId(),
    type: "rectangle",
    x: 100, 
    y: 100,
    width: 200, 
    height: 150,
    strokeColor: "#ff0000",
    strokeWidth: 2,
    fillColor: "#ffcccc",
    fillStyle: "gradient",
    gradientType: "linear",
    gradientStops: [
        { offset: 0, color: "#ff0000" },
        { offset: 100, color: "#ffcccc" }
    ],
    opacity: 1,
    rotation: 0
};

// Add to scene (Note: Direct manipulation - use with caution)
swwInstance.elements.push(customElement);
const svgElement = swwInstance.createSVGElement(customElement);
customElement.svgElement = svgElement;
swwInstance.addSVGElementToDOM(customElement);
swwInstance.updateSVGElement(customElement);
swwInstance.updateElementInSpatialIndex(customElement);
```

### Gradient Management

```javascript
// Create multi-stop gradient
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
    // Auto-save to localStorage
    localStorage.setItem('auto-save', JSON.stringify(swwInstance.getScene()));
});

// Listen for selection changes
container.addEventListener('sww:selectionChanged', (event) => {
    console.log('Selected elements:', event.detail.selectedElements);
    // Update custom UI based on selection
});

// Listen for preview mode changes
container.addEventListener('previewModeEntered', () => {
    console.log('Entered presentation mode');
    // Hide custom UI elements
});

container.addEventListener('previewModeExited', () => {
    console.log('Exited presentation mode');
    // Show custom UI elements
});
```

### Save/Load System

```javascript
// Save to localStorage with metadata
const sceneData = swwInstance.getScene();
const saveData = {
    version: "1.0.0",
    timestamp: Date.now(),
    elements: sceneData.elements,
    viewBox: sceneData.viewBox,
    zoom: sceneData.zoom,
    metadata: {
        title: "My Drawing",
        author: "User Name"
    }
};
localStorage.setItem('my-drawing', JSON.stringify(saveData));

// Load from localStorage
const savedData = JSON.parse(localStorage.getItem('my-drawing'));
if (savedData) {
    swwInstance.loadScene({
        elements: savedData.elements,
        viewBox: savedData.viewBox,
        zoom: savedData.zoom
    });
    console.log(`Loaded: ${savedData.metadata.title}`);
}

// Export to file
function downloadScene() {
    const sceneData = swwInstance.getScene();
    const json = JSON.stringify(sceneData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'drawing.sww.json';
    link.click();
    URL.revokeObjectURL(url);
}

// Import from file
function loadSceneFromFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const sceneData = JSON.parse(e.target.result);
            swwInstance.loadScene(sceneData);
        } catch (error) {
            console.error('Failed to load scene:', error);
        }
    };
    reader.readAsText(file);
}
```

### Working with Tables

```javascript
// Create a table using the tool
swwInstance.setTool('table');
// Click on canvas to place the table

// Or create a table element programmatically
const tableElement = {
    id: swwInstance.generateId(),
    type: "table",
    x: 100,
    y: 100,
    width: 400,
    height: 200,
    strokeColor: "#333333",
    strokeWidth: 1,
    fillColor: "transparent",
    textColor: "#333333",
    fontSize: 14,
    fontFamily: "Arial, sans-serif",
    tableData: {
        headers: ["Column 1", "Column 2", "Column 3"],
        rows: [
            ["Row 1 Cell 1", "Row 1 Cell 2", "Row 1 Cell 3"],
            ["Row 2 Cell 1", "Row 2 Cell 2", "Row 2 Cell 3"]
        ],
        columnWidths: [100, 100, 100],
        rowHeights: [40, 40]
    }
};

// Add rows and columns
swwInstance.addTableRow(tableElement);          // Add row at end
swwInstance.addTableRowAt(tableElement, 0);     // Add row at position
swwInstance.addTableColumn(tableElement);       // Add column at end
swwInstance.addTableColumnAt(tableElement, 1);  // Add column at position

// Remove rows and columns
swwInstance.removeTableRow(tableElement, 0);    // Remove first row
swwInstance.removeTableColumn(tableElement, 2); // Remove third column

// Table interaction:
// - Double-click a cell to edit its content
// - Drag column borders to resize columns
// - Drag row borders to resize rows
// - Press Enter to save cell, Escape to cancel
```
