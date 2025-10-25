# Phase 4 Plan: Selection System Extraction

## Overview

Phase 4 focuses on extracting the **Selection System** - the most complex remaining subsystem that handles element selection, multi-select, resize handles, rotation, and element manipulation. This is critical infrastructure that impacts almost every user interaction.

**Status**: Planning Stage  
**Priority**: High (Next Phase After Phase 3)  
**Estimated Effort**: 4-6 modules, ~1,000-1,200 lines  
**Expected Build Growth**: +10-12 KB (from 191 KB to ~201-203 KB)

---

## Why Phase 4 is Important

The selection system is the foundation for all element manipulation:
- **User Interaction**: Primary way users interact with elements after creation
- **Complexity**: Handles mouse events, coordinate math, boundary calculations
- **Cross-cutting**: Affects tools, UI panels, history, export
- **High Value**: Most frequently used feature after drawing tools

**Dependencies**:
- ✅ Phase 1: Infrastructure (Complete)
- ✅ Phase 2: Core Systems (Complete)
- ✅ Phase 3: Tool System (Complete)
- ⏳ Phase 4: Selection System (This Phase)

**Enables**:
- Phase 5: UI Panels (properties panel depends on selection)
- Phase 6: History System (undo/redo selection changes)
- Phase 7: Final Assembly (complete tool-to-manipulation pipeline)

---

## Current State Analysis

### What's in Legacy (sww-legacy.js)

**Selection State** (~150 lines):
```javascript
// Core selection tracking
this.selectedElements = new Set();
this.selectionBox = null;
this.isSelecting = false;

// Handle tracking
this.activeHandle = null;
this.isDragging = false;
this.isResizing = false;
this.isRotating = false;
```

**Selection Methods** (~200 lines):
- `selectElement(element)` - Add element to selection
- `deselectElement(element)` - Remove from selection
- `clearSelection()` - Clear all selected
- `selectAll()` - Select all elements
- `deleteSelected()` - Delete selected elements
- `duplicateSelected()` - Clone selected elements

**Selection Box** (~150 lines):
- `startSelectionBox(point)` - Begin drag-to-select
- `updateSelectionBox(point)` - Update box during drag
- `endSelectionBox()` - Finalize and select elements
- `getSelectionBoxIntersections()` - Find elements in box

**Resize/Rotate Handles** (~250 lines):
- `createSelectionHandles()` - Create 8 resize + 1 rotate handle
- `updateSelectionHandles()` - Position handles around selection
- `getHandleAtPoint(point)` - Hit test for handles
- `startHandleDrag(handle, point)` - Begin resize/rotate
- `updateHandleDrag(point)` - Apply transformation
- `endHandleDrag()` - Finalize changes

**Element Manipulation** (~200 lines):
- `startDragElements(point)` - Begin element drag
- `updateDragElements(point)` - Move elements
- `endDragElements()` - Finalize position
- `constrainToCanvas(element)` - Boundary checking
- `applyTransformToElement(element, transform)` - Matrix transforms

**Total**: ~950 lines of selection-related code

---

## Phase 4 Module Architecture

### Module 1: SelectionManager.js (~220 lines)

**Purpose**: Core selection state and operations

**Responsibilities**:
- Selection state management (Set of selected elements)
- Add/remove elements from selection
- Selection validation (check if element exists, is selectable)
- Selection change events
- Selected elements queries

**Key Methods**:
```javascript
// State
this.selectedElements = new Set();
this.lastSelectedElement = null;

// Core operations
selectElement(element, addToSelection = false)
deselectElement(element)
clearSelection()
toggleElementSelection(element)
selectAll()
selectMultiple(elements)

// Queries
isSelected(element)
hasSelection()
getSelectedElements()
getSelectionCount()
getSelectionBounds()

// Events
onSelectionChanged(callback)
dispatchSelectionEvent(type, data)
```

