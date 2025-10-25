/**
 * TextTool.js
 * Handles text element creation and inline editing
 */

export const TextToolMixin = {
    /**
     * Start creating a text element
     * Called on pointer down when text tool is active
     * @param {Object} point - {x, y} coordinates
     */
    handleTextStart(point) {
        const snappedPoint = this.snapToGridPoint(point);
        const element = this.createElement('text', snappedPoint);
        element.text = ''; // Start with empty text for better UX
        
        // Calculate initial dimensions for consistent boundary behavior
        const padding = 10;
        const minWidth = 200; // Minimum comfortable width for typing
        const minHeight = element.fontSize * 2 + (padding * 2); // At least 2 lines
        
        // Set initial width and height
        element.width = minWidth;
        element.height = minHeight;
        
        // Add element to the scene immediately
        this.addSVGElementToDOM(element);
        this.elements.push(element);
        this.updateSVGElement(element);
        
        // Save state for undo/redo
        this.saveStateToHistory('createElement');
        
        // Select the element
        this.clearSelection();
        this.selectElement(element);
        
        // Immediately start editing for intuitive UX
        setTimeout(() => {
            this.startTextEditing(element);
        }, 50);
        
        // Switch to select tool (will activate after editing finishes)
        this.setTool('select');
    },

    /**
     * Create SVG text element
     * @param {Object} element - Element object
     * @returns {SVGTextElement} Created SVG text element
     */
    createTextSVGElement(element) {
        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        svgElement.setAttribute('data-element-id', element.id);
        svgElement.setAttribute('class', 'sww-element');
        return svgElement;
    },

    /**
     * Update text SVG attributes
     * @param {Object} element - Element object with SVG reference
     */
    updateTextSVG(element) {
        const svg = element.svgElement;
        if (!svg) return;
        
        const textContent = element.text || 'Text';
        const lines = textContent.split('\n');
        
        // Always position text with padding inside the boundary
        const padding = 10;
        const textX = element.x + padding; // Left padding
        const textY = element.y + element.fontSize + padding; // Top padding + baseline
        
        svg.setAttribute('x', textX);
        svg.setAttribute('y', textY);
        svg.setAttribute('font-size', element.fontSize);
        svg.setAttribute('font-family', element.fontFamily);
        svg.setAttribute('fill', element.textColor || element.strokeColor); // Use textColor for fill
        
        // Show placeholder styling for empty text
        if (!element.text || element.text.trim() === '') {
            svg.setAttribute('opacity', '0.4');
            svg.setAttribute('font-style', 'italic');
        } else {
            svg.setAttribute('font-style', 'normal');
        }
        
        // Text can have stroke for outline effect
        if (element.strokeWidth > 0) {
            svg.setAttribute('stroke', element.strokeColor);
            svg.setAttribute('stroke-width', element.strokeWidth);
        } else {
            svg.removeAttribute('stroke');
            svg.removeAttribute('stroke-width');
        }
        
        // Clear existing content
        svg.innerHTML = '';
        
        // Add each line as a tspan with proper alignment
        lines.forEach((line, index) => {
            const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            
            // Calculate X position based on alignment
            let lineX = textX;
            if (element.textAlign && element.width) {
                const lineWidth = this.measureText(line, element.fontSize, element.fontFamily).width;
                const availableWidth = element.width - (padding * 2); // Account for padding
                
                switch (element.textAlign) {
                    case 'center':
                        lineX = element.x + (element.width / 2) - (lineWidth / 2);
                        break;
                    case 'right':
                        lineX = element.x + element.width - padding - lineWidth;
                        break;
                    case 'left':
                    default:
                        lineX = textX;
                }
            }
            
            tspan.setAttribute('x', lineX);
            tspan.setAttribute('dy', index === 0 ? 0 : element.fontSize * 1.3); // Line height
            tspan.textContent = line || ' '; // Use space for empty lines
            
            svg.appendChild(tspan);
        });
    },

    /**
     * Start inline text editing
     * Creates a contentEditable div overlay for WYSIWYG editing
     * @param {Object} element - Text element to edit
     */
    startTextEditing(element) {
        // Prevent editing in preview mode
        if (this.isPreviewMode) {
            return;
        }
        
        // Hide the original SVG text element during editing
        if (element.svgElement) {
            element.svgElement.style.visibility = 'hidden';
        }
        
        // Create inline contentEditable div
        const textEditor = document.createElement('div');
        textEditor.className = 'sww-text-editor-inline';
        textEditor.contentEditable = true;
        textEditor.textContent = element.originalText || element.text || '';
        
        // Get screen coordinates
        const svgPoint = { x: element.x, y: element.y };
        const screenPoint = this.svgToScreenCoordinates(svgPoint);
        
        // Calculate editor dimensions
        const editorDimensions = this.calculateEditorDimensions(element);
        
        // Apply styling to match SVG element
        this.applyTextEditorStyles(textEditor, element, screenPoint, editorDimensions);
        
        document.body.appendChild(textEditor);
        
        // Create keyboard shortcuts hint
        const hintOverlay = this.createTextEditorHint();
        document.body.appendChild(hintOverlay);
        
        // Focus and select all text
        setTimeout(() => {
            textEditor.style.borderColor = 'rgba(0, 255, 153, 1)';
            textEditor.focus();
            
            const range = document.createRange();
            range.selectNodeContents(textEditor);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }, 50);
        
        // Setup editing handlers
        this.setupTextEditingHandlers(textEditor, hintOverlay, element);
    },

    /**
     * Convert SVG coordinates to screen coordinates
     * @param {Object} svgPoint - {x, y} in SVG coordinates
     * @returns {Object} {x, y} in screen coordinates
     */
    svgToScreenCoordinates(svgPoint) {
        if (this.svg.getScreenCTM) {
            const matrix = this.svg.getScreenCTM();
            return {
                x: matrix.a * svgPoint.x + matrix.c * svgPoint.y + matrix.e,
                y: matrix.b * svgPoint.x + matrix.d * svgPoint.y + matrix.f
            };
        } else {
            // Fallback method
            const rect = this.svg.getBoundingClientRect();
            return {
                x: (svgPoint.x - this.viewBox.x) / this.viewBox.width * rect.width + rect.left,
                y: (svgPoint.y - this.viewBox.y) / this.viewBox.height * rect.height + rect.top
            };
        }
    },

    /**
     * Calculate text editor dimensions based on element
     * @param {Object} element - Text element
     * @returns {Object} {width, height} in screen pixels
     */
    calculateEditorDimensions(element) {
        let editorWidth, editorHeight;
        
        if (element.width && element.height) {
            // Use boundary dimensions
            if (this.svg.getScreenCTM) {
                const matrix = this.svg.getScreenCTM();
                editorWidth = Math.abs(element.width * matrix.a);
                editorHeight = Math.abs(element.height * matrix.d);
            } else {
                const rect = this.svg.getBoundingClientRect();
                editorWidth = Math.abs(element.width) / this.viewBox.width * rect.width;
                editorHeight = Math.abs(element.height) / this.viewBox.height * rect.height;
            }
        } else {
            // Default dimensions for unbounded text
            editorWidth = Math.max(200, element.fontSize * 10);
            editorHeight = element.fontSize * 1.5;
        }
        
        return { width: editorWidth, height: editorHeight };
    },

    /**
     * Apply styles to text editor to match SVG element
     * @param {HTMLElement} textEditor - Editor div
     * @param {Object} element - Text element
     * @param {Object} screenPoint - Screen coordinates
     * @param {Object} dimensions - Editor dimensions
     */
    applyTextEditorStyles(textEditor, element, screenPoint, dimensions) {
        textEditor.style.position = 'fixed';
        textEditor.style.left = `${screenPoint.x}px`;
        textEditor.style.top = `${screenPoint.y}px`;
        textEditor.style.width = `${dimensions.width}px`;
        textEditor.style.height = element.width && element.height ? `${dimensions.height}px` : 'auto';
        textEditor.style.minHeight = `${element.fontSize * 1.3}px`;
        textEditor.style.fontSize = `${element.fontSize}px`;
        textEditor.style.fontFamily = element.fontFamily || 'Arial';
        textEditor.style.background = 'transparent';
        textEditor.style.padding = '8px';
        textEditor.style.boxSizing = 'border-box';
        textEditor.style.zIndex = '10000';
        textEditor.style.outline = 'none';
        textEditor.style.color = element.textColor || element.strokeColor || '#000';
        textEditor.style.lineHeight = '1.3';
        textEditor.style.whiteSpace = 'pre-wrap';
        textEditor.style.wordWrap = 'break-word';
        textEditor.style.overflow = element.width && element.height ? 'auto' : 'visible';
        
        if (element.textAlign) {
            textEditor.style.textAlign = element.textAlign;
        }
        
        if (!textEditor.textContent) {
            textEditor.setAttribute('data-placeholder', 'Type text here...');
        }
    },

    /**
     * Create keyboard shortcuts hint overlay
     * @returns {HTMLElement} Hint overlay element
     */
    createTextEditorHint() {
        const hintOverlay = document.createElement('div');
        hintOverlay.className = 'sww-text-editor-hint';
        hintOverlay.innerHTML = `
            <div class="sww-text-editor-hint-item">
                <kbd>Ctrl</kbd>+<kbd>Enter</kbd> <span>Save</span>
            </div>
            <div class="sww-text-editor-hint-separator"></div>
            <div class="sww-text-editor-hint-item">
                <kbd>Esc</kbd> <span>Cancel</span>
            </div>
            <div class="sww-text-editor-hint-separator"></div>
            <div class="sww-text-editor-hint-item">
                <kbd>Tab</kbd> <span>Indent</span>
            </div>
        `;
        return hintOverlay;
    },

    /**
     * Setup event handlers for text editing
     * @param {HTMLElement} textEditor - Editor div
     * @param {HTMLElement} hintOverlay - Hint overlay
     * @param {Object} element - Text element being edited
     */
    setupTextEditingHandlers(textEditor, hintOverlay, element) {
        let isEditing = true;
        let handleClickOutside;
        
        const finishEditing = () => {
            if (!isEditing) return;
            isEditing = false;
            
            // Animation
            textEditor.style.opacity = '0.5';
            textEditor.style.borderColor = 'rgba(0, 255, 153, 0.3)';
            hintOverlay.style.opacity = '0';
            
            setTimeout(() => {
                const newText = textEditor.textContent || 'Text';
                element.originalText = newText;
                
                if (element.width && element.height) {
                    element.text = newText;
                    this.adjustTextToFitBounds(element);
                } else {
                    element.text = newText;
                }
                
                if (element.svgElement) {
                    element.svgElement.style.visibility = 'visible';
                }
                
                this.updateSVGElement(element);
                
                if (textEditor.parentNode) textEditor.remove();
                if (hintOverlay.parentNode) hintOverlay.remove();
                
                if (handleClickOutside) {
                    document.removeEventListener('click', handleClickOutside);
                }
                
                if (this.selectedElements.has(element)) {
                    this.updateSelectionHandles();
                }
                
                if (this.currentTool === 'text') {
                    this.setTool('select');
                }
            }, 150);
        };
        
        const cancelEditing = () => {
            if (!isEditing) return;
            isEditing = false;
            
            textEditor.style.opacity = '0.3';
            textEditor.style.borderColor = 'rgba(255, 0, 0, 0.3)';
            hintOverlay.style.opacity = '0';
            
            setTimeout(() => {
                if (element.svgElement) {
                    element.svgElement.style.visibility = 'visible';
                }
                
                if (textEditor.parentNode) textEditor.remove();
                if (hintOverlay.parentNode) hintOverlay.remove();
                
                if (handleClickOutside) {
                    document.removeEventListener('click', handleClickOutside);
                }
                
                if (this.currentTool === 'text') {
                    this.setTool('select');
                }
            }, 150);
        };
        
        // Keyboard shortcuts
        textEditor.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                cancelEditing();
            } else if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                finishEditing();
            } else if (e.key === 'Tab') {
                e.preventDefault();
                document.execCommand('insertText', false, '\t');
            }
        });
        
        // Click outside to finish
        handleClickOutside = (e) => {
            if (!textEditor.contains(e.target) && !hintOverlay.contains(e.target)) {
                finishEditing();
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 100);
    },

    /**
     * Measure text dimensions
     * @param {string} text - Text to measure
     * @param {number} fontSize - Font size in pixels
     * @param {string} fontFamily - Font family name
     * @returns {Object} {width, height} in pixels
     */
    measureText(text, fontSize, fontFamily) {
        // Create temporary canvas for measurement
        if (!this.textMeasurementCanvas) {
            this.textMeasurementCanvas = document.createElement('canvas');
        }
        
        const ctx = this.textMeasurementCanvas.getContext('2d');
        ctx.font = `${fontSize}px ${fontFamily}`;
        const metrics = ctx.measureText(text);
        
        return {
            width: metrics.width,
            height: fontSize * 1.3 // Approximate line height
        };
    },

    /**
     * Adjust text to fit within element bounds (word wrapping)
     * Stub for legacy compatibility - full implementation in legacy
     * @param {Object} element - Text element
     */
    adjustTextToFitBounds(element) {
        // This method is implemented in legacy file
        // It handles complex text wrapping logic
        // Will be extracted in a future refactoring phase
        if (this.constructor.prototype.adjustTextToFitBounds) {
            return;
        }
        // For now, just use the text as-is
        element.text = element.originalText || element.text;
    },

    /**
     * Start inline text editing for a text element
     * Creates a contentEditable overlay positioned over the SVG element
     * @param {Object} element - Text element to edit
     */
    startTextEditing(element) {
        // Prevent editing in preview mode
        if (this.isPreviewMode) {
            return;
        }
        
        // Hide the original SVG text element completely during editing for clean WYSIWYG
        if (element.svgElement) {
            element.svgElement.style.visibility = 'hidden';
        }
        
        // Create an inline contentEditable div for seamless editing
        const textEditor = document.createElement('div');
        textEditor.className = 'sww-text-editor-inline';
        textEditor.contentEditable = true;
        textEditor.textContent = element.originalText || element.text || '';
        
        // Get accurate screen coordinates using SVG transformation
        let svgPoint, screenPoint;
        
        if (element.width && element.height) {
            // Text has a boundary - position editor to match the boundary
            svgPoint = { x: element.x, y: element.y };
        } else {
            // Text without boundary - use text position with some adjustments for baseline
            const bounds = this.getElementBounds(element);
            svgPoint = { x: bounds.x, y: bounds.y };
        }
        
        // Convert SVG coordinates to screen coordinates
        if (this.svg.getScreenCTM) {
            const matrix = this.svg.getScreenCTM();
            screenPoint = {
                x: matrix.a * svgPoint.x + matrix.c * svgPoint.y + matrix.e,
                y: matrix.b * svgPoint.x + matrix.d * svgPoint.y + matrix.f
            };
        } else {
            // Fallback method
            const rect = this.svg.getBoundingClientRect();
            screenPoint = {
                x: (svgPoint.x - this.viewBox.x) / this.viewBox.width * rect.width + rect.left,
                y: (svgPoint.y - this.viewBox.y) / this.viewBox.height * rect.height + rect.top
            };
        }
        
        // Calculate editor dimensions
        let editorWidth, editorHeight;
        
        if (element.width && element.height) {
            // Use boundary dimensions
            if (this.svg.getScreenCTM) {
                const matrix = this.svg.getScreenCTM();
                editorWidth = Math.abs(element.width * matrix.a);
                editorHeight = Math.abs(element.height * matrix.d);
            } else {
                const rect = this.svg.getBoundingClientRect();
                editorWidth = Math.abs(element.width) / this.viewBox.width * rect.width;
                editorHeight = Math.abs(element.height) / this.viewBox.height * rect.height;
            }
        } else {
            // Default dimensions for unbounded text
            editorWidth = Math.max(200, element.fontSize * 10);
            editorHeight = element.fontSize * 1.5;
        }
        
        // Apply inline styling to match the SVG element exactly
        textEditor.style.position = 'fixed';
        textEditor.style.left = `${screenPoint.x}px`;
        textEditor.style.top = `${screenPoint.y}px`;
        textEditor.style.width = `${editorWidth}px`;
        textEditor.style.height = element.width && element.height ? `${editorHeight}px` : 'auto';
        textEditor.style.minHeight = `${element.fontSize * 1.3}px`;
        textEditor.style.fontSize = `${element.fontSize}px`;
        textEditor.style.fontFamily = element.fontFamily || 'Arial';
        
        // Inline styling - appears directly on the element
        textEditor.style.background = 'transparent';
        textEditor.style.padding = '8px';
        textEditor.style.boxSizing = 'border-box';
        textEditor.style.zIndex = '10000';
        textEditor.style.outline = 'none';
        textEditor.style.color = element.textColor || element.strokeColor || '#000';
        textEditor.style.lineHeight = '1.3';
        textEditor.style.whiteSpace = 'pre-wrap';
        textEditor.style.wordWrap = 'break-word';
        textEditor.style.overflow = element.width && element.height ? 'auto' : 'visible';
        
        // Set text alignment to match element alignment
        if (element.textAlign) {
            textEditor.style.textAlign = element.textAlign;
        }
        
        // Add empty placeholder attribute
        if (!textEditor.textContent) {
            textEditor.setAttribute('data-placeholder', 'Type text here...');
        }
        
        document.body.appendChild(textEditor);
        
        // Create keyboard shortcuts hint overlay
        const hintOverlay = document.createElement('div');
        hintOverlay.className = 'sww-text-editor-hint';
        hintOverlay.innerHTML = `
            <div class="sww-text-editor-hint-item">
                <kbd>Ctrl</kbd>+<kbd>Enter</kbd> <span>Save</span>
            </div>
            <div class="sww-text-editor-hint-separator"></div>
            <div class="sww-text-editor-hint-item">
                <kbd>Esc</kbd> <span>Cancel</span>
            </div>
            <div class="sww-text-editor-hint-separator"></div>
            <div class="sww-text-editor-hint-item">
                <kbd>Tab</kbd> <span>Indent</span>
            </div>
        `;
        document.body.appendChild(hintOverlay);
        
        // Add focus styling with animation
        setTimeout(() => {
            textEditor.style.borderColor = 'rgba(0, 255, 153, 1)';
            textEditor.focus();
            
            // Select all text in contentEditable
            const range = document.createRange();
            range.selectNodeContents(textEditor);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }, 50);
        
        let isEditing = true; // Flag to prevent double cleanup
        
        // Declare click-outside handler first
        let handleClickOutside;
        
        const finishEditing = () => {
            if (!isEditing) return; // Prevent double execution
            isEditing = false;
            
            // Smooth exit animation
            textEditor.style.opacity = '0.5';
            textEditor.style.borderColor = 'rgba(0, 255, 153, 0.3)';
            hintOverlay.style.opacity = '0';
            
            setTimeout(() => {
                const newText = textEditor.textContent || 'Text';
                element.originalText = newText; // Store original text for future wrapping
                
                // If element has boundary, adjust text to fit and wrap
                if (element.width && element.height) {
                    element.text = newText; // Store original first
                    if (this.adjustTextToFitBounds) {
                        this.adjustTextToFitBounds(element); // Then wrap it if available
                    }
                } else {
                    element.text = newText;
                }
                
                // Show the original SVG element again
                if (element.svgElement) {
                    element.svgElement.style.visibility = 'visible';
                }
                
                this.updateSVGElement(element);
                
                // Safely remove the elements
                if (textEditor.parentNode) textEditor.remove();
                if (hintOverlay.parentNode) hintOverlay.remove();
                
                // Clean up click-outside listener
                if (handleClickOutside) {
                    document.removeEventListener('click', handleClickOutside);
                }
                
                // Update selection handles if element is selected
                if (this.selectedElements.has(element)) {
                    this.updateSelectionHandles();
                }
                
                // Auto-switch to select tool after text editing for better UX
                if (this.currentTool === 'text') {
                    this.setTool('select');
                }
            }, 150); // Small delay for animation
        };
        
        const cancelEditing = () => {
            if (!isEditing) return; // Prevent double execution
            isEditing = false;
            
            // Smooth exit animation for cancel
            textEditor.style.opacity = '0.3';
            textEditor.style.borderColor = 'rgba(255, 0, 0, 0.3)';
            hintOverlay.style.opacity = '0';
            
            setTimeout(() => {
                // Show the original SVG element again
                if (element.svgElement) {
                    element.svgElement.style.visibility = 'visible';
                }
                
                // Safely remove the elements without saving changes
                if (textEditor.parentNode) textEditor.remove();
                if (hintOverlay.parentNode) hintOverlay.remove();
                
                // Clean up click-outside listener
                if (handleClickOutside) {
                    document.removeEventListener('click', handleClickOutside);
                }
                
                // Auto-switch to select tool even when canceling for better UX
                if (this.currentTool === 'text') {
                    this.setTool('select');
                }
            }, 150);
        };
        
        // Enhanced auto-resize function for contentEditable
        const autoResize = () => {
            if (!textEditor.parentNode) return;
            
            // Only auto-resize for unbounded text elements
            if (!(element.width && element.height)) {
                // ContentEditable automatically sizes to content
                // Just ensure minimum dimensions
                const minWidth = Math.max(element.fontSize * 3, 50);
                const minHeight = element.fontSize * 1.3;
                
                if (textEditor.offsetWidth < minWidth) {
                    textEditor.style.minWidth = minWidth + 'px';
                }
                if (textEditor.offsetHeight < minHeight) {
                    textEditor.style.minHeight = minHeight + 'px';
                }
            }
        };
        
        // Enhanced keyboard interactions for contentEditable
        textEditor.addEventListener('keydown', (e) => {
            // Enhanced keyboard shortcuts
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                finishEditing();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEditing();
            } else if (e.key === 'Tab') {
                e.preventDefault();
                // Insert tab character (4 spaces) in contentEditable
                document.execCommand('insertText', false, '    ');
            }
        });
        
        // Add input event listener for real-time resizing with debouncing
        let resizeTimeout;
        textEditor.addEventListener('input', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(autoResize, 50); // Debounced resize
        });
        
        textEditor.addEventListener('blur', (e) => {
            finishEditing();
        });
        
        // Add click-outside listener for intuitive editing
        handleClickOutside = (e) => {
            // Check if click is outside the text editor
            if (!textEditor.contains(e.target) && textEditor.parentNode) {
                // Don't finish editing if clicking on toolbar buttons or other UI elements
                const isToolbarClick = e.target.closest('.sww-toolbar') || 
                                     e.target.closest('button') || 
                                     e.target.classList.contains('sww-toolbar-button');
                
                if (!isToolbarClick) {
                    finishEditing();
                    // Remove this listener after use
                    document.removeEventListener('click', handleClickOutside);
                }
            }
        };
        
        // Add the listener with a slight delay to prevent immediate triggering
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 100);
        
        // Fade out hint after a few seconds
        setTimeout(() => {
            if (hintOverlay.parentNode) {
                hintOverlay.style.opacity = '0';
                setTimeout(() => {
                    if (hintOverlay.parentNode) hintOverlay.remove();
                }, 300);
            }
        }, 5000);
        
        // Initial resize to fit existing content
        autoResize();
    }
};
