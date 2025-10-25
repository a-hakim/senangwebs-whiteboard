/**
 * ContextMenu.js
 * Right-click context menu functionality
 * Part of Phase 6: Features
 * 
 * Provides methods for:
 * - Creating context menu UI
 * - Showing/hiding context menu
 * - Updating menu item states based on selection
 * - Handling menu item actions
 */

export const ContextMenuMixin = {
    /**
     * Create context menu UI
     */
    createContextMenu() {
        const menu = document.createElement('div');
        menu.className = 'sww-context-menu';
        
        const menuItems = [
            { id: 'copy', icon: 'fas fa-copy', text: 'Copy', action: () => this.copySelected() },
            { id: 'paste', icon: 'fas fa-paste', text: 'Paste', action: () => this.pasteClipboard() },
            { id: 'duplicate', icon: 'fas fa-clone', text: 'Duplicate', action: () => this.duplicateSelected() },
            { id: 'separator1', type: 'separator' },
            { id: 'group', icon: 'fas fa-object-group', text: 'Group', action: () => this.groupSelected() },
            { id: 'ungroup', icon: 'fas fa-object-ungroup', text: 'Ungroup', action: () => this.ungroupSelected() },
            { id: 'separator2', type: 'separator' },
            { id: 'lock', icon: 'fas fa-lock', text: 'Lock', action: () => this.lockSelected() },
            { id: 'unlock', icon: 'fas fa-unlock', text: 'Unlock', action: () => this.unlockSelected() },
            { id: 'separator3', type: 'separator' },
            { id: 'bring-to-front', icon: 'fas fa-arrow-up', text: 'Bring to Front', action: () => this.bringToFront() },
            { id: 'send-to-back', icon: 'fas fa-arrow-down', text: 'Send to Back', action: () => this.sendToBack() },
            { id: 'separator4', type: 'separator' },
            { id: 'delete', icon: 'fas fa-trash', text: 'Delete', action: () => this.deleteSelected() },
            { id: 'separator5', type: 'separator' },
            { id: 'edit', icon: 'fas fa-edit', text: 'Edit', action: () => this.editSelected() }
        ];
        
        menuItems.forEach(item => {
            if (item.type === 'separator') {
                const separator = document.createElement('div');
                separator.className = 'sww-context-menu-separator';
                menu.appendChild(separator);
            } else {
                const menuItem = document.createElement('button');
                menuItem.className = 'sww-context-menu-item';
                menuItem.innerHTML = `<i class="${item.icon}"></i>${item.text}`;
                menuItem.onclick = () => {
                    this.hideContextMenu();
                    item.action();
                };
                menuItem.dataset.action = item.id;
                menu.appendChild(menuItem);
            }
        });
        
        this.container.appendChild(menu);
        this.contextMenu = menu;
    },

    /**
     * Show context menu at event position
     * @param {MouseEvent} e - The context menu event
     */
    showContextMenu(e) {
        // Prevent context menu in preview mode
        if (this.isPreviewMode) {
            return;
        }
        
        if (!this.contextMenu) {
            this.createContextMenu();
        }
        
        const rect = this.container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Update menu item states based on current selection and clipboard
        this.updateContextMenuState();
        
        // Position and show the context menu
        this.contextMenu.style.left = x + 'px';
        this.contextMenu.style.top = y + 'px';
        this.contextMenu.style.display = 'block';
        
        // Ensure menu doesn't go off screen
        const menuRect = this.contextMenu.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        if (x + menuRect.width > containerRect.width) {
            this.contextMenu.style.left = (x - menuRect.width) + 'px';
        }
        
        if (y + menuRect.height > containerRect.height) {
            this.contextMenu.style.top = (y - menuRect.height) + 'px';
        }
    },

    /**
     * Hide context menu
     */
    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.style.display = 'none';
        }
    },

    /**
     * Update context menu item states based on current selection
     */
    updateContextMenuState() {
        if (!this.contextMenu) return;
        
        const hasSelection = this.selectedElements.size > 0;
        const hasClipboard = this.clipboard && this.clipboard.length > 0;
        const hasEditableSelection = Array.from(this.selectedElements).some(el => 
            el.type === 'text' || el.type === 'website' || el.type === 'image' || el.type === 'markdown'
        );
        const canGroup = this.selectedElements.size > 1;
        const hasGroupedSelection = Array.from(this.selectedElements).some(el => el.groupId);
        const hasLockedSelection = Array.from(this.selectedElements).some(el => el.locked);
        const hasUnlockedSelection = Array.from(this.selectedElements).some(el => !el.locked);
        
        // Get menu items
        const copyItem = this.contextMenu.querySelector('[data-action="copy"]');
        const pasteItem = this.contextMenu.querySelector('[data-action="paste"]');
        const duplicateItem = this.contextMenu.querySelector('[data-action="duplicate"]');
        const groupItem = this.contextMenu.querySelector('[data-action="group"]');
        const ungroupItem = this.contextMenu.querySelector('[data-action="ungroup"]');
        const lockItem = this.contextMenu.querySelector('[data-action="lock"]');
        const unlockItem = this.contextMenu.querySelector('[data-action="unlock"]');
        const bringToFrontItem = this.contextMenu.querySelector('[data-action="bring-to-front"]');
        const sendToBackItem = this.contextMenu.querySelector('[data-action="send-to-back"]');
        const deleteItem = this.contextMenu.querySelector('[data-action="delete"]');
        const editItem = this.contextMenu.querySelector('[data-action="edit"]');
        
        // Update states
        if (copyItem) {
            copyItem.disabled = !hasSelection;
            copyItem.style.opacity = hasSelection ? '1' : '0.5';
            copyItem.style.cursor = hasSelection ? 'pointer' : 'not-allowed';
        }
        
        if (pasteItem) {
            pasteItem.disabled = !hasClipboard;
            pasteItem.style.opacity = hasClipboard ? '1' : '0.5';
            pasteItem.style.cursor = hasClipboard ? 'pointer' : 'not-allowed';
        }
        
        if (duplicateItem) {
            duplicateItem.disabled = !hasSelection;
            duplicateItem.style.opacity = hasSelection ? '1' : '0.5';
            duplicateItem.style.cursor = hasSelection ? 'pointer' : 'not-allowed';
        }
        
        if (groupItem) {
            groupItem.disabled = !canGroup;
            groupItem.style.opacity = canGroup ? '1' : '0.5';
            groupItem.style.cursor = canGroup ? 'pointer' : 'not-allowed';
        }
        
        if (ungroupItem) {
            ungroupItem.disabled = !hasGroupedSelection;
            ungroupItem.style.opacity = hasGroupedSelection ? '1' : '0.5';
            ungroupItem.style.cursor = hasGroupedSelection ? 'pointer' : 'not-allowed';
        }
        
        if (lockItem) {
            const canLock = hasSelection && hasUnlockedSelection;
            lockItem.disabled = !canLock;
            lockItem.style.opacity = canLock ? '1' : '0.5';
            lockItem.style.cursor = canLock ? 'pointer' : 'not-allowed';
        }
        
        if (unlockItem) {
            const canUnlock = hasSelection && hasLockedSelection;
            unlockItem.disabled = !canUnlock;
            unlockItem.style.opacity = canUnlock ? '1' : '0.5';
            unlockItem.style.cursor = canUnlock ? 'pointer' : 'not-allowed';
        }
        
        if (bringToFrontItem) {
            bringToFrontItem.disabled = !hasSelection;
            bringToFrontItem.style.opacity = hasSelection ? '1' : '0.5';
            bringToFrontItem.style.cursor = hasSelection ? 'pointer' : 'not-allowed';
        }
        
        if (sendToBackItem) {
            sendToBackItem.disabled = !hasSelection;
            sendToBackItem.style.opacity = hasSelection ? '1' : '0.5';
            sendToBackItem.style.cursor = hasSelection ? 'pointer' : 'not-allowed';
        }
        
        if (deleteItem) {
            deleteItem.disabled = !hasSelection;
            deleteItem.style.opacity = hasSelection ? '1' : '0.5';
            deleteItem.style.cursor = hasSelection ? 'pointer' : 'not-allowed';
        }
        
        if (editItem) {
            editItem.disabled = !hasEditableSelection;
            editItem.style.opacity = hasEditableSelection ? '1' : '0.5';
            editItem.style.cursor = hasEditableSelection ? 'pointer' : 'not-allowed';
        }
    },

    /**
     * Add custom menu item to context menu
     * @param {Object} item - Menu item configuration
     * @param {string} item.id - Unique identifier
     * @param {string} item.icon - FontAwesome icon class
     * @param {string} item.text - Display text
     * @param {Function} item.action - Action to perform when clicked
     * @param {string} [item.position] - Position: 'top', 'bottom', or after specific item ID
     */
    addContextMenuItem(item) {
        if (!this.contextMenu) {
            this.createContextMenu();
        }
        
        // Check if item already exists
        const existingItem = this.contextMenu.querySelector(`[data-action="${item.id}"]`);
        if (existingItem) {
            console.warn(`Context menu item with id "${item.id}" already exists`);
            return;
        }
        
        const menuItem = document.createElement('button');
        menuItem.className = 'sww-context-menu-item';
        menuItem.innerHTML = `<i class="${item.icon}"></i>${item.text}`;
        menuItem.onclick = () => {
            this.hideContextMenu();
            item.action();
        };
        menuItem.dataset.action = item.id;
        
        // Add to menu based on position
        if (item.position === 'top') {
            this.contextMenu.insertBefore(menuItem, this.contextMenu.firstChild);
        } else if (item.position === 'bottom') {
            this.contextMenu.appendChild(menuItem);
        } else if (item.position) {
            // Insert after specific item
            const targetItem = this.contextMenu.querySelector(`[data-action="${item.position}"]`);
            if (targetItem && targetItem.nextSibling) {
                this.contextMenu.insertBefore(menuItem, targetItem.nextSibling);
            } else {
                this.contextMenu.appendChild(menuItem);
            }
        } else {
            this.contextMenu.appendChild(menuItem);
        }
    },

    /**
     * Remove custom menu item from context menu
     * @param {string} itemId - Menu item ID to remove
     */
    removeContextMenuItem(itemId) {
        if (!this.contextMenu) return;
        
        const item = this.contextMenu.querySelector(`[data-action="${itemId}"]`);
        if (item) {
            item.remove();
        }
    },

    /**
     * Show context menu at specific coordinates
     * @param {number} x - X coordinate (relative to container)
     * @param {number} y - Y coordinate (relative to container)
     */
    showContextMenuAt(x, y) {
        if (!this.contextMenu) {
            this.createContextMenu();
        }
        
        // Update menu item states
        this.updateContextMenuState();
        
        // Position and show the context menu
        this.contextMenu.style.left = x + 'px';
        this.contextMenu.style.top = y + 'px';
        this.contextMenu.style.display = 'block';
        
        // Ensure menu doesn't go off screen
        const menuRect = this.contextMenu.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        if (x + menuRect.width > containerRect.width) {
            this.contextMenu.style.left = (x - menuRect.width) + 'px';
        }
        
        if (y + menuRect.height > containerRect.height) {
            this.contextMenu.style.top = (y - menuRect.height) + 'px';
        }
    },

    /**
     * Check if context menu is currently visible
     * @returns {boolean} True if context menu is visible
     */
    isContextMenuVisible() {
        if (!this.contextMenu) return false;
        return this.contextMenu.style.display === 'block';
    },

    /**
     * Destroy context menu
     */
    destroyContextMenu() {
        if (this.contextMenu && this.contextMenu.parentNode) {
            this.contextMenu.parentNode.removeChild(this.contextMenu);
            this.contextMenu = null;
        }
    }
};