**Integration Points**:
- Called by: Tools (after element creation), UI (properties panel)
- Calls: History (save state), UI (update panels), Spatial index (queries)
- Events: 'selection-changed', 'selection-cleared'

**Dependencies**:
- `this.elements` - Element array
- `this.spatialIndex` - For boundary queries
- `this.dispatchEvent()` - Custom events

---

### Module 2: SelectionBox.js (~180 lines)

**Purpose**: Drag-to-select box rendering and intersection

**Responsibilities**:
- Selection box SVG rendering
- Drag interaction handling
- Element intersection calculation
- Visual feedback during selection

**Key Methods**:
```javascript
// State
this.selectionBox = null;
this.isSelecting = false;
this.selectionStartPoint = null;

// Core operations
startSelectionBox(point)
updateSelectionBox(point)
endSelectionBox()
cancelSelectionBox()

// Rendering
createSelectionBoxSVG()
updateSelectionBoxSVG(x, y, width, height)
removeSelectionBoxSVG()

// Intersection
getSelectionBoxBounds()
getElementsInSelectionBox()
doesElementIntersectBox(element, box)
```

**SVG Structure**:
```xml
<rect class="sww-selection-box"
      x="..." y="..." width="..." height="..."
      fill="rgba(0, 153, 255, 0.1)"
      stroke="#0099ff"
      stroke-width="1"
      stroke-dasharray="5,5" />
```

**Integration Points**:
- Called by: Event handlers (mousedown on canvas, not on element)
- Calls: SelectionManager (selectMultiple with results)
- Listens: mousemove, mouseup during selection

**Dependencies**:
- `this.svg` - Canvas SVG element
- `this.selectMultiple()` - From SelectionManager
- `this.elements` - For intersection tests

---

### Module 3: SelectionHandles.js (~280 lines)

**Purpose**: Resize and rotate handle rendering and positioning

**Responsibilities**:
- Handle creation and rendering (8 resize + 1 rotate)
- Handle positioning around selection bounds
- Handle hit testing
- Handle cursor updates
- Multi-element handle positioning

**Key Methods**:
```javascript
// State
this.selectionHandles = [];
this.rotateHandle = null;

// Core operations
createSelectionHandles()
updateSelectionHandles()
removeSelectionHandles()
showSelectionHandles()
hideSelectionHandles()

// Handle management
createHandle(type, cursor)
positionHandle(handle, x, y)
updateHandlePositions(bounds)
getHandleAtPoint(point, tolerance = 5)

// Handle types
createResizeHandles()  // nw, n, ne, e, se, s, sw, w
createRotateHandle()   // Above top-center

// Positioning
calculateHandlePositions(bounds)
getHandleCursor(handleType)
updateHandleCursors()
```

**Handle Types**:
```javascript
const HANDLE_TYPES = {
    // Resize handles (8)
    'nw': { cursor: 'nw-resize', position: 'top-left' },
    'n':  { cursor: 'n-resize',  position: 'top-center' },
    'ne': { cursor: 'ne-resize', position: 'top-right' },
    'e':  { cursor: 'e-resize',  position: 'middle-right' },
    'se': { cursor: 'se-resize', position: 'bottom-right' },
    's':  { cursor: 's-resize',  position: 'bottom-center' },
    'sw': { cursor: 'sw-resize', position: 'bottom-left' },
    'w':  { cursor: 'w-resize',  position: 'middle-left' },
    
    // Rotate handle (1)
    'rotate': { cursor: 'grab', position: 'above-top-center' }
};
```

**SVG Structure**:
```xml
<!-- Resize handle -->
<rect class="sww-selection-handle"
      data-handle-type="se"
      x="..." y="..." width="8" height="8"
      fill="white"
      stroke="#0099ff"
      stroke-width="1.5"
      cursor="se-resize" />

<!-- Rotate handle -->
<circle class="sww-rotate-handle"
        cx="..." cy="..." r="6"
        fill="white"
        stroke="#0099ff"
        stroke-width="1.5"
        cursor="grab" />
```

