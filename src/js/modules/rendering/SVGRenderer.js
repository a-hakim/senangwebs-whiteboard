import { escapeHtml, sanitizeHtml, sanitizeUrl } from "../utils/security.js";
import { marked } from "marked";

/**
 * SVG Rendering Engine
 *
 * Handles all SVG element creation, updates, and rendering
 * Core infrastructure for the whiteboard's visual output
 */

export const SVGRendererMixin = {
  /**
   * Create SVG element from element object
   * @param {Object} element - Element data object
   * @returns {SVGElement} Created SVG element
   */
  createSVGElement(element) {
    let svgElement;

    switch (element.type) {
      case "rectangle":
        svgElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        break;
      case "ellipse":
        svgElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "ellipse"
        );
        break;
      case "diamond":
        svgElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "polygon"
        );
        break;
      case "parallelogram":
        svgElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "polygon"
        );
        break;
      case "star":
        svgElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "polygon"
        );
        break;
      case "line":
      case "arrow":
        svgElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        break;
      case "path":
        svgElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        break;
      case "text":
        svgElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        break;
      case "website":
      case "image":
      case "markdown":
      case "table":
        svgElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "foreignObject"
        );
        break;
      default:
        svgElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
    }

    svgElement.setAttribute("data-element-id", element.id);
    svgElement.setAttribute("class", "sww-element");

    // Set the svgElement reference before calling updateSVGElement
    element.svgElement = svgElement;
    this.updateSVGElement(element);

    return svgElement;
  },

  /**
   * Update SVG element attributes and appearance
   * @param {Object} element - Element data object with svgElement reference
   */
  updateSVGElement(element) {
    const svg = element.svgElement;

    // Safety check
    if (!svg) {
      console.warn("SVG element not found for element:", element);
      return;
    }

    // Common attributes
    svg.setAttribute("stroke", element.strokeColor);
    svg.setAttribute("stroke-width", element.strokeWidth);
    svg.setAttribute("opacity", element.opacity);

    // Store original stroke width for selection styling
    svg.style.setProperty("--original-stroke-width", element.strokeWidth);

    // Fill handling
    if (element.fillStyle === "transparent") {
      svg.setAttribute("fill", "none");
    } else if (element.fillStyle === "solid") {
      svg.setAttribute("fill", element.fillColor);
    } else if (element.fillStyle === "hachure") {
      // Create hatch pattern
      svg.setAttribute("fill", "url(#hatch)");
      this.createHatchPattern(element.fillColor);
    } else if (element.fillStyle === "gradient") {
      // Create gradient
      const gradientId = this.createGradient(element);
      svg.setAttribute("fill", `url(#${gradientId})`);
    }

    // Type-specific rendering
    switch (element.type) {
      case "rectangle":
        this._updateRectangle(element, svg);
        break;
      case "ellipse":
        this._updateEllipse(element, svg);
        break;
      case "diamond":
        this._updateDiamond(element, svg);
        break;
      case "parallelogram":
        this._updateParallelogram(element, svg);
        break;
      case "star":
        this._updateStar(element, svg);
        break;
      case "line":
      case "arrow":
        this._updateLine(element, svg);
        break;
      case "path":
        this._updatePath(element, svg);
        break;
      case "text":
        this._updateText(element, svg);
        break;
      case "website":
        this._updateWebsite(element, svg);
        break;
      case "image":
        this._updateImage(element, svg);
        break;
      case "markdown":
        this._updateMarkdown(element, svg);
        break;
      case "table":
        this._updateTable(element, svg);
        break;
    }

    // Apply rotation transform
    if (element.rotation !== 0) {
      // Calculate center point correctly for negative dimensions
      let centerX, centerY;
      if (element.type === "line" || element.type === "arrow") {
        // For lines and arrows, center is midpoint between start and end
        centerX = element.x + element.width / 2;
        centerY = element.y + element.height / 2;
      } else {
        // For shapes, handle negative dimensions
        const elementX =
          element.width < 0 ? element.x + element.width : element.x;
        const elementY =
          element.height < 0 ? element.y + element.height : element.y;
        centerX = elementX + Math.abs(element.width) / 2;
        centerY = elementY + Math.abs(element.height) / 2;
      }
      svg.setAttribute(
        "transform",
        `rotate(${element.rotation} ${centerX} ${centerY})`
      );
    } else {
      // Remove transform attribute when rotation is 0
      svg.removeAttribute("transform");
    }
  },

  /**
   * Update rectangle SVG element
   * @private
   */
  _updateRectangle(element, svg) {
    // Handle negative dimensions for northwest direction
    const rectX = element.width < 0 ? element.x + element.width : element.x;
    const rectY = element.height < 0 ? element.y + element.height : element.y;
    svg.setAttribute("x", rectX);
    svg.setAttribute("y", rectY);
    svg.setAttribute("width", Math.abs(element.width));
    svg.setAttribute("height", Math.abs(element.height));
  },

  /**
   * Update ellipse SVG element
   * @private
   */
  _updateEllipse(element, svg) {
    const ellipseCx = element.x + element.width / 2;
    const ellipseCy = element.y + element.height / 2;
    svg.setAttribute("cx", ellipseCx);
    svg.setAttribute("cy", ellipseCy);
    svg.setAttribute("rx", Math.abs(element.width) / 2);
    svg.setAttribute("ry", Math.abs(element.height) / 2);
  },

  /**
   * Update diamond SVG element
   * @private
   */
  _updateDiamond(element, svg) {
    const diamondCx = element.x + element.width / 2;
    const diamondCy = element.y + element.height / 2;
    const diamondW = Math.abs(element.width) / 2;
    const diamondH = Math.abs(element.height) / 2;
    const diamondPoints = `${diamondCx},${diamondCy - diamondH} ${
      diamondCx + diamondW
    },${diamondCy} ${diamondCx},${diamondCy + diamondH} ${
      diamondCx - diamondW
    },${diamondCy}`;
    svg.setAttribute("points", diamondPoints);
  },

  /**
   * Update parallelogram SVG element
   * @private
   */
  _updateParallelogram(element, svg) {
    const skew = element.width * 0.2;
    const parallelogramPoints = `${element.x + skew},${element.y} ${
      element.x + element.width
    },${element.y} ${element.x + element.width - skew},${
      element.y + element.height
    } ${element.x},${element.y + element.height}`;
    svg.setAttribute("points", parallelogramPoints);
  },

  /**
   * Update star SVG element
   * @private
   */
  _updateStar(element, svg) {
    const starPoints = this.createStarPoints(
      element.x,
      element.y,
      element.width,
      element.height
    );
    svg.setAttribute("points", starPoints);
  },

  /**
   * Update line/arrow SVG element
   * @private
   */
  _updateLine(element, svg) {
    svg.setAttribute("x1", element.x);
    svg.setAttribute("y1", element.y);
    svg.setAttribute("x2", element.x + element.width);
    svg.setAttribute("y2", element.y + element.height);

    if (element.type === "arrow") {
      const markerId = this.createArrowMarker(element.strokeColor);
      svg.setAttribute("marker-end", `url(#${markerId})`);
    }
  },

  /**
   * Update path SVG element
   * @private
   */
  _updatePath(element, svg) {
    if (element.points && element.points.length > 0) {
      let pathData;

      if (this.currentElement && this.currentElement.id === element.id) {
        pathData = this.pointsToPath(element.points);
      } else {
        const absolutePoints = element.points.map((point) => ({
          x: point.x + element.x,
          y: point.y + element.y,
        }));
        pathData = this.pointsToPath(absolutePoints);
      }

      svg.setAttribute("d", pathData);
      svg.setAttribute("fill", "none");
    }
  },

  /**
   * Update text SVG element
   * @private
   */
  _updateText(element, svg) {
    const textContent = element.text || "Text";
    const lines = textContent.split("\n");

    // Always position text with padding inside the boundary
    const padding = 10;
    const textX = element.x + padding; // Left padding
    const textY = element.y + element.fontSize + padding; // Top padding + baseline

    svg.setAttribute("x", textX);
    svg.setAttribute("y", textY);
    svg.setAttribute("font-size", element.fontSize);
    svg.setAttribute("font-family", element.fontFamily);
    svg.setAttribute("fill", element.textColor || element.strokeColor); // Use textColor for fill

    // Show placeholder styling for empty text
    if (!element.text || element.text.trim() === "") {
      svg.setAttribute("opacity", "0.4");
      svg.setAttribute("font-style", "italic");
    } else {
      svg.setAttribute("font-style", "normal");
    }

    // Text can have stroke for outline effect
    if (element.strokeWidth > 0) {
      svg.setAttribute("stroke", element.strokeColor);
      svg.setAttribute("stroke-width", element.strokeWidth);
    } else {
      svg.removeAttribute("stroke");
      svg.removeAttribute("stroke-width");
    }

    // Clear existing content
    svg.innerHTML = "";

    // Add each line as a tspan with proper alignment
    lines.forEach((line, index) => {
      const tspan = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "tspan"
      );

      // Calculate X position based on alignment
      let lineX = textX;
      if (element.textAlign && element.width) {
        const lineWidth = this.measureText(
          line,
          element.fontSize,
          element.fontFamily
        ).width;
        const availableWidth = element.width - padding * 2; // Account for padding

        switch (element.textAlign) {
          case "center":
            lineX = element.x + element.width / 2 - lineWidth / 2;
            break;
          case "right":
            lineX = element.x + element.width - padding - lineWidth;
            break;
          case "left":
          default:
            lineX = textX; // Already set above
            break;
        }
      }

      tspan.setAttribute("x", lineX);
      tspan.setAttribute(
        "dy",
        index === 0 ? "0" : `${element.fontSize * 1.3}px`
      );
      // Use non-breaking space (char code 160) for empty lines - regular spaces are collapsed by SVG
      tspan.textContent = line || String.fromCharCode(160);
      svg.appendChild(tspan);
    });

    // Add subtle boundary visualization for text elements
    if (element.width && element.height) {
      // Remove existing boundary rect
      if (element.boundaryRect) {
        element.boundaryRect.remove();
      }

      // Create new boundary rect
      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      rect.setAttribute("x", element.x);
      rect.setAttribute("y", element.y);
      rect.setAttribute("width", Math.abs(element.width));
      rect.setAttribute("height", Math.abs(element.height));
      rect.setAttribute("fill", "rgba(240, 240, 240, 0.02)");
      // rect.setAttribute("stroke", "rgba(200, 200, 200, 0.15)");
      rect.setAttribute("stroke-width", "1");
      rect.setAttribute("stroke-dasharray", "3,3");
      rect.setAttribute("class", "sww-text-boundary");

      // Insert the rect before the text (only if svg has a parent)
      if (svg.parentNode) {
        svg.parentNode.insertBefore(rect, svg);
        element.boundaryRect = rect;
      } else {
        // Store the rect to be inserted later when the element is added to DOM
        element.pendingBoundaryRect = rect;
      }
    }
  },

  /**
   * Update website embed SVG element
   * @private
   */
  _updateWebsite(element, svg) {
    svg.setAttribute("x", element.x);
    svg.setAttribute("y", element.y);
    svg.setAttribute("width", Math.abs(element.width));
    svg.setAttribute("height", Math.abs(element.height));

    // Clear existing content
    svg.innerHTML = "";

    if (element.url && element.url.trim()) {
      // Create website container with address bar
      const container = document.createElement("div");
      container.className = "sww-website-element";
      container.style.width = "100%";
      container.style.height = "100%";

      this._applyContainerStyles(container, element);

      // Create address bar
      const addressBar = document.createElement("div");
      addressBar.className = "sww-website-address-bar";

      // Window controls
      const controls = document.createElement("div");
      controls.className = "sww-website-controls";

      const closeBtn = document.createElement("div");
      closeBtn.className = "sww-website-control close";
      const minimizeBtn = document.createElement("div");
      minimizeBtn.className = "sww-website-control minimize";
      const maximizeBtn = document.createElement("div");
      maximizeBtn.className = "sww-website-control maximize";

      controls.appendChild(closeBtn);
      controls.appendChild(minimizeBtn);
      controls.appendChild(maximizeBtn);

      // URL display
      const urlDisplay = document.createElement("div");
      urlDisplay.className = "sww-website-url";
      urlDisplay.textContent = element.url;
      urlDisplay.title = "Double-click to edit URL";

      addressBar.appendChild(urlDisplay);

      // Create content area
      const content = document.createElement("div");
      content.className = "sww-website-content";

      const iframe = document.createElement("iframe");
      iframe.src = sanitizeUrl(element.url, {
        allowedProtocols: ["http:", "https:"],
      });
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "none";
      iframe.setAttribute(
        "sandbox",
        this.options.iframeSandbox || "allow-forms allow-popups allow-scripts"
      );
      iframe.setAttribute("referrerpolicy", "no-referrer");
      iframe.setAttribute("allow", this.options.iframeAllow || "");

      content.appendChild(iframe);
      container.appendChild(addressBar);
      container.appendChild(content);
      svg.appendChild(container);
    } else {
      // Show placeholder
      const div = document.createElement("div");
      div.className = "sww-website-placeholder";
      div.style.width = "100%";
      div.style.height = "100%";

      this._applyContainerStyles(div, element);

      div.innerHTML =
        '<i class="ss ss-globe-alt"></i><br>Double-click to set URL';
      svg.appendChild(div);
    }
  },

  /**
   * Update image embed SVG element
   * @private
   */
  _updateImage(element, svg) {
    svg.setAttribute("x", element.x);
    svg.setAttribute("y", element.y);
    svg.setAttribute("width", Math.abs(element.width));
    svg.setAttribute("height", Math.abs(element.height));

    // Clear existing content
    svg.innerHTML = "";

    if (element.imageUrl && element.imageUrl.trim()) {
      // Create image container
      const div = document.createElement("div");
      div.className = "sww-image-element";
      div.style.width = "100%";
      div.style.height = "100%";

      this._applyContainerStyles(div, element);

      const img = document.createElement("img");
      img.src = sanitizeUrl(element.imageUrl, { allowDataImages: true });
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";

      div.appendChild(img);
      svg.appendChild(div);
    } else {
      // Show placeholder
      const div = document.createElement("div");
      div.className = "sww-image-placeholder";
      div.style.width = "100%";
      div.style.height = "100%";

      this._applyContainerStyles(div, element);

      div.innerHTML =
        '<i class="ss ss-photo"></i><br>Double-click to set image';
      svg.appendChild(div);
    }
  },

  /**
   * Update markdown document SVG element
   * @private
   */
  _updateMarkdown(element, svg) {
    svg.setAttribute("x", element.x);
    svg.setAttribute("y", element.y);
    svg.setAttribute("width", Math.abs(element.width));
    svg.setAttribute("height", Math.abs(element.height));

    // Clear existing content
    svg.innerHTML = "";

    // Create markdown container
    const div = document.createElement("div");
    div.className = "sww-markdown-element-container sww-markdown-readonly";
    div.style.width = "100%";
    div.style.height = "100%";
    div.style.position = "relative";
    div.style.overflow = "auto";

    this._applyContainerStyles(div, element);

    // Create rendered markdown view
    const renderedView = document.createElement("div");
    renderedView.className = "sww-markdown-rendered";
    renderedView.style.width = "100%";
    renderedView.style.height = "100%";
    renderedView.style.padding = "8px";
    renderedView.style.color = element.textColor || element.strokeColor;
    renderedView.style.fontSize = (element.fontSize || 12) + "px";
    renderedView.style.fontFamily = element.fontFamily || "Arial, sans-serif";
    renderedView.style.lineHeight = "1.4";
    renderedView.style.boxSizing = "border-box";

    // Parse and render markdown
    const markdownText =
      element.markdown || "# Markdown Document\n\nDouble-click to edit...";
    renderedView.innerHTML = this.parseMarkdown(markdownText);

    // Create markdown editor (hidden by default)
    const textarea = document.createElement("textarea");
    textarea.className = "sww-markdown-editor";
    textarea.value = markdownText;
    textarea.placeholder = "Enter markdown here...";
    textarea.style.width = "100%";
    textarea.style.height = "100%";
    textarea.style.padding = "8px";
    textarea.style.backgroundColor = "transparent";
    textarea.style.color = element.textColor || element.strokeColor;
    textarea.style.border = "none";
    textarea.style.fontSize = (element.fontSize || 12) + "px";
    textarea.style.fontFamily = "Monaco, Menlo, Ubuntu Mono, monospace";
    textarea.style.resize = "none";
    textarea.style.outline = "none";
    textarea.style.boxSizing = "border-box";

    // Handle textarea events
    textarea.addEventListener("input", (e) => {
      element.markdown = e.target.value;
      // Update rendered view in real-time
      renderedView.innerHTML = this.parseMarkdown(e.target.value);
    });

    textarea.addEventListener("blur", () => {
      // Switch back to rendered view using CSS classes
      div.classList.remove("sww-markdown-editing");
      div.classList.add("sww-markdown-readonly");
      textarea.readOnly = true;
      textarea.style.cursor = "default";
    });

    div.appendChild(renderedView);
    div.appendChild(textarea);
    svg.appendChild(div);
  },

  /**
   * Update table SVG element with edge-based hover controls
   * @private
   */
  _updateTable(element, svg) {
    svg.setAttribute("x", element.x);
    svg.setAttribute("y", element.y);
    svg.setAttribute("width", Math.abs(element.width));
    svg.setAttribute("height", Math.abs(element.height));

    svg.innerHTML = "";

    var container = document.createElement("div");
    container.className = "sww-table-element";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.overflow = "hidden";

    this._applyContainerStyles(container, element);

    var tableData = element.tableData || {
      headers: ["Header 1", "Header 2", "Header 3"],
      rows: [["", "", ""], ["", "", ""]],
    };

    var scrollWrapper = document.createElement("div");
    scrollWrapper.className = "sww-table-scroll";
    scrollWrapper.style.flex = "1";
    scrollWrapper.style.overflow = "auto";

    var table = document.createElement("table");
    table.className = "sww-table";
    var bindCellEditing = function (cellElement, rowIndex, colIndex) {
      if (!this.editTableCell) return;

      cellElement.addEventListener("pointerdown", function (e) {
        e.stopPropagation();
      });
      cellElement.addEventListener("click", function (e) {
        e.stopPropagation();

        if (this.currentTool === "select" && element && this.selectElement) {
          if (!this.selectedElements || !this.selectedElements.has(element)) {
            this.clearSelection?.();
            this.selectElement(element);
          }
        }

        if (e.detail < 2) return;

        e.preventDefault();
        this.editTableCell(element, rowIndex, colIndex, cellElement);
      }.bind(this));
    }.bind(this);

    var thead = document.createElement("thead");
    var headerRow = document.createElement("tr");
    headerRow.className = "sww-table-header-row";

    tableData.headers.forEach(function (header, colIndex) {
      var th = document.createElement("th");
      th.className = "sww-table-cell sww-table-header";
      th.setAttribute("data-row", "header");
      th.setAttribute("data-col-index", colIndex);
      th.textContent = header;
      bindCellEditing(th, "header", colIndex);
      headerRow.appendChild(th);
    }, this);

    thead.appendChild(headerRow);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");
    tableData.rows.forEach(function (row, rowIndex) {
      var tr = document.createElement("tr");
      tr.className = "sww-table-row";
      row.forEach(function (cell, colIndex) {
        var td = document.createElement("td");
        td.className = "sww-table-cell";
        td.setAttribute("data-row-index", rowIndex);
        td.setAttribute("data-col-index", colIndex);
        td.textContent = cell;
        bindCellEditing(td, rowIndex, colIndex);
        tr.appendChild(td);
      }, this);
      tbody.appendChild(tr);
    }, this);
    table.appendChild(tbody);

    scrollWrapper.appendChild(table);

    var toolbar = document.createElement("div");
    toolbar.className = "sww-table-toolbar";

    var canRemoveRow = tableData.rows.length > 1;
    var canRemoveCol = tableData.headers.length > 1;

    var addRowBtn = document.createElement("button");
    addRowBtn.className = "sww-table-toolbar-btn";
    addRowBtn.type = "button";
    addRowBtn.setAttribute("data-table-action", "add-row");
    addRowBtn.setAttribute("data-element-id", element.id);
    addRowBtn.title = "Add row";
    addRowBtn.innerHTML = '<i class="ss ss-plus"></i> <span>Row</span>';

    var removeRowBtn = document.createElement("button");
    removeRowBtn.className = "sww-table-toolbar-btn";
    removeRowBtn.type = "button";
    removeRowBtn.setAttribute("data-table-action", "remove-row");
    removeRowBtn.setAttribute("data-element-id", element.id);
    removeRowBtn.title = "Remove row";
    removeRowBtn.innerHTML = '<i class="ss ss-minus"></i> <span>Row</span>';
    if (!canRemoveRow) removeRowBtn.disabled = true;

    var addColBtn = document.createElement("button");
    addColBtn.className = "sww-table-toolbar-btn";
    addColBtn.type = "button";
    addColBtn.setAttribute("data-table-action", "add-column");
    addColBtn.setAttribute("data-element-id", element.id);
    addColBtn.title = "Add column";
    addColBtn.innerHTML = '<i class="ss ss-plus"></i> <span>Col</span>';

    var removeColBtn = document.createElement("button");
    removeColBtn.className = "sww-table-toolbar-btn";
    removeColBtn.type = "button";
    removeColBtn.setAttribute("data-table-action", "remove-column");
    removeColBtn.setAttribute("data-element-id", element.id);
    removeColBtn.title = "Remove column";
    removeColBtn.innerHTML = '<i class="ss ss-minus"></i> <span>Col</span>';
    if (!canRemoveCol) removeColBtn.disabled = true;

    toolbar.appendChild(addRowBtn);
    toolbar.appendChild(removeRowBtn);
    toolbar.appendChild(addColBtn);
    toolbar.appendChild(removeColBtn);

    [addRowBtn, removeRowBtn, addColBtn, removeColBtn].forEach(function (button) {
      button.addEventListener("pointerdown", function (e) {
        e.stopPropagation();
      });
      button.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (button.disabled || !this.handleTableAction) return;
        this.handleTableAction(element, button.getAttribute("data-table-action"));
      }.bind(this));
    }, this);

    container.appendChild(scrollWrapper);
    container.appendChild(toolbar);

    svg.appendChild(container);
  },

  /**
   * Apply common container styles for embed elements
   * @private
   */
  _applyContainerStyles(container, element) {
    // Apply stroke properties to the container
    if (element.strokeWidth > 0) {
      container.style.border = `${element.strokeWidth}px solid ${element.strokeColor}`;
    } else {
      container.style.border = "none";
    }

    // Apply fill style as background
    if (element.fillStyle === "solid" && element.fillColor !== "transparent") {
      container.style.backgroundColor = element.fillColor;
      container.style.backgroundImage = "none";
    } else if (element.fillStyle === "gradient") {
      const cssGradient = this.createCSSGradient(element);
      container.style.backgroundImage = cssGradient;
      container.style.backgroundColor = "transparent";
    } else if (element.fillStyle === "transparent") {
      container.style.backgroundColor = "transparent";
      container.style.backgroundImage = "none";
    } else {
      container.style.backgroundColor = "white";
      container.style.backgroundImage = "none";
    }

    // Apply opacity
    container.style.opacity = element.opacity;
  },

  /**
   * Create hatch pattern for fills
   * @param {string} color - Pattern color
   */
  createHatchPattern(color) {
    if (document.getElementById("hatch")) return;

    // Ensure we have a dedicated defs element for markers and patterns (not the grid defs)
    if (!this.markerDefs) {
      this.markerDefs = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "defs"
      );
      this.markerDefs.setAttribute("id", "sww-marker-defs");
      this.svg.appendChild(this.markerDefs);
    }
    const defs = this.markerDefs;

    const pattern = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "pattern"
    );
    pattern.setAttribute("id", "hatch");
    pattern.setAttribute("patternUnits", "userSpaceOnUse");
    pattern.setAttribute("width", "8");
    pattern.setAttribute("height", "8");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M0,8 l8,-8 M-2,2 l4,-4 M6,10 l4,-4");
    path.setAttribute("stroke", color);
    path.setAttribute("stroke-width", "1");

    pattern.appendChild(path);
    defs.appendChild(pattern);
  },

  /**
   * Create arrow marker for line ends
   * @param {string} strokeColor - Arrow color
   * @returns {string} Marker ID
   */
  createArrowMarker(strokeColor = "#000000") {
    // Create unique marker ID for each color
    const markerId = `arrowhead-${strokeColor.replace("#", "")}`;

    if (document.getElementById(markerId)) return markerId;

    // Ensure we have a dedicated defs element for markers (not the grid defs)
    if (!this.markerDefs) {
      this.markerDefs = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "defs"
      );
      this.markerDefs.setAttribute("id", "sww-marker-defs");
      this.svg.appendChild(this.markerDefs);
    }
    const defs = this.markerDefs;

    const marker = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "marker"
    );
    marker.setAttribute("id", markerId);
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("refX", "9");
    marker.setAttribute("refY", "3.5");
    marker.setAttribute("orient", "auto");
    marker.setAttribute("markerUnits", "strokeWidth");

    const polygon = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon"
    );
    polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
    polygon.setAttribute("fill", strokeColor);

    marker.appendChild(polygon);
    defs.appendChild(marker);

    return markerId;
  },

  /**
   * Create SVG gradient
   * @param {Object} element - Element with gradient properties
   * @returns {string} Gradient ID
   */
  createGradient(element) {
    const gradientId = `gradient-${element.id}`;

    // Ensure we have a dedicated defs element for markers and patterns (not the grid defs)
    if (!this.markerDefs) {
      this.markerDefs = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "defs"
      );
      this.markerDefs.setAttribute("id", "sww-marker-defs");
      this.svg.appendChild(this.markerDefs);
    }
    const defs = this.markerDefs;

    // Remove existing gradient if it exists
    const existingGradient = defs.querySelector(`#${gradientId}`);
    if (existingGradient) {
      existingGradient.remove();
    }

    // Create gradient element based on type
    let gradient;
    if (element.gradientType === "radial") {
      gradient = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "radialGradient"
      );
      gradient.setAttribute("cx", "50%");
      gradient.setAttribute("cy", "50%");
      gradient.setAttribute("r", "50%");
    } else {
      // Default to linear gradient
      gradient = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "linearGradient"
      );
      gradient.setAttribute("x1", "0%");
      gradient.setAttribute("y1", "0%");
      gradient.setAttribute("x2", "100%");
      gradient.setAttribute("y2", "0%");
    }

    gradient.setAttribute("id", gradientId);

    // Add gradient stops
    const stops = element.gradientStops || this.toolSettings.gradientStops;
    stops.forEach((stop) => {
      const stopElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "stop"
      );
      stopElement.setAttribute("offset", `${stop.offset}%`);
      stopElement.setAttribute("stop-color", stop.color);
      gradient.appendChild(stopElement);
    });

    defs.appendChild(gradient);
    return gradientId;
  },

  /**
   * Create CSS gradient for HTML elements
   * @param {Object} element - Element with gradient properties
   * @returns {string} CSS gradient string
   */
  createCSSGradient(element) {
    // Convert SVG gradient to CSS gradient for HTML elements
    const stops = element.gradientStops || this.toolSettings.gradientStops;
    const gradientType = element.gradientType || "linear";

    // Create color stops string
    const colorStops = stops
      .sort((a, b) => a.offset - b.offset) // Sort by offset
      .map((stop) => `${stop.color} ${stop.offset}%`)
      .join(", ");

    if (gradientType === "radial") {
      return `radial-gradient(circle, ${colorStops})`;
    } else {
      // Linear gradient (default direction: left to right)
      return `linear-gradient(to right, ${colorStops})`;
    }
  },

  /**
   * Parse markdown text to HTML
   * @param {string} text - Markdown text
   * @returns {string} HTML string
   */
  parseMarkdown(text) {
    if (!text) return "";

    // Use marked.js library for parsing markdown
    if (typeof marked !== "undefined") {
      try {
        // Marked parses markdown; sanitizeHtml enforces the rendering policy.
        marked.setOptions({
          breaks: true, // Support single line breaks
          gfm: true, // GitHub flavored markdown
          smartLists: true, // Better list handling
          smartypants: false, // Don't convert quotes
        });

        return sanitizeHtml(marked.parse(text));
      } catch (error) {
        return escapeHtml(text).replace(/\n/g, "<br>");
      }
    } else {
      return escapeHtml(text).replace(/\n/g, "<br>");
    }
  },

  /**
   * Create star shape points
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Star width
   * @param {number} height - Star height
   * @returns {string} SVG points string
   */
  createStarPoints(x, y, width, height) {
    // Handle negative dimensions properly by using absolute values for calculations
    // but maintaining the correct center position
    const absWidth = Math.abs(width);
    const absHeight = Math.abs(height);

    // Calculate center based on actual position and dimensions
    const cx = width >= 0 ? x + width / 2 : x + width / 2;
    const cy = height >= 0 ? y + height / 2 : y + height / 2;

    // Use separate radii for width and height to allow proper scaling
    const outerRadiusX = absWidth / 2;
    const outerRadiusY = absHeight / 2;
    const innerRadiusX = outerRadiusX * 0.4; // Inner radius is 40% of outer
    const innerRadiusY = outerRadiusY * 0.4;

    const points = [];

    // Create 5-pointed star with elliptical shape support
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2; // Start from top
      const radiusX = i % 2 === 0 ? outerRadiusX : innerRadiusX;
      const radiusY = i % 2 === 0 ? outerRadiusY : innerRadiusY;
      const pointX = cx + radiusX * Math.cos(angle);
      const pointY = cy + radiusY * Math.sin(angle);
      points.push(`${pointX},${pointY}`);
    }

    return points.join(" ");
  },

  /**
   * Convert points array to SVG path data
   * @param {Array} points - Array of {x, y} points
   * @returns {string} SVG path data string
   */
  pointsToPath(points) {
    if (points.length === 0) return "";

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  },

  /**
   * Measure text dimensions
   * @param {string} text - Text to measure
   * @param {number} fontSize - Font size in pixels
   * @param {string} fontFamily - Font family name
   * @returns {Object} {width, height}
   */
  measureText(text, fontSize = 16, fontFamily = "Arial") {
    // Create a temporary canvas to measure text
    if (!this.textMeasureCanvas) {
      this.textMeasureCanvas = document.createElement("canvas");
      this.textMeasureContext = this.textMeasureCanvas.getContext("2d");
    }

    const ctx = this.textMeasureContext;
    ctx.font = `${fontSize}px ${fontFamily}`;

    const lines = text.split("\n");
    let maxWidth = 0;

    for (const line of lines) {
      const metrics = ctx.measureText(line);
      maxWidth = Math.max(maxWidth, metrics.width);
    }

    const lineHeight = fontSize * 1.3; // Increased line height for better spacing
    const height = lines.length * lineHeight;

    return {
      width: Math.max(maxWidth, 40), // Increased minimum width
      height: Math.max(height, fontSize * 1.3), // Better minimum height
    };
  },
};
