/**
 * Dialogs.js
 * Modal dialogs for element configuration
 * Part of Phase 7: Final extractions
 * 
 * Provides methods for:
 * - Generic configuration dialog
 * - Website element editor
 * - Image element editor
 */

export const DialogsMixin = {
    /**
     * Edit website element - shows dialog to configure URL
     * @param {Object} element - Website element to edit
     */
    editWebsiteElement(element) {
        // Prevent editing in preview mode
        if (this.isPreviewMode) {
            return;
        }
        
        this.showConfigDialog('Website', [
            { 
                label: 'URL:', 
                type: 'text', 
                key: 'url', 
                value: element.url || '', 
                placeholder: 'https://example.com' 
            }
        ], (values) => {
            element.url = values.url;
            this.updateSVGElement(element);
        });
    },

    /**
     * Edit image element - shows dialog to configure image URL
     * @param {Object} element - Image element to edit
     */
    editImageElement(element) {
        // Prevent editing in preview mode
        if (this.isPreviewMode) {
            return;
        }
        
        this.showConfigDialog('Image', [
            { 
                label: 'URL:', 
                type: 'text', 
                key: 'imageUrl', 
                value: element.imageUrl || '', 
                placeholder: 'https://example.com/image.jpg' 
            }
        ], (values) => {
            element.imageUrl = values.imageUrl;
            this.updateSVGElement(element);
        });
    },

    /**
     * Show a generic configuration dialog
     * @param {string} title - Dialog title
     * @param {Array} fields - Array of field definitions
     *   Each field: { label, type, key, value, placeholder }
     * @param {Function} onSave - Callback with values object when saved
     */
    showConfigDialog(title, fields, onSave) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'sww-config-overlay';
        
        // Create dialog
        const dialog = document.createElement('div');
        dialog.className = 'sww-config-dialog';
        
        // Title
        const titleEl = document.createElement('h3');
        titleEl.textContent = title;
        dialog.appendChild(titleEl);
        
        // Fields
        const form = document.createElement('div');
        const inputs = {};
        
        fields.forEach(field => {
            const label = document.createElement('label');
            label.textContent = field.label;
            form.appendChild(label);
            
            let input;
            if (field.type === 'textarea') {
                input = document.createElement('textarea');
            } else {
                input = document.createElement('input');
                input.type = field.type || 'text';
            }
            
            input.value = field.value || '';
            input.placeholder = field.placeholder || '';
            inputs[field.key] = input;
            form.appendChild(input);
        });
        
        dialog.appendChild(form);
        
        // Buttons
        const buttons = document.createElement('div');
        buttons.className = 'sww-config-dialog-buttons';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => {
            overlay.remove();
        };
        
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.className = 'primary';
        saveBtn.onclick = () => {
            const values = {};
            Object.keys(inputs).forEach(key => {
                values[key] = inputs[key].value;
            });
            onSave(values);
            overlay.remove();
        };
        
        buttons.appendChild(cancelBtn);
        buttons.appendChild(saveBtn);
        dialog.appendChild(buttons);
        
        // Add to page
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Focus first input
        const firstInput = Object.values(inputs)[0];
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
        
        // Close on Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape, {
            signal: this.eventController?.signal
        });
        
        // Clean up event listener when overlay is removed
        const originalRemove = overlay.remove.bind(overlay);
        overlay.remove = function() {
            document.removeEventListener('keydown', handleEscape);
            originalRemove();
        };
    }
};