**Integration Points**:
- Called by: SelectionManager (after selection changes)
- Calls: ElementManipulation (when handle dragged)
- Updates: On selection, zoom, pan, window resize

**Dependencies**:
- `this.selectedElements` - Current selection
- `this.getSelectionBounds()` - Bounding box calculation
- `this.zoom` - Handle size scales with zoom

---

### Module 4: ElementManipulation.js (~250 lines)

**Purpose**: Element drag, resize, and rotate operations

**Responsibilities**:
- Element dragging (single and multi-select)
- Element resizing via handles
- Element rotation
- Constraint enforcement (canvas bounds)
- Transform calculations

**Key Methods**:
```javascript
// State
this.isDragging = false;
this.isResizing = false;
this.isRotating = false;
this.activeHandle = null;
this.manipulationStartPoint = null;
this.manipulationStartBounds = null;

// Drag operations
startDragElements(point)
updateDragElements(point, constrainToCanvas = true)
endDragElements()
dragElement(element, deltaX, deltaY)
dragMultipleElements(elements, deltaX, deltaY)

// Resize operations
startResize(handle, point)
updateResize(point, maintainAspectRatio = false)
endResize()
resizeElement(element, handle, deltaX, deltaY)
resizeMultipleElements(elements, handle, scaleX, scaleY)

// Rotate operations
startRotate(point)
updateRotate(point)
endRotate()
rotateElement(element, angle, centerX, centerY)
rotateMultipleElements(elements, angle, centerX, centerY)

// Utilities
constrainToCanvas(element)
calculateRotationAngle(centerX, centerY, pointX, pointY)
applyTransformToElement(element, transform)
getBoundingBoxForElements(elements)
```

**Transformation Math**:
```javascript
// Drag: Simple translation
element.x += deltaX;
element.y += deltaY;

// Resize: Scale from handle origin
const scaleX = newWidth / oldWidth;
const scaleY = newHeight / oldHeight;
element.width *= scaleX;
element.height *= scaleY;

// Rotate: Matrix transform around center
const angle = Math.atan2(point.y - centerY, point.x - centerX);
const rotation = (angle * 180) / Math.PI;
element.rotation = rotation;
```

**Integration Points**:
- Called by: Event handlers (mousemove during manipulation)
- Calls: History (saveStateToHistory after manipulation)
- Updates: SVG elements, spatial index, properties panel

**Dependencies**:
- `this.selectedElements` - Elements to manipulate
- `this.updateSVGElement()` - Re-render after changes
- `this.saveStateToHistory()` - Undo/redo support
- `this.rebuildSpatialIndex()` - Update performance index

---

### Module 5: SelectionUI.js (~150 lines) - OPTIONAL

**Purpose**: Selection-related UI components (optional, can defer to Phase 5)

**Responsibilities**:
- Selection indicator rendering (dashed outline)
- Selection info display (count, type)
- Alignment guides
- Snap-to guides

**Key Methods**:
```javascript
// Selection indicator
createSelectionIndicator(element)
updateSelectionIndicator(element)
removeSelectionIndicator(element)

// Info display
showSelectionInfo(elements)
hideSelectionInfo()

// Alignment guides (optional)
showAlignmentGuides(elements)
hideAlignmentGuides()
```

**Note**: This module is optional for Phase 4. Can be deferred to Phase 5 (UI Panels) if time is limited.

---

## Implementation Strategy

### Step 1: SelectionManager First (Foundation)
**Priority**: Critical  
**Order**: 1st  
**Rationale**: Core selection state needed by all other modules

**Tasks**:
1. Create `src/js/modules/selection/SelectionManager.js`
2. Extract selection methods from legacy
3. Implement custom events for selection changes
4. Add to sww.js entry point
5. Build and verify

**Testing**:
- [ ] Select single element
- [ ] Select multiple elements (Ctrl+click)
- [ ] Clear selection (Esc)
- [ ] Select all (Ctrl+A)
- [ ] Selection change events fire

