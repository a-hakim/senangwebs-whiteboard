const assert = require("node:assert/strict");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const { JSDOM } = require("jsdom");

// Exercise the real whiteboard and renderer together. Geometry is supplied only
// for overlay placement: jsdom does not perform browser layout or paint.
async function main() {
  const dom = new JSDOM('<!doctype html><body><div id="one"></div><div id="two"></div><button id="outside">Outside</button></body>', {
    pretendToBeVisual: true,
  });
  for (const name of ["window", "document", "HTMLElement", "Element", "HTMLInputElement", "CustomEvent", "DOMParser", "XMLSerializer", "AbortController"]) {
    global[name] = dom.window[name];
  }
  global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  global.__SWW_VERSION__ = require("../package.json").version;
  const { default: SWW } = await import(pathToFileURL(path.join(__dirname, "../src/js/sww.js")).href);
  const boards = [];
  const click = (node, detail = 1) => node.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, detail }));
  const key = (node, value, extra = {}) => {
    const event = new dom.window.KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true, ...extra });
    node.dispatchEvent(event);
    return event;
  };
  const item = (board, text) => [...board.tableMenu.querySelectorAll("button")].find(button => button.textContent === text);
  const menu = (board, kind) => click(board.tableToolbar.querySelector(`[data-table-menu="${kind}"]`));
  const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height });
  try {
    const board = SWW.init(document.getElementById("one"));
    boards.push(board);
    board.handleTableStart({ x: 400, y: 300 });
    const table = board.elements[0];
    table.tableData = { headers: ["First", "Second"], rows: [["A", "B"], ["C", "D"]] };
    board.updateSVGElement(table);
    board.saveStateToHistory("fixture");
    const cell = (row, col) => table.svgElement.querySelector(`[data-row-index="${row}"][data-col-index="${col}"]`);
    const header = col => table.svgElement.querySelector(`[data-row="header"][data-col-index="${col}"]`);

    assert.ok(board.tableToolbar && !board.tableToolbar.hidden);
    assert.equal(board.svg.contains(board.tableToolbar), false, "Tools must be outside exported SVG");
    menu(board, "row");
    assert.ok(item(board, "Add row"));
    assert.equal(item(board, "Delete row").disabled, true);
    key(document.activeElement, "Escape");
    assert.equal(document.activeElement.dataset.tableMenu, "row");

    click(cell(0, 1));
    assert.equal(document.activeElement, cell(0, 1));
    assert.equal(board.activeTableEditor, undefined);
    assert.equal(board.tableToolbar.querySelector(".sww-table-location").textContent, "Row 1 · Column 2");
    menu(board, "row");
    click(item(board, "Insert below"));
    assert.deepEqual(table.tableData.rows, [["A", "B"], ["", ""], ["C", "D"]]);
    assert.equal(document.activeElement, cell(1, 1));
    menu(board, "column");
    click(item(board, "Insert left"));
    assert.deepEqual(table.tableData.rows[0], ["A", "", "B"]);
    assert.equal(board.activeTableCell.colIndex, 1);
    menu(board, "column");
    click(item(board, "Delete column"));
    assert.deepEqual(table.tableData.rows[0], ["A", "B"]);
    assert.equal(document.activeElement, cell(1, 1));

    key(document.activeElement, "Enter");
    let input = board.activeTableEditor.input;
    input.value = "Committed";
    key(input, "Tab");
    assert.equal(table.tableData.rows[1][1], "Committed");
    assert.equal(document.activeElement, cell(2, 0));
    key(document.activeElement, "ArrowUp");
    assert.equal(document.activeElement, cell(1, 0));
    key(document.activeElement, "Enter");
    input = board.activeTableEditor.input;
    input.value = "Discarded";
    key(input, "Escape");
    assert.equal(table.tableData.rows[1][0], "");
    assert.equal(document.activeElement, cell(1, 0));
    const count = board.elements.length;
    key(document.activeElement, "Delete");
    assert.equal(board.elements.length, count, "Cell Delete must not delete the table");

    click(cell(0, 0), 2);
    input = board.activeTableEditor.input;
    input.value = "Pending";
    input.setSelectionRange(2, 4);
    const scroll = table.svgElement.querySelector(".sww-table-scroll");
    scroll.scrollLeft = 42;
    scroll.scrollTop = 24;
    board.updateSVGElement(table);
    assert.equal(document.activeElement, input, "Rerender must preserve the live editor");
    assert.equal(input.value, "Pending");
    assert.equal(input.selectionStart, 2);
    assert.equal(table.svgElement.querySelector(".sww-table-scroll").scrollLeft, 42);
    assert.equal(table.svgElement.querySelector(".sww-table-scroll").scrollTop, 24);
    menu(board, "row");
    click(item(board, "Insert above"));
    assert.equal(table.tableData.rows[1][0], "Pending", "Commit before changing row indexes");

    click(header(0));
    menu(board, "row");
    assert.ok(item(board, "Insert first row"));
    assert.equal(item(board, "Delete row").disabled, true);
    key(document.activeElement, "End");
    assert.equal(document.activeElement.textContent, "Insert first row", "Skip disabled menu entries");
    key(document.activeElement, "Escape");
    const trigger = document.activeElement;
    assert.equal(trigger.getAttribute("aria-expanded"), "false");
    click(trigger);
    document.getElementById("outside").dispatchEvent(new dom.window.Event("pointerdown", { bubbles: true }));
    assert.equal(board.tableMenu, null);

    click(cell(0, 0));
    menu(board, "row");
    const pointer = new dom.window.MouseEvent("pointerdown", { button: 0, bubbles: true, cancelable: true });
    cell(0, 0).dispatchEvent(pointer);
    assert.equal(board.tableMenu, null, "Clicking a cell must dismiss the menu despite stopping canvas events");
    assert.equal(pointer.defaultPrevented, true, "Delay native focus until the click survives the editor's rerender");
    click(cell(0, 0), 2);
    board.activeTableEditor.input.value = "Switch cell";
    click(cell(0, 1));
    assert.equal(table.tableData.rows[0][0], "Switch cell");
    assert.equal(document.activeElement, cell(0, 1));

    click(header(0));
    assert.equal(key(document.activeElement, "Tab", { shiftKey: true }).defaultPrevented, false);
    click(cell(table.tableData.rows.length - 1, 1));
    assert.equal(key(document.activeElement, "Tab").defaultPrevented, false, "Final Tab must leave the grid");
    const rowCount = table.tableData.rows.length;
    assert.equal(rowCount, 4);
    const exported = board.createExportSVG().clonedSVG;
    assert.equal(exported.querySelector(".sww-table-cell-selected, .sww-table-toolbar, input"), null);
    assert.equal(JSON.stringify(board.createSceneSnapshot()).includes("activeTableCell"), false);

    // Placement uses screen coordinates and clamps menus at viewport edges.
    board.container.getBoundingClientRect = () => rect(0, 0, 800, 600);
    board.svg.getBoundingClientRect = () => rect(0, 0, 800, 600);
    table.svgElement.getBoundingClientRect = () => rect(600, 200, 200, 200);
    Object.defineProperty(board.tableToolbar, "offsetWidth", { configurable: true, value: 300 });
    Object.defineProperty(board.tableToolbar, "offsetHeight", { configurable: true, value: 50 });
    board.positionTableToolbar();
    assert.equal(board.tableToolbar.style.left, "492px");
    assert.equal(board.tableToolbar.style.top, "110px");
    table.svgElement.getBoundingClientRect = () => rect(200, 10, 200, 200);
    board.positionTableToolbar();
    assert.equal(board.tableToolbar.style.top, "226px", "Flip below the table near the top edge");

    board.undo(); // Cell edit
    board.undo(); // Row insertion
    assert.equal(board.activeTableCell, null);
    assert.equal(board.elements[0].tableData.rows.length, rowCount - 1);
    board.redo();
    const restored = board.elements[0];
    assert.equal(restored.tableData.rows.length, rowCount);
    board.selectTableCell(restored, 0, 0);
    while (restored.tableData.rows.length > 1) board.performContextualTableAction("delete-row");
    while (restored.tableData.headers.length > 1) board.performContextualTableAction("delete-column");
    menu(board, "row");
    assert.equal(item(board, "Delete row").disabled, true);
    menu(board, "column");
    assert.equal(item(board, "Delete column").disabled, true);
    board.closeTableMenu(false);
    board.setTool("draw");
    assert.equal(board.tableToolbar.hidden, true);
    board.setTool("select");
    restored.locked = true;
    board.syncTableTools();
    assert.equal(board.tableToolbar.hidden, true);
    restored.locked = false;

    const other = SWW.init(document.getElementById("two"));
    boards.push(other);
    other.handleTableStart({ x: 400, y: 300 });
    other.selectTableCell(other.elements[0], "header", 0);
    board.selectTableCell(restored, 0, 0);
    board.clearSelection();
    assert.equal(board.activeTableCell, null);
    assert.equal(other.tableToolbar.hidden, false);
    assert.equal(other.activeTableCell.element, other.elements[0]);
    board.selectElement(restored);
    board.isPreviewMode = true;
    board.container.dispatchEvent(new dom.window.CustomEvent("previewModeEntered"));
    assert.equal(board.tableToolbar.hidden, true);
    board.isPreviewMode = false;
    board.syncTableTools();
    board.removeElement(restored);
    assert.equal(board.tableToolbar.hidden, true);
    const overlay = other.tableToolbar;
    other.destroy();
    assert.equal(overlay.isConnected, false);
    assert.equal(other.activeTableCell, null);
    console.log("Table tools DOM integration checks passed (layout/paint requires a browser).");
  } finally {
    boards.forEach(board => board.destroy());
    dom.window.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
