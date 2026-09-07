/**
 * Type definitions for senangwebs-whiteboard
 *
 * Hand-maintained declarations derived from the library source
 * (src/js/modules/**) and docs (docs/api-reference.md, docs/advanced-usage.md).
 * Update this file manually when the public API changes.
 *
 * Library style: UMD + ESM dual.
 * - ESM:  `import SWW from 'senangwebs-whiteboard'`
 * - UMD:  global `SWW` (also aliased as `window.sww`)
 */

/* ============================================================================
 * Shared data types
 * ========================================================================== */

export type SWWToolName =
  | "select"
  | "rectangle"
  | "ellipse"
  | "diamond"
  | "parallelogram"
  | "star"
  | "line"
  | "arrow"
  | "text"
  | "draw"
  | "website"
  | "image"
  | "markdown"
  | "table";

export type SWWFillStyle = "solid" | "gradient" | "hatch";
export type SWWGradientType = "linear" | "radial";
export type SWWTextAlign = "left" | "center" | "right";
export type SWWLineShapeType = "line" | "arrow";

/** Schema version emitted by getScene() / createSceneSnapshot(). */
export type SWWSceneVersion = number; // currently 1

export interface SWWGradientStop {
  offset: number; // 0 - 100
  color: string;
}

export interface SWWViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SWWPoint {
  x: number;
  y: number;
}

export interface SWWBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/* ----------------------------------------------------------------------------
 * Element data (JSON-serializable scene element shapes)
 * ------------------------------------------------------------------------- */

export interface SWWElementDataBase {
  /** Unique element id, format `sww-<random>`. */
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  fillStyle: SWWFillStyle;
  gradientType?: SWWGradientType;
  gradientStops?: SWWGradientStop[];
  opacity: number; // 0 - 1
  rotation: number; // degrees
  fontSize: number;
  fontFamily: string;
  textAlign: SWWTextAlign;
  textColor: string;
  locked: boolean;
  visible: boolean;
  groupId: string | null;
}

export interface SWWShapeElementData extends SWWElementDataBase {
  type: "rectangle" | "ellipse" | "diamond" | "parallelogram" | "star";
  cornerRadius?: number;
}

export interface SWWLineElementData extends SWWElementDataBase {
  type: SWWLineShapeType;
  points?: SWWPoint[];
  lineStyle?: "solid" | "dashed" | "dotted";
  arrowStartMarker?: boolean;
  arrowEndMarker?: boolean;
}

export interface SWWPathElementData extends SWWElementDataBase {
  type: "path";
  /** Freehand draw tool points. Normalized to an array on load. */
  points: SWWPoint[];
}

export interface SWWTextElementData extends SWWElementDataBase {
  type: "text";
  text: string;
}

export interface SWWWebsiteElementData extends SWWElementDataBase {
  type: "website";
  url: string;
  text: string;
}

export interface SWWImageElementData extends SWWElementDataBase {
  type: "image";
  imageUrl: string;
  text: string;
}

export interface SWWMarkdownElementData extends SWWElementDataBase {
  type: "markdown";
  markdown: string;
  text: string;
}

export interface SWWTableData {
  headers: string[];
  rows: string[][];
}

export interface SWWTableElementData extends SWWElementDataBase {
  type: "table";
  tableData: SWWTableData;
  text: string;
}

/** Union of all supported scene element types. */
export type SWWElementType =
  | "rectangle"
  | "ellipse"
  | "diamond"
  | "parallelogram"
  | "star"
  | "line"
  | "arrow"
  | "path"
  | "text"
  | "website"
  | "image"
  | "markdown"
  | "table";

export type SWWElementData =
  | SWWShapeElementData
  | SWWLineElementData
  | SWWPathElementData
  | SWWTextElementData
  | SWWWebsiteElementData
  | SWWImageElementData
  | SWWMarkdownElementData
  | SWWTableElementData;

/**
 * A live (in-memory) element as returned by getElementById() / exposed via
 * `instance.elements`. Extends the serializable data with runtime-only
 * properties (stripped again by getScene()/serializeElement()).
 */
export type SWWElement = (SWWElementData | SWWElementDataBase) & {
  svgElement?: SVGElement;
  boundaryRect?: SVGElement;
};

/* ----------------------------------------------------------------------------
 * Scene snapshot / scene data
 * ------------------------------------------------------------------------- */

/** Returned by getScene() and createSceneSnapshot(). JSON-serializable. */
export interface SWWSceneSnapshot {
  version: SWWSceneVersion;
  elements: SWWElementData[];
  viewBox: SWWViewBox;
  zoom: number;
  backgroundColor: string;
  gridSize: number;
  showGrid: boolean;
  /** Empty for getScene(); populated by createSceneSnapshot({ includeSelection: true }). */
  selectedElementIds: string[];
}

