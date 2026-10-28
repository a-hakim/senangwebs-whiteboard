const assert = require("node:assert/strict");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const { JSDOM } = require("jsdom");

async function main() {
  const dom = new JSDOM("<!doctype html><body><div id='board'></div></body>");
  global.document = dom.window.document;
  try {
    const { PropertiesPanelMixin } = await import(pathToFileURL(path.join(__dirname, "../src/js/modules/ui/PropertiesPanel.js")).href);
    const { DEFAULT_TOOL_SETTINGS } = await import(pathToFileURL(path.join(__dirname, "../src/js/modules/utils/constants.js")).href);
    const updates = [];
    const history = [];
    const indexed = [];
    const board = {
      ...PropertiesPanelMixin,
      container: document.getElementById("board"),
      selectedElements: new Set(),
      toolSettings: JSON.parse(JSON.stringify(DEFAULT_TOOL_SETTINGS)),
      updateSVGElement: element => updates.push(element),
      updateElementInSpatialIndex: element => indexed.push(element),
      updateSelectionHandles() {},
      saveStateToHistory: action => history.push(action),
      updateControlPanelLayers() {},
    };
    board.createPropertiesPanel();
    const panel = board.propertiesPanel;
    const group = propertyName => panel.querySelector(`[data-property="${propertyName}"]`);
    const input = propertyName => group(propertyName).querySelector("input, select");
    const visibleProperties = () => [...panel.querySelectorAll("[data-property]")]
      .filter(node => node.style.display !== "none").map(node => node.dataset.property).sort();
    const common = ["width", "height", "rotation", "opacity"];
    const stroke = ["strokeColor", "strokeWidth"];
    const font = ["fontSize", "fontFamily", "textColor"];
    const fill = ["fillStyle", "fillColor"];
    const select = (type, extra = {}) => {
      const element = {
        ...JSON.parse(JSON.stringify(DEFAULT_TOOL_SETTINGS)),
        id: type,
        type,
        x: 10,
        y: 20,
        width: 120,
        height: 80,
        rotation: 0,
        fillColor: "#ffffff",
        fillStyle: "solid",
        ...extra,
      };
      board.selectedElements = new Set([element]);
      board.syncPropertiesPanel();
      return element;
    };
    const expectProperties = properties => assert.deepEqual(visibleProperties(), [...properties].sort());

    assert.equal(panel.classList.contains("visible"), false);
    expectProperties([]);
    for (const type of ["rectangle", "ellipse", "diamond", "parallelogram", "star"]) {
      select(type);
      expectProperties([...common, ...stroke, ...fill]);
    }
    for (const type of ["line", "arrow", "image", "website"]) {
      select(type, { fillStyle: "gradient" });
      expectProperties([...common, ...stroke]);
      assert.equal(group("gradientType").classList.contains("hidden"), true);
      assert.equal(input("width").min, type === "line" || type === "arrow" ? "0" : "1");
    }
    select("path");
    expectProperties(["opacity", "rotation", ...stroke]);
    select("text", { fontFamily: "Georgia", textAlign: "right" });
    expectProperties([...common, ...stroke, ...font, "textAlign"]);
    assert.equal(input("fontFamily").value, "Georgia");
    assert.equal(panel.querySelector('[data-align="right"]').classList.contains("active"), true);
    for (const type of ["markdown", "table"]) {
      select(type, { fontSize: 24, fontFamily: "Courier New", textColor: "#123456" });
      expectProperties([...common, ...stroke, ...fill, ...font]);
      assert.equal(input("fontSize").value, "24");
      assert.equal(input("fontFamily").value, "Courier New");
      assert.equal(input("textColor").value, "#123456");
    }

    const gradient = select("rectangle", {
      fillStyle: "gradient",
      gradientType: "radial",
      opacity: 0,
      gradientStops: [{ color: "#000000", offset: 10 }, { color: "#ffffff", offset: 90 }],
    });
    expectProperties([...common, ...stroke, "fillStyle", "gradientType"]);
    assert.equal(input("opacity").value, "0");
    assert.equal(panel.querySelector('.sww-gradient-stop input[type="number"]').value, "10");
    assert.equal(group("gradientType").classList.contains("visible"), true);
    select("ellipse", { fillStyle: "gradient", gradientType: undefined });
    assert.equal(input("gradientType").value, "linear");
    select("rectangle", { fillStyle: "transparent" });
    expectProperties([...common, ...stroke, "fillStyle"]);
    select("rectangle", { fillStyle: "hachure" });
    expectProperties([...common, ...stroke, ...fill]);
    group("fillColor").querySelector("label").textContent = "Localized fill label";
    select("image");
    assert.equal(group("fillColor").style.display, "none");
    select("rectangle");
    assert.equal(group("fillColor").style.display, "flex");

    const table = select("table");
    board.updateSelectedElementProperty("fontSize", 32);
    board.updateSelectedElementProperty("fontFamily", "Georgia");
    board.updateSelectedElementProperty("textColor", "#abcdef");
    assert.equal(table.fontSize, 32);
    assert.equal(table.fontFamily, "Georgia");
    assert.equal(table.textColor, "#abcdef");
    assert.equal(indexed.at(-1), table);
    const count = history.length;
    board.updateSelectedElementProperty("textAlign", "center");
    board.updateSelectedElementProperty("width", NaN);
    assert.equal(history.length, count);
    const originalFontSize = board.toolSettings.fontSize;
    input("fontSize").value = "";
    input("fontSize").dispatchEvent(new dom.window.Event("input"));
    assert.equal(board.toolSettings.fontSize, originalFontSize);
    assert.equal(table.fontSize, 32);

    const line = select("arrow", { width: -120, height: 0 });
    assert.equal(input("height").value, "0");
    board.updateSelectedElementProperty("width", 200);
    assert.equal(line.width, -200);
    board.updatePropertiesPanelRealTime();
    assert.equal(input("width").value, "200");
    assert.equal(input("height").value, "0");
    input("height").value = "0";
    input("height").dispatchEvent(new dom.window.Event("input"));
    assert.equal(line.height, 0);
    const freehand = select("path");
    board.updateSelectedElementProperty("width", 200);
    board.updateSelectedElementProperty("fillStyle", "gradient");
    assert.equal(freehand.width, 120);
    assert.equal(freehand.fillStyle, "solid");
    const locked = select("rectangle", { locked: true });
    board.updateSelectedElementProperty("opacity", 0.5);
    assert.equal(locked.opacity, 1);

    board.selectedElements = new Set([gradient, table]);
    board.syncPropertiesPanel();
    assert.equal(panel.classList.contains("visible"), false);
    expectProperties([]);
    select("rectangle", { groupId: "group" });
    assert.equal(panel.classList.contains("visible"), false);
    expectProperties([]);
    board.selectedElements.clear();
    board.syncPropertiesPanel();
    assert.equal(panel.classList.contains("visible"), false);
    expectProperties([]);
    assert.ok(updates.length > 0);
    console.log("Contextual properties pane, selection transitions, and property editing regressions passed.");
  } finally {
    dom.window.close();
    delete global.document;
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
