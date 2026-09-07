# Installation

### Production Use (Recommended)

Simply include the built SWW files in your HTML - SenangStart Icons and Marked are pre-bundled:

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="sww.css" />
    <script src="sww.js"></script>
  </head>
  <body>
    <div id="drawing-container"></div>

    <script>
      const container = document.getElementById("drawing-container");
      const whiteboard = sww.init(container, {
        backgroundColor: "#ffffff",
        gridSize: 20,
        showGrid: true,
      });
    </script>
  </body>
</html>
```

### Development Setup

For development or customization, you'll need to build the library from source:

```bash
# Clone the repository
git clone https://github.com/a-hakim/senangwebs-whiteboard.git
cd senangwebs-whiteboard

# Install dependencies
npm install

# Build for production
npm run build

# Or build with watch mode for development
npm run dev
```

### Dependencies

The library has **no runtime dependencies** — these are bundled during the build process:

- **@bookklik/senangstart-icons** (^1.0.14) - Icon library for UI elements (only the icons the library uses are bundled — regenerate with `npm run icons:build`)
- **marked** (^9.0.0) - Markdown parser for document elements

### Build Output

After running `npm run build`, you'll find in the `dist/` folder:

- `sww.js` (485 KB) / `sww.min.js` (206 KB) - UMD bundles with all dependencies bundled
- `sww.esm.mjs` (205 KB) - ES module build
- `sww.css` (76 KB) / `sww.min.css` (64 KB) - Stylesheet including the trimmed SenangStart Icons subset
- `*.map` - Source maps for the bundles

Development builds (`npm run dev`) are written to `dist-dev/` so they never overwrite the production artifacts in `dist/`.

### TypeScript

The package ships hand-maintained type definitions (`index.d.ts`) — no `@types` package is needed.
