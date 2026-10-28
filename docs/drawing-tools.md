# Drawing Tools

### Shape Tools

- `rectangle` - Draw rectangles and squares with customizable borders and fills
- `ellipse` - Draw circles and ellipses with gradient support
- `diamond` - Draw diamond shapes with rotation capabilities
- `parallelogram` - Draw parallelograms with skew transformations
- `star` - Draw 5-pointed star shapes with inner/outer radius control

### Line Tools

- `line` - Draw straight lines with customizable stroke width and color
- `arrow` - Draw directional arrows with customizable arrowheads

### Content Tools

- `text` - Add text elements with font customization, color, and alignment
  - **Available Fonts**: Arial, Helvetica, Times New Roman, Georgia, Verdana, Courier New, Monaco, Comic Sans MS, Impact, Trebuchet MS
- `website` - Embed website previews with URL configuration
- `image` - Add image elements with source URL and alt text support
- `markdown` - Add markdown documents with comprehensive syntax support
- `table` - Add tables with headers, rows, and columns
  - **Features**: Double-click to edit cells, use the toolbar to add/remove rows and columns at the end, customizable fonts and colors

### Utility Tools

- `select` - Selection and manipulation tool with multi-select capabilities
- `draw` - Freehand drawing tool with path optimization

### Tool Settings

Available settings depend on the element type:

- **Stroke**: Color, width, and style
- **Fill**: Solid colors, gradients (linear/radial), hatch patterns, transparency
- **Opacity**: Element transparency (0-1)
- **Text**: Font family (10 choices), size, color, alignment
- **Gradients**: Multi-stop gradients with color and position controls
- **Grid Snapping**: Optional snap-to-grid with customizable grid size

### Contextual Properties Pane

The pane opens for one selected, ungrouped element and only shows applicable
controls. It remains hidden for no selection, multiple selection, and groups.

- **Shapes**: Stroke, fill style, opacity, dimensions, and rotation.
- **Lines and arrows**: Stroke, opacity, dimensions, and rotation; no fill controls.
  Dimension edits preserve endpoint direction and allow zero-width/height lines.
- **Freehand paths**: Stroke, opacity, and rotation. Use canvas resize handles to
  scale paths; numeric dimensions are hidden because they do not scale path points.
- **Text**: Stroke/outline, opacity, dimensions, rotation, font size/family, text
  color, and alignment; no shape-fill controls.
- **Images and websites**: Border stroke, opacity, dimensions, and rotation;
  no fill or typography controls.
- **Markdown and tables**: Stroke, fill style, opacity, dimensions, rotation,
  font size/family, and text color. Alignment is only offered for text elements.

Fill color appears for solid or imported hatch fills. Gradient type and stops
appear only for a gradient fill. Transparent fills show neither. Property changes
also refresh the spatial index so subsequent hit testing uses the new bounds.
