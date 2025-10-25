# Getting Started with Modularization

## What We've Done

✅ Created modular directory structure in `src/js/modules/`
✅ Extracted utility classes (PerformanceUtils, SpatialIndex)
✅ Created helper functions module
✅ Created constants module
✅ Documented complete migration plan in `MODULARIZATION_PLAN.md`

## Current State

Your project now has:
- **`src/js/sww.js`** - Original 7,109-line monolithic file (still working)
- **`src/js/modules/`** - New modular structure (partially complete)
- **`MODULARIZATION_PLAN.md`** - Complete refactoring roadmap

## Two Paths Forward

### Path A: Gradual Migration (RECOMMENDED)

This is safer and lets you work incrementally:

1. **Rename the old file** (keep it as backup):
   ```bash
   mv src/js/sww.js src/js/sww-legacy.js
   ```

2. **Continue working on the legacy file** for now
   - Your builds still work
   - No breaking changes

3. **Extract one section at a time**:
   - When you need to edit a section, extract it to a module
   - Update `sww-legacy.js` to import from the module
   - Test thoroughly
   - Repeat

4. **Example - Extract a small section first**:
   ```javascript
   // In src/js/modules/utils/textMeasure.js
   export function measureText(text, fontSize, fontFamily) {
       // ... extracted logic
   }
   
   // In src/js/sww-legacy.js
   import { measureText } from './modules/utils/textMeasure.js';
   // ... use measureText() where needed
   ```

### Path B: All-at-Once Migration (More Work Upfront)

For a clean break, follow the phases in `MODULARIZATION_PLAN.md`:

1. Work through Phase 2-7 systematically
2. Test after each phase
3. Keep legacy file until 100% confident

## Immediate Next Steps

### Step 1: Update Webpack Configuration

Your current webpack should already support ES6 modules (Babel is configured), but verify:

```bash
npm run dev
```

Watch for any import/export errors.

### Step 2: Create Core Instance Skeleton

Start extracting the massive SWWInstance class:

1. Create `src/js/modules/core/SWWInstance.js`:
   ```javascript
   import { PerformanceUtils } from '../utils/PerformanceUtils.js';
   import { SpatialIndex } from '../utils/SpatialIndex.js';
   import { FONT_FAMILIES, DEFAULT_TOOL_SETTINGS } from '../utils/constants.js';
   
   export class SWWInstance {
       static FONT_FAMILIES = FONT_FAMILIES;
       
       constructor(container, options = {}) {
           this.container = container;
           // ... initialization
       }
       
       // Methods will be added as mixins from other modules
   }
   ```

2. Create method mixins in separate files:
   - `src/js/modules/core/initialization.js` - init(), createUI()
   - `src/js/modules/elements/factory.js` - createElement(), createSVGElement()
   - etc.

3. Combine in main SWWInstance:
   ```javascript
   import { initializationMixin } from './initialization.js';
   import { elementFactoryMixin } from '../elements/factory.js';
   
   Object.assign(SWWInstance.prototype, initializationMixin);
   Object.assign(SWWInstance.prototype, elementFactoryMixin);
   ```

### Step 3: Test Continuously

After each extraction:
```bash
npm run build
# Open examples/sww.html in browser
# Test that feature still works
```

### Step 4: Update Documentation

As you modularize, update:
- `.github/copilot-instructions.md` - Remove "monolithic" notes, add module structure
- `README.md` - Add development section about module structure

## Quick Wins

Start with these easy extractions:

1. **Utility functions** (DONE ✅)
   - PerformanceUtils
   - SpatialIndex
   - Helpers
   - Constants

2. **Constants and configuration** (DONE ✅)
   - Font families
   - Default settings
   - Theme colors

3. **Simple functions** (Next):
   - `generateId()` → Already in helpers
   - `measureText()` → Extract to helpers
   - `hexToRgb()` → Already in helpers

4. **UI components**:
   - `createToolbar()` → `modules/ui/Toolbar.js`
   - `createPropertiesPanel()` → `modules/ui/PropertiesPanel.js`
   - `createContextMenu()` → `modules/ui/ContextMenu.js`

5. **Tool handlers**:
   - `handleRectangleStart()` → `modules/tools/ShapeTools.js`
   - `handleTextStart()` → `modules/tools/TextTool.js`
   - etc.

## Benefits You'll See

As you extract modules, you'll notice:

- ✅ **Easier navigation**: Jump to specific files instead of scrolling through 7,000 lines
- ✅ **Better IDE support**: Autocomplete and type hints work better on smaller files
- ✅ **Clearer structure**: Obvious where to add new features
- ✅ **Easier debugging**: Smaller files mean clearer stack traces
- ✅ **Team collaboration**: Multiple people can work without merge conflicts
- ✅ **Code reuse**: Utilities can be imported where needed

## Need Help?

Refer to:
- `MODULARIZATION_PLAN.md` - Complete strategy and structure
- `src/js/modules/utils/` - Examples of extracted modules
- Original `sww.js` - Reference implementation

## Tips

1. **Start small**: Extract one utility function at a time
2. **Test often**: Build and test after each extraction
3. **Keep legacy file**: Don't delete until 100% migrated
4. **Document as you go**: Add JSDoc comments to new modules
5. **Be patient**: This is a big refactor, take it step by step

Good luck! The hardest part (deciding to modularize) is done. Now it's just systematic work.
