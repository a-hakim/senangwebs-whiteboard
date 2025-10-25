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
