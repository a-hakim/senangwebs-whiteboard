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

// DOM polyfill for Node.js test environment
if (!global.document) {
  var { JSDOM } = require("jsdom");
  var dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.HTMLInputElement = dom.window.HTMLInputElement;
  global.KeyboardEvent = dom.window.KeyboardEvent;
  global.Event = dom.window.Event;
  global.Element = dom.window.Element;
}

async function testTableNormalization() {
  var { SceneStateMixin } = await importSource("src/js/modules/core/SceneState.js");
  var counter = 0;
  var instance = {
    ...SceneStateMixin,
    generateId: function () { counter += 1; return "id-" + counter; },
  };

  // Default table: no sizing arrays, at least 1 header and 1 row
  var defaultTable = instance.deserializeElement({
    type: "table",
    tableData: { headers: ["A", "B"], rows: [["1", "2"], ["3", "4"]] },
  });
  assert.deepEqual(defaultTable.tableData.headers, ["A", "B"]);
  assert.deepEqual(defaultTable.tableData.rows, [["1", "2"], ["3", "4"]]);
  assert.equal(defaultTable.tableData.columnWidths, undefined);
  assert.equal(defaultTable.tableData.rowHeights, undefined);

  // Legacy scene: strips columnWidths and rowHeights
  var legacyTable = instance.deserializeElement({
    type: "table",
    tableData: {
      headers: ["H1", "H2"],
      rows: [["a", "b"]],
      columnWidths: [120, 180],
      rowHeights: [44],
    },
  });
  assert.equal(legacyTable.tableData.columnWidths, undefined);
  assert.equal(legacyTable.tableData.rowHeights, undefined);

  // Ragged rows: pads short rows, trims long rows
  var ragged = instance.deserializeElement({
    type: "table",
    tableData: {
      headers: ["A", "B", "C"],
      rows: [["1"], ["2", "3", "4", "5"], [], ["ok"]],
    },
  });
  assert.equal(ragged.tableData.headers.length, 3);
  assert.equal(ragged.tableData.rows.length, 4);
  assert.deepEqual(ragged.tableData.rows[0], ["1", "", ""]);
  assert.deepEqual(ragged.tableData.rows[1], ["2", "3", "4"]);
  assert.deepEqual(ragged.tableData.rows[2], ["", "", ""]);
  assert.deepEqual(ragged.tableData.rows[3], ["ok", "", ""]);

  // Non-string cells: converted to strings, rows trimmed to header count
  var mixed = instance.deserializeElement({
    type: "table",
    tableData: {
      headers: ["H"],
      rows: [[null, 42, undefined]],
    },
  });
  assert.equal(mixed.tableData.headers.length, 1);
  assert.deepEqual(mixed.tableData.rows[0], [""]);

  // More headers than row cells: pads with empty strings
  var moreHeaders = instance.deserializeElement({
    type: "table",
    tableData: {
      headers: ["A", "B", "C"],
      rows: [["x"]],
    },
  });
  assert.equal(moreHeaders.tableData.rows[0].length, 3);
  assert.deepEqual(moreHeaders.tableData.rows[0], ["x", "", ""]);

  // Empty headers: defaults to one
  var emptyHeaders = instance.deserializeElement({
    type: "table",
    tableData: { headers: [], rows: [["x", "y"]] },
  });
  assert.deepEqual(emptyHeaders.tableData.headers, ["Header 1"]);
  assert.deepEqual(emptyHeaders.tableData.rows[0], ["x"]);

  // Empty rows: defaults to one row
  var emptyRows = instance.deserializeElement({
    type: "table",
    tableData: { headers: ["A", "B"], rows: [] },
  });
  assert.equal(emptyRows.tableData.rows.length, 1);
  assert.deepEqual(emptyRows.tableData.rows[0], ["", ""]);

  console.log("  Table normalization tests passed.");
}

async function testTableMutations() {
  var { TableToolMixin } = await importSource("src/js/modules/tools/TableTool.js");
  var history = [];
  var element = {
    id: "t1",
    type: "table",
    x: 0, y: 0, width: 200, height: 100, opacity: 1,
    tableData: {
      headers: ["A", "B"],
      rows: [["1", "2"]],
    },
  };
  var instance = {
    ...TableToolMixin,
    updateSVGElement: function () {},
    saveStateToHistory: function (action) { history.push(action); },
  };

  // addTableRow appends a row
  instance.addTableRow(element);
  assert.equal(element.tableData.rows.length, 2);
  assert.deepEqual(element.tableData.rows[1], ["", ""]);
  assert.equal(element.tableData.rows[0][0], "1");

  // addTableRowAt inserts at position
  instance.addTableRowAt(element, 1);
  assert.equal(element.tableData.rows.length, 3);
  assert.deepEqual(element.tableData.rows[1], ["", ""]);

  // addTableColumn appends a column
  instance.addTableColumn(element);
  assert.equal(element.tableData.headers.length, 3);
  assert.equal(element.tableData.headers[2], "New Column");
  assert.equal(element.tableData.rows[0].length, 3);

  // addTableColumnAt inserts at position
  instance.addTableColumnAt(element, 1);
  assert.equal(element.tableData.headers.length, 4);
  assert.equal(element.tableData.headers[1], "New Column");

  // removeTableRow within bounds
  instance.removeTableRow(element, 0);
  assert.equal(element.tableData.rows.length, 2);

  // removeTableRow minimum constraint
  instance.removeTableRow(element, 0);
  instance.removeTableRow(element, 0); // should be no-op (only 1 row left)
  assert.equal(element.tableData.rows.length, 1);

  // removeTableColumn minimum constraint
  instance.removeTableColumn(element, 3);
  instance.removeTableColumn(element, 2);
  instance.removeTableColumn(element, 1);
  instance.removeTableColumn(element, 0); // should be no-op (only 1 col left)
  assert.equal(element.tableData.headers.length, 1);

  // handleTableAction dispatch
  element.tableData = { headers: ["X"], rows: [["a"]] };
  // Add row
  instance.handleTableAction(element, "add-row");
  assert.equal(element.tableData.rows.length, 2);
  // Add column
  instance.handleTableAction(element, "add-column");
  assert.equal(element.tableData.headers.length, 2);
  // Remove row (last) - should work
  instance.handleTableAction(element, "remove-row");
  assert.equal(element.tableData.rows.length, 1);
  // Remove row again - should not go below 1
  instance.handleTableAction(element, "remove-row");
  assert.equal(element.tableData.rows.length, 1);
  // Remove column - should work
  instance.handleTableAction(element, "remove-column");
  assert.equal(element.tableData.headers.length, 1);
  // Remove column again - should not go below 1
  instance.handleTableAction(element, "remove-column");
  assert.equal(element.tableData.headers.length, 1);

  console.log("  Table mutation tests passed.");
}

