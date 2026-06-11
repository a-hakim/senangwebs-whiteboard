---
name: senangwebs-whiteboard
description: Interactive digital whiteboard and vector drawing library with drawing tools, layers, undo/redo, spatial indexing, and export.
version: 1.2.1
package: senangwebs-whiteboard
---

# SenangWebs Whiteboard (SWW)

## Quick Reference

- **Purpose**: Canvas-based whiteboard/drawing application with layers, tools, and performance optimizations
- **Entry**: `dist/sww.js`; stylesheet: `dist/sww.css`
- **Dependencies**: `@bookklik/senangstart-icons`, `marked`
- **Scripts**: `npm run test`, `npm run build`, `npm run dev`

## Workflow

Start in `C:\wamp64\www\sw-libraries\senangwebs-whiteboard`. Read `README.md`, `package.json`, and touched source files. Match existing patterns. **Canvas library — verify drawing output and tool behavior after changes.**

## JavaScript API

```js
const wb = sww.init(container, {
  width, height, backgroundColor, gridSize, showGrid,
  panelMode, accentColor, readOnly, performanceMode
})

// Drawing tools
wb.setTool('rectangle' | 'ellipse' | 'diamond' | 'parallelogram' | 'star' |
  'line' | 'arrow' | 'text' | 'image' | 'markdown' | 'table' | 'freehand')

// Scene management
wb.getScene()
wb.loadScene(data)
wb.clearAll()
SWW.getInstance(container)

// Element operations
wb.getElementById(id)
wb.selectElementById(id)
wb.deleteElementById(id)
wb.selectAll()
wb.clearSelection()
wb.deleteSelectedElements()

// Clipboard
wb.copySelected()
wb.pasteClipboard()

// Zoom
wb.zoomIn()
wb.zoomOut()
wb.resetZoom()

// History
wb.undo()
wb.redo()             // 50-step stack

// Export
wb.exportToSVG()
wb.exportToPNG()

// Modes
wb.togglePreviewMode()
wb.setPanelMode('dark' | 'light')
```

## Focus Areas

- Drawing tools: rectangle, ellipse, diamond, parallelogram, star, line, arrow, text, images, markdown, tables, freehand
- Layer management: visibility toggle, lock, reorder
- Multi-select: selection rectangle, group operations, clipboard copy/paste
- Undo/redo: 50-step command stack
- Spatial indexing: performance for 100+ elements
- LOD and viewport culling: skip off-screen elements
- Dark/light themes with customizable accent colors
- Grid with snap-to-grid toggle
- Zoom and pan (Ctrl+Scroll, drag)
- Export: SVG and PNG
- Preview/presentation mode, read-only mode
- Keyboard shortcuts: Ctrl+Z/Y, Ctrl+A, Delete, arrows (nudge), 1-5 (tool quick select)

## Implementation Guidance

- Preserve backward compatibility for all init options, method names, and export formats
- Keep `package.json` entry points aligned with webpack output and derive the runtime version from the package version
- Performance: verify spatial indexing keeps interactions smooth with 100+ elements
- Test all drawing tools on both mouse and touch input
- SVG export must be faithful to canvas rendering
- Clipboard: test paste after copy, cross-instance paste

## Validation

```bash
npm run build
npm run dev      # for visual verification
npm test         # validates package entry points, artifacts, and runtime version
```
