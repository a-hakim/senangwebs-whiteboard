/**
 * PropertiesPanel.js
 * Real-time property editing panel for selected elements
 * Part of Phase 5: UI Panels
 */

export const PropertiesPanelMixin = {
  /**
   * Create the properties panel HTML structure
   * This is a large method (~657 lines) that builds all property controls
   */
  createPropertiesPanel() {
    const panel = document.createElement("div");
    panel.className = "sww-properties-panel";

    const panelHeader = document.createElement("div");
    panelHeader.className = "sww-panel-header";

    const panelHeaderTitle = document.createElement("span");
    panelHeaderTitle.textContent = "Properties";

    const panelHeaderCloseButton = document.createElement("button");
    panelHeaderCloseButton.className = "sww-panel-header-button";
    panelHeaderCloseButton.innerHTML = '<i class="ss ss-x-mark"></i>';
    panelHeaderCloseButton.title = "Close Properties Panel";

    panelHeaderCloseButton.addEventListener("click", () => {
      panel.classList.remove("visible");
    });

    panelHeader.appendChild(panelHeaderTitle);
    panelHeader.appendChild(panelHeaderCloseButton);

    // Stroke color
    const strokeGroup = document.createElement("div");
    strokeGroup.className = "sww-property-group";

    const strokeLabel = document.createElement("label");
    strokeLabel.className = "sww-property-label";
    strokeLabel.textContent = "Stroke Color";

    const strokeInput = document.createElement("input");
    strokeInput.type = "color";
    strokeInput.className = "sww-color-input";
    strokeInput.value = this.toolSettings.strokeColor;

    const strokeHexInput = document.createElement("input");
    strokeHexInput.type = "text";
    strokeHexInput.className = "sww-hex-input";
    strokeHexInput.placeholder = "#000000";
    strokeHexInput.value = this.toolSettings.strokeColor;
    strokeHexInput.maxLength = 7;

    const updateStrokeColor = (value) => {
      // Validate hex color
      if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
        this.toolSettings.strokeColor = value;
        strokeInput.value = value;
        strokeHexInput.value = value;
        this.updateSelectedElementProperty("strokeColor", value);
      }
    };

    strokeInput.addEventListener("change", (e) => {
      updateStrokeColor(e.target.value);
    });
    strokeInput.addEventListener("input", (e) => {
      updateStrokeColor(e.target.value);
    });

    strokeHexInput.addEventListener("change", (e) => {
      let value = e.target.value.trim();
      if (!value.startsWith("#")) {
        value = "#" + value;
      }
      updateStrokeColor(value);
    });
    strokeHexInput.addEventListener("input", (e) => {
      let value = e.target.value.trim();
      if (!value.startsWith("#")) {
        value = "#" + value;
      }
      if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
        updateStrokeColor(value);
      }
    });

    const strokeInputGroup = document.createElement("div");
    strokeInputGroup.className = "sww-property-input-group";
    strokeInputGroup.appendChild(strokeInput);
    strokeInputGroup.appendChild(strokeHexInput);

    strokeGroup.appendChild(strokeLabel);
    strokeGroup.appendChild(strokeInputGroup);

    // Stroke width
    const widthGroup = document.createElement("div");
    widthGroup.className = "sww-property-group";

    const widthLabel = document.createElement("label");
    widthLabel.className = "sww-property-label";
    widthLabel.textContent = "Stroke Width";

    const widthInput = document.createElement("input");
    widthInput.type = "number";
    widthInput.className = "sww-number-input";
    widthInput.min = "0";
    widthInput.max = "20";
    widthInput.step = "1";
    widthInput.value = this.toolSettings.strokeWidth;
    widthInput.addEventListener("input", (e) => {
      let value = parseInt(e.target.value);
      // Validate input range
      if (value < 0) value = 0;
      if (value > 20) value = 20;
      e.target.value = value;

      this.toolSettings.strokeWidth = value;
      // Update only strokeWidth property for selected elements
      this.updateSelectedElementProperty("strokeWidth", value);
    });

    const widthUnit = document.createElement("span");
    widthUnit.className = "sww-property-unit";
    widthUnit.textContent = "px";

    widthGroup.appendChild(widthLabel);

    const widthInputGroup = document.createElement("div");
    widthInputGroup.className = "sww-property-input-group";
    widthInputGroup.appendChild(widthInput);
    widthInputGroup.appendChild(widthUnit);

    widthGroup.appendChild(widthInputGroup);

    // Fill color
    const fillGroup = document.createElement("div");
    fillGroup.className = "sww-property-group";

    const fillLabel = document.createElement("label");
    fillLabel.className = "sww-property-label";
    fillLabel.textContent = "Fill Color";

    const fillInput = document.createElement("input");
    fillInput.type = "color";
    fillInput.className = "sww-color-input";
    fillInput.value =
      this.toolSettings.fillColor === "transparent"
        ? "#ffffff"
        : this.toolSettings.fillColor;

    const fillHexInput = document.createElement("input");
    fillHexInput.type = "text";
    fillHexInput.className = "sww-hex-input";
    fillHexInput.placeholder = "#ffffff";
    fillHexInput.value =
      this.toolSettings.fillColor === "transparent"
        ? "#ffffff"
        : this.toolSettings.fillColor;
    fillHexInput.maxLength = 7;

    const updateFillColor = (value) => {
      // Validate hex color
      if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
        this.toolSettings.fillColor = value;
        fillInput.value = value;
        fillHexInput.value = value;
        this.updateSelectedElementProperty("fillColor", value);
      }
    };

    fillInput.addEventListener("change", (e) => {
      updateFillColor(e.target.value);
    });
    fillInput.addEventListener("input", (e) => {
      updateFillColor(e.target.value);
    });

    fillHexInput.addEventListener("change", (e) => {
      let value = e.target.value.trim();
      if (!value.startsWith("#")) {
        value = "#" + value;
      }
      updateFillColor(value);
    });
    fillHexInput.addEventListener("input", (e) => {
      let value = e.target.value.trim();
      if (!value.startsWith("#")) {
        value = "#" + value;
      }
      if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
        updateFillColor(value);
      }
    });

    const fillInputGroup = document.createElement("div");
    fillInputGroup.className = "sww-property-input-group";
    fillInputGroup.appendChild(fillInput);
    fillInputGroup.appendChild(fillHexInput);

    fillGroup.appendChild(fillLabel);
    fillGroup.appendChild(fillInputGroup);

    // Fill style
    const fillStyleGroup = document.createElement("div");
    fillStyleGroup.className = "sww-property-group";

    const fillStyleLabel = document.createElement("label");
    fillStyleLabel.className = "sww-property-label";
    fillStyleLabel.textContent = "Fill Style";

    const fillStyleSelect = document.createElement("select");
    fillStyleSelect.className = "sww-select-input";

    const fillStyles = [
      { value: "transparent", text: "Transparent" },
      { value: "solid", text: "Solid" },
      { value: "gradient", text: "Gradient" },
    ];

    fillStyles.forEach((style) => {
      const option = document.createElement("option");
      option.value = style.value;
      option.textContent = style.text;
      fillStyleSelect.appendChild(option);
    });

    fillStyleSelect.value = this.toolSettings.fillStyle;
    fillStyleSelect.addEventListener("change", (e) => {
      this.toolSettings.fillStyle = e.target.value;
      // Update only fillStyle property for selected elements
      this.updateSelectedElementProperty("fillStyle", e.target.value);
      // Show/hide gradient controls
      this.updateGradientControlsVisibility();
    });

    fillStyleGroup.appendChild(fillStyleLabel);
    fillStyleGroup.appendChild(fillStyleSelect);

    // Gradient Controls
    const gradientGroup = document.createElement("div");
    gradientGroup.className = "sww-property-group sww-gradient-group";
    gradientGroup.classList.toggle(
      "visible",
      this.toolSettings.fillStyle === "gradient"
    );
    gradientGroup.classList.toggle(
      "hidden",
      this.toolSettings.fillStyle !== "gradient"
    );

    // Gradient Type
    const gradientTypeGroup = document.createElement("div");
    gradientTypeGroup.className = "sww-property-subgroup";

    const gradientTypeLabel = document.createElement("label");
    gradientTypeLabel.className = "sww-property-label";
    gradientTypeLabel.textContent = "Gradient Type";

    const gradientTypeSelect = document.createElement("select");
    gradientTypeSelect.className = "sww-select-input";

    const gradientTypes = [
      { value: "linear", text: "Linear" },
      { value: "radial", text: "Radial" },
    ];

    gradientTypes.forEach((type) => {
      const option = document.createElement("option");
      option.value = type.value;
      option.textContent = type.text;
      gradientTypeSelect.appendChild(option);
    });

    gradientTypeSelect.value = this.toolSettings.gradientType;
    gradientTypeSelect.addEventListener("change", (e) => {
      this.toolSettings.gradientType = e.target.value;
      this.updateSelectedElementProperty("gradientType", e.target.value);
    });

    gradientTypeGroup.appendChild(gradientTypeLabel);
    gradientTypeGroup.appendChild(gradientTypeSelect);

    // Gradient Stops
    const gradientStopsGroup = document.createElement("div");
    gradientStopsGroup.className = "sww-property-subgroup";

    const gradientStopsLabel = document.createElement("label");
    gradientStopsLabel.className = "sww-property-label";
    gradientStopsLabel.textContent = "Gradient Stops";

    const gradientStopsContainer = document.createElement("div");
    gradientStopsContainer.className = "sww-gradient-stops-container";

    // Add Gradient Stop Button
    const addStopButton = document.createElement("button");
    addStopButton.className = "sww-gradient-add-stop";
    addStopButton.textContent = "+ Add Stop";
    addStopButton.addEventListener("click", () => {
      this.addGradientStop();
    });

    gradientStopsGroup.appendChild(gradientStopsLabel);
    gradientStopsGroup.appendChild(gradientStopsContainer);
    gradientStopsGroup.appendChild(addStopButton);

    gradientGroup.appendChild(gradientTypeGroup);
    gradientGroup.appendChild(gradientStopsGroup);

    // Initialize gradient stops UI
    this.updateGradientStopsUI();

    // Opacity
    const opacityGroup = document.createElement("div");
    opacityGroup.className = "sww-property-group";

    const opacityLabel = document.createElement("label");
    opacityLabel.className = "sww-property-label";
    opacityLabel.textContent = "Opacity";

    const opacityInput = document.createElement("input");
    opacityInput.type = "number";
    opacityInput.className = "sww-number-input";
    opacityInput.min = "0";
    opacityInput.max = "100";
    opacityInput.step = "5";
    opacityInput.value = Math.round(this.toolSettings.opacity * 100);
    opacityInput.addEventListener("input", (e) => {
      let value = parseInt(e.target.value);
      // Validate input range
      if (value < 0) value = 0;
      if (value > 100) value = 100;
      e.target.value = value;

      // Convert percentage to decimal for internal use
      const decimalValue = value / 100;
      this.toolSettings.opacity = decimalValue;
      // Update only opacity property for selected elements
      this.updateSelectedElementProperty("opacity", decimalValue);
    });

    const opacityPercentage = document.createElement("span");
    opacityPercentage.className = "sww-property-unit";
    opacityPercentage.textContent = "%";

    opacityGroup.appendChild(opacityLabel);

    const opacityInputGroup = document.createElement("div");
    opacityInputGroup.className = "sww-property-input-group";
    opacityInputGroup.appendChild(opacityInput);
    opacityInputGroup.appendChild(opacityPercentage);

    opacityGroup.appendChild(opacityInputGroup);

    // Width property
    const elementWidthGroup = document.createElement("div");
    elementWidthGroup.className = "sww-property-group";

    const elementWidthLabel = document.createElement("label");
    elementWidthLabel.className = "sww-property-label";
    elementWidthLabel.textContent = "Width";

    const elementWidthInput = document.createElement("input");
    elementWidthInput.type = "number";
    elementWidthInput.className = "sww-number-input";
    elementWidthInput.min = "1";
    elementWidthInput.step = "1";
    elementWidthInput.value = "100";

    const elementWidthUnit = document.createElement("span");
    elementWidthUnit.className = "sww-property-unit";
    elementWidthUnit.textContent = "px";

    elementWidthInput.addEventListener("input", (e) => {
      let value = parseInt(e.target.value);
      if (value < 1) value = 1;
      e.target.value = value;

      // Update width property for selected elements
      this.updateSelectedElementProperty("width", value);
    });

    elementWidthGroup.appendChild(elementWidthLabel);

    const elementWidthInputGroup = document.createElement("div");
    elementWidthInputGroup.className = "sww-property-input-group";
    elementWidthInputGroup.appendChild(elementWidthInput);
    elementWidthInputGroup.appendChild(elementWidthUnit);

    elementWidthGroup.appendChild(elementWidthInputGroup);

    // Height property
    const elementHeightGroup = document.createElement("div");
    elementHeightGroup.className = "sww-property-group";

    const elementHeightLabel = document.createElement("label");
    elementHeightLabel.className = "sww-property-label";
    elementHeightLabel.textContent = "Height";

    const elementHeightInput = document.createElement("input");
    elementHeightInput.type = "number";
    elementHeightInput.className = "sww-number-input";
    elementHeightInput.min = "1";
    elementHeightInput.step = "1";
    elementHeightInput.value = "100";

    const elementHeightUnit = document.createElement("span");
    elementHeightUnit.className = "sww-property-unit";
    elementHeightUnit.textContent = "px";

    elementHeightInput.addEventListener("input", (e) => {
      let value = parseInt(e.target.value);
      if (value < 1) value = 1;
      e.target.value = value;

      // Update height property for selected elements
      this.updateSelectedElementProperty("height", value);
    });

    elementHeightGroup.appendChild(elementHeightLabel);

    const elementHeightInputGroup = document.createElement("div");
    elementHeightInputGroup.className = "sww-property-input-group";
    elementHeightInputGroup.appendChild(elementHeightInput);
    elementHeightInputGroup.appendChild(elementHeightUnit);

    elementHeightGroup.appendChild(elementHeightInputGroup);

    // Rotation property
    const rotationGroup = document.createElement("div");
    rotationGroup.className = "sww-property-group";

    const rotationLabel = document.createElement("label");
    rotationLabel.className = "sww-property-label";
    rotationLabel.textContent = "Rotation";

    const rotationInput = document.createElement("input");
    rotationInput.type = "number";
    rotationInput.className = "sww-number-input";
    rotationInput.min = "-360";
    rotationInput.max = "360";
    rotationInput.step = "1";
    rotationInput.value = "0";

    const rotationUnit = document.createElement("span");
    rotationUnit.className = "sww-property-unit";
    rotationUnit.textContent = "°";

    rotationInput.addEventListener("input", (e) => {
      let value = parseInt(e.target.value);
      // Normalize rotation to -360 to 360 range
      if (value < -360) value = -360;
      if (value > 360) value = 360;
      e.target.value = value;

      // Update rotation property for selected elements
      this.updateSelectedElementProperty("rotation", value);
    });

    rotationGroup.appendChild(rotationLabel);

    const rotationInputGroup = document.createElement("div");
    rotationInputGroup.className = "sww-property-input-group";
    rotationInputGroup.appendChild(rotationInput);
    rotationInputGroup.appendChild(rotationUnit);

    rotationGroup.appendChild(rotationInputGroup);

    // Text properties section
    const textSection = document.createElement("div");
    textSection.className = "sww-text-properties sww-text-section hidden";

    const fontSizeGroup = document.createElement("div");
    fontSizeGroup.className = "sww-property-group";

    const fontSizeLabel = document.createElement("label");
    fontSizeLabel.className = "sww-property-label";
    fontSizeLabel.textContent = "Font Size";

    const fontSizeInput = document.createElement("input");
    fontSizeInput.type = "number";
    fontSizeInput.className = "sww-number-input";
    fontSizeInput.min = "8";
    fontSizeInput.max = "72";
    fontSizeInput.step = "1";
    fontSizeInput.value = this.toolSettings.fontSize;

    const fontSizeUnit = document.createElement("span");
    fontSizeUnit.className = "sww-property-unit";
    fontSizeUnit.textContent = "px";

    fontSizeInput.addEventListener("input", (e) => {
      let value = parseInt(e.target.value);
      // Validate input range
      if (value < 8) value = 8;
      if (value > 72) value = 72;
      e.target.value = value;

      this.toolSettings.fontSize = value;
      fontSizeUnit.textContent = "px";

      // Update only fontSize property for selected elements
      this.updateSelectedElementProperty("fontSize", value);
    });

    fontSizeGroup.appendChild(fontSizeLabel);

    const fontSizeInputGroup = document.createElement("div");
    fontSizeInputGroup.className = "sww-property-input-group";
    fontSizeInputGroup.appendChild(fontSizeInput);
    fontSizeInputGroup.appendChild(fontSizeUnit);

    fontSizeGroup.appendChild(fontSizeInputGroup);

    // Font family
    const fontFamilyGroup = document.createElement("div");
    fontFamilyGroup.className = "sww-property-group";

    const fontFamilyLabel = document.createElement("label");
    fontFamilyLabel.className = "sww-property-label";
    fontFamilyLabel.textContent = "Font Family";

    const fontFamilySelect = document.createElement("select");
    fontFamilySelect.className = "sww-select-input";

    // Import SWWInstance to access FONT_FAMILIES constant
    import("../core/SWWInstance.js").then((module) => {
      const SWWInstance = module.SWWInstance;
      SWWInstance.FONT_FAMILIES.forEach((font) => {
        const option = document.createElement("option");
        option.value = font.value;
        option.textContent = font.text;
        option.className = "sww-font-family-option";
        option.style.fontFamily = font.value;
        fontFamilySelect.appendChild(option);
      });
    });

    fontFamilySelect.value = this.toolSettings.fontFamily;
    fontFamilySelect.addEventListener("change", (e) => {
      this.toolSettings.fontFamily = e.target.value;
      // Update only fontFamily property for selected elements
      this.updateSelectedElementProperty("fontFamily", e.target.value);
    });

    fontFamilyGroup.appendChild(fontFamilyLabel);
    fontFamilyGroup.appendChild(fontFamilySelect);

    // Text color (separate from stroke color for clarity)
    const textColorGroup = document.createElement("div");
    textColorGroup.className = "sww-property-group";

    const textColorLabel = document.createElement("label");
    textColorLabel.className = "sww-property-label";
    textColorLabel.textContent = "Text Color";

    const textColorInput = document.createElement("input");
    textColorInput.type = "color";
    textColorInput.className = "sww-color-input";
    textColorInput.value = this.toolSettings.textColor;

    const textColorHexInput = document.createElement("input");
    textColorHexInput.type = "text";
    textColorHexInput.className = "sww-hex-input";
    textColorHexInput.placeholder = "#000000";
    textColorHexInput.value = this.toolSettings.textColor;
    textColorHexInput.maxLength = 7;

    const updateTextColor = (value) => {
      // Validate hex color
      if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
        this.toolSettings.textColor = value;
        textColorInput.value = value;
        textColorHexInput.value = value;
        this.updateSelectedElementProperty("textColor", value);
      }
    };

    textColorInput.addEventListener("change", (e) => {
      updateTextColor(e.target.value);
    });
    textColorInput.addEventListener("input", (e) => {
      updateTextColor(e.target.value);
    });

    textColorHexInput.addEventListener("change", (e) => {
      let value = e.target.value.trim();
      if (!value.startsWith("#")) {
        value = "#" + value;
      }
      updateTextColor(value);
    });
    textColorHexInput.addEventListener("input", (e) => {
      let value = e.target.value.trim();
      if (!value.startsWith("#")) {
        value = "#" + value;
      }
      if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
        updateTextColor(value);
      }
    });

    const textColorInputGroup = document.createElement("div");
    textColorInputGroup.className = "sww-property-input-group";
    textColorInputGroup.appendChild(textColorInput);
    textColorInputGroup.appendChild(textColorHexInput);

    textColorGroup.appendChild(textColorLabel);
    textColorGroup.appendChild(textColorInputGroup);

    // Text alignment
    const textAlignGroup = document.createElement("div");
    textAlignGroup.className = "sww-property-group";

    const textAlignLabel = document.createElement("label");
    textAlignLabel.className = "sww-property-label";
    textAlignLabel.textContent = "Text Align";

    const textAlignContainer = document.createElement("div");
    textAlignContainer.className = "sww-align-buttons sww-text-align-container";

    const alignments = [
      { value: "left", icon: "ss ss-text-align-left", title: "Align Left" },
      {
        value: "center",
        icon: "ss ss-text-align-center",
        title: "Align Center",
      },
      { value: "right", icon: "ss ss-text-align-right", title: "Align Right" },
    ];

    alignments.forEach((align) => {
      const button = document.createElement("button");
      button.className = "sww-align-button";
      button.setAttribute("data-align", align.value);

      const icon = document.createElement("i");
      icon.className = align.icon;
      button.appendChild(icon);

      button.title = align.title;

      if (align.value === (this.toolSettings.textAlign || "left")) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }

      button.addEventListener("click", () => {
        // Update all align buttons
        textAlignContainer
          .querySelectorAll(".sww-align-button")
          .forEach((btn) => {
            btn.classList.remove("active");
          });

        // Highlight selected button
        button.classList.add("active");

        // Update setting
        this.toolSettings.textAlign = align.value;
        // Update only textAlign property for selected elements
        this.updateSelectedElementProperty("textAlign", align.value);
      });

      textAlignContainer.appendChild(button);
    });

    textAlignGroup.appendChild(textAlignLabel);
    textAlignGroup.appendChild(textAlignContainer);

    textSection.appendChild(fontSizeGroup);
    textSection.appendChild(fontFamilyGroup);
    textSection.appendChild(textColorGroup);
    textSection.appendChild(textAlignGroup);

    panel.appendChild(panelHeader);
    panel.appendChild(strokeGroup);
    panel.appendChild(widthGroup);
    panel.appendChild(fillGroup);
    panel.appendChild(fillStyleGroup);
    panel.appendChild(gradientGroup);
    panel.appendChild(opacityGroup);
    panel.appendChild(elementWidthGroup);
    panel.appendChild(elementHeightGroup);
    panel.appendChild(rotationGroup);
    panel.appendChild(textSection);

    this.container.appendChild(panel);
    this.propertiesPanel = panel;
  },

  /**
   * Sync properties panel with selected element
   * Also called updatePropertiesPanel in some places
   */
  syncPropertiesPanel() {
    if (!this.propertiesPanel) return;

    // Hide properties panel if no selection, multiple elements, or grouped elements
    const hasGroupedSelection = Array.from(this.selectedElements).some(
      (el) => el.groupId
    );
    const hasMultipleSelection = this.selectedElements.size > 1;

    if (
      this.selectedElements.size === 0 ||
      hasMultipleSelection ||
      hasGroupedSelection
    ) {
      this.propertiesPanel.classList.remove("visible");

      // When no selection, ensure properties panel shows current tool settings
      if (this.selectedElements.size === 0) {
        // Update stroke color input to current tool setting
        const strokeInput = this.propertiesPanel.querySelector(
          'input[type="color"]'
        );
        if (
          strokeInput &&
          strokeInput.value !== this.toolSettings.strokeColor
        ) {
          strokeInput.value = this.toolSettings.strokeColor;
        }

        // Update stroke hex input
        const strokeHexInput =
          this.propertiesPanel.querySelector(".sww-hex-input");
        if (
          strokeHexInput &&
          strokeHexInput.value !== this.toolSettings.strokeColor
        ) {
          strokeHexInput.value = this.toolSettings.strokeColor;
        }

        // Update fill color input to current tool setting
        const fillInputs = this.propertiesPanel.querySelectorAll(
          'input[type="color"]'
        );
        if (fillInputs[1] && this.toolSettings.fillColor !== "transparent") {
          const expectedFillValue = this.toolSettings.fillColor;
          if (fillInputs[1].value !== expectedFillValue) {
            fillInputs[1].value = expectedFillValue;
          }
        }

        // Update fill hex input
        const fillHexInputs =
          this.propertiesPanel.querySelectorAll(".sww-hex-input");
        if (fillHexInputs[1] && this.toolSettings.fillColor !== "transparent") {
          const expectedFillValue = this.toolSettings.fillColor;
          if (fillHexInputs[1].value !== expectedFillValue) {
            fillHexInputs[1].value = expectedFillValue;
          }
        }
      }

      // Update gradient controls visibility for no selection (use tool settings)
      this.updateGradientControlsVisibility();
      return;
    }

    // Show properties panel for single, non-grouped element
    this.propertiesPanel.classList.add("visible");

    // Get the first selected element to sync properties
    const firstElement = this.selectedElements.values().next().value;

    if (firstElement) {
      // Update stroke color input (first color input)
      const strokeInput = this.propertiesPanel.querySelector(
        'input[type="color"]'
      );
      if (strokeInput) {
        strokeInput.value = firstElement.strokeColor || "#000000";
      }

      // Update stroke hex input
      const strokeHexInput =
        this.propertiesPanel.querySelector(".sww-hex-input");
      if (strokeHexInput) {
        strokeHexInput.value = firstElement.strokeColor || "#000000";
      }

      // Update stroke width input (number input)
      const strokeWidthInput = this.propertiesPanel.querySelector(
        'input[type="number"][min="0"][max="20"]'
      );
      if (strokeWidthInput) {
        strokeWidthInput.value = firstElement.strokeWidth || 0;
      }

      // Update fill color input (second color input)
      const fillInputs = this.propertiesPanel.querySelectorAll(
        'input[type="color"]'
      );
      if (fillInputs[1]) {
        fillInputs[1].value =
          firstElement.fillColor === "transparent"
            ? "#ffffff"
            : firstElement.fillColor || "#ffffff";
      }

      // Update fill hex input
      const fillHexInputs =
        this.propertiesPanel.querySelectorAll(".sww-hex-input");
      if (fillHexInputs[1]) {
        fillHexInputs[1].value =
          firstElement.fillColor === "transparent"
            ? "#ffffff"
            : firstElement.fillColor || "#ffffff";
      }

      // Update fill style select
      const fillStyleSelect = this.propertiesPanel.querySelector(
        "select.sww-select-input"
      );
      if (fillStyleSelect) {
        fillStyleSelect.value = firstElement.fillStyle || "transparent";
      }

      // Update gradient properties
      if (firstElement.gradientType) {
        const gradientTypeSelect = this.propertiesPanel.querySelector(
          ".sww-gradient-group select"
        );
        if (gradientTypeSelect) {
          gradientTypeSelect.value = firstElement.gradientType;
        }
      }

      // Update gradient controls visibility and stops
      this.updateGradientControlsVisibility();
      this.updateGradientStopsUI();

      // Update opacity input (number input with max 100)
      const opacityInput = this.propertiesPanel.querySelector(
        'input[type="number"][min="0"][max="100"]'
      );
      if (opacityInput) {
        opacityInput.value = Math.round((firstElement.opacity || 1) * 100);
      }

      // Update width input
      const widthInputs = this.propertiesPanel.querySelectorAll(
        'input[type="number"][min="1"]'
      );
      const widthInput = widthInputs[0]; // First input with min="1" should be width
      if (widthInput) {
        widthInput.value = Math.abs(firstElement.width) || 100;
      }

      // Update height input
      const heightInput = widthInputs[1]; // Second input with min="1" should be height
      if (heightInput) {
        heightInput.value = Math.abs(firstElement.height) || 100;
      }

      // Update rotation input
      const rotationInput = this.propertiesPanel.querySelector(
        'input[type="number"][min="-360"][max="360"]'
      );
      if (rotationInput) {
        rotationInput.value = firstElement.rotation || 0;
      }

      // Update text properties visibility and values
      this.updateTextPropertiesVisibility();

      // Update text-specific properties if it's a text or markdown element
      if (firstElement.type === "text" || firstElement.type === "markdown") {
        // Update font family select (for both text and markdown elements)
        const fontFamilySelect = this.propertiesPanel.querySelector(
          ".sww-text-properties select"
        );
        if (fontFamilySelect) {
          fontFamilySelect.value = firstElement.fontFamily || "Arial";
        }

        // Only show text color for markdown elements, all text properties for text elements
        if (firstElement.type === "text") {
          // Update font size input
          const fontSizeInput = this.propertiesPanel.querySelector(
            '.sww-text-properties input[type="number"][min="8"][max="72"]'
          );
          if (fontSizeInput) {
            fontSizeInput.value = firstElement.fontSize || 16;
          }

          // Update text alignment buttons (only for text elements)
          const alignButtons =
            this.propertiesPanel.querySelectorAll(".sww-align-button");
          alignButtons.forEach((button) => {
            const align = button.getAttribute("data-align");
            if (align === (firstElement.textAlign || "left")) {
              button.classList.add("active");
            } else {
              button.classList.remove("active");
            }
          });
        }

        // Update text color input (for both text and markdown elements)
        const textColorInput = this.propertiesPanel.querySelector(
          '.sww-text-properties input[type="color"]'
        );
        if (textColorInput) {
          const textColorValue =
            firstElement.textColor || firstElement.strokeColor || "#000000";
          textColorInput.value = textColorValue;
        }

        // Update text color hex input (for both text and markdown elements)
        const textColorHexInputs = this.propertiesPanel.querySelectorAll(
          ".sww-text-properties .sww-hex-input"
        );
        const textColorHexInput =
          textColorHexInputs[textColorHexInputs.length - 1]; // Last hex input should be text color
        if (textColorHexInput) {
          const textColorValue =
            firstElement.textColor || firstElement.strokeColor || "#000000";
          textColorHexInput.value = textColorValue;
        }
      }
    }

    // Update text properties visibility based on current selection
    this.updateTextPropertiesVisibility();
  },

  /**
   * Alias for syncPropertiesPanel - some code calls it this way
   */
  updatePropertiesPanel() {
    this.syncPropertiesPanel();
  },

  /**
   * Real-time update of specific properties during manipulation (resize/rotate)
   * More efficient than full syncPropertiesPanel for live updates
   */
  updatePropertiesPanelRealTime(properties = []) {
    if (!this.propertiesPanel || this.selectedElements.size !== 1) return;

    const firstElement = this.selectedElements.values().next().value;
    if (!firstElement) return;

    // Update width if requested or if no specific properties specified
    if (properties.length === 0 || properties.includes("width")) {
      const widthInputs = this.propertiesPanel.querySelectorAll(
        'input[type="number"][min="1"]'
      );
      const widthInput = widthInputs[0]; // First input with min="1" should be width
      if (widthInput) {
        widthInput.value = Math.abs(firstElement.width) || 100;
      }
    }

    // Update height if requested or if no specific properties specified
    if (properties.length === 0 || properties.includes("height")) {
      const widthInputs = this.propertiesPanel.querySelectorAll(
        'input[type="number"][min="1"]'
      );
      const heightInput = widthInputs[1]; // Second input with min="1" should be height
      if (heightInput) {
        heightInput.value = Math.abs(firstElement.height) || 100;
      }
    }

    // Update rotation if requested or if no specific properties specified
    if (properties.length === 0 || properties.includes("rotation")) {
      const rotationInput = this.propertiesPanel.querySelector(
        'input[type="number"][min="-360"][max="360"]'
      );
      if (rotationInput) {
        rotationInput.value = Math.round(firstElement.rotation || 0);
      }
    }
  },

  /**
   * Commit any pending property changes
   * Forces blur on active inputs to trigger change events
   */
  commitPropertiesPanelChanges() {
    if (!this.propertiesPanel) return;

    // Force any focused input to trigger its change event
    const activeElement = document.activeElement;
    if (activeElement && activeElement.closest(".sww-properties-panel")) {
      // If an input in the properties panel is active, blur it to trigger change event
      activeElement.blur();
      // Give a brief moment for the change event to process
      setTimeout(() => {
        // Re-focus the canvas or appropriate element if needed
        if (this.svg) {
          this.svg.focus();
        }
      }, 10);
    }
  },

  /**
   * Update a specific property for all selected elements
   * @param {string} propertyName - The property to update
   * @param {*} value - The new value
   */
  updateSelectedElementProperty(propertyName, value) {
    if (this.selectedElements.size === 0) return;

    this.selectedElements.forEach((element) => {
      // Only update the specific property
      if (propertyName === "fontSize" && element.type === "text") {
        element.fontSize = value;
      } else if (
        propertyName === "fontFamily" &&
        (element.type === "text" || element.type === "markdown")
      ) {
        element.fontFamily = value;
      } else if (propertyName === "textAlign" && element.type === "text") {
        element.textAlign = value;
      } else if (
        propertyName === "textColor" &&
        (element.type === "text" || element.type === "markdown")
      ) {
        element.textColor = value;
      } else if (propertyName === "strokeColor") {
        element.strokeColor = value;
      } else if (propertyName === "strokeWidth") {
        element.strokeWidth = value;
      } else if (propertyName === "fillColor") {
        element.fillColor = value;
      } else if (propertyName === "fillStyle") {
        element.fillStyle = value;
      } else if (propertyName === "opacity") {
        element.opacity = value;
      } else if (propertyName === "width") {
        element.width = Math.abs(value); // Ensure positive width
      } else if (propertyName === "height") {
        element.height = Math.abs(value); // Ensure positive height
      } else if (propertyName === "rotation") {
        element.rotation = value;
      } else if (propertyName === "gradientType") {
        element.gradientType = value;
      } else if (propertyName === "gradientStops") {
        element.gradientStops = value;
      }

      this.updateSVGElement(element);
    });

    // Update selection handles after property change to reflect new dimensions
    this.updateSelectionHandles();

    // Save state after property change
    this.saveStateToHistory("updateProperty");

    // Update layers panel to reflect any changes
    this.updateControlPanelLayers();
  },

  /**
   * Update text properties section visibility based on selection
   */
  updateTextPropertiesVisibility() {
    if (!this.propertiesPanel) return;

    const textPropertiesSection = this.propertiesPanel.querySelector(
      ".sww-text-properties"
    );
    if (!textPropertiesSection) return;

    // Check if any selected elements are text, markdown, or image elements
    const hasTextElements = Array.from(this.selectedElements).some(
      (element) => element.type === "text"
    );
    const hasMarkdownElements = Array.from(this.selectedElements).some(
      (element) => element.type === "markdown"
    );
    const hasImageElements = Array.from(this.selectedElements).some(
      (element) => element.type === "image"
    );
    const hasWebsiteElements = Array.from(this.selectedElements).some(
      (element) => element.type === "website"
    );

    // Show or hide text properties based on selection
    if (hasTextElements || hasMarkdownElements) {
      textPropertiesSection.classList.remove("hidden");
      textPropertiesSection.classList.add("visible");

      // Find property groups by their labels
      const propertyGroups = textPropertiesSection.querySelectorAll(
        ".sww-property-group"
      );

      propertyGroups.forEach((group) => {
        const label = group.querySelector(".sww-property-label");
        if (label) {
          const labelText = label.textContent.trim();

          if (hasMarkdownElements && !hasTextElements) {
            // For markdown elements only, hide font size and text align, but keep font family
            if (labelText === "Font Size" || labelText === "Text Align") {
              group.style.display = "none";
            } else {
              group.style.display = "flex";
            }
          } else {
            // For text elements or mixed selection, show all properties
            group.style.display = "flex";
          }
        }
      });
    } else {
      textPropertiesSection.classList.remove("visible");
      textPropertiesSection.classList.add("hidden");
    }

    // Handle fill properties visibility for image and website elements
    if (
      (hasImageElements || hasWebsiteElements || hasTextElements) &&
      !hasMarkdownElements
    ) {
      // For image, website, and text elements, hide fill color and fill style properties
      const allPropertyGroups = this.propertiesPanel.querySelectorAll(
        ".sww-property-group"
      );

      allPropertyGroups.forEach((group) => {
        const label = group.querySelector(".sww-property-label");
        if (label) {
          const labelText = label.textContent.trim();

          if (labelText === "Fill Color" || labelText === "Fill Style") {
            group.style.display = "none";
          }
        }
      });

      // For text elements, also hide gradient controls since they don't apply
      if (hasTextElements) {
        const gradientGroup = this.propertiesPanel.querySelector(
          ".sww-gradient-group"
        );
        if (gradientGroup) {
          gradientGroup.style.display = "none";
        }
      }
    } else {
      // For other elements or mixed selection, show fill style but handle fill color based on gradient
      const allPropertyGroups = this.propertiesPanel.querySelectorAll(
        ".sww-property-group"
      );

      allPropertyGroups.forEach((group) => {
        const label = group.querySelector(".sww-property-label");
        if (label) {
          const labelText = label.textContent.trim();

          if (labelText === "Fill Style") {
            group.style.display = "flex";
          }
        }
      });

      // Update gradient controls visibility (this will also handle fill color visibility)
      if (!hasTextElements && !hasImageElements && !hasWebsiteElements) {
        this.updateGradientControlsVisibility();
      } else {
        // For text/image/website elements, ensure gradient controls are hidden
        const gradientGroup = this.propertiesPanel.querySelector(
          ".sww-gradient-group"
        );
        if (gradientGroup) {
          gradientGroup.style.display = "none";
        }
      }
    }
  },

  /**
   * Update gradient controls visibility based on fill style
   */
  updateGradientControlsVisibility() {
    if (!this.propertiesPanel) return;

    const gradientGroup = this.propertiesPanel.querySelector(
      ".sww-gradient-group"
    );
    if (!gradientGroup) return;

    // Check if we have text elements selected (they don't support gradients)
    const hasTextElements = Array.from(this.selectedElements).some(
      (element) => element.type === "text"
    );

    // Hide gradient controls for text elements
    if (hasTextElements) {
      gradientGroup.style.display = "none";
      // Also hide fill color for text elements
      this.updateFillColorVisibility(false);
      return;
    }

    // Check the actual fill style of selected elements or tool settings
    let isGradientStyle = false;

    if (this.selectedElements.size > 0) {
      // If elements are selected, check their fill style
      isGradientStyle = Array.from(this.selectedElements).some(
        (element) => element.fillStyle === "gradient"
      );
    } else {
      // If no elements selected, use tool settings
      isGradientStyle = this.toolSettings.fillStyle === "gradient";
    }

    gradientGroup.style.display = isGradientStyle ? "block" : "none";

    // Hide/show fill color controls based on gradient selection
    this.updateFillColorVisibility(!isGradientStyle);
  },

  /**
   * Update fill color visibility based on element type and gradient selection
   */
  updateFillColorVisibility(shouldShow) {
    if (!this.propertiesPanel) return;

    // Check if we have image, website, or text elements selected (they should hide fill color)
    const hasImageElements = Array.from(this.selectedElements).some(
      (element) => element.type === "image"
    );
    const hasWebsiteElements = Array.from(this.selectedElements).some(
      (element) => element.type === "website"
    );
    const hasTextElements = Array.from(this.selectedElements).some(
      (element) => element.type === "text"
    );
    const hasMarkdownElements = Array.from(this.selectedElements).some(
      (element) => element.type === "markdown"
    );

    // Hide fill color for image/website/text elements, or when gradient is selected for other elements
    const shouldHideFillColor =
      (hasImageElements || hasWebsiteElements || hasTextElements) &&
      !hasMarkdownElements;
    const finalShouldShow = shouldHideFillColor ? false : shouldShow;

    // Find the fill color property group by looking for the "Fill Color" label
    const allPropertyGroups = this.propertiesPanel.querySelectorAll(
      ".sww-property-group"
    );

    allPropertyGroups.forEach((group) => {
      const label = group.querySelector(".sww-property-label");
      if (label && label.textContent.trim() === "Fill Color") {
        group.style.display = finalShouldShow ? "flex" : "none";
      }
    });
  },

  /**
   * Update gradient stops UI
   */
  updateGradientStopsUI() {
    if (!this.propertiesPanel) return;

    const container = this.propertiesPanel.querySelector(
      ".sww-gradient-stops-container"
    );
    if (!container) return;

    // Clear existing stops
    container.innerHTML = "";

    // Get gradient stops from tool settings or selected element
    let gradientStops = this.toolSettings.gradientStops;
    if (this.selectedElements.size === 1) {
      const selectedElement = Array.from(this.selectedElements)[0];
      if (selectedElement.gradientStops) {
        gradientStops = selectedElement.gradientStops;
      }
    }

    // Create UI for each gradient stop
    gradientStops.forEach((stop, index) => {
      const stopElement = this.createGradientStopElement(stop, index);
      container.appendChild(stopElement);
    });
  },

  /**
   * Create a gradient stop element
   */
  createGradientStopElement(stop, index) {
    const stopDiv = document.createElement("div");
    stopDiv.className = "sww-gradient-stop";

    // Color input
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.className = "sww-color-input";
    colorInput.value = stop.color;
    colorInput.addEventListener("change", (e) => {
      this.updateGradientStop(index, "color", e.target.value);
    });

    // Offset input (0-100%)
    const offsetInput = document.createElement("input");
    offsetInput.type = "number";
    offsetInput.className = "sww-number-input";
    offsetInput.min = "0";
    offsetInput.max = "100";
    offsetInput.value = stop.offset;
    offsetInput.addEventListener("input", (e) => {
      this.updateGradientStop(index, "offset", parseInt(e.target.value));
    });

    // Offset label
    const offsetLabel = document.createElement("span");
    offsetLabel.className = "sww-gradient-stop-label";
    offsetLabel.textContent = "%";

    // Remove button (only show if more than 2 stops)
    const removeButton = document.createElement("button");
    removeButton.className = "sww-gradient-remove-stop";
    removeButton.textContent = "×";
    removeButton.addEventListener("click", () => {
      this.removeGradientStop(index);
    });

    stopDiv.appendChild(colorInput);
    stopDiv.appendChild(offsetInput);
    stopDiv.appendChild(offsetLabel);

    // Only show remove button if we have more than 2 stops
    const gradientStops =
      this.selectedElements.size === 1
        ? Array.from(this.selectedElements)[0].gradientStops ||
          this.toolSettings.gradientStops
        : this.toolSettings.gradientStops;

    if (gradientStops.length > 2) {
      stopDiv.appendChild(removeButton);
    }

    return stopDiv;
  },

  /**
   * Add a gradient stop
   */
  addGradientStop() {
    // Determine which gradient stops to modify
    let gradientStops;
    if (this.selectedElements.size === 1) {
      const selectedElement = Array.from(this.selectedElements)[0];
      if (selectedElement.gradientStops) {
        gradientStops = [...selectedElement.gradientStops];
      } else {
        gradientStops = [...this.toolSettings.gradientStops];
      }
    } else {
      gradientStops = [...this.toolSettings.gradientStops];
    }

    // Find a good position for the new stop (middle of the largest gap)
    gradientStops.sort((a, b) => a.offset - b.offset);
    let newOffset = 50;

    if (gradientStops.length >= 2) {
      let maxGap = 0;
      let maxGapMidpoint = 50;

      for (let i = 0; i < gradientStops.length - 1; i++) {
        const gap = gradientStops[i + 1].offset - gradientStops[i].offset;
        if (gap > maxGap) {
          maxGap = gap;
          maxGapMidpoint = gradientStops[i].offset + gap / 2;
        }
      }

      newOffset = Math.round(maxGapMidpoint);
    }

    // Add new stop
    const newStop = {
      offset: newOffset,
      color: "#808080", // Gray as default
    };

    gradientStops.push(newStop);
    gradientStops.sort((a, b) => a.offset - b.offset);

    // Update tool settings and selected elements
    this.toolSettings.gradientStops = gradientStops;
    if (this.selectedElements.size > 0) {
      this.updateSelectedElementProperty("gradientStops", gradientStops);
    }

    // Update UI
    this.updateGradientStopsUI();
  },

  /**
   * Remove a gradient stop
   */
  removeGradientStop(index) {
    // Don't allow removing if only 2 stops remain
    let gradientStops =
      this.selectedElements.size === 1
        ? Array.from(this.selectedElements)[0].gradientStops ||
          this.toolSettings.gradientStops
        : this.toolSettings.gradientStops;

    if (gradientStops.length <= 2) return;

    gradientStops = [...gradientStops];
    gradientStops.splice(index, 1);

    // Update tool settings and selected elements
    this.toolSettings.gradientStops = gradientStops;
    if (this.selectedElements.size > 0) {
      this.updateSelectedElementProperty("gradientStops", gradientStops);
    }

    // Update UI
    this.updateGradientStopsUI();
  },

  /**
   * Update a specific property of a gradient stop
   */
  updateGradientStop(index, property, value) {
    // Get current gradient stops
    let gradientStops =
      this.selectedElements.size === 1
        ? Array.from(this.selectedElements)[0].gradientStops ||
          this.toolSettings.gradientStops
        : this.toolSettings.gradientStops;

    gradientStops = [...gradientStops];
    gradientStops[index] = { ...gradientStops[index], [property]: value };

    // Sort by offset after updating
    if (property === "offset") {
      gradientStops.sort((a, b) => a.offset - b.offset);
    }

    // Update tool settings and selected elements
    this.toolSettings.gradientStops = gradientStops;
    if (this.selectedElements.size > 0) {
      this.updateSelectedElementProperty("gradientStops", gradientStops);
    }

    // Update UI if offset changed (to maintain correct order)
    if (property === "offset") {
      this.updateGradientStopsUI();
    }
  },
};