---

### Step 2: SelectionBox (User Interaction)
**Priority**: High  
**Order**: 2nd  
**Rationale**: Primary multi-select method

**Tasks**:
1. Create `src/js/modules/selection/SelectionBox.js`
2. Extract selection box methods from legacy
3. Implement drag-to-select logic
4. Integrate with SelectionManager
5. Build and verify

**Testing**:
- [ ] Drag on canvas creates selection box
- [ ] Box visually updates during drag
- [ ] Elements inside box get selected
- [ ] Box disappears on mouse up
- [ ] Ctrl+drag adds to selection

---

### Step 3: SelectionHandles (Visual Feedback)
**Priority**: High  
**Order**: 3rd  
**Rationale**: Required for resize/rotate

**Tasks**:
1. Create `src/js/modules/selection/SelectionHandles.js`
2. Extract handle creation/positioning from legacy
3. Implement handle rendering
4. Integrate with SelectionManager
5. Build and verify

**Testing**:
- [ ] Handles appear on selection
- [ ] 8 resize + 1 rotate handle
- [ ] Handles positioned correctly
- [ ] Handles update on zoom/pan
- [ ] Handles have correct cursors

---

### Step 4: ElementManipulation (Transformations)
**Priority**: Critical  
**Order**: 4th  
**Rationale**: Makes selection functional

**Tasks**:
1. Create `src/js/modules/selection/ElementManipulation.js`
2. Extract drag/resize/rotate methods from legacy
3. Implement transformation logic
4. Integrate with SelectionHandles
5. Build and verify

**Testing**:
- [ ] Drag element to move
- [ ] Drag multiple elements together
- [ ] Resize via handles
- [ ] Maintain aspect ratio (Shift+resize)
- [ ] Rotate via rotate handle
- [ ] Constrain to canvas bounds
- [ ] Undo/redo after manipulation

---

### Step 5: Integration & Polish
**Priority**: Medium  
**Order**: 5th  
**Rationale**: Ensure everything works together

**Tasks**:
1. Verify all modules work together
2. Test edge cases (empty selection, single vs multi)
3. Performance testing with 100+ elements
4. Update documentation
5. Final build verification

**Testing**:
- [ ] Select → Drag → Works
- [ ] Select → Resize → Works
- [ ] Select → Rotate → Works
- [ ] Multi-select → Manipulate → Works
- [ ] Tool switching preserves selection
- [ ] Undo/redo with selection
- [ ] No memory leaks (handles cleaned up)

---

## Technical Considerations

### Event Handler Integration

**Current Event Handlers** (from eventHandlers.js):
```javascript
handlePointerDown(e) {
    // Need to detect:
    // 1. Click on element → Start drag
    // 2. Click on handle → Start resize/rotate
    // 3. Click on canvas → Start selection box
}

handlePointerMove(e) {
    // Need to route to:
    // 1. updateDragElements() if dragging
    // 2. updateResize() if resizing
    // 3. updateRotate() if rotating
    // 4. updateSelectionBox() if selecting
}

handlePointerUp(e) {
    // Need to finalize:
    // 1. endDragElements()
    // 2. endResize()
    // 3. endRotate()
    // 4. endSelectionBox()
}
```

**Strategy**: Update eventHandlers.js to call selection module methods

---

### Coordinate Systems

**Three coordinate spaces to handle**:
1. **Screen coordinates** - Mouse event clientX/clientY
2. **Canvas coordinates** - After viewBox transform
3. **Element coordinates** - Relative to element origin

**Existing utilities** (from eventHandlers.js):
```javascript
screenToCanvas(screenX, screenY)  // ✅ Already exists
canvasToScreen(canvasX, canvasY)  // ✅ Already exists
```

**New utilities needed**:
```javascript
getElementCenter(element)         // For rotation
getBoundsForElements(elements)    // For multi-select handles
```

---

### Multi-Element Selection Challenges

**Problem**: How to resize/rotate multiple elements together?