/**
 * Input for loadScene(). Validated by the library: version, element types,
 * duplicate ids, numeric geometry and table data are checked. Most fields
 * except `elements` are optional and fall back to instance defaults.
 */
export interface SWWSceneData {
  version?: SWWSceneVersion;
  elements: Array<Partial<SWWElementData> & { type: SWWElementType }>;
  viewBox?: Partial<SWWViewBox>;
  zoom?: number;
  backgroundColor?: string;
  gridSize?: number;
  showGrid?: boolean;
  selectedElementIds?: string[];
}

/* ----------------------------------------------------------------------------
 * Constructor options
 * ------------------------------------------------------------------------- */

export interface SWWOptions {
  /** CSS width of the whiteboard. Default `"100%"`. */
  width?: string | number;
  /** CSS height of the whiteboard. Default `"100%"`. */
  height?: string | number;
  /** Canvas background color. Default `"#ffffff"`. */
  backgroundColor?: string;
  /** Grid cell size in px. Default `20`. */
  gridSize?: number;
  /** Show the background grid. Default `true`. */
  showGrid?: boolean;
  /** Panel color scheme. Default `"dark"`. */
  panelMode?: "dark" | "light";
  /** UI panel background color. Defaults derived from panelMode. */
  panelBackgroundColor?: string;
  /** UI panel text color. Defaults derived from panelMode. */
  panelTextColor?: string;
  /** Primary accent color (buttons, active states). */
  accentColor?: string;
  /** Secondary accent color (selection highlights etc.). */
  secondaryAccentColor?: string;
  /** `sandbox` attribute applied to website-embed iframes. */
  iframeSandbox?: string;
  /** `allow` attribute applied to website-embed iframes. */
  iframeAllow?: string;
  /** Start in read-only preview mode. Default `false`. */
  readOnly?: boolean;
  /**
   * Any additional properties are spread onto `instance.options` and
   * readable at runtime (e.g. external integrations).
   */
  [key: string]: unknown;
}

/* ----------------------------------------------------------------------------
 * Export options
 * ------------------------------------------------------------------------- */

export interface SWWExportOptions {
  /**
   * `"all"` (default) fits the export to all visible elements with padding;
   * `"view"` exports the current viewport.
   */
  mode?: "all" | "view";
  /** Padding (in scene units) around content when mode is `"all"`. Default `20`. */
  padding?: number;
  /** PNG raster scale factor. Default `1`. */
  scale?: number;
}

/* ----------------------------------------------------------------------------
 * History
 * ------------------------------------------------------------------------- */

export interface SWWHistoryStats {
  stackSize: number;
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  estimatedMemoryBytes: number;
  maxSize: number;
}

/* ----------------------------------------------------------------------------
 * Events
 *
 * The instance does NOT implement on()/off(). All events are dispatched as
 * DOM CustomEvents on the whiteboard container element. Listen with:
 *
 *   container.addEventListener('sww:sceneChanged', (e) => {
 *     const detail = (e as SWWSceneChangedEvent).detail;
 *   });
 * ------------------------------------------------------------------------- */

export interface SWWSceneChangedEventDetail {
  actionType: string; // e.g. 'init' | 'draw' | 'move' | 'delete' | 'undo' | 'redo' | 'loadScene' | 'clearAll'
  affectedElementIds: string[];
  revision: number;
}

export interface SWWSelectionChangedEventDetail {
  selectedElements: SWWElement[];
  selectedElementIds: string[];
}

export interface SWWToolChangedEventDetail {
  tool: SWWToolName;
  previousTool: SWWToolName | null;
}

export interface SWWToolSettingChangedEventDetail {
  property: string;
  value: unknown;
}

export interface SWWToolSettingsChangedEventDetail {
  settings: Record<string, unknown>;
}

export type SWWSceneChangedEvent = CustomEvent<SWWSceneChangedEventDetail>;
export type SWWSelectionChangedEvent = CustomEvent<SWWSelectionChangedEventDetail>;
export type SWWToolChangedEvent = CustomEvent<SWWToolChangedEventDetail>;
export type SWWToolSettingChangedEvent = CustomEvent<SWWToolSettingChangedEventDetail>;
export type SWWToolSettingsChangedEvent = CustomEvent<SWWToolSettingsChangedEventDetail>;
export type SWWPreviewModeEvent = CustomEvent<undefined>; // 'previewModeEntered' | 'previewModeExited'

/* ============================================================================
 * Instance
 * ========================================================================== */

