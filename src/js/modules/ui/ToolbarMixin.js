/**
 * Toolbar Mixin for SWWInstance
 * Creates basic toolbar with action buttons
 * Note: Full properties panel still in legacy - will be extracted in separate module
 */

export const ToolbarMixin = {
  /**
   * Create simple toolbar with action buttons
   * Full toolbar in examples/sww.html handles tool selection
   */
  createToolbar() {
    const toolbar = document.createElement("div");
    toolbar.className = "sww-toolbar";

    const actionGroup = document.createElement("div");
    actionGroup.className = "sww-tool-group";

    const actions = [
      {
        id: "lock",
        icon: "ss ss-lock-closed",
        title: "Lock/Unlock Selected",
        action: () => this.toggleLockSelected(),
      },
      {
        id: "group",
        icon: "ss ss-group-object",
        title: "Group Selected",
        action: () => this.groupSelected(),
      },
      {
        id: "ungroup",
        icon: "ss ss-ungroup-object",
        title: "Ungroup Selected",
        action: () => this.ungroupSelected(),
      },
      {
        id: "select",
        icon: "ss ss-check",
        title: "Select All",
        action: () => this.selectAll(),
      },
      {
        id: "clear",
        icon: "ss ss-trash",
        title: "Clear All",
        action: () => this.clearAll(),
      },
    ];

    actions.forEach((action) => {
      const button = document.createElement("button");
      button.className = "sww-tool-button";
      button.setAttribute("data-action", action.id);

      const icon = document.createElement("i");
      icon.className = action.icon;
      button.appendChild(icon);

      button.title = action.title;
      button.addEventListener("click", action.action);

      actionGroup.appendChild(button);
    });

    toolbar.appendChild(actionGroup);
    // Note: Toolbar not added to DOM here - external examples handle tool UI
  },

  /**
   * Create simple properties panel stub
   * Full implementation still in legacy - extracted separately due to size
   */
  createPropertiesPanel() {
    // Stub - actual implementation in legacy
    // Will be extracted to PropertiesPanel.js module
    this.propertiesPanel = null;
  },

  /**
   * Create context menu stub
   * Full implementation still in legacy
   */
  createContextMenu() {
    // Stub - actual implementation in legacy
    // Will be extracted to ContextMenu.js module
    this.contextMenu = null;
  },
};
