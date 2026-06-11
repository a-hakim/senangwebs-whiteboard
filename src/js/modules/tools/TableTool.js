/**
 * TableTool.js - Table element tool
 *
 * Provides tools for creating editable tables using SVG foreignObject.
 * Handles table creation, inline cell editing, and row/column mutations.
 *
 * Responsibilities:
 * - Table element creation with default structure
 * - Inline cell editing (double-click)
 * - Add/remove row and column operations
 * - Delegated toolbar action handling
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

    var originalValue = rowIndex === "header"
      ? element.tableData.headers[colIndex]
      : element.tableData.rows[rowIndex][colIndex];

    var input = document.createElement("input");
    input.type = "text";
    input.value = originalValue;
    input.className = "sww-table-cell-input";
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

    input.addEventListener("blur", function () { finishEdit(true); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        finishEdit(true);
      } else if (e.key === "Escape") {
        e.preventDefault();
        finishEdit(false);
      }
    });
  },

  addTableRow(element) {
    var numColumns = element.tableData.headers.length;
    var newRow = new Array(numColumns).fill("");
    element.tableData.rows.push(newRow);
    this.updateSVGElement(element);
    this.saveStateToHistory("addTableRow");
  },

  addTableRowAt(element, position) {
    var numColumns = element.tableData.headers.length;
    var newRow = new Array(numColumns).fill("");
    element.tableData.rows.splice(position, 0, newRow);
    this.updateSVGElement(element);
    this.saveStateToHistory("addTableRow");
  },

  addTableColumn(element) {
    element.tableData.headers.push("New Column");
    element.tableData.rows.forEach(function (row) { row.push(""); });
    this.updateSVGElement(element);
    this.saveStateToHistory("addTableColumn");
  },

  addTableColumnAt(element, position) {
    element.tableData.headers.splice(position, 0, "New Column");
    element.tableData.rows.forEach(function (row) { row.splice(position, 0, ""); });
    this.updateSVGElement(element);
    this.saveStateToHistory("addTableColumn");
  },

  removeTableRow(element, rowIndex) {
    if (element.tableData.rows.length <= 1) return;
    element.tableData.rows.splice(rowIndex, 1);
    this.updateSVGElement(element);
    this.saveStateToHistory("removeTableRow");
  },

  removeTableColumn(element, colIndex) {
    if (element.tableData.headers.length <= 1) return;
    element.tableData.headers.splice(colIndex, 1);
    element.tableData.rows.forEach(function (row) { row.splice(colIndex, 1); });
    this.updateSVGElement(element);
    this.saveStateToHistory("removeTableColumn");
  },
};
