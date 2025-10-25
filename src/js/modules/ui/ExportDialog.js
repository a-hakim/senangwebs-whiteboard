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
    /**
     * Export canvas as SVG file
     * Creates a downloadable SVG file with all elements
     * @returns {string} SVG data string
     */
    exportToSVG() {
        // Clone the SVG to avoid modifying the original
        const clonedSVG = this.svg.cloneNode(true);
        
        // Remove UI elements that shouldn't be in the export
        const selectionGroup = clonedSVG.querySelector('.sww-selection');
        if (selectionGroup) {
            selectionGroup.remove();
        }
        
        // Remove selection handles
        const selectionHandles = clonedSVG.querySelectorAll('.sww-selection-handle');
        selectionHandles.forEach(handle => handle.remove());
        
        // Remove rotation handle
        const rotationHandle = clonedSVG.querySelector('.sww-rotation-handle');
        if (rotationHandle) {
            rotationHandle.remove();
        }
        
        // Serialize SVG to string
        const svgData = new XMLSerializer().serializeToString(clonedSVG);
        
        // Create blob and download link
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
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
    exportToPNG() {
        // Create canvas element for conversion
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        // Get SVG data (without downloading)
        const clonedSVG = this.svg.cloneNode(true);
        
        // Remove UI elements
        const selectionGroup = clonedSVG.querySelector('.sww-selection');
        if (selectionGroup) {
            selectionGroup.remove();
        }
        const selectionHandles = clonedSVG.querySelectorAll('.sww-selection-handle');
        selectionHandles.forEach(handle => handle.remove());
        const rotationHandle = clonedSVG.querySelector('.sww-rotation-handle');
        if (rotationHandle) {
            rotationHandle.remove();
        }
        
        const svgData = new XMLSerializer().serializeToString(clonedSVG);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
            // Set canvas dimensions to match SVG
            canvas.width = img.width || this.viewBox.width;
            canvas.height = img.height || this.viewBox.height;
            
            // Draw SVG image to canvas
            ctx.drawImage(img, 0, 0);
            
            // Convert canvas to PNG blob and download
            canvas.toBlob((blob) => {
                const pngUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = pngUrl;
                link.download = `sww-drawing-${Date.now()}.png`;
                link.click();
                
                // Clean up
                URL.revokeObjectURL(url);
                URL.revokeObjectURL(pngUrl);
            }, 'image/png');
        };
        
        img.onerror = () => {
            console.error('Failed to load SVG for PNG export');
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
        
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
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
                this.showNotification('Scene data copied to clipboard', 'success');
                return true;
            } else {
                // Fallback for browsers without Clipboard API
                const textarea = document.createElement('textarea');
                textarea.value = jsonData;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                const success = document.execCommand('copy');
                document.body.removeChild(textarea);
                
                if (success) {
                    this.showNotification('Scene data copied to clipboard', 'success');
                } else {
                    this.showNotification('Failed to copy to clipboard', 'error');
                }
                return success;
            }
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            this.showNotification('Failed to copy to clipboard', 'error');
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
            this.showNotification('Scene loaded successfully', 'success');
            return true;
        } catch (error) {
            console.error('Error loading scene:', error);
            this.showNotification('Failed to load scene - invalid JSON', 'error');
            return false;
        }
    },

    /**
     * Import scene from JSON file
     * Opens file picker and loads selected JSON file
     */
    importFromJSON() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                this.loadSceneFromJSON(event.target.result);
            };
            reader.onerror = () => {
                this.showNotification('Failed to read file', 'error');
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
        const existingDialog = document.querySelector('.sww-export-dialog');
        if (existingDialog) {
            existingDialog.remove();
        }
        
        // Create dialog overlay
        const overlay = document.createElement('div');
        overlay.className = 'sww-export-dialog';
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
        const dialog = document.createElement('div');
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
                    <i class="fas fa-file-code"></i>
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
                    <i class="fas fa-file-image"></i>
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
                    <i class="fas fa-file-alt"></i>
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
                    <i class="fas fa-clipboard"></i>
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
        const exportButtons = dialog.querySelectorAll('.sww-export-btn');
        exportButtons.forEach(button => {
            button.addEventListener('click', () => {
                const format = button.dataset.format;
                switch (format) {
                    case 'svg':
                        this.exportToSVG();
                        break;
                    case 'png':
                        this.exportToPNG();
                        break;
                    case 'json':
                        this.exportToJSON();
                        break;
                    case 'clipboard':
                        this.copySceneToClipboard();
                        break;
                }
                overlay.remove();
            });
            
            // Add hover effect
            button.addEventListener('mouseenter', () => {
                button.style.opacity = '0.9';
                button.style.transform = 'translateY(-1px)';
            });
            button.addEventListener('mouseleave', () => {
                button.style.opacity = '1';
                button.style.transform = 'translateY(0)';
            });
        });
        
        // Cancel button
        const cancelButton = dialog.querySelector('.sww-export-cancel');
        cancelButton.addEventListener('click', () => {
            overlay.remove();
        });
        
        // Click outside to close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
        
        // ESC key to close
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }
};
