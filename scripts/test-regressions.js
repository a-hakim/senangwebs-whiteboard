const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const { JSDOM } = require('jsdom');

async function main() {
    const load = relativePath => import(pathToFileURL(path.resolve(__dirname, '..', relativePath)).href);
    const { ViewportMixin } = await load('src/js/modules/viewport/Viewport.js');
    const viewport = {
        ...ViewportMixin,
        zoom: 4.9,
        viewBox: { x: 100, y: 200, width: 1000, height: 800 },
        elements: [],
        getPointerPosition: () => ({ x: 350, y: 400 }),
        updateViewBox() {},
    };
    const wheel = { ctrlKey: true, deltaY: -1, preventDefault() {} };
    viewport.handleWheel(wheel);
    assert.equal(viewport.zoom, 5);
    assert.ok(Math.abs(viewport.viewBox.width - 980) < 1e-9);
    assert.ok(Math.abs((350 - viewport.viewBox.x) / viewport.viewBox.width - 0.25) < 1e-9);
    const atLimit = { ...viewport.viewBox };
    viewport.handleWheel(wheel);
    viewport.zoomIn();
    assert.deepEqual(viewport.viewBox, atLimit);
    viewport.setZoom(0.1);
    const atMinimum = { ...viewport.viewBox };
    viewport.zoomOut();
    viewport.handleWheel({ ...wheel, deltaY: 1 });
    viewport.handleWheel({ ...wheel, deltaY: 0 });
    viewport.setZoom(NaN);
    viewport.setZoom(Infinity);
    assert.deepEqual(viewport.viewBox, atMinimum);

    const { SWWInstance } = await load('src/js/modules/core/SWWInstance.js');
    const first = new SWWInstance({});
    const second = new SWWInstance({});
    first.toolSettings.gradientStops[0].color = '#123456';
    assert.equal(second.toolSettings.gradientStops[0].color, '#000000');

    const { SceneStateMixin } = await load('src/js/modules/core/SceneState.js');
    const { ClipboardMixin } = await load('src/js/modules/clipboard/Clipboard.js');
    const clipboard = {
        ...SceneStateMixin,
        ...ClipboardMixin,
        generateId: () => 'generated',
    };
    const source = [{ type: 'table', tableData: { headers: ['A'], rows: [['B']] } }];
    clipboard.setClipboardContent(source);
    assert.equal(clipboard.clipboard[0].x, 0);
    const copy = clipboard.getClipboardContent();
    copy[0].tableData.rows[0][0] = 'changed';
    source[0].tableData.headers[0] = 'changed';
    assert.equal(clipboard.clipboard[0].tableData.rows[0][0], 'B');
    assert.equal(clipboard.clipboard[0].tableData.headers[0], 'A');
    assert.throws(() => clipboard.setClipboardContent([{ type: 'unsupported' }]), TypeError);
    assert.equal(clipboard.clipboard[0].type, 'table');
    assert.equal('resizeStartPoints' in clipboard.serializeElement({
        type: 'path', resizeStartPoints: [{ x: 1, y: 2 }],
    }), false);

    const dom = new JSDOM('<!doctype html><body></body>');
    global.document = dom.window.document;
    const { GridMixin } = await load('src/js/modules/grid/Grid.js');
    const scene = {
        ...SceneStateMixin,
        options: { backgroundColor: '#fff', gridSize: 20, showGrid: true },
        snapToGrid: true,
        elements: [],
        elementsById: new Map(),
        spatialIndex: { clear() {} },
        visibleElements: new Set(),
        elementsGroup: document.createElement('div'),
        clearSelection() {},
        updateViewBox() {},
        createGrid() {},
        updateGridVisibility() {},
        updateGridButtonState() { this.gridButtonUpdated = true; },
        updateSelectionHandles() {},
        syncPropertiesPanel() {},
        updateVisibleElements() {},
        updateControlPanelLayers() {},
    };
    scene.applySceneSnapshot({ elements: [], showGrid: false }, { preserveHistory: true });
    assert.equal(scene.options.showGrid, false);
    assert.equal(scene.snapToGrid, false);
    assert.equal(scene.gridButtonUpdated, true);
    scene.showGrid = () => {};
    scene.hideGrid = () => {};
    GridMixin.toggleGrid.call(scene);
    assert.equal(scene.options.showGrid, true);
    assert.equal(scene.snapToGrid, true);
    assert.equal(scene.validateScene({
        elements: [], backgroundColor: 'url(https://example.test/beacon)',
    }).backgroundColor, '#fff');

    const { ThemeManagerMixin } = await load('src/js/modules/ui/ThemeManager.js');
    const { THEME_COLORS } = await load('src/js/modules/utils/constants.js');
    const theme = {
        ...ThemeManagerMixin,
        options: { ...THEME_COLORS.dark, panelMode: 'dark', accentColor: '#123456' },
        applyThemeColors() {},
    };
    theme.setPanelMode('light');
    assert.equal(theme.options.accentColor, '#123456');
    assert.equal(theme.options.panelBackgroundColor, '#ffffff');
    theme.setPanelMode('dark');
    assert.equal(theme.options.accentColor, '#123456');
    assert.equal(theme.options.panelBackgroundColor, '#18181b');

    const { EventHandlersMixin } = await load('src/js/modules/core/eventHandlers.js');
    const calls = [];
    const keyboard = {
        ...EventHandlersMixin,
        selectAll: () => calls.push('selectAll'),
        undo: () => calls.push('undo'),
        redo: () => calls.push('redo'),
        copySelected: () => calls.push('copy'),
        pasteClipboard: () => calls.push('paste'),
    };
    const command = { metaKey: true, preventDefault() {} };
    keyboard.handleKeyDown({ ...command, key: 'A' });
    keyboard.handleKeyDown({ ...command, key: 'z' });
    keyboard.handleKeyDown({ ...command, key: 'z', shiftKey: true });
    keyboard.handleKeyDown({ ...command, key: 'C' });
    keyboard.handleKeyDown({ ...command, key: 'v' });
    assert.deepEqual(calls, ['selectAll', 'undo', 'redo', 'copy', 'paste']);
    const editor = document.createElement('div');
    editor.setAttribute('contenteditable', 'plaintext-only');
    editor.tabIndex = 0;
    document.body.appendChild(editor);
    editor.focus();
    keyboard.handleKeyDown({ ...command, key: 'A' });
    assert.equal(calls.length, 5);

    const { ElementManagementMixin } = await load('src/js/modules/core/elementManagement.js');
    const { UtilitiesMixin } = await load('src/js/modules/utilities/Utilities.js');
    const element = { id: 'text', svgElement: document.createElement('div'), boundaryRect: document.createElement('div') };
    document.body.append(element.boundaryRect, element.svgElement);
    const elements = {
        ...ElementManagementMixin,
        cleanupElement: UtilitiesMixin.cleanupElement,
        elements: [element],
        elementsById: new Map([[element.id, element]]),
        visibleElements: new Set([element]),
        spatialIndex: { remove() {} },
        updateControlPanelLayers() {},
    };
    elements.removeElement(element);
    assert.equal(element.boundaryRect.isConnected, false);
    assert.equal(element.svgElement, null);
    assert.equal(elements.visibleElements.size, 0);
    assert.equal(elements.elementsById.size, 0);

    const { PerformanceUtils } = await load('src/js/modules/utils/PerformanceUtils.js');
    let invoked = false;
    const debounced = PerformanceUtils.debounce(() => { invoked = true; }, 0);
    debounced();
    debounced.cancel();
    await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(invoked, false);
    dom.window.close();
    delete global.document;
    console.log('Viewport, scene, clipboard, theme, keyboard, cleanup, and debounce regressions passed.');
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
