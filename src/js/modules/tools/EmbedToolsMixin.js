/**
 * EmbedToolsMixin.js - Embedded content tools (website, image, markdown)
 *
 * Provides tools for embedding external content using SVG foreignObject.
 * Handles website iframes, images, and markdown rendering with editing capabilities.
 *
 * Responsibilities:
 * - Website element creation with iframe embedding
 * - Image element creation with URL loading
 * - Markdown element creation with live rendering
 * - SVG foreignObject management for HTML content
 * - Content editing dialogs and inline editors
 * - Markdown parsing with Marked.js integration
 *
 * Key Features:
 * - Click-to-create centered on cursor
 * - Immediate configuration dialogs
 * - Website address bar UI with browser controls
 * - Image loading with cover fit
 * - Markdown live preview and editing
 * - Stroke, fill, and opacity support
 * - Gradient background support
 * - Double-click to edit functionality
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
 * - editWebsiteElement() - Website URL editor (legacy)
 * - editImageElement() - Image URL editor (legacy)
 * - createCSSGradient() - Gradient CSS generator (legacy)
 * - parseMarkdown() - Markdown parser (legacy)
 * - marked - Marked.js library for markdown rendering
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
    this.elements.push(element);
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
    this.elements.push(element);
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
   * Create SVG foreignObject element for website embedding
   *
   * @param {Object} element - Website element data
   * @returns {SVGForeignObjectElement} Created foreignObject element
   */
  createWebsiteSVGElement(element) {
    const svg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "foreignObject"
    );
    svg.setAttribute("data-element-id", element.id);
    svg.setAttribute("class", "sww-element");

    element.svgElement = svg;
    this.updateWebsiteSVG(element);

    return svg;
  },

  /**
   * Update website SVG element rendering
   * Renders iframe with address bar or placeholder
   *
   * @param {Object} element - Website element data
   */
  updateWebsiteSVG(element) {
    const svg = element.svgElement;
    if (!svg) return;

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

      this.applyStrokeAndFillToContainer(container, element);

      // Create address bar
      const addressBar = document.createElement("div");
      addressBar.className = "sww-website-address-bar";

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
      iframe.src = element.url;
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "none";

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

      this.applyStrokeAndFillToContainer(div, element);

      div.innerHTML =
        '<i class="ss ss-globe-alt"></i><br>Double-click to set URL';
      svg.appendChild(div);
    }
  },

  /**
   * Create SVG foreignObject element for image embedding
   *
   * @param {Object} element - Image element data
   * @returns {SVGForeignObjectElement} Created foreignObject element
   */
  createImageSVGElement(element) {
    const svg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "foreignObject"
    );
    svg.setAttribute("data-element-id", element.id);
    svg.setAttribute("class", "sww-element");

    element.svgElement = svg;
    this.updateImageSVG(element);

    return svg;
  },

  /**
   * Update image SVG element rendering
   * Renders image with cover fit or placeholder
   *
   * @param {Object} element - Image element data
   */
  updateImageSVG(element) {
    const svg = element.svgElement;
    if (!svg) return;

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

      this.applyStrokeAndFillToContainer(div, element);

      const img = document.createElement("img");
      img.src = element.imageUrl;
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

      this.applyStrokeAndFillToContainer(div, element);

      div.innerHTML =
        '<i class="ss ss-photo"></i><br>Double-click to set image';
      svg.appendChild(div);
    }
  },

  /**
   * Create SVG foreignObject element for markdown rendering
   *
   * @param {Object} element - Markdown element data
   * @returns {SVGForeignObjectElement} Created foreignObject element
   */
  createMarkdownSVGElement(element) {
    const svg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "foreignObject"
    );
    svg.setAttribute("data-element-id", element.id);
    svg.setAttribute("class", "sww-element");

    element.svgElement = svg;
    this.updateMarkdownSVG(element);

    return svg;
  },

  /**
   * Update markdown SVG element rendering
   * Renders parsed markdown with live preview and editing
   *
   * @param {Object} element - Markdown element data
   */
  updateMarkdownSVG(element) {
    const svg = element.svgElement;
    if (!svg) return;

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

    this.applyStrokeAndFillToContainer(div, element);

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

      // Save state for undo/redo
      this.saveStateToHistory("editMarkdown");
    });

    div.appendChild(renderedView);
    div.appendChild(textarea);
    svg.appendChild(div);
  },

  /**
   * Apply stroke and fill styling to HTML container
   * Used by website, image, and markdown elements
   *
   * @param {HTMLElement} container - Container div element
   * @param {Object} element - Element data with styling properties
   */
  applyStrokeAndFillToContainer(container, element) {
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
   * Parse markdown text to HTML using Marked.js
   * Falls back to simple line break conversion if Marked.js unavailable
   *
   * @param {string} text - Markdown text to parse
   * @returns {string} Parsed HTML string
   */
  parseMarkdownInternal(text) {
    if (!text) return "";

    // Use marked.js library for parsing markdown
    if (typeof marked !== "undefined") {
      try {
        // Configure marked options for security and functionality
        marked.setOptions({
          breaks: true, // Support single line breaks
          gfm: true, // GitHub flavored markdown
          sanitize: false, // We'll trust the input since it's user content
          smartLists: true, // Better list handling
          smartypants: false, // Don't convert quotes
        });

        return marked.parse(text);
      } catch (error) {
        return text.replace(/\n/g, "<br>");
      }
    } else {
      return text.replace(/\n/g, "<br>");
    }
  },
};
