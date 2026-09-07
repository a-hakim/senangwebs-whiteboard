/**
 * EmbedToolsMixin.js - Embedded content tools (website, image, markdown)
 *
 * Provides tool entry points for embedding external content. Element rendering
 * is handled by rendering/SVGRenderer.js (foreignObject containers, markdown
 * parsing, container styling) and editing dialogs by dialogs/Dialogs.js.
 *
 * @module EmbedToolsMixin
 * @since Phase 3 - Tool System Extraction
 */

/**
 * EmbedTools mixin - adds website, image, and markdown embedding capabilities
 */
export const EmbedToolsMixin = {
  /**
   * Handle website tool click
   * Creates a website element with iframe embedding
   * Positioned centered on cursor for better UX
   *
   * @param {Object} point - Click point {x, y}
   */
  handleWebsiteStart(point) {
    // Position element at cursor location for better UI/UX
    // Offset by half the element size so it's centered on the cursor
    const elementPoint = {
      x: point.x - 150, // Half of default width (300/2)
      y: point.y - 100, // Half of default height (200/2)
    };
    const snappedPoint = this.snapToGridPoint(elementPoint);
    const element = this.createElement("website", snappedPoint);

    // Add element to the scene
    this.addSVGElementToDOM(element);
    this.addElement(element);
    this.updateSVGElement(element);

    // Save state for undo/redo
    this.saveStateToHistory("createElement");

    // Select the element and show configuration dialog
    this.clearSelection();
    this.selectElement(element);
    this.editWebsiteElement(element);

    // Switch back to select tool
    this.setTool("select");
  },

  /**
   * Handle image tool click
   * Creates an image element with URL loading
   * Positioned centered on cursor for better UX
   *
   * @param {Object} point - Click point {x, y}
   */
  handleImageStart(point) {
    // Position element at cursor location for better UI/UX
    // Offset by half the element size so it's centered on the cursor
    const elementPoint = {
      x: point.x - 150, // Half of default width (300/2)
      y: point.y - 100, // Half of default height (200/2)
    };
    const snappedPoint = this.snapToGridPoint(elementPoint);
    const element = this.createElement("image", snappedPoint);

    // Add element to the scene
    this.addSVGElementToDOM(element);
    this.addElement(element);
    this.updateSVGElement(element);

    // Save state for undo/redo
    this.saveStateToHistory("createElement");

    // Select the element and show configuration dialog
    this.clearSelection();
    this.selectElement(element);
    this.editImageElement(element);

    // Switch back to select tool
    this.setTool("select");
  },

  /**
   * Handle markdown tool click
   * Creates a markdown element with live rendering
   * Positioned centered on cursor for better UX
   *
   * @param {Object} point - Click point {x, y}
   */
  handleMarkdownStart(point) {
    // Position element at cursor location for better UI/UX
    // Offset by half the element size so it's centered on the cursor
    const elementPoint = {
      x: point.x - 150, // Half of default width (300/2)
      y: point.y - 100, // Half of default height (200/2)
    };
    const snappedPoint = this.snapToGridPoint(elementPoint);
    const element = this.createElement("markdown", snappedPoint);

    // Add element to the scene
    this.addSVGElementToDOM(element);
    this.addElement(element);
    this.updateSVGElement(element);

    // Save state for undo/redo
    this.saveStateToHistory("createElement");

    // Select the element
    this.clearSelection();
    this.selectElement(element);

    // Switch back to select tool
    this.setTool("select");
  }
};