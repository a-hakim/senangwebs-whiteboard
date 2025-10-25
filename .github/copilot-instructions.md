# SenangWebs Whiteboard (SWW) - AI Coding Agent Instructions

## Project Overview

**SenangWebs Whiteboard** is a client-side JavaScript drawing library for creating interactive digital whiteboards. The library is distributed as a single UMD bundle (`dist/sww.js` + `dist/sww.css`) with all dependencies pre-bundled (FontAwesome, Marked.js).

**Core Architecture**: 
- **Distribution**: Single UMD bundle (~150KB) for easy integration
- **Development**: Hybrid modular + legacy architecture during migration
- **Legacy**: Original monolithic implementation preserved as `sww-legacy.js`
- **Build**: Webpack bundles all modules into single distributable file

**✅ Phase 1 Complete**: Modular infrastructure established and building successfully.
**⏳ Migration Status**: Currently using hybrid approach - new entry point imports legacy implementation while features are gradually extracted into modules. See `MODULARIZATION_PLAN.md` for complete roadmap.

## Critical Developer Workflows

### Build System (Webpack 5)
```bash
npm run build    # Production build (minified bundle)
npm run dev      # Development mode with file watching
```

**Build outputs** (`dist/` folder):
- `sww.js` (150 KB) - Main library bundle with FontAwesome + Marked.js
- `sww.css` (135 KB) - Stylesheet with embedded FontAwesome CSS
- `fonts/` - FontAwesome font files (auto-bundled)
- `styles.js` - Additional style utilities

**Key webpack config details** (`webpack.config.js`):
- UMD library format exports as `SWW` global
- Entry points: `src/js/sww.js` and `src/css/sww.css`
- Babel transpilation for ES6+ support
- Asset handling for fonts and images with custom paths

### No Testing Framework
**Important**: This project has no test suite. `npm test` will error. All testing must be done manually via the HTML examples in `examples/`.

### Development Workflow
1. Edit source files in `src/js/sww.js` or `src/css/sww.css`
2. Run `npm run dev` for auto-rebuild on file changes
3. Open `examples/sww.html` or `examples/sww-tailwind.html` in browser to test
4. Check browser console for errors (no server-side logging)

## Architecture Deep-Dive

### Modular Structure (New)

The library is now organized into logical modules under `src/js/modules/`:

```
modules/
├── utils/          # Utilities and helpers
│   ├── PerformanceUtils.js
│   ├── SpatialIndex.js
│   ├── helpers.js
│   └── constants.js
├── core/           # Core instance and initialization
├── tools/          # Drawing tools
├── elements/       # Element management
├── selection/      # Selection system
├── ui/             # UI components
├── canvas/         # Canvas and viewport
│   └── Background.js
├── history/        # Undo/redo
└── api/            # Public API
```

### Class Hierarchy (Target)

After full modularization, the library will have this structure:

```javascript
// Global SWW object (factory pattern)
const SWW = {
    init(container, options) // Returns new SWWInstance
    getInstance(container)   // Retrieves existing instance
}

// Main instance class (~6,900 lines)
class SWWInstance {
    // State management
    elements = []                    // All drawn elements
    selectedElements = Set()         // Currently selected elements
    historyStack = []                // Undo/redo stack (max 50 entries)
    spatialIndex = SpatialIndex()   // Performance optimization for hit testing
    
    // Critical methods for element management
    getElementById(id)               // Find element by ID
    selectElementById(id)           // Select specific element
    deleteElementById(id)           // Delete specific element
    toggleElementVisibility(id)     // Show/hide element
    
    // Scene management
    getScene()                      // Export all elements as JSON
    loadScene(data)                 // Import scene from JSON
    
    // Tool system
    setTool(toolName)               // Switch drawing tools
}

// Performance utilities
class PerformanceUtils {
    static throttle(func, limit)    // Throttle function calls
    static debounce(func, delay)    // Debounce function calls
}

// Spatial indexing for efficient element lookup
class SpatialIndex {
    constructor(cellSize = 100)     // Grid-based spatial hash
    insert(element, bounds)         // Add element to grid
    query(point)                    // Find elements at point
}
```

### Module System

**Development**: Uses ES6 modules with imports/exports for better organization:
```javascript
// Example module structure
import { PerformanceUtils } from './modules/utils/PerformanceUtils.js';
import { SpatialIndex } from './modules/utils/SpatialIndex.js';

export class SWWInstance {
    // Class implementation
}
```

