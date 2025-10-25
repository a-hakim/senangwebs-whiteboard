# Installation

### Production Use (Recommended)

Simply include the built SWW files in your HTML - FontAwesome and Marked are pre-bundled:

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
        const container = document.getElementById('drawing-container');
        const whiteboard = sww.init(container, {
            backgroundColor: "#ffffff",
            gridSize: 20,
            showGrid: true
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

The library includes these dependencies that are bundled during the build process:

- **@fortawesome/fontawesome-free** (^6.4.0) - Icon library for UI elements
- **marked** (^9.0.0) - Markdown parser for document elements

### Build Output

After running `npm run build`, you'll find in the `dist/` folder:

- `sww.js` (150 KB) - Main library bundle with all dependencies and latest features
- `sww.css` (135 KB) - Stylesheet including FontAwesome icons and dark theme support
- `fonts/` - FontAwesome font files (232 KB total)
- `styles.js` - Additional style utilities for theme management
