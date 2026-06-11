const SCENE_VERSION = 1;
const ELEMENT_TYPES = new Set([
  "rectangle",
  "ellipse",
  "diamond",
  "parallelogram",
  "star",
  "line",
  "arrow",
  "path",
  "text",
  "website",
  "image",
  "markdown",
  "table",
]);
const RUNTIME_ELEMENT_KEYS = new Set([
  "svgElement",
  "boundaryRect",
  "pendingBoundaryRect",
  "_mouseDownHandler",
  "_touchStartHandler",
  "dragStartX",
  "dragStartY",
  "resizeStartX",
  "resizeStartY",
  "resizeStartWidth",
  "resizeStartHeight",
  "rotateStartAngle",
]);
const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function cloneSerializable(value) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(cloneSerializable);
  }

  if (typeof value === "object") {
    const result = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      if (UNSAFE_KEYS.has(key) || typeof nestedValue === "function") continue;
      result[key] = cloneSerializable(nestedValue);
    }
    return result;
  }

  return undefined;
}

function finiteNumber(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function normalizeElement(rawElement, generateId) {
  if (!rawElement || typeof rawElement !== "object" || !ELEMENT_TYPES.has(rawElement.type)) {
    throw new TypeError("Scene contains an unsupported element type.");
  }

  const element = {};
  for (const [key, value] of Object.entries(rawElement)) {
    if (UNSAFE_KEYS.has(key) || RUNTIME_ELEMENT_KEYS.has(key)) continue;
    element[key] = cloneSerializable(value);
  }

  element.id = typeof element.id === "string" && element.id ? element.id : generateId();
  element.x = finiteNumber(element.x, 0);
  element.y = finiteNumber(element.y, 0);
  element.width = finiteNumber(element.width, 0);
  element.height = finiteNumber(element.height, 0);
  element.strokeWidth = finiteNumber(element.strokeWidth, 2);
  element.opacity = Math.max(0, Math.min(1, finiteNumber(element.opacity, 1)));
  element.fontSize = finiteNumber(element.fontSize, 16);
  element.rotation = finiteNumber(element.rotation, 0);
  element.strokeColor =
    typeof element.strokeColor === "string" ? element.strokeColor : "#000000";
  element.fillColor =
    typeof element.fillColor === "string" ? element.fillColor : "#ffffff";
  element.fillStyle =
    typeof element.fillStyle === "string" ? element.fillStyle : "solid";
  element.fontFamily =
    typeof element.fontFamily === "string" ? element.fontFamily : "Arial";
  element.textAlign =
    typeof element.textAlign === "string" ? element.textAlign : "left";
  element.textColor =
    typeof element.textColor === "string" ? element.textColor : "#000000";
  element.locked = Boolean(element.locked);
  element.visible = element.visible !== false;
  element.groupId = element.groupId || null;

  if (element.type === "path" && !Array.isArray(element.points)) {
    element.points = [];
  }

  if (element.type === "table") {
    const tableData = element.tableData;
    if (!tableData || !Array.isArray(tableData.headers) || !Array.isArray(tableData.rows)) {
      throw new TypeError("Table elements require valid tableData.");
    }

    if (tableData.headers.length === 0) {
      tableData.headers = ["Header 1"];
    }
    if (tableData.rows.length === 0) {
      tableData.rows = [new Array(tableData.headers.length).fill("")];
    }

    tableData.headers = tableData.headers.map(function (h) { return String(h ?? ""); });

    var headerCount = tableData.headers.length;
    tableData.rows = tableData.rows.map(function (row) {
      if (!Array.isArray(row)) return new Array(headerCount).fill("");
      var normalized = row.slice(0, headerCount).map(function (cell) { return String(cell ?? ""); });
      while (normalized.length < headerCount) {
        normalized.push("");
      }
      return normalized;
    });

    delete tableData.columnWidths;
    delete tableData.rowHeights;
  }

  return element;
}

export const SceneStateMixin = {
  serializeElement(element) {
    const serialized = {};
    for (const [key, value] of Object.entries(element)) {
      if (RUNTIME_ELEMENT_KEYS.has(key) || UNSAFE_KEYS.has(key) || typeof value === "function") {
        continue;
      }
      serialized[key] = cloneSerializable(value);
    }
    return serialized;
  },

  deserializeElement(elementData) {
    return normalizeElement(elementData, () => this.generateId());
  },

  createSceneSnapshot({ includeSelection = true } = {}) {
    return {
      version: SCENE_VERSION,
      elements: this.elements.map((element) => this.serializeElement(element)),
      viewBox: cloneSerializable(this.viewBox),
      zoom: this.zoom,
      backgroundColor: this.options.backgroundColor,
      gridSize: this.options.gridSize,
      showGrid: this.snapToGrid,
      selectedElementIds: includeSelection
        ? Array.from(this.selectedElements, (element) => element.id)
        : [],
    };
  },

  getScene() {
    return this.createSceneSnapshot({ includeSelection: false });
  },

  validateScene(sceneData) {
    if (!sceneData || typeof sceneData !== "object" || !Array.isArray(sceneData.elements)) {
      throw new TypeError("Scene data must contain an elements array.");
    }

    if (sceneData.version !== undefined && sceneData.version !== SCENE_VERSION) {
      throw new TypeError(`Unsupported scene version: ${sceneData.version}`);
    }

    const ids = new Set();
    const elements = sceneData.elements.map((elementData) => {
      const element = this.deserializeElement(elementData);
      if (ids.has(element.id)) {
        element.id = this.generateId();
      }
      ids.add(element.id);
      return element;
    });

    const rawViewBox = sceneData.viewBox || {};
    const viewBox = {
      x: finiteNumber(rawViewBox.x, 0),
      y: finiteNumber(rawViewBox.y, 0),
      width: Math.max(1, finiteNumber(rawViewBox.width, 1000)),
      height: Math.max(1, finiteNumber(rawViewBox.height, 1000)),
    };

    return {
      elements,
      viewBox,
      zoom: Math.max(0.1, Math.min(5, finiteNumber(sceneData.zoom, 1))),
      backgroundColor:
        typeof sceneData.backgroundColor === "string"
          ? sceneData.backgroundColor
          : this.options.backgroundColor,
      gridSize: Math.max(1, finiteNumber(sceneData.gridSize, this.options.gridSize)),
      showGrid:
        sceneData.showGrid === undefined ? this.snapToGrid : Boolean(sceneData.showGrid),
      selectedElementIds: Array.isArray(sceneData.selectedElementIds)
        ? sceneData.selectedElementIds.filter((id) => typeof id === "string")
        : [],
    };
  },

  applySceneSnapshot(sceneData, { preserveHistory = false, actionType = "loadScene" } = {}) {
    const scene = this.validateScene(sceneData);

    this.closeActiveTableEditor?.(false);
    this.clearSelection();
    this.elements.forEach((element) => this.cleanupElement(element));
    this.elements = [];
    this.elementsById.clear();
    this.spatialIndex.clear();
    this.visibleElements.clear();
    this.elementsGroup.replaceChildren();

    this.viewBox = scene.viewBox;
    this.zoom = scene.zoom;
    this.options.backgroundColor = scene.backgroundColor;
    this.options.gridSize = scene.gridSize;
    this.snapToGrid = scene.showGrid;

    for (const element of scene.elements) {
      element.svgElement = this.createSVGElement(element);
      this.addElement(element, { emit: false });
    }

    for (const elementId of scene.selectedElementIds) {
      const element = this.elementsById.get(elementId);
      if (element && element.visible !== false && !element.locked) {
        this.addElementToSelection(element);
      }
    }

    this.updateViewBox();
    if (this.backgroundRect) {
      this.backgroundRect.setAttribute("fill", this.options.backgroundColor);
    }
    this.createGrid();
    this.updateGridVisibility();
    this.updateSelectionHandles();
    this.syncPropertiesPanel();
    this.updateVisibleElements();
    this.updateControlPanelLayers();

    if (!preserveHistory) {
      this.clearHistory();
      this.saveStateToHistory(actionType);
    }
  },

  loadScene(sceneData) {
    this.applySceneSnapshot(sceneData, { actionType: "loadScene" });
    return true;
  },
};

export { SCENE_VERSION };
