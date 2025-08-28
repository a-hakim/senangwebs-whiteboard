# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2025-08-28

### 🚀 Major Release - Complete Rewrite

#### Added
- **Modular Architecture**: Complete rewrite with clean separation of concerns
- **Modern ES6+ Modules**: All code restructured into ES6 modules
- **Event-Driven System**: Comprehensive event management and handling
- **Tool System**: Extensible tool architecture for drawing operations
- **SVG Rendering**: Native SVG-based rendering system
- **Build System**: Rollup-based build pipeline with multiple output formats
- **Development Tools**: ESLint configuration, development server, and build scripts
- **Better Documentation**: Comprehensive documentation and migration guides

#### Changed
- **Breaking**: Complete API redesign for better developer experience
- **Performance**: Significantly improved rendering performance with SVG
- **Code Quality**: Modern JavaScript with better error handling
- **Project Structure**: Organized codebase with logical module separation

#### Core Modules
- `CanvasManager`: SVG canvas and viewport management
- `ElementFactory`: Drawing element creation and validation  
- `HistoryManager`: Undo/redo functionality with configurable history
- `SVGRenderer`: Native SVG rendering system
- `EventManager`: Event handling and propagation
- `ExportManager`: Export to multiple formats (SVG, PNG, JSON)
- `Tool System`: Base tools with extensible architecture

#### Tools Available
- `SelectTool`: Element selection and manipulation
- `RectangleTool`: Rectangle drawing
- `EllipseTool`: Ellipse/circle drawing  
- `DiamondTool`: Diamond shape drawing

#### Build Outputs
- `dist/sww.esm.js`: ES6 module version
- `dist/sww.js`: UMD version (universal)
- `dist/sww.min.js`: Minified UMD version

### Removed
- Legacy v1.x monolithic file (4000+ lines)
- Old demo files and redundant documentation
- Dependency on external libraries

### Migration
- See `docs/MIGRATION.md` for migration guide from v1.x
- Complete API changes - not backward compatible
- New initialization pattern and tool system

---

## [1.0.0] - Previous Release
- Initial monolithic implementation (archived)
- Single 4000+ line JavaScript file
- Basic drawing functionality
- Canvas-based rendering
