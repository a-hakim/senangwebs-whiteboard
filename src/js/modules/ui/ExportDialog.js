/**
 * ExportDialog.js
 * Export functionality - SVG, PNG, JSON/Scene export
 * Part of Phase 5: UI Panels
 *
 * Provides methods to export the whiteboard content in various formats:
 * - SVG: Vector format preserving all drawing details
 * - PNG: Raster image format for sharing
 * - JSON/Scene: Complete scene data for saving/loading
 */

export const ExportDialogMixin = {
  createExportSVG(options = {}) {
    const mode = options.mode || "all";
    const padding = Number.isFinite(options.padding) ? options.padding : 20;
    const clonedSVG = this.svg.cloneNode(true);

    clonedSVG.querySelector(".sww-selection")?.remove();
    clonedSVG
      .querySelectorAll(
        ".sww-selection-handle, .sww-rotation-handle, .sww-table-control-btn, .sww-table-inline-btn"
      )
      .forEach((element) => element.remove());

    clonedSVG.querySelectorAll("[data-element-id]").forEach((svgElement) => {
      const element = this.elementsById.get(svgElement.getAttribute("data-element-id"));
      svgElement.style.display = element?.visible === false ? "none" : "block";
      svgElement.classList.remove("selected");
    });

    let bounds = { ...this.viewBox };
    if (mode === "all") {
      const visibleElements = this.elements.filter((element) => element.visible !== false);
      if (visibleElements.length > 0) {
        const elementBounds = visibleElements.map((element) => this.getElementBounds(element));
        const minX = Math.min(...elementBounds.map((item) => item.x));
        const minY = Math.min(...elementBounds.map((item) => item.y));
        const maxX = Math.max(...elementBounds.map((item) => item.x + item.width));
        const maxY = Math.max(...elementBounds.map((item) => item.y + item.height));
        bounds = {
          x: minX - padding,
          y: minY - padding,
          width: Math.max(1, maxX - minX + padding * 2),
          height: Math.max(1, maxY - minY + padding * 2),
        };
      }
    }

    clonedSVG.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clonedSVG.setAttribute(
      "viewBox",
      `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`
    );
    clonedSVG.setAttribute("width", bounds.width);
    clonedSVG.setAttribute("height", bounds.height);

    return { clonedSVG, bounds };
  },

  /**
   * Export canvas as SVG file
   * Creates a downloadable SVG file with all elements
   * @returns {string} SVG data string
   */
  exportToSVG(options = {}) {
    const { clonedSVG } = this.createExportSVG(options);

    // Serialize SVG to string
    const svgData = new XMLSerializer().serializeToString(clonedSVG);

    // Create blob and download link
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `sww-drawing-${Date.now()}.svg`;
    link.click();

    // Clean up
    URL.revokeObjectURL(url);

    return svgData;
  },

  /**
   * Export canvas as PNG file
   * Converts SVG to PNG raster image and downloads
   */
  exportToPNG(options = {}) {
    const unsupportedElement = this.elements.find(
      (element) => element.visible !== false && element.type === "website"
    );
    if (unsupportedElement) {
      this.showNotification?.(
        "PNG export does not support live website embeds. Use SVG or hide the embed.",
        "warning"
      );
      return false;
    }

    const crossOriginImage = this.elements.find((element) => {
      if (element.visible === false || element.type !== "image" || !element.imageUrl) {
        return false;
      }
      try {
        const url = new URL(element.imageUrl, window.location.href);
        return ["http:", "https:"].includes(url.protocol) &&
          url.origin !== window.location.origin;
      } catch {
        return true;
      }
    });
    if (crossOriginImage) {
      this.showNotification?.(
        "PNG export requires same-origin or embedded image data.",
        "warning"
      );
      return false;
    }

    // Create canvas element for conversion
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    const { clonedSVG, bounds } = this.createExportSVG(options);
    const scale = Math.max(0.1, Number(options.scale) || 1);

    const svgData = new XMLSerializer().serializeToString(clonedSVG);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = Math.ceil(bounds.width * scale);
      canvas.height = Math.ceil(bounds.height * scale);

      // Draw SVG image to canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert canvas to PNG blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          URL.revokeObjectURL(url);
          this.showNotification?.("PNG export failed", "error");
          return;
        }
        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = `sww-drawing-${Date.now()}.png`;
        link.click();

        // Clean up
        URL.revokeObjectURL(url);
        URL.revokeObjectURL(pngUrl);
      }, "image/png");
    };

    img.onerror = () => {
      console.error("Failed to load SVG for PNG export");
      URL.revokeObjectURL(url);
    };

    img.src = url;
  },

  /**
   * Export scene as JSON file
   * Exports complete scene data including elements, viewBox, and zoom
   */
  exportToJSON() {
    const scene = this.getScene();
    const jsonData = JSON.stringify(scene, null, 2);

    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `sww-scene-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);

    return jsonData;
  },

  /**
   * Copy scene data to clipboard
   * Copies the JSON scene data to system clipboard
   * @returns {Promise<boolean>} True if successful
   */
  async copySceneToClipboard() {
    try {
      const scene = this.getScene();
      const jsonData = JSON.stringify(scene, null, 2);

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(jsonData);
        this.showNotification("Scene data copied to clipboard", "success");
        return true;
      } else {
        // Fallback for browsers without Clipboard API
        const textarea = document.createElement("textarea");
        textarea.value = jsonData;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textarea);

        if (success) {
          this.showNotification("Scene data copied to clipboard", "success");
        } else {
          this.showNotification("Failed to copy to clipboard", "error");
        }
        return success;
      }
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      this.showNotification("Failed to copy to clipboard", "error");
      return false;
    }
  },

  /**
   * Load scene from JSON string
   * @param {string} jsonData - JSON string containing scene data
   * @returns {boolean} True if successful
   */
  loadSceneFromJSON(jsonData) {
    try {
      const sceneData = JSON.parse(jsonData);
      this.loadScene(sceneData);
      this.showNotification("Scene loaded successfully", "success");
      return true;
    } catch (error) {
      console.error("Error loading scene:", error);
      this.showNotification("Failed to load scene - invalid JSON", "error");
      return false;
    }
  },

  /**
   * Import scene from JSON file
   * Opens file picker and loads selected JSON file
   */
  importFromJSON() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        this.loadSceneFromJSON(event.target.result);
      };
      reader.onerror = () => {
        this.showNotification("Failed to read file", "error");
      };
      reader.readAsText(file);
    };

    input.click();
  },

  /**
   * Show export dialog with format options
   * Creates a modal dialog for choosing export format
   */
  showExportDialog() {
    // Remove existing dialog if present
    const existingDialog = document.querySelector(".sww-export-dialog");
    if (existingDialog) {
      existingDialog.remove();
    }

    // Create dialog overlay
    const overlay = document.createElement("div");
    overlay.className = "sww-export-dialog";
    overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

    // Create dialog content
    const dialog = document.createElement("div");
    dialog.style.cssText = `
            background: var(--sww-panel-bg, #18181b);
            border: 1px solid var(--sww-border-color, #3f3f46);
            border-radius: 8px;
            padding: 24px;
            min-width: 320px;
            max-width: 400px;
            color: var(--sww-text-color, #ffffff);
        `;

    dialog.innerHTML = `
            <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
                Export Drawing
            </h3>
            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
                <button class="sww-export-btn" data-format="svg" style="
                    padding: 12px 16px;
                    background: var(--sww-accent-color, #00FF99);
                    color: var(--sww-panel-bg, #18181b);
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <i class="ss ss-code"></i>
                    Export as SVG (Vector)
                </button>
                <button class="sww-export-btn" data-format="png" style="
                    padding: 12px 16px;
                    background: var(--sww-accent-color, #00FF99);
                    color: var(--sww-panel-bg, #18181b);
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <i class="ss ss-photo"></i>
                    Export as PNG (Image)
                </button>
                <button class="sww-export-btn" data-format="json" style="
                    padding: 12px 16px;
                    background: var(--sww-accent-color, #00FF99);
                    color: var(--sww-panel-bg, #18181b);
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <i class="ss ss-document"></i>
                    Export as JSON (Scene Data)
                </button>
                <button class="sww-export-btn" data-format="clipboard" style="
                    padding: 12px 16px;
                    background: var(--sww-button-bg, #27272a);
                    color: var(--sww-text-color, #ffffff);
                    border: 1px solid var(--sww-border-color, #3f3f46);
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <i class="ss ss-clipboard"></i>
                    Copy Scene to Clipboard
                </button>
            </div>
            <button class="sww-export-cancel" style="
                padding: 10px 16px;
                background: transparent;
                color: var(--sww-text-color, #ffffff);
                border: 1px solid var(--sww-border-color, #3f3f46);
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                width: 100%;
            ">
                Cancel
            </button>
        `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Add event listeners
    const exportButtons = dialog.querySelectorAll(".sww-export-btn");
    exportButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const format = button.dataset.format;
        switch (format) {
          case "svg":
            this.exportToSVG();
            break;
          case "png":
            this.exportToPNG();
            break;
          case "json":
            this.exportToJSON();
            break;
          case "clipboard":
            this.copySceneToClipboard();
            break;
        }
        overlay.remove();
      });

      // Add hover effect
      button.addEventListener("mouseenter", () => {
        button.style.opacity = "0.9";
        button.style.transform = "translateY(-1px)";
      });
      button.addEventListener("mouseleave", () => {
        button.style.opacity = "1";
        button.style.transform = "translateY(0)";
      });
    });

    // Cancel button
    const cancelButton = dialog.querySelector(".sww-export-cancel");
    cancelButton.addEventListener("click", () => {
      overlay.remove();
    });

    // Click outside to close
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    // ESC key to close
    const escHandler = (e) => {
      if (e.key === "Escape") {
        overlay.remove();
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler, {
      signal: this.eventController?.signal,
    });
  },
};
