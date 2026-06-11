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
        this.addElement(element);
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
            // Use non-breaking space (char code 160) for empty lines - regular spaces are collapsed by SVG
            tspan.textContent = line || String.fromCharCode(160);
            
            svg.appendChild(tspan);
        });
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
        textEditor.style.padding = '10px';
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
     * Creates a textarea overlay positioned over the SVG element
     * Using textarea instead of contentEditable for consistent newline handling
     * @param {Object} element - Text element to edit
     */
    startTextEditing(element) {
        // Prevent editing in preview mode
        if (this.isPreviewMode) {
            return;
        }
        
        // Hide the SVG text content during editing to prevent seeing double text
        if (element.svgElement) {
            element.svgElement.style.opacity = '0';
        }
        
        // Create a textarea for seamless editing
        // Using textarea instead of contentEditable because:
        // 1. Native newline handling (1 Enter = 1 \n)
        // 2. Simple .value property for getting/setting text
        // 3. No DOM parsing or newline normalization needed
        // 4. Consistent across all browsers
        const textEditor = document.createElement('textarea');
        textEditor.className = 'sww-text-editor-inline';
        
        // Load the text directly - no transformation needed
        const originalText = element.originalText || element.text || '';
        textEditor.value = originalText;
        
        // Get accurate screen coordinates using SVG transformation
        let svgPoint, screenPoint;
        
        if (element.width && element.height) {
            svgPoint = { x: element.x, y: element.y };
        } else {
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
            const rect = this.svg.getBoundingClientRect();
            screenPoint = {
                x: (svgPoint.x - this.viewBox.x) / this.viewBox.width * rect.width + rect.left,
                y: (svgPoint.y - this.viewBox.y) / this.viewBox.height * rect.height + rect.top
            };
        }
        
        // Calculate editor dimensions
        let editorWidth;
        
        if (element.width && element.height) {
            if (this.svg.getScreenCTM) {
                const matrix = this.svg.getScreenCTM();
                editorWidth = Math.abs(element.width * matrix.a);
            } else {
                const rect = this.svg.getBoundingClientRect();
                editorWidth = Math.abs(element.width) / this.viewBox.width * rect.width;
            }
        } else {
            const zoomMatrix = this.svg.getScreenCTM ? this.svg.getScreenCTM() : null;
            const zoomScale = zoomMatrix ? Math.abs(zoomMatrix.a) : 1;
            editorWidth = Math.max(200 * zoomScale, element.fontSize * 10 * zoomScale);
        }
        
        // Get zoom scale factor for font size and padding
        const zoomMatrix = this.svg.getScreenCTM ? this.svg.getScreenCTM() : null;
        const zoomScale = zoomMatrix ? Math.abs(zoomMatrix.a) : 1;
        const scaledFontSize = element.fontSize * zoomScale;
        const scaledPadding = 10 * zoomScale;
        
        // Calculate initial height based on content
        const lines = originalText.split('\n');
        const lineCount = Math.max(1, lines.length);
        const lineHeight = scaledFontSize * 1.3;
        const initialHeight = Math.max((lineCount * lineHeight) + (scaledPadding * 2), scaledFontSize * 2 + (scaledPadding * 2));
        
        // Apply styling to match the SVG element
        textEditor.style.position = 'fixed';
        textEditor.style.left = `${screenPoint.x}px`;
        textEditor.style.top = `${screenPoint.y}px`;
        textEditor.style.width = `${editorWidth}px`;
        textEditor.style.height = `${initialHeight}px`;
        textEditor.style.minHeight = `${scaledFontSize * 2}px`;
        textEditor.style.fontSize = `${scaledFontSize}px`;
        textEditor.style.fontFamily = element.fontFamily || 'Arial';
        textEditor.style.background = 'transparent';
        textEditor.style.border = 'none';
        textEditor.style.padding = `${scaledPadding}px`;
        textEditor.style.boxSizing = 'border-box';
        textEditor.style.zIndex = '10000';
        textEditor.style.outline = 'none';
        textEditor.style.color = element.textColor || element.strokeColor || '#000';
        textEditor.style.lineHeight = '1.3';
        textEditor.style.resize = 'none';
        textEditor.style.overflow = 'hidden';
        
        if (element.textAlign) {
            textEditor.style.textAlign = element.textAlign;
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
        
        // Focus and select all text
        setTimeout(() => {
            textEditor.focus();
            textEditor.select();
        }, 50);
        
        let isEditing = true;
        let handleClickOutside;
        
        // Auto-resize function - simple and clean with textarea
        const autoResize = () => {
            if (!textEditor.parentNode) return;
            
            const currentText = textEditor.value || '';
            const lines = currentText.split('\n');
            const lineCount = Math.max(1, lines.length);
            const lineHeight = scaledFontSize * 1.3;
            const padding = scaledPadding * 2;
            
            // Update textarea height
            const newHeight = Math.max((lineCount * lineHeight) + padding, scaledFontSize * 2 + padding);
            textEditor.style.height = `${newHeight}px`;
            
            // Update element height for selection handles
            const svgLineHeight = element.fontSize * 1.3;
            const svgPadding = 20;
            element.height = Math.max((lineCount * svgLineHeight) + svgPadding, element.fontSize * 2 + svgPadding);
            
            if (this.selectedElements.has(element)) {
                this.updateSelectionHandles();
            }
        };
        
        const finishEditing = () => {
            if (!isEditing) return;
            isEditing = false;
            
            textEditor.style.opacity = '0';
            hintOverlay.style.opacity = '0';
            
            setTimeout(() => {
                // Get text directly from textarea - no normalization needed!
                let newText = textEditor.value || 'Text';
                
                // Only remove trailing empty lines
                let lines = newText.split('\n');
                while (lines.length > 1 && lines[lines.length - 1].trim() === '') {
                    lines.pop();
                }
                
                const cleanedText = lines.join('\n');
                element.originalText = cleanedText;
                
                // Calculate height based on line count
                const lineCount = Math.max(1, lines.length);
                const lineHeight = element.fontSize * 1.3;
                const padding = 20;
                const calculatedHeight = (lineCount * lineHeight) + padding;
                
                element.height = Math.max(calculatedHeight, element.fontSize * 2 + padding);
                
                if (element.width && element.height) {
                    element.text = cleanedText;
                    if (this.adjustTextToFitBounds) {
                        this.adjustTextToFitBounds(element);
                    }
                } else {
                    element.text = cleanedText;
                }
                
                if (element.svgElement) {
                    element.svgElement.style.opacity = '1';
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
            
            textEditor.style.opacity = '0';
            hintOverlay.style.opacity = '0';
            
            setTimeout(() => {
                if (element.svgElement) {
                    element.svgElement.style.opacity = '1';
                }
                
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
        
        // Keyboard event handling
        textEditor.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                finishEditing();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEditing();
            } else if (e.key === 'Tab') {
                e.preventDefault();
                // Insert 4 spaces at cursor position
                const start = textEditor.selectionStart;
                const end = textEditor.selectionEnd;
                textEditor.value = textEditor.value.substring(0, start) + '    ' + textEditor.value.substring(end);
                textEditor.selectionStart = textEditor.selectionEnd = start + 4;
                autoResize();
            }
        });
        
        // Auto-resize on input
        textEditor.addEventListener('input', autoResize);
        
        // Finish on blur
        textEditor.addEventListener('blur', finishEditing);
        
        // Click outside handler
        handleClickOutside = (e) => {
            if (!textEditor.contains(e.target) && textEditor.parentNode) {
                const isToolbarClick = e.target.closest('.sww-toolbar') || 
                                     e.target.closest('button') || 
                                     e.target.classList.contains('sww-toolbar-button');
                
                if (!isToolbarClick) {
                    finishEditing();
                    document.removeEventListener('click', handleClickOutside);
                }
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside, {
                signal: this.eventController?.signal
            });
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
        
        // Initial resize
        autoResize();
    }
};
