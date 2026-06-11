const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");

async function importSource(relativePath) {
  const filePath = path.join(root, relativePath);
  const source = fs.readFileSync(filePath, "utf8");
  const dataUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
  return import(dataUrl);
}

async function testSceneState() {
  const { SceneStateMixin } = await importSource("src/js/modules/core/SceneState.js");
  const instance = {
    ...SceneStateMixin,
    elements: [
      {
        id: "table-1",
        type: "table",
        x: 10,
        y: 20,
        width: 300,
        height: 200,
        opacity: 1,
        tableData: {
          headers: ["A", "B"],
          rows: [["1", "2"]],
          columnWidths: [120, 180],
          rowHeights: [44],
        },
        svgElement: { runtimeOnly: true },
      },
    ],
    selectedElements: new Set(),
    viewBox: { x: 0, y: 0, width: 1000, height: 800 },
    zoom: 1,
    snapToGrid: true,
    options: { backgroundColor: "#fff", gridSize: 20 },
    generateId: () => "generated-id",
  };

  const scene = instance.getScene();
  assert.equal(scene.version, 1);
  assert.deepEqual(scene.elements[0].tableData.rows, [["1", "2"]]);
  assert.equal("svgElement" in scene.elements[0], false);

  scene.elements[0].tableData.rows[0][0] = "changed";
  assert.equal(instance.elements[0].tableData.rows[0][0], "1");

  const validated = instance.validateScene(scene);
  assert.equal(validated.elements[0].type, "table");
  assert.throws(
    () => instance.validateScene({ version: 99, elements: [] }),
    /Unsupported scene version/,
  );
  assert.throws(
    () => instance.validateScene({ version: 1, elements: [{ type: "script" }] }),
    /unsupported element type/,
  );
}

async function testSpatialIndex() {
  const { SpatialIndex } = await importSource("src/js/modules/utils/SpatialIndex.js");
  const index = new SpatialIndex(100);
  const element = { id: "one" };

  index.insert(element, { x: 50, y: 50, width: 200, height: 100 });
  assert.equal(index.query({ x: 60, y: 60 }).has(element), true);
  assert.equal(
    index.queryBounds({ x: 200, y: 0, width: 100, height: 200 }).has(element),
    true,
  );

  index.insert(element, { x: 500, y: 500, width: 20, height: 20 });
  assert.equal(index.query({ x: 60, y: 60 }).has(element), false);
  assert.equal(index.query({ x: 510, y: 510 }).has(element), true);

  index.remove(element);
  assert.equal(index.query({ x: 510, y: 510 }).has(element), false);

  const largeIndex = new SpatialIndex(100);
  for (let indexValue = 0; indexValue < 10000; indexValue += 1) {
    const x = (indexValue % 100) * 20;
    const y = Math.floor(indexValue / 100) * 20;
    largeIndex.insert(
      { id: indexValue },
      { x, y, width: 10, height: 10 },
    );
  }
  const start = performance.now();
  const candidates = largeIndex.queryBounds({ x: 500, y: 500, width: 200, height: 200 });
  const duration = performance.now() - start;
  assert.ok(candidates.size > 0);
  assert.ok(duration < 250, `10,000-element spatial query took ${duration.toFixed(1)}ms`);
}

