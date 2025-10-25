# SenangWebs Whiteboard (SWW) - AI Coding Agent Instructions

## Project Overview

**SenangWebs Whiteboard** is a client-side JavaScript drawing library for creating interactive digital whiteboards. The library is distributed as a single UMD bundle (`dist/sww.js` + `dist/sww.css`) with all dependencies pre-bundled (FontAwesome, Marked.js).

**Core Architecture**: 
- **Distribution**: Single UMD bundle (~150KB) for easy integration via CDN or npm
- **Development**: Fully modular ES6 architecture using mixin pattern
- **Build**: Webpack 5 bundles all modules into single UMD distributable
- **State**: Plain JavaScript objects with direct SVG DOM manipulation (no reactive framework)

**✅ Modular Refactoring**: Complete! All functionality extracted into organized modules under `src/js/modules/`
**Architecture Pattern**: SWWInstance base class + 24 mixins applied via `Object.assign()` in `src/js/sww.js`

## Critical Developer Workflows

### Build System (Webpack 5)
```powershell
npm run build    # Production build (minified UMD bundle)
npm run dev      # Development mode with live file watching
```

**Build outputs** (`dist/` folder):
- `sww.js` (150 KB) - Main UMD bundle with all dependencies
- `sww.css` (135 KB) - Stylesheet with embedded FontAwesome CSS
- `fonts/*.woff2` - FontAwesome font files (auto-bundled, 232 KB total)
- `styles.js` - CSS loader artifacts (can be ignored)

**Key webpack config** (`webpack.config.js`):
- **Entry**: `src/js/sww.js` (ES6 modules) + `src/css/sww.css`
- **Output**: UMD format exposing `window.SWW` global
- **Babel**: ES6+ transpilation for browser compatibility
- **Assets**: Font and image handling with custom output paths

### No Testing Framework
**Critical**: This project has NO automated tests. `npm test` will error.
All testing must be manual via browser:
1. Run `npm run build` or `npm run dev`
2. Open `examples/sww.html` in browser
3. Test drawing tools, undo/redo, export/import
4. Check browser console for errors

## Architecture Deep-Dive

### Modular Structure (✅ Complete)

All functionality is organized into 24 mixin modules under `src/js/modules/`:

```
modules/
├── core/               # Core instance and initialization
│   ├── SWWInstance.js       # Base class with constructor
│   ├── initialization.js    # init(), UI setup, performance
│   ├── elementManagement.js # CRUD operations for elements
│   └── eventHandlers.js     # Mouse/keyboard event routing
├── tools/              # Drawing tools (7 modules)
│   ├── ToolManager.js       # Tool switching logic
│   ├── ShapeToolsMixin.js   # Rectangle, ellipse, diamond, star
│   ├── LineToolsMixin.js    # Arrow, line drawing
│   ├── TextTool.js          # Text with font/size controls
│   ├── DrawTool.js          # Freehand pen with path optimization
│   ├── EmbedToolsMixin.js   # Website, image, markdown embeds
│   └── SelectionTool.js     # Selection/manipulation mode
├── selection/          # Selection system (4 modules)
│   ├── SelectionManager.js       # Multi-select, select-all logic
│   ├── SelectionBox.js           # Drag-to-select box
│   ├── SelectionHandles.js       # Resize/rotate handles
│   └── ElementManipulation.js    # Drag, resize, rotate operations
├── ui/                 # UI components (7 modules)
│   ├── ControlPanel.js      # Theme, preview mode, notifications
│   ├── PropertiesPanel.js   # Real-time element property editor
│   ├── LayersPanel.js       # Layer list with visibility/lock
│   ├── ToolbarMixin.js      # Tool buttons UI
│   ├── ExportDialog.js      # SVG/PNG export UI
│   ├── Notifications.js     # Toast notifications
│   └── ThemeManager.js      # Dark/light theme switching
├── canvas/             # Canvas and viewport
│   ├── CanvasMixin.js       # SVG canvas setup
│   └── Background.js        # (Placeholder, not yet used)
├── viewport/           # Zoom, pan, fit controls
│   └── Viewport.js
├── history/            # Undo/redo system
│   └── History.js
├── clipboard/          # Copy/paste operations
│   └── Clipboard.js
├── contextmenu/        # Right-click menus
│   └── ContextMenu.js
├── actions/            # Element operations
│   └── ElementActions.js
├── grid/               # Snap-to-grid system
│   └── Grid.js
├── dialogs/            # Modal dialogs
│   └── Dialogs.js
├── rendering/          # SVG rendering
│   └── SVGRenderer.js
├── utilities/          # Helper methods
│   └── Utilities.js
└── utils/              # Performance and constants
    ├── PerformanceUtils.js  # Throttle, debounce, RAF
    ├── SpatialIndex.js      # Grid-based hit testing
    ├── constants.js         # Font families, defaults, theme colors
    └── helpers.js           # General utility functions
```