export interface SWWFontFamilyOption {
  value: string;
  text: string;
}

export class SWWInstance {
  /* -- construction / lifecycle ------------------------------------------- */
  constructor(container: HTMLElement, options?: SWWOptions);

  /** Called by the SWW factory after all mixins are applied. */
  init(): void;
  /** Removes DOM, listeners, observers and the container reference. Idempotent. */
  destroy(): void;

  /** The host element passed to init(). */
  container: HTMLElement;
  /** Normalized constructor options (merged with defaults). */
  options: SWWOptions;
  /** True after destroy() has been called. */
  isDestroyed: boolean;

  /* -- scene state (public fields, read at your own risk) ------------------ */
  elements: SWWElement[];
  selectedElements: Set<SWWElement>;
  viewBox: SWWViewBox;
  zoom: number;
  currentTool: SWWToolName;
  toolSettings: {
    strokeColor: string;
    strokeWidth: number;
    fillColor: string;
    fillStyle: SWWFillStyle;
    opacity: number;
    gradientType: SWWGradientType;
    gradientStops: SWWGradientStop[];
    fontSize: number;
    fontFamily: string;
    textAlign: SWWTextAlign;
    textColor: string;
  };
  sceneRevision: number;
  snapToGrid: boolean;
  isPreviewMode: boolean;

  /** Static list of font families offered by the text tool. */
  static FONT_FAMILIES: SWWFontFamilyOption[];
  /** Instance copy of the font families list. */
  FONT_FAMILIES: SWWFontFamilyOption[];

  /* -- tools ---------------------------------------------------------------- */
  setTool(toolName: SWWToolName): void;
  getCurrentTool(): SWWToolName;
  isToolActive(toolName: SWWToolName): boolean;
  isShapeTool(): boolean;
  isLineTool(): boolean;
  isTextTool(): boolean;
  isDrawTool(): boolean;
  isEmbedTool(): boolean;
  cancelCurrentDrawing(): void;

  getToolSetting<K extends keyof SWWInstance["toolSettings"]>(property: K): SWWInstance["toolSettings"][K];
  setToolSetting<K extends keyof SWWInstance["toolSettings"]>(property: K, value: SWWInstance["toolSettings"][K]): void;
  setToolSettings(settings: Partial<SWWInstance["toolSettings"]>): void;
  getAllToolSettings(): SWWInstance["toolSettings"];
  resetToolSettings(): void;

  /* -- scene get / load ------------------------------------------------------ */
  /** JSON-serializable snapshot of the current scene (without selection). */
  getScene(): SWWSceneSnapshot;
  /** Validate + replace the current scene. Clears history by default. */
  loadScene(sceneData: SWWSceneData): boolean;
  createSceneSnapshot(options?: { includeSelection?: boolean }): SWWSceneSnapshot;
  validateScene(sceneData: SWWSceneData): SWWSceneSnapshot;
  applySceneSnapshot(
    sceneData: SWWSceneData,
    options?: { preserveHistory?: boolean; actionType?: string }
  ): void;
  serializeElement(element: SWWElement): SWWElementData;
  deserializeElement(elementData: SWWElementData): SWWElement;

  /* -- export / import -------------------------------------------------------- */
  /** Builds the export SVG without triggering a download. */
  createExportSVG(options?: SWWExportOptions): { clonedSVG: SVGSVGElement; bounds: SWWBounds };
  /** Downloads and returns the SVG source string. */
  exportToSVG(options?: SWWExportOptions): string;
  /** Downloads a PNG raster. Returns false (and warns) for unsupported content. */
  exportToPNG(options?: SWWExportOptions): boolean | undefined;
  /** Downloads scene JSON and returns the JSON string. */
  exportToJSON(): string;
  /** Copies scene JSON to the system clipboard. */
  copySceneToClipboard(): Promise<boolean>;
  /** Parses a JSON string and calls loadScene(). */
  loadSceneFromJSON(jsonData: string): boolean;
  /** Opens a file picker and imports a scene JSON file. */
  importFromJSON(): void;
  showExportDialog(): void;

  /* -- element management ------------------------------------------------------ */
  generateId(): string;
  getElementById(elementId: string): SWWElement | null;
  selectElementById(elementId: string): boolean;
  deleteElementById(elementId: string): boolean;
  toggleElementVisibility(elementId: string): boolean;
  duplicateElement(elementId: string): SWWElement | null;
  copyElementById(elementId: string): boolean;

