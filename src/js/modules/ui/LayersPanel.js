/**
 * LayersPanel.js
 * Layer management functionality - visibility, lock, selection
 * Part of Phase 5: UI Panels
 *
 * Note: This module provides layer management methods that are used by
 * the SWWControlPanel class (defined in examples). The HTML structure
 * for the layers panel is in the examples HTML files.
 */

export const LayersPanelMixin = {
  /**
   * Toggle element visibility
   * @param {string} elementId - The element ID to toggle
   */
  toggleElementVisibility(elementId) {
    const element = this.getElementById(elementId);
    if (!element) return;

    this.saveStateToHistory("visibility");

    // Toggle visibility state
    element.visible = element.visible !== false ? false : true;

    // Update SVG element display
    const svgElement = element.svgElement;
    if (svgElement) {
      if (element.visible) {
        svgElement.style.display = "block";
        svgElement.style.opacity = element.opacity || 1;
        svgElement.classList.remove("sww-hidden");
      } else {
        svgElement.style.display = "none";
        svgElement.classList.add("sww-hidden");
      }
    }

    // If element is being hidden and is selected, deselect it
    if (!element.visible && this.selectedElements.has(element)) {
      this.selectedElements.delete(element);
      this.updateSelectionHandles();
    }

    // Update control panel if it exists
    if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
      setTimeout(() => {
        window.swwControlPanel.updateLayers();
      }, 100);
    }
  },

  /**
   * Toggle element lock state
   * @param {string} elementId - The element ID to toggle
   */
  toggleElementLock(elementId) {
    const element = this.getElementById(elementId);
    if (!element) return;

    this.saveStateToHistory("lock");

    // Toggle lock state
    element.locked = !element.locked;

    // Update SVG element classes
    const svgElement = element.svgElement;
    if (svgElement) {
      if (element.locked) {
        svgElement.classList.add("sww-locked");
      } else {
        svgElement.classList.remove("sww-locked");
      }
    }

    // If element is being locked and is selected, deselect it
    if (element.locked && this.selectedElements.has(element)) {
      this.selectedElements.delete(element);
      this.updateSelectionHandles();
    }

    // Update control panel if it exists
    if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
      setTimeout(() => {
        window.swwControlPanel.updateLayers();
      }, 100);
    }
  },

  /**
   * Focus on a specific element (center view and select)
   * @param {string} elementId - The element ID to focus on
   */
  focusOnElement(elementId) {
    const element = this.getElementById(elementId);
    if (!element) return;

    // Clear current selection and select this element
    this.clearSelection();
    this.selectedElements.add(element);
    this.updateSelectionHandles();

    // Focus on the element by centering the view on it
    const bounds = this.getElementBounds(element);
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    // Update view to center on this element
    this.viewBox.x = centerX - this.viewBox.width / 2;
    this.viewBox.y = centerY - this.viewBox.height / 2;
    this.updateViewBox();

    // Update control panel if it exists
    if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
      window.swwControlPanel.updateLayers();
    }
  },

  /**
   * Get layer icon class based on element type
   * @param {string} type - The element type
   * @returns {string} SenangStart icon class
   */
  getLayerIcon(type) {
    const icons = {
      rectangle: "ss ss-square",
      ellipse: "ss ss-circle",
      arrow: "ss ss-arrow-right",
      draw: "ss ss-draw-curve",
      text: "ss ss-text",
      website: "ss ss-globe-alt",
      image: "ss ss-photo",
      markdown: "ss ss-document-text",
      diamond: "ss ss-diamond",
      parallelogram: "ss ss-parallelogram",
      star: "ss ss-star",
      line: "ss ss-draw-line",
    };
    return icons[type] || "ss ss-question-mark-circle";
  },

  /**
   * Get display name for a layer
   * @param {Object} element - The element object
   * @returns {string} Display name
   */
  getLayerName(element) {
    if (element.text) {
      return `Text: ${element.text.substring(0, 20)}${
        element.text.length > 20 ? "..." : ""
      }`;
    }
    if (element.url) {
      return `Website: ${element.url.substring(0, 20)}${
        element.url.length > 20 ? "..." : ""
      }`;
    }
    if (element.src) {
      return `Image: ${element.src.substring(0, 20)}${
        element.src.length > 20 ? "..." : ""
      }`;
    }

    const typeName =
      element.type.charAt(0).toUpperCase() + element.type.slice(1);
    return `${typeName} ${element.id.split("-").pop() || ""}`;
  },

  /**
   * Get all layers for display (reversed order - top elements first)
   * @returns {Array} Array of elements with index
   */
  getLayersForDisplay() {
    return this.elements
      .map((element, index) => ({
        ...element,
        index: index,
      }))
      .reverse();
  },

  /**
   * Check if an element is currently selected
   * @param {string} elementId - The element ID to check
   * @returns {boolean} True if selected
   */
  isElementSelected(elementId) {
    return Array.from(this.selectedElements).some((el) => el.id === elementId);
  },

  /**
   * Bring element to front (move to end of elements array)
   * @param {string} elementId - The element ID to bring forward
   */
  bringElementToFront(elementId) {
    const element = this.getElementById(elementId);
    if (!element) return;

    const index = this.elements.indexOf(element);
    if (index === -1 || index === this.elements.length - 1) return; // Already at front

    this.saveStateToHistory("reorder");

    // Remove from current position and add to end
    this.elements.splice(index, 1);
    this.elements.push(element);

    // Re-render by removing and re-adding SVG element
    if (element.svgElement && element.svgElement.parentNode) {
      element.svgElement.parentNode.appendChild(element.svgElement);
    }

    // Update control panel if it exists
    if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
      window.swwControlPanel.updateLayers();
    }
  },

  /**
   * Send element to back (move to start of elements array)
   * @param {string} elementId - The element ID to send backward
   */
  sendElementToBack(elementId) {
    const element = this.getElementById(elementId);
    if (!element) return;

    const index = this.elements.indexOf(element);
    if (index === -1 || index === 0) return; // Already at back

    this.saveStateToHistory("reorder");

    // Remove from current position and add to start
    this.elements.splice(index, 1);
    this.elements.unshift(element);

    // Re-render by removing and re-adding SVG element
    if (element.svgElement && element.svgElement.parentNode) {
      const parent = element.svgElement.parentNode;
      const firstChild = parent.firstChild;
      if (firstChild) {
        parent.insertBefore(element.svgElement, firstChild);
      } else {
        parent.appendChild(element.svgElement);
      }
    }

    // Update control panel if it exists
    if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
      window.swwControlPanel.updateLayers();
    }
  },

  /**
   * Move element forward one position
   * @param {string} elementId - The element ID to move forward
   */
  moveElementForward(elementId) {
    const element = this.getElementById(elementId);
    if (!element) return;

    const index = this.elements.indexOf(element);
    if (index === -1 || index === this.elements.length - 1) return; // Already at front

    this.saveStateToHistory("reorder");

    // Swap with next element
    [this.elements[index], this.elements[index + 1]] = [
      this.elements[index + 1],
      this.elements[index],
    ];

    // Re-render by adjusting SVG order
    if (element.svgElement && element.svgElement.parentNode) {
      const nextElement = this.elements[index];
      if (nextElement.svgElement) {
        element.svgElement.parentNode.insertBefore(
          element.svgElement,
          nextElement.svgElement.nextSibling
        );
      }
    }

    // Update control panel if it exists
    if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
      window.swwControlPanel.updateLayers();
    }
  },

  /**
   * Move element backward one position
   * @param {string} elementId - The element ID to move backward
   */
  moveElementBackward(elementId) {
    const element = this.getElementById(elementId);
    if (!element) return;

    const index = this.elements.indexOf(element);
    if (index === -1 || index === 0) return; // Already at back

    this.saveStateToHistory("reorder");

    // Swap with previous element
    [this.elements[index], this.elements[index - 1]] = [
      this.elements[index - 1],
      this.elements[index],
    ];

    // Re-render by adjusting SVG order
    if (element.svgElement && element.svgElement.parentNode) {
      const prevElement = this.elements[index];
      if (prevElement.svgElement) {
        element.svgElement.parentNode.insertBefore(
          element.svgElement,
          prevElement.svgElement
        );
      }
    }

    // Update control panel if it exists
    if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
      window.swwControlPanel.updateLayers();
    }
  },

  /**
   * Duplicate an element
   * @param {string} elementId - The element ID to duplicate
   */
  duplicateElement(elementId) {
    const element = this.getElementById(elementId);
    if (!element) return;

    this.saveStateToHistory("duplicate");

    // Create a deep copy of the element (except SVG reference)
    const duplicate = JSON.parse(
      JSON.stringify({
        ...element,
        svgElement: null,
      })
    );

    // Generate new ID
    duplicate.id = `${element.type}-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Offset position slightly
    duplicate.x += 20;
    duplicate.y += 20;

    // Add to elements array
    this.elements.push(duplicate);

    // Create SVG element
    this.addSVGElementToDOM(duplicate);

    // Select the new element
    this.clearSelection();
    this.selectElement(duplicate);

    // Update control panel if it exists
    if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
      window.swwControlPanel.updateLayers();
    }
  },

  /**
   * Group selected elements
   */
  groupSelectedElements() {
    if (this.selectedElements.size < 2) return;

    this.saveStateToHistory("group");

    // Generate group ID
    const groupId = `group-${Date.now()}`;

    // Apply group ID to all selected elements
    this.selectedElements.forEach((element) => {
      element.groupId = groupId;
    });

    // Update control panel if it exists
    if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
      window.swwControlPanel.updateLayers();
    }
  },

  /**
   * Ungroup selected elements
   */
  ungroupSelectedElements() {
    if (this.selectedElements.size === 0) return;

    // Check if any selected elements are grouped
    const hasGroupedElements = Array.from(this.selectedElements).some(
      (el) => el.groupId
    );
    if (!hasGroupedElements) return;

    this.saveStateToHistory("ungroup");

    // Get group IDs from selected elements
    const groupIds = new Set();
    this.selectedElements.forEach((element) => {
      if (element.groupId) {
        groupIds.add(element.groupId);
      }
    });

    // Remove group ID from all elements in these groups
    groupIds.forEach((groupId) => {
      this.elements.forEach((element) => {
        if (element.groupId === groupId) {
          delete element.groupId;
        }
      });
    });

    // Update control panel if it exists
    if (window.swwControlPanel && window.swwControlPanel.updateLayers) {
      window.swwControlPanel.updateLayers();
    }
  },
};
