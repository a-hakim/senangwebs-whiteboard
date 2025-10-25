# Phase 5: UI Panels - Extraction Plan

**Status**: 📋 Planning Complete, Ready to Begin  
**Target**: Extract ~1,200 lines into 4 UI panel modules  
**Estimated Bundle Growth**: +10-15 KB

---

## 🎯 Objectives

Extract all UI panel components from the legacy file into modular, maintainable components:

1. **PropertiesPanel.js** - Element property editing UI
2. **LayersPanel.js** - Layer management UI
3. **ExportDialog.js** - Export functionality UI
4. **ControlPanel.js** - Main panel container and theme management

---

## 📋 Module Breakdown

### 1. PropertiesPanel.js (~400-450 lines)

**Purpose**: Real-time property editing for selected elements

**Responsibilities**:
- Create properties panel HTML structure
- Populate panel based on element type
- Handle property changes (color, size, rotation, etc.)
- Real-time updates during manipulation
- Multi-element property editing
- Element-type specific controls

**Key Methods**:
```javascript
createPropertiesPanel()           // Build panel HTML
updatePropertiesPanel()           // Populate with current selection
syncPropertiesPanel()             // Alias for update
throttledRealTimeUpdate(props)    // Real-time during drag/resize
commitPropertiesPanelChanges()    // Apply changes from UI
handlePropertyChange(prop, value) // Individual property update
```

**UI Controls**:
- Color picker (stroke, fill, text color)
- Gradient editor (type, stops)
- Fill style selector (solid, gradient, hatch)
- Size inputs (width, height, x, y)
- Rotation slider
- Opacity slider
- Font family/size selectors (text elements)
- Stroke width/dash pattern
- Arrow head selector (arrows)

