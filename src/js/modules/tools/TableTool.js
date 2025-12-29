/**
 * TableTool.js - Table element tool
 *
 * Provides tools for creating editable tables using SVG foreignObject.
 * Handles table creation with headers, rows, and resizable columns/rows.
 *
 * Responsibilities:
 * - Table element creation with default structure
 * - SVG foreignObject management for HTML table content
 * - Resizable column/row functionality
 * - Inline cell editing
 * - Add/remove row/column operations
 *
 * Key Features:
 * - Click-to-create centered on cursor
 * - Editable cells with double-click
 * - Draggable column/row borders for resizing
 * - Header row styling
 * - Stroke, fill, and opacity support
 *
 * Dependencies:
 * - createElement() - Element creation
 * - snapToGridPoint() - Grid snapping
 * - addSVGElementToDOM() - SVG element attachment
 * - updateSVGElement() - SVG rendering
 * - saveStateToHistory() - Undo/redo support
 * - selectElement() - Element selection
 * - clearSelection() - Selection clearing
 * - setTool() - Tool switching
 *
 * @module TableToolMixin
 */

/**
 * TableTool mixin - adds table creation and editing capabilities
 */
export const TableToolMixin = {
  /**
   * Handle table tool click
   * Creates a table element with default structure
   * Positioned centered on cursor for better UX
   *
   * @param {Object} point - Click point {x, y}
   */
  handleTableStart(point) {
    // Position element at cursor location for better UI/UX
    // Offset by half the element size so it's centered on the cursor
    const elementPoint = {
      x: point.x - 200, // Half of default width (400/2)
      y: point.y - 100, // Half of default height (200/2)
    };
    const snappedPoint = this.snapToGridPoint(elementPoint);
    const element = this.createElement("table", snappedPoint);

    // Add element to the scene
    this.addSVGElementToDOM(element);
    this.elements.push(element);
    this.updateSVGElement(element);

    // Save state for undo/redo
    this.saveStateToHistory("createElement");

    // Select the element
    this.clearSelection();
    this.selectElement(element);

    // Switch back to select tool
    this.setTool("select");
  },

  /**
   * Create SVG foreignObject element for table
   *
   * @param {Object} element - Table element data
   * @returns {SVGForeignObjectElement} Created foreignObject element
   */
  createTableSVGElement(element) {
    const svg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "foreignObject"
    );
    svg.setAttribute("data-element-id", element.id);
    svg.setAttribute("class", "sww-element");

    element.svgElement = svg;
    this.updateTableSVG(element);

    return svg;
  },

  /**
   * Update table SVG element rendering
   * Renders HTML table with editable cells and resize handles
   *
   * @param {Object} element - Table element data
   */
  updateTableSVG(element) {
    const svg = element.svgElement;
    if (!svg) return;

    svg.setAttribute("x", element.x);
    svg.setAttribute("y", element.y);
    svg.setAttribute("width", Math.abs(element.width));
    svg.setAttribute("height", Math.abs(element.height));

    // Clear existing content
    svg.innerHTML = "";

    // Create table container
    const container = document.createElement("div");
    container.className = "sww-table-element";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.overflow = "auto";
    container.style.boxSizing = "border-box";

    this.applyStrokeAndFillToContainer(container, element);

    // Get table data
    const tableData = element.tableData || {
      headers: ["Header 1", "Header 2", "Header 3"],
      rows: [
        ["", "", ""],
        ["", "", ""],
      ],
      columnWidths: [100, 100, 100],
      rowHeights: [40, 40],
    };

    // Create table element
    const table = document.createElement("table");
    table.className = "sww-table";
    table.style.width = "100%";
    table.style.height = "100%";
    table.style.borderCollapse = "collapse";
    table.style.tableLayout = "fixed";

    // Create header row
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerRow.className = "sww-table-header-row";

    tableData.headers.forEach((header, colIndex) => {
      const th = document.createElement("th");
      th.className = "sww-table-cell sww-table-header";
      th.textContent = header;
      th.style.width = (tableData.columnWidths[colIndex] || 100) + "px";
      th.style.minWidth = "50px";
      th.style.padding = "8px";
      th.style.border = "1px solid #ccc";
      th.style.backgroundColor = element.fillColor === "transparent" ? "#f5f5f5" : "";
      th.style.fontWeight = "bold";
      th.style.textAlign = "left";
      th.style.position = "relative";
      th.style.color = element.textColor || element.strokeColor || "#333";
      th.style.fontSize = (element.fontSize || 14) + "px";
      th.style.fontFamily = element.fontFamily || "Arial, sans-serif";

      // Double-click to edit
      th.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        this.editTableCell(element, "header", colIndex, th);
      });

      // Add resize handle for columns
      if (colIndex < tableData.headers.length - 1) {
        const resizeHandle = document.createElement("div");
        resizeHandle.className = "sww-table-col-resize";
        resizeHandle.style.position = "absolute";
        resizeHandle.style.right = "-3px";
        resizeHandle.style.top = "0";
        resizeHandle.style.width = "6px";
        resizeHandle.style.height = "100%";
        resizeHandle.style.cursor = "col-resize";
        resizeHandle.style.zIndex = "10";

        resizeHandle.addEventListener("mousedown", (e) => {
          e.stopPropagation();
          this.startColumnResize(element, colIndex, e);
        });

        th.appendChild(resizeHandle);
      }

      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body rows
    const tbody = document.createElement("tbody");
    tableData.rows.forEach((row, rowIndex) => {
      const tr = document.createElement("tr");
      tr.className = "sww-table-row";
      tr.style.height = (tableData.rowHeights[rowIndex] || 40) + "px";

      row.forEach((cell, colIndex) => {
        const td = document.createElement("td");
        td.className = "sww-table-cell";
        td.textContent = cell;
        td.style.width = (tableData.columnWidths[colIndex] || 100) + "px";
        td.style.minWidth = "50px";
        td.style.padding = "8px";
        td.style.border = "1px solid #ccc";
        td.style.textAlign = "left";
        td.style.position = "relative";
        td.style.color = element.textColor || element.strokeColor || "#333";
        td.style.fontSize = (element.fontSize || 14) + "px";
        td.style.fontFamily = element.fontFamily || "Arial, sans-serif";
        td.style.backgroundColor = element.fillColor === "transparent" ? "transparent" : "";

        // Double-click to edit
        td.addEventListener("dblclick", (e) => {
          e.stopPropagation();
          this.editTableCell(element, rowIndex, colIndex, td);
        });

        tr.appendChild(td);
      });

      // Add row resize handle
      if (rowIndex < tableData.rows.length - 1) {
        const lastCell = tr.lastChild;
        if (lastCell) {
          const resizeHandle = document.createElement("div");
          resizeHandle.className = "sww-table-row-resize";
          resizeHandle.style.position = "absolute";
          resizeHandle.style.left = "0";
          resizeHandle.style.bottom = "-3px";
          resizeHandle.style.width = "100%";
          resizeHandle.style.height = "6px";
          resizeHandle.style.cursor = "row-resize";
          resizeHandle.style.zIndex = "10";

          resizeHandle.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            this.startRowResize(element, rowIndex, e);
          });

          lastCell.appendChild(resizeHandle);
        }
      }

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
    svg.appendChild(container);
  },

  /**
   * Edit a table cell inline
   *
   * @param {Object} element - Table element
   * @param {number|string} rowIndex - Row index or 'header'
   * @param {number} colIndex - Column index
   * @param {HTMLElement} cellElement - The cell DOM element
   */
  editTableCell(element, rowIndex, colIndex, cellElement) {
    // Find the text span to get actual content (not button text)
    const textSpan = cellElement.querySelector('.sww-cell-text, .sww-header-text');
    const originalValue = textSpan ? textSpan.textContent : cellElement.firstChild?.textContent || '';
    
    const input = document.createElement("input");
    input.type = "text";
    input.value = originalValue;
    input.className = "sww-table-cell-input";
    input.style.width = "100%";
    input.style.height = "auto";
    input.style.minHeight = "1em";
    input.style.border = "none";
    input.style.padding = "0";
    input.style.margin = "0";
    input.style.fontSize = "inherit";
    input.style.fontFamily = "inherit";
    input.style.color = "inherit";
    input.style.backgroundColor = "transparent";
    input.style.outline = "2px solid var(--sww-accent-color, #00ff99)";
    input.style.boxSizing = "border-box";
    input.style.verticalAlign = "top";
    input.style.textAlign = "left";

    // Hide the text span instead of clearing cell content (preserve buttons)
    if (textSpan) {
      textSpan.style.display = "none";
    }
    
    cellElement.insertBefore(input, cellElement.firstChild);
    input.focus();
    input.select();

    let isFinished = false;
    
    const finishEdit = (save = true) => {
      // Prevent double-execution
      if (isFinished) return;
      isFinished = true;
      
      // Remove global click handler
      document.removeEventListener("mousedown", handleOutsideClick, true);
      
      if (save) {
        const newValue = input.value;
        
        // Update element data
        if (rowIndex === "header") {
          element.tableData.headers[colIndex] = newValue;
        } else {
          element.tableData.rows[rowIndex][colIndex] = newValue;
        }
        
        // Save state for undo/redo
        this.saveStateToHistory("editTable");
      }

      // Re-render table to sync all changes (this will replace the entire table DOM)
      this.updateSVGElement(element);
    };
    
    // Handler to detect clicks outside the input
    const handleOutsideClick = (e) => {
      if (!input.contains(e.target) && e.target !== input) {
        finishEdit(true);
      }
    };
    
    // Add global click handler to catch outside clicks (use capture phase)
    setTimeout(() => {
      document.addEventListener("mousedown", handleOutsideClick, true);
    }, 10);

    input.addEventListener("blur", () => finishEdit(true));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        finishEdit(true);
      } else if (e.key === "Escape") {
        finishEdit(false);
      }
    });
  },

  /**
   * Start column resize operation
   *
   * @param {Object} element - Table element
   * @param {number} colIndex - Column index being resized
   * @param {MouseEvent} e - Mouse event
   */
  startColumnResize(element, colIndex, e) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = element.tableData.columnWidths[colIndex] || 100;

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(50, startWidth + deltaX);
      element.tableData.columnWidths[colIndex] = newWidth;
      this.updateSVGElement(element);
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      this.saveStateToHistory("resizeTableColumn");
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  },

  /**
   * Start row resize operation
   *
   * @param {Object} element - Table element
   * @param {number} rowIndex - Row index being resized
   * @param {MouseEvent} e - Mouse event
   */
  startRowResize(element, rowIndex, e) {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = element.tableData.rowHeights[rowIndex] || 40;

    const onMouseMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(30, startHeight + deltaY);
      element.tableData.rowHeights[rowIndex] = newHeight;
      this.updateSVGElement(element);
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      this.saveStateToHistory("resizeTableRow");
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  },

  /**
   * Add a new row to the table
   *
   * @param {Object} element - Table element
   */
  addTableRow(element) {
    const numColumns = element.tableData.headers.length;
    const newRow = new Array(numColumns).fill("");
    element.tableData.rows.push(newRow);
    element.tableData.rowHeights.push(40);
    this.updateSVGElement(element);
    this.saveStateToHistory("addTableRow");
  },

  /**
   * Add a new row at a specific position
   *
   * @param {Object} element - Table element
   * @param {number} position - Position to insert at (0-indexed)
   */
  addTableRowAt(element, position) {
    const numColumns = element.tableData.headers.length;
    const newRow = new Array(numColumns).fill("");
    element.tableData.rows.splice(position, 0, newRow);
    element.tableData.rowHeights.splice(position, 0, 40);
    this.updateSVGElement(element);
    this.saveStateToHistory("addTableRow");
  },

  /**
   * Add a new column to the table
   *
   * @param {Object} element - Table element
   */
  addTableColumn(element) {
    element.tableData.headers.push("New Column");
    element.tableData.columnWidths.push(100);
    element.tableData.rows.forEach((row) => row.push(""));
    this.updateSVGElement(element);
    this.saveStateToHistory("addTableColumn");
  },

  /**
   * Add a new column at a specific position
   *
   * @param {Object} element - Table element
   * @param {number} position - Position to insert at (0-indexed)
   */
  addTableColumnAt(element, position) {
    element.tableData.headers.splice(position, 0, "New Column");
    element.tableData.columnWidths.splice(position, 0, 100);
    element.tableData.rows.forEach((row) => row.splice(position, 0, ""));
    this.updateSVGElement(element);
    this.saveStateToHistory("addTableColumn");
  },

  /**
   * Remove a row from the table
   *
   * @param {Object} element - Table element
   * @param {number} rowIndex - Index of row to remove
   */
  removeTableRow(element, rowIndex) {
    if (element.tableData.rows.length <= 1) return; // Keep at least one row
    element.tableData.rows.splice(rowIndex, 1);
    element.tableData.rowHeights.splice(rowIndex, 1);
    this.updateSVGElement(element);
    this.saveStateToHistory("removeTableRow");
  },

  /**
   * Remove a column from the table
   *
   * @param {Object} element - Table element
   * @param {number} colIndex - Index of column to remove
   */
  removeTableColumn(element, colIndex) {
    if (element.tableData.headers.length <= 1) return; // Keep at least one column
    element.tableData.headers.splice(colIndex, 1);
    element.tableData.columnWidths.splice(colIndex, 1);
    element.tableData.rows.forEach((row) => row.splice(colIndex, 1));
    this.updateSVGElement(element);
    this.saveStateToHistory("removeTableColumn");
  },
};
