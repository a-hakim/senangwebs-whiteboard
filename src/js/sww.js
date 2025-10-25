/**
 * SenangWebs Whiteboard (SWW) - Modular Entry Point
 * Version: 1.0.1
 * 
 * Migration Status: Hybrid Architecture (Phase 2)
 * - Modular infrastructure: ✅ Complete
 * - Core initialization: ✅ Extracted
 * - Element management: ✅ Extracted
 * - Remaining: Uses legacy for full functionality
 */

import { marked } from 'marked';

// Make marked available globally for markdown elements
if (typeof window !== 'undefined') {
    window.marked = marked;
}

// Import modular components
import { SWWInstance } from './modules/core/SWWInstance.js';
import { InitializationMixin } from './modules/core/initialization.js';
import { ElementManagementMixin } from './modules/core/elementManagement.js';
import { CanvasMixin } from './modules/canvas/CanvasMixin.js';
import { ToolbarMixin } from './modules/ui/ToolbarMixin.js';
import { EventHandlersMixin } from './modules/core/eventHandlers.js';
import { ToolManagerMixin } from './modules/tools/ToolManager.js';
import { ShapeToolsMixin } from './modules/tools/ShapeToolsMixin.js';
import { LineToolsMixin } from './modules/tools/LineToolsMixin.js';
import { TextToolMixin } from './modules/tools/TextTool.js';
import { DrawToolMixin } from './modules/tools/DrawTool.js';
import { EmbedToolsMixin } from './modules/tools/EmbedToolsMixin.js';
import { SelectionManagerMixin } from './modules/selection/SelectionManager.js';
import { SelectionBoxMixin } from './modules/selection/SelectionBox.js';
import { SelectionHandlesMixin } from './modules/selection/SelectionHandles.js';
import { ElementManipulationMixin } from './modules/selection/ElementManipulation.js';
import { PropertiesPanelMixin } from './modules/ui/PropertiesPanel.js';
import { LayersPanelMixin } from './modules/ui/LayersPanel.js';
import { ExportDialogMixin } from './modules/ui/ExportDialog.js';
import { ControlPanelMixin } from './modules/ui/ControlPanel.js';
import { HistoryMixin } from './modules/history/History.js';
import { ViewportMixin } from './modules/viewport/Viewport.js';
import { ClipboardMixin } from './modules/clipboard/Clipboard.js';
import { ContextMenuMixin } from './modules/contextmenu/ContextMenu.js';
import { ElementActionsMixin } from './modules/actions/ElementActions.js';
import { GridMixin } from './modules/grid/Grid.js';
import { DialogsMixin } from './modules/dialogs/Dialogs.js';
import { UtilitiesMixin } from './modules/utilities/Utilities.js';

// Apply mixins to SWWInstance prototype
Object.assign(SWWInstance.prototype, InitializationMixin);
Object.assign(SWWInstance.prototype, ElementManagementMixin);
Object.assign(SWWInstance.prototype, CanvasMixin);
Object.assign(SWWInstance.prototype, ToolbarMixin);
Object.assign(SWWInstance.prototype, EventHandlersMixin);
Object.assign(SWWInstance.prototype, ToolManagerMixin);
Object.assign(SWWInstance.prototype, ShapeToolsMixin);
Object.assign(SWWInstance.prototype, LineToolsMixin);
Object.assign(SWWInstance.prototype, TextToolMixin);
Object.assign(SWWInstance.prototype, DrawToolMixin);
Object.assign(SWWInstance.prototype, EmbedToolsMixin);
Object.assign(SWWInstance.prototype, SelectionManagerMixin);
Object.assign(SWWInstance.prototype, SelectionBoxMixin);
Object.assign(SWWInstance.prototype, SelectionHandlesMixin);
Object.assign(SWWInstance.prototype, ElementManipulationMixin);
Object.assign(SWWInstance.prototype, PropertiesPanelMixin);
Object.assign(SWWInstance.prototype, LayersPanelMixin);
Object.assign(SWWInstance.prototype, ExportDialogMixin);
Object.assign(SWWInstance.prototype, ControlPanelMixin);
Object.assign(SWWInstance.prototype, HistoryMixin);
Object.assign(SWWInstance.prototype, ViewportMixin);
Object.assign(SWWInstance.prototype, ClipboardMixin);
Object.assign(SWWInstance.prototype, ContextMenuMixin);
Object.assign(SWWInstance.prototype, ElementActionsMixin);
Object.assign(SWWInstance.prototype, GridMixin);
Object.assign(SWWInstance.prototype, DialogsMixin);
Object.assign(SWWInstance.prototype, UtilitiesMixin);

// Import legacy implementation (still needed for UI, tools, etc.)
import './sww-legacy.js';

// Use legacy implementation until full migration is complete
const SWW = (typeof window !== 'undefined') ? window.sww : {};

export default SWW;