async function testTableCellEditing() {
  var { TableToolMixin } = await importSource("src/js/modules/tools/TableTool.js");
  var history = [];
  var renderCount = 0;
  var element = {
    id: "t1",
    type: "table",
    x: 0, y: 0, width: 200, height: 100, opacity: 1,
    tableData: {
      headers: ["H1"],
      rows: [["old"]],
    },
  };
  var instance = {
    ...TableToolMixin,
    updateSVGElement: function () { renderCount += 1; },
    saveStateToHistory: function (action) { history.push(action); },
  };

  // editTableCell creates input, blur saves on value change
  var cell = document.createElement("td");
  cell.className = "sww-table-cell";
  cell.setAttribute("data-row-index", "0");
  cell.setAttribute("data-col-index", "0");
  cell.textContent = "old";

  instance.editTableCell(element, 0, 0, cell);

  var input = cell.querySelector(".sww-table-cell-input");
  assert.ok(input, "Input should be created");
  assert.equal(input.value, "old");

  // Change value and blur to save
  input.value = "new";
  input.dispatchEvent(new Event("blur", { bubbles: true }));

  assert.equal(element.tableData.rows[0][0], "new");
  assert.equal(history[history.length - 1], "editTable");
  assert.ok(renderCount >= 1, "Should re-render on save");

  // Edit a header cell
  history.length = 0;
  var headerCell = document.createElement("th");
  headerCell.className = "sww-table-cell sww-table-header";
  headerCell.setAttribute("data-row", "header");
  headerCell.setAttribute("data-col-index", "0");
  headerCell.textContent = "H1";

  instance.editTableCell(element, "header", 0, headerCell);
  var headerInput = headerCell.querySelector(".sww-table-cell-input");
  headerInput.value = "Updated";
  headerInput.dispatchEvent(new Event("blur", { bubbles: true }));

  assert.equal(element.tableData.headers[0], "Updated");
  assert.equal(history[history.length - 1], "editTable");

  // No-op edit: same value does not create history entry
  history.length = 0;
  renderCount = 0;
  var noopCell = document.createElement("td");
  noopCell.className = "sww-table-cell";
  noopCell.setAttribute("data-row-index", "0");
  noopCell.setAttribute("data-col-index", "0");
  noopCell.textContent = "new";

  instance.editTableCell(element, 0, 0, noopCell);
  var noopInput = noopCell.querySelector(".sww-table-cell-input");
  noopInput.value = "new"; // same value
  noopInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

  assert.equal(history.length, 0, "No-op edit should not create history entry");
  assert.ok(renderCount >= 1, "Should still re-render even for no-op");

  console.log("  Cell editing tests passed.");
}

async function testGridLayerOrdering() {
  var { GridMixin } = await importSource("src/js/modules/grid/Grid.js");
  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  var backgroundRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  var elementsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  var selectionGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  backgroundRect.setAttribute("id", "bg");
  elementsGroup.setAttribute("id", "elements");
  selectionGroup.setAttribute("id", "selection");
  svg.appendChild(backgroundRect);
  svg.appendChild(elementsGroup);
  svg.appendChild(selectionGroup);

  var instance = {
    ...GridMixin,
    svg: svg,
    elementsGroup: elementsGroup,
    selectionGroup: selectionGroup,
    options: { gridSize: 20, showGrid: true },
    viewBox: { x: 0, y: 0, width: 1000, height: 1000 },
    generateId: function () { return "grid-test"; },
  };

  instance.createGrid();

  assert.equal(instance.gridDefs.nextSibling, instance.gridRect);
  assert.equal(instance.gridRect.nextSibling, elementsGroup);
  assert.equal(svg.lastChild, selectionGroup);

  console.log("  Grid layer ordering tests passed.");
}

Promise.all([
  testSceneState(),
  testSpatialIndex(),
  testDrawSelectionAndDrag(),
  testHistoryRoundTrip(),
  testUrlPolicy(),
  testEsmEntry(),
  testTableNormalization(),
  testTableMutations(),
  testTableCellEditing(),
  testGridLayerOrdering(),
])
  .then(() => {
    console.log("Core scene-state, history, Draw interaction, URL-policy, spatial-index, and ESM tests passed.");
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