  /** Low-level programmatic element creation (see docs/advanced-usage.md). */
  createElement(type: SWWElementType, point: SWWPoint): SWWElement;
  addElement(element: SWWElement, options?: { emit?: boolean }): SWWElement;
  removeElement(element: SWWElement): void;
  addSVGElementToDOM(element: SWWElement): void;
  updateSVGElement(element: SWWElement): void;
  updateElementInSpatialIndex(element: SWWElement): void;
  createSVGElement(element: SWWElementData): SVGElement;
  getElementBounds(element: SWWElement): SWWBounds;

  /* -- tables ----------------------------------------------------------------- */
  addTableRow(element: SWWTableElement & SWWElement): void;
  addTableRowAt(element: SWWTableElement & SWWElement, position: number): void;
  addTableColumn(element: SWWTableElement & SWWElement): void;
  addTableColumnAt(element: SWWTableElement & SWWElement, position: number): void;
  removeTableRow(element: SWWTableElement & SWWElement, rowIndex: number): void;
  removeTableColumn(element: SWWTableElement & SWWElement, colIndex: number): void;

  /* -- selection actions -------------------------------------------------------- */
  deleteSelected(): void;
  deleteSelectedElements(): void;
  lockSelected(): void;
  unlockSelected(): void;
  toggleLockSelected(): void;
  groupSelected(): void;
  ungroupSelected(): void;
  bringToFront(): void;
  sendToBack(): void;
  bringSelectedToFront(): void;
  sendSelectedToBack(): void;
  editSelected(): void;

  /* -- clipboard ------------------------------------------------------------------ */
  copySelected(): void;
  cutSelected(): void;
  pasteClipboard(): void;
  pasteAt(x: number, y: number): void;
  duplicateSelected(): void;
  clearClipboard(): void;
  hasClipboardContent(): boolean;
  getClipboardCount(): number;
  getClipboardContent(): SWWElementData[];
  setClipboardContent(elements: SWWElementData[]): void;

  /* -- history ----------------------------------------------------------------------- */
  undo(): void;
  redo(): void;
  clearHistory(): void;
  getHistoryStats(): SWWHistoryStats;
  saveStateToHistory(actionType: string): void;
  restoreState(state: SWWSceneSnapshot): void;

  /* -- viewport / zoom ------------------------------------------------------------------ */
  zoomIn(): void;
  zoomOut(): void;
  resetZoom(): void;
  zoomToFit(): void;
  setZoom(zoomLevel: number): void;
  getZoom(): number;
  pan(dx: number, dy: number): void;
  getViewBox(): SWWViewBox;
  setViewBox(viewBox: SWWViewBox): void;
  centerViewOn(x: number, y: number): void;
  getViewportBounds(): SWWBounds;
  isPointVisible(x: number, y: number): boolean;
  svgToScreenCoordinates(x: number, y: number): SWWPoint;
  getPointerPosition(e: PointerEvent | MouseEvent): SWWPoint;
  setCursor(cursorType: string): void;

  /* -- grid -------------------------------------------------------------------------------- */
  showGrid(): void;
  hideGrid(): void;
  toggleGrid(): void;
  toggleGridSnap(): void;

  /* -- preview / read-only mode --------------------------------------------------------------- */
  enterPreviewMode(): void;
  exitPreviewMode(): void;
  togglePreviewMode(): void;
  fitCanvasToElements(): void;
  lockAllElements(): void;
  unlockAllElements(): void;
  enableBrowserFrameFullscreen(): void;
  disableBrowserFrameFullscreen(): void;

  /* -- theme ------------------------------------------------------------------------------------ */
  setPanelMode(mode: "dark" | "light"): void;
  getThemeMode(): "dark" | "light";
  toggleTheme(): void;

  /* -- notifications -------------------------------------------------------------------------------- */
  showNotification(message: string, type?: "info" | "success" | "warning" | "error", duration?: number): void;

  /* -- misc ------------------------------------------------------------------------------------------- */
  /** Clears all elements from the canvas. Creates an undo history entry. */
  clearAll(): void;
}

/**
 * Convenience alias: a live table element (tableData present).
 * (getElementById returns SWWElement; cast when you know it is a table.)
 */
export type SWWTableElement = SWWElement & { tableData: SWWTableData };

/* ============================================================================
 * Factory
 * ========================================================================== */

export interface SWWStatic {
  /** Initialize a new whiteboard instance inside the given container. */
  init(container: HTMLElement, options?: SWWOptions): SWWInstance;
  /** Retrieve the instance previously initialized in the container, if any. */
  getInstance(container: HTMLElement): SWWInstance | null;
  /** Library version (injected at build time). */
  readonly version: string;
}

declare const sww: SWWStatic;

export default sww;

/** UMD global (browser builds expose both `window.SWW` and `window.sww`). */
export as namespace SWW;
