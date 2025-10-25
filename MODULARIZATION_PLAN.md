# Modularization Plan for SWW

## Overview
This document outlines the strategy for refactoring the 7,109-line `sww.js` into maintainable modules while preserving the UMD bundle for distribution.

## Directory Structure

```
src/js/
├── sww.js (NEW - main entry point, ~100 lines)
├── sww-legacy.js (RENAMED from old sww.js - backup)
└── modules/
    ├── utils/
    │   ├── PerformanceUtils.js ✓ DONE
    │   ├── SpatialIndex.js ✓ DONE
    │   └── helpers.js (ID generation, color utils, etc.)
    ├── core/
    │   ├── SWWInstance.js (Main class skeleton)
    │   ├── state.js (State initialization)
    │   ├── initialization.js (init, createUI, etc.)
    │   └── performance.js (Performance optimizations)
    ├── tools/
    │   ├── ToolManager.js (setTool, tool switching)
    │   ├── SelectTool.js (Selection logic)
    │   ├── ShapeTools.js (Rectangle, ellipse, etc.)
    │   ├── DrawTool.js (Freehand drawing)
    │   └── TextTool.js (Text editing)
    ├── elements/
    │   ├── ElementFactory.js (createElement, createSVGElement)
    │   ├── ElementRenderer.js (updateSVGElement)
    │   ├── ElementManipulation.js (drag, resize, rotate)
    │   └── ElementManager.js (add, remove, bounds)
    ├── selection/
    │   ├── SelectionManager.js (selectElement, clearSelection)
    │   ├── SelectionBox.js (Selection box logic)
    │   └── SelectionHandles.js (Resize/rotate handles)
    ├── ui/
    │   ├── Toolbar.js (createToolbar)
    │   ├── PropertiesPanel.js (createPropertiesPanel)
    │   ├── ContextMenu.js (createContextMenu)
    │   ├── ControlPanel.js (SWWControlPanel class)
    │   └── Notifications.js (showNotification)
    ├── canvas/
    │   ├── Background.js (createBackground, grid)
    │   ├── ViewBox.js (zoom, pan, viewBox management)
    │   └── PreviewMode.js (Preview mode functionality)
    ├── history/
    │   ├── HistoryManager.js (undo/redo)
    │   └── StateManager.js (saveStateToHistory)
    └── api/
        ├── PublicAPI.js (Public methods)
        ├── SceneManager.js (getScene, loadScene)
        └── ExportManager.js (exportToSVG, exportToPNG)
```

## Migration Strategy

### Phase 1: Setup & Utils (CURRENT)
1. ✓ Create directory structure
2. ✓ Extract utility classes (PerformanceUtils, SpatialIndex)
3. Create helper utilities module
4. Update webpack to support ES6 modules

### Phase 2: Core Refactoring
1. Create SWWInstance class skeleton in modules/core/
2. Move state initialization to modules/core/state.js
3. Extract initialization logic to modules/core/initialization.js
4. Move performance optimizations to modules/core/performance.js

### Phase 3: Tool System
1. Create ToolManager for tool switching
2. Extract individual tool handlers to separate files
3. Create tool event handlers module

### Phase 4: Element Management
1. Extract element creation logic
2. Separate rendering logic
3. Extract manipulation (drag/resize/rotate) logic

### Phase 5: UI Components
1. Extract toolbar creation
2. Extract properties panel
3. Extract context menu
4. Move SWWControlPanel to separate module

### Phase 6: Features
1. Extract selection system
2. Extract history management
3. Extract export functionality
4. Extract preview mode

### Phase 7: Final Assembly
1. Create new sww.js that imports all modules
2. Test thoroughly
3. Update documentation
4. Deprecate sww-legacy.js

## Implementation Notes

### Webpack Configuration
The existing webpack config should work with ES6 modules, but verify:
- Babel transpilation handles imports/exports
- UMD wrapper is applied to final bundle
- Source maps for debugging

### Class Structure Pattern
Each module exports functionality that gets mixed into SWWInstance:

```javascript
// Example: modules/elements/ElementFactory.js
export const ElementFactoryMixin = {
    createElement(type, point) {
        // ... element creation logic
    },
    
    createSVGElement(element) {
        // ... SVG creation logic
    }
};

// In main sww.js
import { ElementFactoryMixin } from './modules/elements/ElementFactory.js';

class SWWInstance {
    constructor() {
        // Apply mixins
        Object.assign(this, ElementFactoryMixin);
    }
}
```

### Backward Compatibility
- Keep sww-legacy.js as fallback
- Ensure dist/sww.js API remains identical
- No breaking changes for users

### Testing Checklist
After each phase:
- [ ] `npm run build` completes without errors
- [ ] examples/sww.html loads and works
- [ ] All drawing tools function correctly
- [ ] Undo/redo works
- [ ] Export functions work
- [ ] No console errors
- [ ] File size similar to original (~150KB)

## Quick Start Guide

### For Immediate Use

1. **Keep using current sww.js for now**
   - Your existing code still works
   - No immediate changes needed

2. **Rename old file as backup**:
   ```bash
   mv src/js/sww.js src/js/sww-legacy.js
   ```

3. **Start gradual migration**:
   - Use new utility modules for new features
   - Gradually extract sections as you work on them
   - Test frequently

### For New Features

When adding new functionality:
1. Create it in appropriate module file
2. Import into main sww.js
3. Test with `npm run dev`
4. Keep legacy file as reference

## Benefits

### Developer Experience
- ✅ Files under 300 lines each (vs 7,109!)
- ✅ Clear separation of concerns
- ✅ Easier to find and edit code
- ✅ Better IDE support and navigation
- ✅ Easier code reviews

### Maintainability
- ✅ Can test modules independently
- ✅ Reduces merge conflicts
- ✅ Easier to onboard new developers
- ✅ Clear code organization

### No Downsides
- ✅ Users still get single bundle
- ✅ Same UMD format
- ✅ No breaking changes
- ✅ Backward compatible

## Next Steps

1. Review this plan
2. Decide on migration pace (gradual vs all-at-once)
3. Set up webpack for ES6 modules
4. Start with Phase 2 (Core Refactoring)
5. Test each phase thoroughly

## Questions to Consider

1. **Migration Pace**: Gradual (safer) or all-at-once (cleaner)?
2. **Testing**: Manual only or add unit tests during refactor?
3. **Documentation**: Update as you go or at the end?
4. **Team Size**: Solo developer or team coordination needed?

Choose the approach that fits your workflow best!
