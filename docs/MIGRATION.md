# Migration Guide: SWW v1.x to v2.0

SWW v2.0 is a complete rewrite with significant architectural changes. This guide will help you migrate from the monolithic v1.x to the new modular v2.0.

## Breaking Changes

### 1. Module System
**v1.x (Monolithic):**
```html
<script src="sww.js"></script>
<script>
const instance = sww.init(container);
</script>
```

**v2.x (Modular):**
```html
<script type="module">
import SWW from './src/main.js';
const instance = SWW.init(container);
</script>
```

### 2. Instance Creation
**v1.x:**
```javascript
const instance = sww.init(container, options);
```

**v2.x:**
```javascript
const instance = SWW.init(container, options);
// or
import { SWWInstance } from './src/main.js';
const instance = new SWWInstance(container, options);
```

### 3. Event System
**v1.x:** Events were handled internally

**v2.x:** Comprehensive event system
```javascript
instance.events.on('elementCreated', (data) => {
    console.log('Element created:', data.element);
});

instance.events.on('selectionChanged', (data) => {
    console.log('Selected:', data.selected);
});
```

### 4. Tool Registration
**v1.x:** Tools were hardcoded

**v2.x:** Extensible tool system
```javascript
import { BaseTool } from './src/tools/BaseTool.js';

class CustomTool extends BaseTool {
    constructor() {
        super('custom', 'fas fa-star');
    }
    // ... implement tool methods
}

instance.registerTool(new CustomTool());
```

### 5. Configuration Changes
**v1.x:**
```javascript
sww.init(container, {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff'
});
```

**v2.x:** More configuration options
```javascript
SWW.init(container, {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    gridSize: 20,
    showGrid: true,
    snapToGrid: true,
    maxHistorySize: 50,
    enableDebug: false
});
```

## Migration Steps

### Step 1: Update File Structure
Replace the single `sww.js` file with the new modular structure:

```
old/
└── sww.js

new/
├── src/
│   ├── core/
│   ├── tools/
│   ├── ui/
│   ├── utils/
│   ├── events/
│   ├── export/
│   ├── SWWInstance.js
│   └── main.js
├── dist/           (built files)
├── examples/
└── docs/
```

### Step 2: Update HTML
**Before:**
```html
<script src="sww.js"></script>
```

**After:**
```html
<!-- ES Module (recommended) -->
<script type="module" src="main.js"></script>

<!-- Or UMD build -->
<script src="dist/sww.js"></script>
```

### Step 3: Update Initialization Code
**Before:**
```javascript
const container = document.getElementById('canvas');
const instance = sww.init(container, options);
instance.setTool('rectangle');
```

**After:**
```javascript
import SWW from './src/main.js';

const container = document.getElementById('canvas');
const instance = SWW.init(container, options);
instance.setTool('rectangle');
```

### Step 4: Update Event Handling
**Before:** Events were handled by callbacks or polling

**After:** Use the event system
```javascript
// Listen for element creation
instance.events.on('elementCreated', (data) => {
    console.log('New element:', data.element);
});

// Listen for selection changes
instance.events.on('selectionChanged', (data) => {
    updateUI(data.selected);
});

// Listen for tool changes
instance.events.on('toolChanged', (data) => {
    updateToolbar(data.toolName);
});
```

### Step 5: Update Custom Tools (if any)
**Before:** Custom tools required modifying the main file

**After:** Create separate tool classes
```javascript
import { BaseTool } from './src/tools/BaseTool.js';

export class MyCustomTool extends BaseTool {
    constructor() {
        super('mycustom', 'fas fa-star');
    }
    
    onPointerDown(data) {
        // Handle pointer down
        console.log('Pointer down at:', data.point);
    }
    
    onPointerMove(data) {
        // Handle pointer move
        if (data.isDown) {
            console.log('Dragging to:', data.point);
        }
    }
    
    onPointerUp(data) {
        // Handle pointer up
        console.log('Pointer up at:', data.point);
    }
}

// Register the tool
instance.registerTool(new MyCustomTool());
```

### Step 6: Update Export Functions
**Before:**
```javascript
const svgData = instance.exportToSVG();
instance.exportToPNG();
```

**After:** Same API, but with more options
```javascript
const svgData = instance.exportToSVG();
instance.exportToPNG(2); // 2x scale
const jsonData = instance.exportToJSON();
```

## New Features Available

### 1. Comprehensive Event System
```javascript
// Available events
instance.events.on('elementCreated', handler);
instance.events.on('elementUpdated', handler);
instance.events.on('elementDeleted', handler);
instance.events.on('selectionChanged', handler);
instance.events.on('toolChanged', handler);
instance.events.on('canvasUpdated', handler);
```

### 2. Better History Management
```javascript
// Check if undo/redo is available
const history = instance.history.getHistory();
console.log('Can undo:', history.canUndo);
console.log('Can redo:', history.canRedo);

// Configure history size
const instance = SWW.init(container, {
    maxHistorySize: 100  // default: 50
});
```

### 3. Enhanced Configuration
```javascript
const instance = SWW.init(container, {
    // Visual options
    backgroundColor: '#ffffff',
    gridSize: 20,
    showGrid: true,
    
    // Behavior options
    snapToGrid: true,
    maxHistorySize: 50,
    
    // Debug options
    enableDebug: false
});
```

### 4. Instance Management
```javascript
// Get existing instance
const existing = SWW.getInstance(container);

// Destroy instance
SWW.destroy(container);

// Get all instances
const all = SWW.getAllInstances();

// Destroy all instances
SWW.destroyAll();
```

## Testing Your Migration

1. **Basic Functionality:** Ensure drawing tools work
2. **Selection:** Test element selection and manipulation
3. **History:** Test undo/redo functionality
4. **Export:** Test SVG and PNG export
5. **Events:** Verify event listeners are working
6. **Performance:** Check that performance is maintained or improved

## Common Issues

### Issue 1: Module Loading Errors
**Problem:** `Uncaught SyntaxError: Cannot use import statement outside a module`

**Solution:** Ensure you're using `type="module"` in your script tag:
```html
<script type="module" src="main.js"></script>
```

### Issue 2: Missing Tools
**Problem:** Some tools from v1.x are not available in v2.x

**Solution:** v2.x starts with core tools. Additional tools will be added in future updates or you can implement them as custom tools.

### Issue 3: Different Event Behavior
**Problem:** Some events behave differently than in v1.x

**Solution:** Review the new event system documentation and update your event handlers accordingly.

### Issue 4: Style Changes
**Problem:** The appearance looks different

**Solution:** v2.x includes updated CSS. You may need to adjust your custom styles or override the default styles.

## Getting Help

- Check the [examples](../examples/) directory for working examples
- Review the [API documentation](../docs/API.md)
- Open an issue on GitHub for specific problems
- Consult the source code - it's well-documented and modular

## Rollback Plan

If you need to rollback to v1.x:
1. Keep a backup of your v1.x implementation
2. Test v2.x thoroughly in a development environment first
3. Have a migration timeline that allows for debugging

Remember that v2.x offers significant advantages in maintainability, extensibility, and developer experience, making the migration worthwhile for long-term projects.