### Mixin Pattern Architecture

**Entry point** (`src/js/sww.js`):
1. Imports `SWWInstance` base class + 24 mixins
2. Applies mixins via `Object.assign(SWWInstance.prototype, Mixin)`
3. Exports factory object: `SWW.init(container, options)`

**Example mixin** (`modules/tools/ShapeToolsMixin.js`):
```javascript
export const ShapeToolsMixin = {
    handleShapeStart(point) { /* ... */ },
    handleShapeMove(point) { /* ... */ },
    handleShapeEnd() { /* ... */ }
};
```

**Applied in main file**:
```javascript
import { ShapeToolsMixin } from './modules/tools/ShapeToolsMixin.js';
Object.assign(SWWInstance.prototype, ShapeToolsMixin);
```

**Webpack bundles everything** into single UMD file exposing:
- `window.SWW` - Factory with `init()` and `getInstance()` methods
- `window.sww` - Lowercase alias for convenience

### State Management Pattern

Elements are plain JavaScript objects with SVG references:

```javascript
{
    id: 'rectangle-1635789123456-0.12345',  // ${tool}-${timestamp}-${random}
    type: 'rectangle',  // rectangle, ellipse, text, arrow, etc.
    x: 100, y: 100,
    width: 200, height: 150,
    svgElement: <SVG Node>,  // Direct DOM reference
    visible: true,
    locked: false,
    strokeColor: '#000000',
    strokeWidth: 2,
    fillColor: 'transparent'
    // ... tool-specific properties
}
```

**No reactive framework** - updates via direct DOM manipulation:
- Modify element object properties
- Call `this.updateSVGElement(element)` to sync DOM
- Arrays are mutated directly (`this.elements.push()`, `splice()`, etc.)
- Sets track selections (`this.selectedElements = new Set()`)

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
    gradientStops: [{offset: 0, color: '#000'}, {offset: 1, color: '#fff'}],
    fontSize: 16,
    fontFamily: 'Arial',
    textColor: '#000000'
}
```

**Updating tool settings**:
- Modify `this.toolSettings` properties directly
- Properties panel UI automatically syncs via `this.updatePropertiesPanel()`
- New elements inherit current `toolSettings` values

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

Control panel functionality is managed through the `ControlPanelMixin` in `src/js/modules/ui/ControlPanel.js`:

```javascript
// Theme switching
this.setPanelMode('dark' | 'light')  // Switch between themes
this.applyThemeColors()              // Apply CSS custom properties

// Preview mode (presentation mode)
this.enterPreviewMode()              // Lock editing, hide UI
this.exitPreviewMode()               // Restore editing mode

// Notifications
this.showNotification(message, type) // Show toast notification
```

### CSS Theming with CSS Variables

All theme colors use CSS custom properties in `src/css/sww.css`:

```css
:root {
    --sww-panel-bg: #18181b;           /* Panel background */
    --sww-accent-color: #00FF99;        /* Primary accent */
    --sww-secondary-accent: #007370;    /* Secondary accent */
    --sww-panel-text: #ffffff;          /* Text color */
    /* ... 10+ more variables */
}
```

**Dynamic theme switching**: `setPanelMode('dark' | 'light')` updates CSS variables via JS:
```javascript
this.container.style.setProperty('--sww-panel-bg', color);
this.container.setAttribute('data-panel-mode', mode);
```

**Adding new theme colors**:
1. Define CSS variable in `src/css/sww.css` under `:root`
2. Add mode-specific values in `applyThemeColors()` method
3. Use variable in CSS: `background: var(--sww-new-color)`

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
- **src/js/sww.js** (123 lines) - Main entry point, applies 24 mixins
- **src/js/modules/** - Modular components directory (24 modules total)
  - **utils/** - Utility classes (PerformanceUtils, SpatialIndex, constants, helpers)
  - **core/** - Core instance logic (SWWInstance, initialization, elementManagement, eventHandlers)
  - **tools/** - Drawing tools (7 modules)
  - **selection/** - Selection system (4 modules)
  - **ui/** - UI components (7 modules)
  - **canvas/** - Canvas setup (CanvasMixin, Background)
  - **viewport/** - Viewport controls
  - **history/** - Undo/redo
  - **clipboard/** - Copy/paste
  - **contextmenu/** - Right-click menus
  - **actions/** - Element operations
  - **grid/** - Grid system
  - **dialogs/** - Modal dialogs
  - **rendering/** - SVG rendering
  - **utilities/** - Helper methods
- **src/css/sww.css** (1,715 lines) - All styles with FontAwesome import

**Build & Config**:
- **webpack.config.js** - Build configuration (UMD export, asset handling)
- **package.json** - Dependencies and build scripts

**Examples & Docs**:
- **examples/sww.html** - Main demo with full control panel
- **examples/sww-tailwind.html** - Alternative styling demo

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