**Solution 1: Group Transform** (Recommended)
- Calculate bounding box for all selected elements
- Apply scale/rotation relative to group center
- Each element transforms proportionally

**Solution 2: Individual Transform**
- Each element resizes/rotates independently
- Simpler but less intuitive for users

**Recommendation**: Use Solution 1 for better UX

---

### Performance Considerations

**Handle Updates**:
- Handles update on every selection change
- Use `PerformanceUtils.throttle()` for frequent updates
- Only update if visible (viewport culling)

**Drag Performance**:
- For 100+ elements, use `requestAnimationFrame()`
- Update spatial index only on drag end, not during
- Consider LOD (level of detail) during drag

**Resize/Rotate**:
- Matrix transforms can be expensive
- Cache original bounds at start of operation
- Apply transform once at end, not continuously

---

## Migration Strategy

### Hybrid Approach (Same as Phase 3)

**During Phase 4**:
1. Selection modules coexist with legacy
2. New code gradually replaces legacy handlers
3. Event handlers updated to call new methods
4. Legacy selection code becomes dead code (not called)
5. Build verified after each module

**After Phase 4**:
- Selection system fully modular
- Legacy selection code can be removed (Phase 7)
- ~950 lines moved from legacy to modules

---

## Testing Strategy

### Automated Tests (Future)
- Unit tests for coordinate transforms
- Unit tests for intersection calculations
- Unit tests for bounds calculations

### Manual Testing (Current)
**After each module**:
1. Run `npm run build` - verify no errors
2. Open `examples/sww.html`
3. Test the newly extracted functionality
4. Test integration with existing features
5. Check browser console for errors

**Full test suite** (after Phase 4 complete):
- Single element selection (click)
- Multi-element selection (Ctrl+click)
- Drag-to-select box
- Drag element(s)
- Resize via all 8 handles
- Rotate via rotate handle
- Maintain aspect ratio (Shift+resize)
- Constrain to canvas
- Undo/redo after manipulation
- Selection persistence across tool switches
- Handle visibility updates

---

## Documentation Updates

### Files to Update
- ✅ `PHASE4_PLAN.md` - This file (planning)
- ⏳ `PHASE4_UPDATE.md` - Create during implementation
- ⏳ `MODULARIZATION_PROGRESS.md` - Update with Phase 4 progress
- ⏳ `README.md` - Update architecture section
- ⏳ `.github/copilot-instructions.md` - Add selection system info

### Documentation Structure
```
PHASE4_UPDATE.md (to be created during work)
├── Progress tracking (0% → 100%)
├── Module-by-module details
├── Integration points
├── Testing results
└── Build verification
```

---

## Success Criteria

### Phase 4 is complete when:

**Functionality**:
- ✅ All 4-5 selection modules created and working
- ✅ Single and multi-select operational
- ✅ Drag, resize, rotate all functional
- ✅ Selection box works for drag-to-select
- ✅ Handles render and update correctly

**Code Quality**:
- ✅ All modules under 300 lines
- ✅ Clear separation of concerns
- ✅ Consistent naming and patterns
- ✅ Comprehensive JSDoc comments

**Integration**:
- ✅ Event handlers call new methods
- ✅ Undo/redo works with selection
- ✅ Performance optimizations active
- ✅ No breaking changes to API

**Build**:
- ✅ Webpack compiles successfully
- ✅ Bundle size ~201-203 KB
- ✅ No errors or warnings
- ✅ All modules load correctly

**Testing**:
- ✅ Manual test suite passes
- ✅ No console errors
- ✅ Works with 100+ elements
- ✅ No memory leaks

---

## Risk Assessment

### High Risk
**Complex Coordinate Transforms**
- Risk: Bugs in screen→canvas→element coordinate conversion
- Mitigation: Reuse existing transform utilities, extensive testing
- Fallback: Start with simple cases, add complexity incrementally