**Distribution**: Webpack bundles all modules into a single UMD file that exposes:
- `window.sww` - Main factory object
- `window.SWW` - Alternative reference
- `window.SWWControlPanel` - Control panel class

When adding features:
- Create new module file in appropriate `modules/` subdirectory
- Import into main entry point or parent module
- Use mixins pattern for extending SWWInstance functionality
- Webpack automatically bundles everything

### State Management Pattern
Elements are plain JavaScript objects with SVG references:

```javascript
{
    id: 'element-123',
    type: 'rectangle',  // rectangle, ellipse, text, arrow, etc.
    x: 100, y: 100,
    width: 200, height: 150,
    svgElement: <SVG Node>,  // Direct DOM reference
    visible: true,
    locked: false,
    // ... tool-specific properties
}
```

**No reactive framework** - updates happen via direct DOM manipulation and array mutations.

## Tool System Architecture

### Available Drawing Tools
Tools are switched via `setTool(toolName)` where toolName is one of:
- `select` - Selection/manipulation (default)
- `rectangle`, `ellipse`, `diamond`, `parallelogram`, `star` - Shapes
- `arrow`, `line` - Directional elements
- `text` - Text with 10 font families (see `SWWInstance.FONT_FAMILIES`)
- `draw` - Freehand drawing with path optimization
- `website`, `image`, `markdown` - Embedded content (uses Marked.js)

### Tool State Management
Current tool settings stored in `this.toolSettings` object:
```javascript
{
    strokeColor: '#000000',
    strokeWidth: 2,
    fillColor: 'transparent',
    fillStyle: 'solid',  // or 'gradient', 'hatch'
    gradientType: 'linear',  // or 'radial'
    gradientStops: [{offset: 0, color: '#000'}, ...],
    fontSize: 16,
    fontFamily: 'Arial',
    textColor: '#000000'
}
```

## Performance Optimizations

### Automatic Performance Scaling
The library auto-enables optimizations based on element count:

- **< 100 elements**: Standard rendering
- **≥ 100 elements**: Spatial indexing enabled for O(1) hit testing
- **≥ 100 elements**: Viewport culling (only render visible elements)
- **≥ 500 elements**: History size reduced from 50 to 20 entries
- **LOD system**: Level-of-Detail rendering for zoom levels

### Critical Performance Classes
```javascript
// Spatial hash grid for efficient hit testing
this.spatialIndex = new SpatialIndex(100);  // 100px cell size
this.spatialIndex.insert(element, bounds);
this.spatialIndex.query({x, y});  // Returns elements at point

// Throttled updates for real-time property changes
this.throttledPropertiesPanelUpdate = PerformanceUtils.throttle(() => {
    this.updatePropertiesPanel();
}, 16);  // ~60fps
```

### When Adding Features
- Use `PerformanceUtils.throttle()` for frequent events (mousemove, resize)
- Update spatial index after bulk element operations: `this.rebuildSpatialIndex()`
- Viewport culling happens automatically - check `this.visibleElements` Set

## UI Component System

### Control Panel Pattern
Control panel managed by separate `SWWControlPanel` class (lines 6300-7000 in sww.js):

```javascript
class SWWControlPanel {
    constructor(instance) {
        this.instance = instance;  // Reference to SWWInstance
    }
    
    updateLayers()           // Refresh layer list UI
    toggleLayerVisibility()  // Show/hide layers
    toggleLayerLock()        // Lock/unlock editing
}
```

### CSS Theming with CSS Variables
All theme colors use CSS custom properties in `src/css/sww.css`:

```css
:root {
    --sww-panel-bg: #18181b;
    --sww-accent-color: #00FF99;
    --sww-secondary-accent: #007370;
    /* ... 10+ more variables */
}
```

**Dynamic theme switching**: `setPanelMode('dark' | 'light')` updates CSS variables via JS:
```javascript
document.documentElement.style.setProperty('--sww-panel-bg', color);
```

## Integration Points & Dependencies

### Bundled Dependencies (via webpack)
1. **FontAwesome Free 6.4.0** - Icons throughout UI
   - Imported via `@import '~@fortawesome/fontawesome-free/css/all.css'` in sww.css
   - Used directly in HTML: `<i class="fas fa-square"></i>`

2. **Marked.js 9.0.0** - Markdown rendering for document elements
   - Imported at top: `import { marked } from 'marked'`
   - Made global: `global.marked = marked`
   - Used for markdown tool rendering

### External API Usage
**None** - This is a fully client-side library with zero external API calls or server dependencies.

## Project-Specific Conventions