**Dependencies**:
- SelectionManager (to know what's selected)
- Element update methods (updateSVGElement)
- History (saveStateToHistory after changes)

**Search Terms**: `createPropertiesPanel`, `updatePropertiesPanel`, `syncPropertiesPanel`, `commitPropertiesPanelChanges`, `handlePropertyChange`

---

### 2. LayersPanel.js (~300-350 lines)

**Purpose**: Layer list and visibility management

**Responsibilities**:
- Render layer list UI
- Toggle element visibility
- Lock/unlock elements
- Delete elements from layer list
- Select elements by clicking layer
- Reorder layers (drag-to-reorder)
- Update layer list on element changes

**Key Methods**:
```javascript
createLayersPanel()               // Build panel HTML
updateLayersPanel()               // Refresh layer list
toggleLayerVisibility(elementId)  // Show/hide element
toggleLayerLock(elementId)        // Lock/unlock element
selectLayerElement(elementId)     // Select from layer list
deleteLayerElement(elementId)     // Delete from layer list
handleLayerReorder(oldIndex, newIndex) // Drag-to-reorder
```

**UI Features**:
- Layer list with element thumbnails/icons
- Visibility eye icon (toggle)
- Lock icon (toggle)
- Element name/type display
- Delete button per layer
- Active selection highlight
- Drag handles for reordering

**Dependencies**:
- SelectionManager (for selection operations)
- Element management (delete, visibility, lock)
- SVG rendering (for thumbnails)

**Search Terms**: `createLayersPanel`, `updateLayersPanel`, `toggleLayerVisibility`, `toggleLayerLock`, `layersList`

---

### 3. ExportDialog.js (~200-250 lines)

**Purpose**: Export scene to various formats

**Responsibilities**:
- Export dialog UI
- Export to SVG
- Export to PNG (via canvas conversion)
- Export to JSON (scene data)
- Copy to clipboard
- Download file handling
- Preview generation

**Key Methods**:
```javascript
createExportDialog()              // Build dialog HTML
showExportDialog()                // Open dialog
hideExportDialog()                // Close dialog
exportToSVG()                     // Export as SVG file
exportToPNG(scale)                // Export as PNG (with scale)
exportToJSON()                    // Export scene data
copyToClipboard(format)           // Copy to clipboard
downloadFile(data, filename, type) // Trigger download
generatePreview()                 // Preview thumbnail
```

**UI Controls**:
- Format selector (SVG, PNG, JSON)
- Scale/size controls (for PNG)
- Quality settings
- Include/exclude options
- Preview area
- Copy and Download buttons

**Dependencies**:
- Scene data (getScene method)
- SVG serialization
- Canvas API (for PNG conversion)
- Clipboard API

**Search Terms**: `exportToSVG`, `exportToPNG`, `exportToJSON`, `createExportDialog`, `showExportDialog`

---

### 4. ControlPanel.js (~300-350 lines)

**Purpose**: Main panel container and theme management

**Responsibilities**:
- Panel container management
- Theme switching (dark/light mode)
- Panel visibility toggles
- Panel positioning/resizing
- Panel state persistence
- Keyboard shortcuts for panels

**Key Methods**:
```javascript
createControlPanel()              // Build panel container
initializePanelControls()         // Setup panel buttons
setPanelMode(mode)                // Switch theme (dark/light)
togglePropertiesPanel()           // Show/hide properties
toggleLayersPanel()               // Show/hide layers
toggleExportDialog()              // Show/hide export
savePanelState()                  // Persist panel preferences
loadPanelState()                  // Restore panel preferences
updatePanelTheme(colors)          // Apply theme colors
```

**UI Features**:
- Panel toggle buttons
- Theme switcher
- Panel minimize/maximize
- Panel drag-to-move
- Panel resize handles
- Close buttons

**Dependencies**:
- PropertiesPanel, LayersPanel, ExportDialog
- Theme constants
- Local storage (for persistence)

**Search Terms**: `createControlPanel`, `setPanelMode`, `togglePropertiesPanel`, `toggleLayersPanel`, `panelControls`

---

## 🔄 Extraction Strategy

### Step 1: PropertiesPanel.js
1. Search for properties panel methods in legacy file
2. Extract `createPropertiesPanel()` and related HTML generation
3. Extract `updatePropertiesPanel()` and population logic
4. Extract property change handlers
5. Extract real-time update throttling
6. Create mixin with all methods
7. Update entry point to import and apply mixin
8. Build and verify

**Expected Result**: 195 KB → ~213 KB bundle (+18 KB)

---

### Step 2: LayersPanel.js
1. Search for layers panel methods in legacy file
2. Extract `createLayersPanel()` and HTML generation
3. Extract `updateLayersPanel()` and list rendering
4. Extract visibility/lock toggle handlers
5. Extract layer selection and deletion
6. Create mixin with all methods
7. Update entry point to import and apply mixin
8. Build and verify

**Expected Result**: 213 KB → ~220 KB bundle (+7 KB)

---

### Step 3: ExportDialog.js
1. Search for export methods in legacy file
2. Extract `createExportDialog()` and dialog HTML
3. Extract SVG export logic
4. Extract PNG export with canvas conversion
5. Extract JSON export (scene data)
6. Extract clipboard and download utilities
7. Create mixin with all methods
8. Update entry point to import and apply mixin
9. Build and verify

**Expected Result**: 220 KB → ~225 KB bundle (+5 KB)

---

### Step 4: ControlPanel.js
1. Search for control panel methods in legacy file
2. Extract `createControlPanel()` and container HTML
3. Extract theme switching logic (`setPanelMode`)
4. Extract panel toggle methods
5. Extract panel state persistence
6. Create mixin with all methods
7. Update entry point to import and apply mixin
8. Build and verify

**Expected Result**: 225 KB → ~230 KB bundle (+5 KB)

---

## 🧪 Testing Checklist

### PropertiesPanel
- [ ] Panel displays when element selected
- [ ] Properties populate correctly for each element type
- [ ] Color picker works (stroke, fill, text)
- [ ] Size/position inputs update elements
- [ ] Rotation slider works
- [ ] Font controls work for text elements
- [ ] Multi-element selection shows common properties
- [ ] Real-time updates during drag/resize
- [ ] Changes trigger history save

### LayersPanel
- [ ] Layer list shows all elements
- [ ] Element names/types display correctly
- [ ] Eye icon toggles visibility
- [ ] Lock icon toggles lock state
- [ ] Clicking layer selects element
- [ ] Delete button removes element
- [ ] Layer list updates on element add/remove
- [ ] Selected element highlighted in list
- [ ] Drag-to-reorder works (if implemented)

### ExportDialog
- [ ] Dialog opens/closes correctly
- [ ] SVG export works (download file)
- [ ] PNG export works (with correct scale)
- [ ] JSON export includes all scene data
- [ ] Copy to clipboard works
- [ ] Preview generates correctly
- [ ] Format selector changes options
- [ ] Export respects element visibility

### ControlPanel
- [ ] Panel container renders correctly
- [ ] Theme switcher works (dark/light)
- [ ] Panel toggles show/hide panels
- [ ] Panel positions save/restore
- [ ] Keyboard shortcuts work
- [ ] Close buttons work
- [ ] Panel minimizes/maximizes
- [ ] Theme applies to all UI elements

---

## 📊 Success Metrics

- [ ] All 4 UI panel modules created
- [ ] Bundle size ≤ 230 KB (≤15 KB growth)
- [ ] 26 total modules (22 current + 4 new)
- [ ] Zero build errors
- [ ] All panel functionality preserved
- [ ] UI remains responsive
- [ ] Theme switching works across all panels

---

## 🎯 Phase 5 Goals

1. **Modularity**: Each panel in its own focused module
2. **Maintainability**: Clear separation of UI concerns
3. **Extensibility**: Easy to add new panels or controls
4. **Performance**: No UI lag, smooth updates
5. **Consistency**: Unified theme system across panels

---

## 🚀 What Comes After Phase 5

With UI panels extracted, we'll have:
- ✅ Infrastructure (Phase 1)
- ✅ Core system (Phase 2)
- ✅ Tools (Phase 3)
- ✅ Selection (Phase 4)
- ✅ UI Panels (Phase 5) ← This phase
- 📋 History System (Phase 6) - ~500 lines
- 📋 Final Cleanup (Phase 7) - Remove legacy file

**Estimated Project Completion**: ~75% after Phase 5

---

**Ready to Begin**: Phase 5 extraction starts with PropertiesPanel.js
