# API Reference

### Core Initialization

#### `sww.init(container, options)`

Initializes a new SWW instance in the specified container.

**Parameters:**
- `container` (HTMLElement) - Required. The DOM element to initialize SWW in
- `options` (Object) - Optional. Configuration options (see Configuration section)

**Returns:** SWWInstance object

```javascript
const instance = sww.init(document.getElementById('container'), {
    backgroundColor: "#ffffff",
    gridSize: 20,
    showGrid: true
});
```

### Drawing Tool Methods

#### `setTool(toolName)`

Sets the current drawing tool.

**Parameters:**
- `toolName` (string) - Tool name: 'select', 'rectangle', 'ellipse', 'diamond', 'parallelogram', 'star', 'arrow', 'text', 'draw', 'website', 'image', 'markdown'

```javascript
instance.setTool('rectangle');
instance.setTool('text');
instance.setTool('select');
```

### Scene Management Methods

#### `getScene()`

Returns the current scene data as a JSON-serializable object.

**Returns:** Object containing:
- `elements` (Array) - All scene elements with their properties
- `viewBox` (Object) - Current viewport position and dimensions
- `zoom` (Number) - Current zoom level

```javascript
const sceneData = instance.getScene();
console.log(`Scene has ${sceneData.elements.length} elements`);
localStorage.setItem('my-drawing', JSON.stringify(sceneData));
```

#### `loadScene(sceneData)`

Loads a scene from JSON data. Clears current scene and replaces with loaded data.

**Parameters:**
- `sceneData` (Object) - Scene data object (from `getScene()`)

```javascript
const savedData = JSON.parse(localStorage.getItem('my-drawing'));
instance.loadScene(savedData);
```

#### `clearAll()`

Clears all elements from the canvas. Creates undo history entry.

```javascript
instance.clearAll();
```

### Element Management Methods

#### `getElementById(elementId)`

Finds and returns an element by its unique ID.

**Parameters:**
- `elementId` (string) - The unique element ID

**Returns:** Element object or `null` if not found

```javascript
const element = instance.getElementById('my-element-id');
if (element) {
    console.log('Element found:', element.type, element.x, element.y);
}
```

#### `selectElementById(elementId)`

Selects a specific element by its ID, clearing any previous selection.

**Parameters:**
- `elementId` (string) - The unique element ID

**Returns:** `true` if element found and selected, `false` otherwise

```javascript
const success = instance.selectElementById('my-element-id');
if (success) {
    console.log('Element selected');
}
```

#### `deleteElementById(elementId)`

Deletes a specific element by its ID. Creates undo history entry.

**Parameters:**
- `elementId` (string) - The unique element ID

**Returns:** `true` if element found and deleted, `false` otherwise

```javascript
const success = instance.deleteElementById('my-element-id');
console.log('Element deleted:', success);
```

#### `toggleElementVisibility(elementId)`

Toggles the visibility of an element by its ID.

**Parameters:**
- `elementId` (string) - The unique element ID

**Returns:** `true` if element found and toggled, `false` otherwise

```javascript
// Hide or show an element
const success = instance.toggleElementVisibility('my-element-id');
console.log('Visibility toggled:', success);
```

#### `generateId()`

Generates a unique ID for new elements. IDs are in format: `sww-<random>`

**Returns:** String - Unique element ID

```javascript
const newId = instance.generateId();
console.log('New ID:', newId); // e.g., 'sww-abc123def'
```
