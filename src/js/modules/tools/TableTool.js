/**
 * TableTool.js - Table element tool
 *
 * Provides tools for creating editable tables using SVG foreignObject.
 * Handles table creation, inline cell editing, and row/column mutations.
 *
 * Responsibilities:
 * - Table element creation with default structure
 * - Cell selection, keyboard navigation, and inline editing
 * - Contextual row/column menus in a floating HTML toolbar
 * - Legacy append/remove-last action handling
 *
 * Dependencies:
 * - createElement() - Element creation
 * - snapToGridPoint() - Grid snapping
 * - addSVGElementToDOM() - SVG element attachment
 * - updateSVGElement() - SVG rendering (delegates to SVGRenderer)
 * - saveStateToHistory() - Undo/redo support
 * - selectElement() / clearSelection() - Selection management
 * - setTool() - Tool switching
 *
 * @module TableToolMixin
 */

export const TableToolMixin = {
  canInteractWithTable(element) {
    return !this.isDestroyed && !this.isPreviewMode && !this.options?.readOnly &&
      this.currentTool === "select" && !element.locked && element.visible !== false;
  },

  setupTableTools() {
    this.tableToolsController?.abort();
    this.tableToolsResizeObserver?.disconnect();
    this.tableToolsController = new AbortController();
    const options = { signal: this.tableToolsController.signal };
    for (const event of ["sww:selectionChanged", "sww:toolChanged", "sww:sceneChanged", "previewModeEntered", "previewModeExited"]) {
      this.container.addEventListener(event, () => this.syncTableTools(), options);
    }
    document.addEventListener("pointerdown", (event) => {
      if (!this.tableToolbar?.contains(event.target)) this.closeTableMenu(false);
    }, { ...options, capture: true });
    window.addEventListener("scroll", () => this.scheduleTableToolbarPosition(), { ...options, capture: true });
    window.addEventListener("resize", () => this.scheduleTableToolbarPosition(), options);
    if (window.ResizeObserver) {
      this.tableToolsResizeObserver = new ResizeObserver(() => this.scheduleTableToolbarPosition());
      this.tableToolsResizeObserver.observe(this.container);
      this.tableToolsResizeObserver.observe(this.svg);
    }
  },

  destroyTableTools() {
    this.closeActiveTableEditor(false);
    this.tableToolsController?.abort();
    this.tableToolsResizeObserver?.disconnect();
    cancelAnimationFrame(this.tableToolbarFrame);
    this.tableToolbar?.remove();
    this.tableToolbar = null;
    this.activeTableCell = null;
  },

  getSelectedTable() {
    if (this.selectedElements?.size !== 1) return null;
    const element = this.selectedElements.values().next().value;
    return element.type === "table" && this.canInteractWithTable(element) &&
      this.elements.includes(element) ? element : null;
  },

  syncTableTools() {
    const element = this.getSelectedTable();
    if (this.activeTableCell && this.activeTableCell.element !== element) {
      const previous = this.activeTableCell.element;
      this.activeTableCell = null;
      this.closeActiveTableEditor(true);
      this.refreshTableCellSelection(previous);
    }
    if (!element) {
      this.closeTableMenu(false);
      if (this.tableToolbar) this.tableToolbar.hidden = true;
      this.tableToolbarContext = null;
      return;
    }
    if (this.activeTableCell) {
      const cell = this.activeTableCell;
      cell.colIndex = Math.min(cell.colIndex, element.tableData.headers.length - 1);
      if (cell.rowIndex !== "header") cell.rowIndex = Math.min(cell.rowIndex, element.tableData.rows.length - 1);
    }
    this.refreshTableCellSelection(element);
    this.ensureTableToolbar();
    this.tableToolbar.hidden = false;
    const cell = this.activeTableCell;
    const context = [element.id, cell?.rowIndex, cell?.colIndex, element.tableData.rows.length, element.tableData.headers.length].join(":");
    if (context !== this.tableToolbarContext) {
      this.closeTableMenu(false);
      this.tableToolbarContext = context;
      this.tableToolbar.querySelector(".sww-table-location").textContent = cell
        ? `${cell.rowIndex === "header" ? "Header" : `Row ${cell.rowIndex + 1}`} · Column ${cell.colIndex + 1}`
        : `${element.tableData.rows.length} rows · ${element.tableData.headers.length} columns`;
    }
    this.scheduleTableToolbarPosition();
  },

  ensureTableToolbar() {
    if (this.tableToolbar) return;
    const toolbar = document.createElement("div");
    toolbar.className = "sww-table-toolbar";
    toolbar.setAttribute("role", "group");
    toolbar.setAttribute("aria-label", "Table tools");
    const location = document.createElement("span");
    location.className = "sww-table-location";
    location.setAttribute("aria-live", "polite");
    toolbar.appendChild(location);
    for (const [kind, label] of [["row", "Row"], ["column", "Column"]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sww-table-toolbar-btn";
      button.textContent = label;
      const icon = document.createElement("i");
      icon.className = "ss ss-arrow-down";
      icon.setAttribute("aria-hidden", "true");
      button.appendChild(icon);
      button.setAttribute("aria-haspopup", "menu");
      button.setAttribute("aria-expanded", "false");
      button.dataset.tableMenu = kind;
      button.addEventListener("click", () => {
        if (this.tableMenuTrigger === button) this.closeTableMenu(true);
        else this.openTableMenu(kind, button);
      });
      button.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          this.openTableMenu(kind, button, event.key === "ArrowUp");
        }
      });
      toolbar.appendChild(button);
    }
    toolbar.addEventListener("pointerdown", (event) => event.stopPropagation());
    toolbar.addEventListener("keydown", (event) => {
      event.stopPropagation();
      if (event.key === "Escape") {
        event.preventDefault();
        if (this.tableMenu) this.closeTableMenu(true);
        else this.focusActiveTableCell();
      }
    });
    this.container.appendChild(toolbar);
    this.tableToolbar = toolbar;
  },

  openTableMenu(kind, trigger, last = false) {
    this.closeActiveTableEditor(true);
    this.closeTableMenu(false);
    const element = this.getSelectedTable();
    if (!element) return;
    const cell = this.activeTableCell;
    const row = kind === "row";
    let actions;
    if (!cell) actions = [[`Add ${kind}`, `append-${kind}`]];
    else if (row && cell.rowIndex === "header") actions = [["Insert first row", "first-row"]];
    else actions = row
      ? [["Insert above", "above-row"], ["Insert below", "below-row"]]
      : [["Insert left", "left-column"], ["Insert right", "right-column"]];
    const canDelete = !!cell && (row
      ? cell.rowIndex !== "header" && element.tableData.rows.length > 1
      : element.tableData.headers.length > 1);
    actions.push([`Delete ${kind}`, `delete-${kind}`, !canDelete]);
    const menu = document.createElement("div");
    menu.className = "sww-table-menu";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", `${row ? "Row" : "Column"} actions`);
    for (const [label, action, disabled] of actions) {
      const item = document.createElement("button");
      item.type = "button";
      item.setAttribute("role", "menuitem");
      item.tabIndex = -1;
      item.textContent = label;
      item.disabled = !!disabled;
      item.className = action.startsWith("delete") ? "sww-table-menu-delete" : "";
      item.addEventListener("click", () => this.performContextualTableAction(action));
      menu.appendChild(item);
    }
    menu.addEventListener("keydown", (event) => {
      const items = Array.from(menu.querySelectorAll("button:not(:disabled)"));
      const index = items.indexOf(document.activeElement);
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
          : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        items[next]?.focus();
      } else if (event.key === "Tab") {
        this.closeTableMenu(true);
      }
    });
    this.tableToolbar.appendChild(menu);
    this.tableMenu = menu;
    this.tableMenuTrigger = trigger;
    trigger.setAttribute("aria-expanded", "true");
    this.positionTableToolbar();
    const items = menu.querySelectorAll("button:not(:disabled)");
    items[last ? items.length - 1 : 0]?.focus();
  },

  closeTableMenu(restoreFocus) {
    const trigger = this.tableMenuTrigger;
    this.tableMenu?.remove();
    this.tableMenu = null;
    this.tableMenuTrigger = null;
    trigger?.setAttribute("aria-expanded", "false");
    if (restoreFocus) trigger?.focus({ preventScroll: true });
  },

  scheduleTableToolbarPosition() {
    if (this.tableToolbarFrame || this.isDestroyed) return;
    this.tableToolbarFrame = requestAnimationFrame(() => {
      this.tableToolbarFrame = null;
      this.positionTableToolbar();
    });
  },

  positionTableToolbar() {
    const toolbar = this.tableToolbar;
    const element = this.getSelectedTable();
    if (!toolbar || toolbar.hidden || !element) return;
    const bounds = element.svgElement.getBoundingClientRect();
    const canvas = this.svg.getBoundingClientRect();
    const host = this.container.getBoundingClientRect();
    const leftEdge = Math.max(canvas.left, 0) + 8;
    const rightEdge = Math.min(canvas.right, window.innerWidth) - 8;
    const topEdge = Math.max(canvas.top, 0) + 8;
    const bottomEdge = Math.min(canvas.bottom, window.innerHeight) - 8;
    toolbar.style.visibility = bounds.right < leftEdge || bounds.left > rightEdge ||
      bounds.bottom < topEdge || bounds.top > bottomEdge ? "hidden" : "visible";
    toolbar.style.maxWidth = `${Math.max(0, rightEdge - leftEdge)}px`;
    const width = toolbar.offsetWidth;
    const height = toolbar.offsetHeight;
    const left = Math.max(leftEdge, Math.min(bounds.left, rightEdge - width));
    const top = Math.max(topEdge, Math.min(
      bounds.top - height - 40 >= topEdge ? bounds.top - height - 40 : bounds.bottom + 16,
      bottomEdge - height));
    toolbar.style.left = `${left - host.left - this.container.clientLeft + this.container.scrollLeft}px`;
    toolbar.style.top = `${top - host.top - this.container.clientTop + this.container.scrollTop}px`;
    if (this.tableMenu) {
      const menu = this.tableMenu;
      menu.style.maxHeight = `${Math.max(36, bottomEdge - topEdge)}px`;
      const menuHeight = menu.offsetHeight;
      const menuTop = top + height + 4 + menuHeight <= bottomEdge ? top + height + 4 : top - menuHeight - 4;
      menu.style.top = `${Math.max(topEdge, Math.min(menuTop, bottomEdge - menuHeight)) - top}px`;
    }
  },

  refreshTableCellSelection(element) {
    const active = this.activeTableCell;
    element?.svgElement?.querySelectorAll(".sww-table-cell").forEach((cell, index) => {
      const selected = active?.element === element && cell.dataset.colIndex === String(active.colIndex) &&
        (cell.dataset.row === "header" ? active.rowIndex === "header" : cell.dataset.rowIndex === String(active.rowIndex));
      cell.classList.toggle("sww-table-cell-selected", !!selected);
      cell.tabIndex = this.canInteractWithTable(element) && (selected || (!active && index === 0)) ? 0 : -1;
    });
  },

  selectTableCell(element, rowIndex, colIndex, focus = true) {
    if (!this.canInteractWithTable(element)) return;
    this.closeActiveTableEditor(true);
    if (!this.selectedElements.has(element) || this.selectedElements.size !== 1) this.selectElement(element);
    if (this.getSelectedTable() !== element) return;
    this.activeTableCell = { element, rowIndex, colIndex };
    this.syncTableTools();
    if (focus) this.focusActiveTableCell();
  },

  getActiveTableCellElement() {
    const cell = this.activeTableCell;
    if (!cell) return null;
    const row = cell.rowIndex === "header" ? '[data-row="header"]' : `[data-row-index="${cell.rowIndex}"]`;
    return cell.element.svgElement?.querySelector(`${row}[data-col-index="${cell.colIndex}"]`);
  },

  focusActiveTableCell() {
    const cell = this.getActiveTableCellElement();
    if (cell) {
      cell.focus({ preventScroll: true });
      const wrapper = cell.closest(".sww-table-scroll");
      const bounds = cell.getBoundingClientRect();
      const viewport = wrapper.getBoundingClientRect();
      const scale = viewport.width / wrapper.offsetWidth || 1;
      if (bounds.left < viewport.left) wrapper.scrollLeft -= (viewport.left - bounds.left) / scale;
      else if (bounds.right > viewport.right) wrapper.scrollLeft += (bounds.right - viewport.right) / scale;
      if (bounds.top < viewport.top) wrapper.scrollTop -= (viewport.top - bounds.top) / scale;
      else if (bounds.bottom > viewport.bottom) wrapper.scrollTop += (bounds.bottom - viewport.bottom) / scale;
    } else this.svg?.focus({ preventScroll: true });
  },

  moveTableCell(key, backwards = false) {
    const cell = this.activeTableCell;
    if (!cell) return false;
    const { element, colIndex } = cell;
    const columns = element.tableData.headers.length;
    let row = cell.rowIndex === "header" ? 0 : cell.rowIndex + 1;
    let col = colIndex;
    if (key === "Tab") {
      const next = row * columns + col + (backwards ? -1 : 1);
      if (next < 0 || next >= (element.tableData.rows.length + 1) * columns) return false;
      row = Math.floor(next / columns);
      col = next % columns;
    } else {
      row = Math.max(0, Math.min(element.tableData.rows.length, row + (key === "ArrowDown" ? 1 : key === "ArrowUp" ? -1 : 0)));
      col = Math.max(0, Math.min(columns - 1, col + (key === "ArrowRight" ? 1 : key === "ArrowLeft" ? -1 : 0)));
    }
    this.selectTableCell(element, row === 0 ? "header" : row - 1, col);
    return true;
  },

  bindTableCell(element, rowIndex, colIndex, cell) {
    cell.addEventListener("pointerdown", (event) => {
      if (!this.canInteractWithTable(element)) return;
      event.stopPropagation();
      // Focus on click, after committing the editor. Native pointer focus would
      // blur the input and rebuild this target before its click can be delivered.
      if (event.button === 0) event.preventDefault();
    });
    cell.addEventListener("click", (event) => {
      if (!this.canInteractWithTable(element)) return;
      event.stopPropagation();
      this.selectTableCell(element, rowIndex, colIndex);
      if (event.detail >= 2 && this.getSelectedTable() === element) {
        this.editTableCell(element, rowIndex, colIndex, this.getActiveTableCellElement());
      }
    });
    cell.addEventListener("focus", () => {
      if (this.activeTableCell?.element !== element || this.activeTableCell.rowIndex !== rowIndex || this.activeTableCell.colIndex !== colIndex) {
        this.selectTableCell(element, rowIndex, colIndex, false);
      }
    });
    cell.addEventListener("keydown", (event) => {
      if (!this.canInteractWithTable(element)) return;
      // Keep board shortcuts available except destructive commands while a cell has focus.
      if (["Enter", "Escape", "Tab", "Delete", "Backspace", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.stopPropagation();
        if (event.key !== "Tab" || this.moveTableCell("Tab", event.shiftKey)) event.preventDefault();
        if (event.key.startsWith("Arrow")) this.moveTableCell(event.key);
        if (event.key === "Enter") this.editTableCell(element, rowIndex, colIndex, cell);
        if (event.key === "Escape") { this.clearSelection(); this.svg.focus(); }
      }
    });
  },

  performContextualTableAction(action) {
    const element = this.getSelectedTable();
    if (!element) return;
    this.closeActiveTableEditor(true);
    this.closeTableMenu(false);
    const cell = this.activeTableCell;
    let row = cell?.rowIndex ?? "header";
    let col = cell?.colIndex ?? 0;
    switch (action) {
      case "append-row": row = element.tableData.rows.length; this.addTableRow(element); break;
      case "append-column": col = element.tableData.headers.length; this.addTableColumn(element); break;
      case "first-row": row = 0; this.addTableRowAt(element, row); break;
      case "above-row": if (!cell || row === "header") return; this.addTableRowAt(element, row); break;
      case "below-row": if (!cell || row === "header") return; row++; this.addTableRowAt(element, row); break;
      case "left-column": if (!cell) return; this.addTableColumnAt(element, col); break;
      case "right-column": if (!cell) return; col++; this.addTableColumnAt(element, col); break;
      case "delete-row":
        if (!cell || row === "header" || element.tableData.rows.length <= 1) return;
        this.removeTableRow(element, row); row = Math.min(row, element.tableData.rows.length - 1); break;
      case "delete-column":
        if (!cell || element.tableData.headers.length <= 1) return;
        this.removeTableColumn(element, col); col = Math.min(col, element.tableData.headers.length - 1); break;
      default: return;
    }
    this.selectTableCell(element, row, col);
  },

  handleTableStart(point) {
    var elementPoint = {
      x: point.x - 200,
      y: point.y - 100,
    };
    var snappedPoint = this.snapToGridPoint(elementPoint);
    var element = this.createElement("table", snappedPoint);

    this.addSVGElementToDOM(element);
    this.addElement(element);
    this.updateSVGElement(element);

    this.saveStateToHistory("createElement");

    this.clearSelection();
    this.selectElement(element);

    this.setTool("select");
  },

  handleTableAction(element, action) {
    var tableData = element.tableData;
    if (!tableData) return;

    switch (action) {
      case "add-row":
        this.addTableRow(element);
        break;
      case "remove-row":
        if (tableData.rows.length > 1) {
          this.removeTableRow(element, tableData.rows.length - 1);
        }
        break;
      case "add-column":
        this.addTableColumn(element);
        break;
      case "remove-column":
        if (tableData.headers.length > 1) {
          this.removeTableColumn(element, tableData.headers.length - 1);
        }
        break;
    }
  },

  closeActiveTableEditor(save) {
    if (this.activeTableEditor && typeof this.activeTableEditor.finish === "function") {
      this.activeTableEditor.finish(save !== false);
    }
  },

  editTableCell(element, rowIndex, colIndex, cellElement) {
    this.closeActiveTableEditor(true);
    if (this.isPreviewMode || element.locked || this.options?.readOnly || !cellElement) return;

    var originalValue = rowIndex === "header"
      ? element.tableData.headers[colIndex]
      : element.tableData.rows[rowIndex][colIndex];

    var input = document.createElement("input");
    input.type = "text";
    input.value = originalValue;
    input.className = "sww-table-cell-input";
    input.setAttribute("aria-label", `${rowIndex === "header" ? "Header" : `Row ${rowIndex + 1}`}, column ${colIndex + 1}`);
    input.addEventListener("pointerdown", function (e) {
      e.stopPropagation();
    });
    input.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    cellElement.textContent = "";
    cellElement.appendChild(input);
    input.focus();
    input.select();

    var isFinished = false;
    var finishEdit = function (save) {
      if (isFinished) return;
      isFinished = true;

      if (this.activeTableEditor && this.activeTableEditor.input === input) {
        this.activeTableEditor = null;
      }

      if (save) {
        var newValue = input.value;
        var oldValue = rowIndex === "header"
          ? element.tableData.headers[colIndex]
          : element.tableData.rows[rowIndex][colIndex];

        if (newValue !== oldValue) {
          if (rowIndex === "header") {
            element.tableData.headers[colIndex] = newValue;
          } else {
            element.tableData.rows[rowIndex][colIndex] = newValue;
          }
          this.saveStateToHistory("editTable");
        }
      }

      this.updateSVGElement(element);
    }.bind(this);

    this.activeTableEditor = {
      element: element,
      rowIndex: rowIndex,
      colIndex: colIndex,
      input: input,
      finish: finishEdit,
    };

    input.addEventListener("blur", () => {
      if (!this.activeTableEditor?.suspended) finishEdit(true);
    });
    input.addEventListener("keydown", function (e) {
      e.stopPropagation();
      if (e.key === "Enter") {
        e.preventDefault();
        finishEdit(true);
        this.focusActiveTableCell();
      } else if (e.key === "Escape") {
        e.preventDefault();
        finishEdit(false);
        this.focusActiveTableCell();
      } else if (e.key === "Tab") {
        finishEdit(true);
        this.focusActiveTableCell();
        if (this.moveTableCell("Tab", e.shiftKey)) e.preventDefault();
      }
    }.bind(this));
  },

  addTableRow(element) {
    this.closeActiveTableEditor(true);
    var numColumns = element.tableData.headers.length;
    var newRow = new Array(numColumns).fill("");
    element.tableData.rows.push(newRow);
    this.updateSVGElement(element);
    this.saveStateToHistory("addTableRow");
  },

  addTableRowAt(element, position) {
    this.closeActiveTableEditor(true);
    var numColumns = element.tableData.headers.length;
    var newRow = new Array(numColumns).fill("");
    element.tableData.rows.splice(position, 0, newRow);
    this.updateSVGElement(element);
    this.saveStateToHistory("addTableRow");
  },

  addTableColumn(element) {
    this.closeActiveTableEditor(true);
    element.tableData.headers.push("New Column");
    element.tableData.rows.forEach(function (row) { row.push(""); });
    this.updateSVGElement(element);
    this.saveStateToHistory("addTableColumn");
  },

  addTableColumnAt(element, position) {
    this.closeActiveTableEditor(true);
    element.tableData.headers.splice(position, 0, "New Column");
    element.tableData.rows.forEach(function (row) { row.splice(position, 0, ""); });
    this.updateSVGElement(element);
    this.saveStateToHistory("addTableColumn");
  },

  removeTableRow(element, rowIndex) {
    this.closeActiveTableEditor(true);
    if (element.tableData.rows.length <= 1) return;
    element.tableData.rows.splice(rowIndex, 1);
    this.updateSVGElement(element);
    this.saveStateToHistory("removeTableRow");
  },

  removeTableColumn(element, colIndex) {
    this.closeActiveTableEditor(true);
    if (element.tableData.headers.length <= 1) return;
    element.tableData.headers.splice(colIndex, 1);
    element.tableData.rows.forEach(function (row) { row.splice(colIndex, 1); });
    this.updateSVGElement(element);
    this.saveStateToHistory("removeTableColumn");
  },
};