async function testDrawSelectionAndDrag() {
  const [{ UtilitiesMixin }, { ElementManipulationMixin }, { SpatialIndex }] = await Promise.all([
    importSource("src/js/modules/utilities/Utilities.js"),
    importSource("src/js/modules/selection/ElementManipulation.js"),
    importSource("src/js/modules/utils/SpatialIndex.js"),
  ]);
  const pathElement = {
    id: "path-1",
    type: "path",
    x: 0,
    y: 80,
    width: 100,
    height: 0,
    strokeWidth: 2,
    points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
  };
  const hitTestInstance = {
    ...UtilitiesMixin,
    elements: [pathElement],
    spatialIndex: new SpatialIndex(100),
    currentElement: null,
    svg: null,
    zoom: 0.25,
  };
  hitTestInstance.spatialIndex.insert(
    pathElement,
    hitTestInstance.getElementBounds(pathElement),
  );

  assert.equal(
    hitTestInstance.getElementAtPoint({ x: 50, y: 105 }),
    pathElement,
    "zoomed-out Draw strokes should remain selectable across spatial-index cells",
  );
  hitTestInstance.zoom = 1;
  assert.equal(
    hitTestInstance.getElementAtPoint({ x: 50, y: 105 }),
    null,
    "selection tolerance should remain screen-sized at normal zoom",
  );

  const dragInstance = {
    ...ElementManipulationMixin,
    selectedElements: new Set([pathElement]),
    isDraggingElement: true,
    dragStartPoint: { x: 10, y: 10 },
    snapToGrid: true,
    snapToGridValue: value => Math.round(value / 20) * 20,
    updateSVGElement() {},
    updateSelectionHandles() {},
  };
  pathElement.dragStartX = pathElement.x;
  pathElement.dragStartY = pathElement.y;
  dragInstance.updateElementDrag({ x: 13, y: 14 });
  assert.equal(pathElement.x, 3);
  assert.equal(pathElement.y, 84);
}

async function testHistoryRoundTrip() {
  const [{ SceneStateMixin }, { HistoryMixin }] = await Promise.all([
    importSource("src/js/modules/core/SceneState.js"),
    importSource("src/js/modules/history/History.js"),
  ]);
  const instance = {
    ...SceneStateMixin,
    ...HistoryMixin,
    elements: [{
      id: "table-1",
      type: "table",
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      opacity: 1,
      tableData: {
        headers: ["A"],
        rows: [["before"]],
        columnWidths: [100],
        rowHeights: [40],
      },
    }],
    selectedElements: new Set(),
    viewBox: { x: 0, y: 0, width: 1000, height: 1000 },
    zoom: 1,
    snapToGrid: true,
    options: { backgroundColor: "#fff", gridSize: 20 },
    historyStack: [],
    historyIndex: -1,
    maxHistorySize: 50,
    isPerformingHistoryAction: false,
    generateId: () => "generated-id",
    updateHistoryButtons() {},
    emitSceneChanged() {},
    applySceneSnapshot(state) {
      this.elements = state.elements.map((element) => this.deserializeElement(element));
    },
  };

  instance.saveStateToHistory("init");
  instance.elements[0].tableData.rows[0][0] = "after";
  instance.saveStateToHistory("editTable");
  instance.undo();
  assert.equal(instance.elements[0].tableData.rows[0][0], "before");
  instance.redo();
  assert.equal(instance.elements[0].tableData.rows[0][0], "after");
}

async function testUrlPolicy() {
  global.window = {
    location: {
      href: "https://example.test/board",
      origin: "https://example.test",
    },
  };
  const { sanitizeUrl } = await importSource("src/js/modules/utils/security.js");
  assert.equal(sanitizeUrl("javascript:alert(1)"), "");
  assert.equal(sanitizeUrl("https://example.com/image.png"), "https://example.com/image.png");
  assert.equal(sanitizeUrl("mailto:test@example.com"), "mailto:test@example.com");
  assert.equal(
    sanitizeUrl("mailto:test@example.com", { allowedProtocols: ["http:", "https:"] }),
    "",
  );
  delete global.window;
}

async function testEsmEntry() {
  const module = await import(
    `${pathToFileURL(path.join(root, "dist/sww.esm.mjs")).href}?test=${Date.now()}`
  );
  assert.equal(module.default.version, require("../package.json").version);
}

Promise.all([
  testSceneState(),
  testSpatialIndex(),
  testDrawSelectionAndDrag(),
  testHistoryRoundTrip(),
  testUrlPolicy(),
  testEsmEntry(),
])
  .then(() => {
    console.log("Core scene-state, history, Draw interaction, URL-policy, spatial-index, and ESM tests passed.");
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