### ID Generation Pattern
All elements get unique IDs: `${toolName}-${Date.now()}-${Math.random()}`

Example: `rectangle-1635789123456-0.123456789`

### SVG-Based Rendering
All drawing happens directly on SVG elements:
```javascript
const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
svgEl.setAttribute('x', element.x);
// ... set attributes
element.svgElement = svgEl;  // Store reference
this.svg.appendChild(svgEl);  // Add to canvas
```

**Never use Canvas API** - this is purely SVG-based for vector scalability.

### Undo/Redo System
History tracking via deep cloning:
```javascript
saveStateToHistory(action) {
    this.historyStack.push({
        action: action,  // 'draw', 'delete', 'move', etc.
        elements: JSON.parse(JSON.stringify(this.elements)),  // Deep clone
        selectedElements: new Set(this.selectedElements)
    });
}
```

**Important**: Avoid triggering history saves during undo/redo operations via `this.isPerformingHistoryAction` flag.

### Read-Only Mode Behavior
When `options.readOnly === true`:
- Auto-enters preview mode on init
- ESC key disabled
- All edit functions blocked
- UI panels hidden

Check `this.isPreviewMode` or `this.options.readOnly` before allowing modifications.

## Common Patterns When Extending

### Adding a New Drawing Tool (Modular Approach)

1. Create tool module in `src/js/modules/tools/NewTool.js`:
   ```javascript
   export const NewToolMixin = {
       handleNewToolStart(point) {
           // Tool initialization logic
       },
       
       handleNewToolMove(point) {
           // Drawing logic
       },
       
       handleNewToolEnd(point) {
           // Finalization logic
       }
   };
   ```

2. Import and apply to SWWInstance:
   ```javascript
   import { NewToolMixin } from './modules/tools/NewTool.js';
   Object.assign(SWWInstance.prototype, NewToolMixin);
   ```

3. Register in tool switch (in core or tool manager):
   ```javascript
   setTool(toolName) {
       if (toolName === 'newtool') {
           this.currentTool = 'newtool';
       }
   }
   ```

4. Add UI button to `examples/sww.html`

### Adding a New Feature Module

1. Create module file with mixin pattern:
   ```javascript
   // src/js/modules/features/MyFeature.js
   export const MyFeatureMixin = {
       myFeatureMethod() {
           // Implementation
       }
   };
   ```

2. Import in main entry or parent module:
   ```javascript
   import { MyFeatureMixin } from './modules/features/MyFeature.js';
   Object.assign(SWWInstance.prototype, MyFeatureMixin);
   ```

3. Feature is automatically bundled by webpack

### Adding Element Properties
1. Add property to `toolSettings` object initialization
2. Create UI control in `createPropertiesPanel()` method (~line 1400)
3. Update `updatePropertiesPanel()` to populate values
4. Apply property in element rendering logic

### Modifying Export/Import
Scene data structure in `getScene()` (line 5830):
```javascript
{
    elements: [...],  // All element objects without SVG references
    viewBox: {...},   // Viewport position
    zoom: 1.0        // Zoom level
}
```

SVG references are **not serializable** - they're recreated on `loadScene()`.

## Key Files Reference

**Development Files**:
- **src/js/sww.js** or **src/js/sww-legacy.js** - Main source (7,109 lines, being modularized)
- **src/js/modules/** - Modular components directory
  - **utils/** - Utility classes and helpers
  - **core/** - Core instance logic
  - **tools/** - Drawing tools
  - **ui/** - UI components
  - **canvas/** - Canvas and viewport
- **src/css/sww.css** (1,715 lines) - All styles with FontAwesome import

**Build & Config**:
- **webpack.config.js** - Build configuration (UMD export, asset handling)
- **package.json** - Dependencies and build scripts

**Examples & Docs**:
- **examples/sww.html** - Main demo with full control panel
- **examples/sww-tailwind.html** - Alternative styling demo
- **MODULARIZATION_PLAN.md** - Refactoring roadmap and strategy
- **GETTING_STARTED_MODULAR.md** - Quick start guide for modular development

## Testing Strategy

**Manual testing only** - No automated test framework exists.

**Test checklist for changes**:
1. Run `npm run build` - ensure no webpack errors
2. Open `examples/sww.html` in browser
3. Test all drawing tools still work
4. Test undo/redo (Ctrl+Z/Y)
5. Test export/import with `getScene()`/`loadScene()`
6. Check browser console for errors
7. Test with 100+ elements to verify performance optimizations
8. Test dark/light theme switching if UI changes made
