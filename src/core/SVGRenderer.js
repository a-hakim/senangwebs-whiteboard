/**
 * SVG Renderer
 * Handles rendering of drawing elements to SVG
 */

export class SVGRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.elementMap = new Map(); // Track SVG elements by element ID
    }

    renderElement(element) {
        // Remove existing SVG element if it exists
        this.removeElement(element);

        // Create new SVG element
        const svgElement = this.createSVGElement(element);
        if (!svgElement) return;

        // Add to canvas
        this.canvas.elementsGroup.appendChild(svgElement);
        
        // Track the element
        this.elementMap.set(element.id, svgElement);
    }

    removeElement(element) {
        const svgElement = this.elementMap.get(element.id);
        if (svgElement && svgElement.parentNode) {
            svgElement.parentNode.removeChild(svgElement);
        }
        this.elementMap.delete(element.id);
    }

    createSVGElement(element) {
        switch (element.type) {
            case 'rectangle':
                return this.createRectangle(element);
            case 'ellipse':
                return this.createEllipse(element);
            case 'diamond':
                return this.createDiamond(element);
            case 'line':
                return this.createLine(element);
            case 'arrow':
                return this.createArrow(element);
            case 'draw':
                return this.createPath(element);
            case 'text':
                return this.createText(element);
            default:
                console.warn(`Unknown element type: ${element.type}`);
                return null;
        }
    }

    createRectangle(element) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', element.x);
        rect.setAttribute('y', element.y);
        rect.setAttribute('width', element.width);
        rect.setAttribute('height', element.height);
        this.applyStyles(rect, element);
        return rect;
    }

    createEllipse(element) {
        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ellipse.setAttribute('cx', element.x + element.width / 2);
        ellipse.setAttribute('cy', element.y + element.height / 2);
        ellipse.setAttribute('rx', element.width / 2);
        ellipse.setAttribute('ry', element.height / 2);
        this.applyStyles(ellipse, element);
        return ellipse;
    }

    createDiamond(element) {
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const cx = element.x + element.width / 2;
        const cy = element.y + element.height / 2;
        const points = [
            `${cx},${element.y}`,
            `${element.x + element.width},${cy}`,
            `${cx},${element.y + element.height}`,
            `${element.x},${cy}`
        ].join(' ');
        polygon.setAttribute('points', points);
        this.applyStyles(polygon, element);
        return polygon;
    }

    createLine(element) {
        if (!element.points || element.points.length < 2) return null;
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', element.points[0].x);
        line.setAttribute('y1', element.points[0].y);
        line.setAttribute('x2', element.points[1].x);
        line.setAttribute('y2', element.points[1].y);
        this.applyStyles(line, element);
        return line;
    }

    createArrow(element) {
        if (!element.points || element.points.length < 2) return null;
        
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Create line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', element.points[0].x);
        line.setAttribute('y1', element.points[0].y);
        line.setAttribute('x2', element.points[1].x);
        line.setAttribute('y2', element.points[1].y);
        line.setAttribute('marker-end', 'url(#arrowhead)');
        this.applyStyles(line, element);
        g.appendChild(line);
        
        return g;
    }

    createPath(element) {
        if (!element.points || element.points.length === 0) return null;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = this.pointsToPath(element.points);
        path.setAttribute('d', d);
        this.applyStyles(path, element);
        return path;
    }

    createText(element) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', element.x);
        text.setAttribute('y', element.y + (element.fontSize || 16));
        text.setAttribute('font-family', element.fontFamily || 'Arial');
        text.setAttribute('font-size', element.fontSize || 16);
        text.setAttribute('fill', element.textColor || element.strokeColor || '#000000');
        text.textContent = element.text || '';
        
        if (element.rotation) {
            const cx = element.x + element.width / 2;
            const cy = element.y + element.height / 2;
            text.setAttribute('transform', `rotate(${element.rotation} ${cx} ${cy})`);
        }
        
        return text;
    }

    applyStyles(svgElement, element) {
        // Set common attributes
        svgElement.setAttribute('data-element-id', element.id);
        svgElement.setAttribute('class', 'sww-element');
        
        // Stroke
        svgElement.setAttribute('stroke', element.strokeColor || 'none');
        svgElement.setAttribute('stroke-width', element.strokeWidth || 1);
        
        // Fill
        if (element.fillStyle === 'transparent' || element.fillColor === 'transparent') {
            svgElement.setAttribute('fill', 'none');
        } else if (element.fillStyle === 'hachure') {
            svgElement.setAttribute('fill', `url(#hachure-${element.fillColor?.replace('#', '') || '000000'})`);
        } else {
            svgElement.setAttribute('fill', element.fillColor || 'none');
        }
        
        // Opacity
        if (element.opacity !== undefined && element.opacity !== 1) {
            svgElement.setAttribute('opacity', element.opacity);
        }
        
        // Rotation
        if (element.rotation && element.type !== 'text') {
            const cx = element.x + element.width / 2;
            const cy = element.y + element.height / 2;
            svgElement.setAttribute('transform', `rotate(${element.rotation} ${cx} ${cy})`);
        }
    }

    pointsToPath(points) {
        if (points.length === 0) return '';
        
        let path = `M ${points[0].x} ${points[0].y}`;
        
        for (let i = 1; i < points.length; i++) {
            path += ` L ${points[i].x} ${points[i].y}`;
        }
        
        return path;
    }

    clear() {
        this.elementMap.clear();
        if (this.canvas.elementsGroup) {
            while (this.canvas.elementsGroup.firstChild) {
                this.canvas.elementsGroup.removeChild(this.canvas.elementsGroup.firstChild);
            }
        }
    }

    createElement(tagName) {
        return document.createElementNS('http://www.w3.org/2000/svg', tagName);
    }
}