**Multi-Element Operations**
- Risk: Group transformations are mathematically complex
- Mitigation: Use proven transform algorithms, test thoroughly
- Fallback: Implement individual transforms first, group later

### Medium Risk
**Event Handler Integration**
- Risk: Breaking existing pointer event handling
- Mitigation: Careful refactoring, test after each change
- Fallback: Keep legacy event handlers until new ones proven

**Performance Degradation**
- Risk: Selection updates slow down with many elements
- Mitigation: Use existing performance utilities, throttle updates
- Fallback: Implement LOD system for handle rendering

### Low Risk
**Module Size**
- Risk: ElementManipulation could exceed 300 lines
- Mitigation: Split into drag/resize/rotate if needed
- Fallback: Accept larger file if logic is cohesive

---

## Timeline Estimate

### Optimistic (Focused work, no blockers)
- SelectionManager: 2-3 hours
- SelectionBox: 2-3 hours
- SelectionHandles: 3-4 hours
- ElementManipulation: 4-5 hours
- Integration & Testing: 2-3 hours
- **Total**: 13-18 hours (~2-3 work days)

### Realistic (With testing, documentation, interruptions)
- SelectionManager: 4-5 hours
- SelectionBox: 3-4 hours
- SelectionHandles: 5-6 hours
- ElementManipulation: 6-8 hours
- Integration & Testing: 4-5 hours
- Documentation: 2-3 hours
- **Total**: 24-31 hours (~3-4 work days)

### Pessimistic (Complex issues, multiple iterations)
- SelectionManager: 6-8 hours
- SelectionBox: 5-6 hours
- SelectionHandles: 8-10 hours
- ElementManipulation: 10-12 hours
- Integration & Testing: 6-8 hours
- Documentation: 3-4 hours
- Bug fixes: 4-6 hours
- **Total**: 42-54 hours (~5-7 work days)

---

## Questions to Consider

### Before Starting Phase 4

**Q1**: Should SelectionUI be part of Phase 4 or deferred to Phase 5?
- **Recommendation**: Defer to Phase 5 (optional, low priority)

**Q2**: Should we split ElementManipulation into 3 modules (Drag, Resize, Rotate)?
- **Recommendation**: Start as one module, split if exceeds 350 lines

**Q3**: How to handle selection during tool usage?
- **Recommendation**: Clear selection when starting new tool (current behavior)

**Q4**: Should handles scale with zoom level?
- **Recommendation**: Yes, maintain consistent visual size (current behavior)

**Q5**: Support for locked/hidden elements in selection?
- **Recommendation**: Yes, respect element.locked flag (current behavior)

---

## Next Steps

### To Begin Phase 4

1. **Review this plan** - Ensure alignment with project goals
2. **Confirm module architecture** - Adjust if needed
3. **Set up module stubs** - Create empty files with JSDoc
4. **Start with SelectionManager** - Foundation first
5. **Iterate with testing** - Build → Test → Refine

### After Phase 4 Complete

**Project Status**:
- ~60-65% complete
- Selection system fully modular
- Ready for Phase 5 (UI Panels)

**Remaining Work**:
- Phase 5: UI Panels (~1,200 lines)
- Phase 6: History & State (~500 lines)
- Phase 7: Final Assembly & Cleanup

---

## Conclusion

Phase 4 represents a significant milestone in the modularization journey. The selection system is complex but well-understood, making it a good candidate for extraction. Success here will prove the architecture can handle the most intricate parts of the codebase.

**Key Takeaways**:
1. Start with SelectionManager (foundation)
2. Build incrementally with testing
3. Reuse existing utilities (coordinates, performance)
4. Maintain hybrid approach (coexist with legacy)
5. Document as you go

**Expected Outcome**:
- 4-5 focused selection modules
- ~1,000-1,200 lines extracted
- Fully functional selection system
- Clear path to Phase 5

Ready to begin when you are! 🚀

---

**Document Version**: 1.0  
**Created**: After Phase 3 completion  
**Status**: Planning - Ready for Implementation
