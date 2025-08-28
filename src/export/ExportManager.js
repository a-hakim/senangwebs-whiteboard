/**
 * Export Manager
 * Handles exporting drawings to various formats
 */

export class ExportManager {
    constructor(instance) {
        this.instance = instance;
    }

    /**
     * Export scene to SVG format
     */
    exportToSVG() {
        const scene = this.instance.getScene();
        const { viewBox } = scene;
        
        // Create a new SVG element for export
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', viewBox.width);
        svg.setAttribute('height', viewBox.height);
        svg.setAttribute('viewBox', `0 0 ${viewBox.width} ${viewBox.height}`);
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        
        // Add defs for patterns and markers
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        this.addExportDefs(defs);
        svg.appendChild(defs);

        // Add background
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('width', '100%');
        background.setAttribute('height', '100%');
        background.setAttribute('fill', this.instance.options.backgroundColor || '#ffffff');
        svg.appendChild(background);

        // Add elements
        scene.elements.forEach(element => {
            if (element.visible !== false) {
                const svgElement = this.createSVGElement(element);
                if (svgElement) {
                    svg.appendChild(svgElement);
                }
            }
        });

        // Convert to string
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);
        
        // Download the file
        this.downloadFile(svgString, 'drawing.svg', 'image/svg+xml');
        
        return svgString;
    }

    /**
     * Export scene to PNG format
     */
    exportToPNG(scale = 2) {
        const svgString = this.exportToSVG();
        const scene = this.instance.getScene();
        const { viewBox } = scene;
        
        // Create canvas for rasterization
        const canvas = document.createElement('canvas');
        canvas.width = viewBox.width * scale;
        canvas.height = viewBox.height * scale;
        const ctx = canvas.getContext('2d');
        
        // Create image from SVG
        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
            // Draw image to canvas
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Convert to PNG and download
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'drawing.png';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 'image/png');
            
            URL.revokeObjectURL(url);
        };
        
        img.src = url;
    }

    /**
     * Export scene data as JSON
     */
    exportToJSON() {
        const scene = this.instance.getScene();
        const jsonString = JSON.stringify(scene, null, 2);
        this.downloadFile(jsonString, 'drawing.json', 'application/json');
        return jsonString;
    }

    /**
     * Create SVG element from drawing element
     */
    createSVGElement(element) {
        switch (element.type) {
            case 'rectangle':
                return this.createSVGRect(element);
            case 'ellipse':
                return this.createSVGEllipse(element);
            case 'diamond':
                return this.createSVGDiamond(element);
            case 'line':
                return this.createSVGLine(element);
            case 'arrow':
                return this.createSVGArrow(element);
            case 'draw':
                return this.createSVGPath(element);
            case 'text':
                return this.createSVGText(element);
            default:
                console.warn(`Unknown element type for export: ${element.type}`);
                return null;
        }
    }

    createSVGRect(element) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', element.x);
        rect.setAttribute('y', element.y);
        rect.setAttribute('width', element.width);
        rect.setAttribute('height', element.height);
        this.applyCommonStyles(rect, element);
        return rect;
    }

    createSVGEllipse(element) {
        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ellipse.setAttribute('cx', element.x + element.width / 2);
        ellipse.setAttribute('cy', element.y + element.height / 2);
        ellipse.setAttribute('rx', element.width / 2);
        ellipse.setAttribute('ry', element.height / 2);
        this.applyCommonStyles(ellipse, element);
        return ellipse;
    }

    createSVGDiamond(element) {
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
        this.applyCommonStyles(polygon, element);
        return polygon;
    }

    createSVGLine(element) {
        if (!element.points || element.points.length < 2) return null;
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', element.points[0].x);
        line.setAttribute('y1', element.points[0].y);
        line.setAttribute('x2', element.points[1].x);
        line.setAttribute('y2', element.points[1].y);
        this.applyCommonStyles(line, element);
        return line;
    }

    createSVGArrow(element) {
        if (!element.points || element.points.length < 2) return null;
        
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', element.points[0].x);
        line.setAttribute('y1', element.points[0].y);
        line.setAttribute('x2', element.points[1].x);
        line.setAttribute('y2', element.points[1].y);
        line.setAttribute('marker-end', 'url(#arrowhead)');
        this.applyCommonStyles(line, element);
        g.appendChild(line);
        
        return g;
    }

    createSVGPath(element) {
        if (!element.points || element.points.length === 0) return null;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = this.pointsToPath(element.points);
        path.setAttribute('d', d);
        this.applyCommonStyles(path, element);
        return path;
    }

    createSVGText(element) {
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

    applyCommonStyles(svgElement, element) {
        // Stroke
        svgElement.setAttribute('stroke', element.strokeColor || 'none');
        svgElement.setAttribute('stroke-width', element.strokeWidth || 1);
        
        // Fill
        if (element.fillStyle === 'transparent' || element.fillColor === 'transparent') {
            svgElement.setAttribute('fill', 'none');
        } else if (element.fillStyle === 'hachure') {
            svgElement.setAttribute('fill', `url(#hachure-${element.fillColor.replace('#', '')})`);
        } else {
            svgElement.setAttribute('fill', element.fillColor || 'none');
        }
        
        // Opacity
        if (element.opacity !== undefined && element.opacity !== 1) {
            svgElement.setAttribute('opacity', element.opacity);
        }
        
        // Rotation
        if (element.rotation) {
            const cx = element.x + element.width / 2;
            const cy = element.y + element.height / 2;
            svgElement.setAttribute('transform', `rotate(${element.rotation} ${cx} ${cy})`);
        }
    }

    addExportDefs(defs) {
        // Add arrow marker
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '7');
        marker.setAttribute('refX', '10');
        marker.setAttribute('refY', '3.5');
        marker.setAttribute('orient', 'auto');
        
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
        polygon.setAttribute('fill', 'black');
        
        marker.appendChild(polygon);
        defs.appendChild(marker);
        
        // Add hachure patterns for common colors
        const colors = ['ff0000', '00ff00', '0000ff', '000000', 'ffff00', 'ff00ff', '00ffff'];
        colors.forEach(color => {
            const pattern = this.createHatchPattern(`#${color}`, `hachure-${color}`);
            defs.appendChild(pattern);
        });
    }

    createHatchPattern(color, id) {
        const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
        pattern.setAttribute('id', id);
        pattern.setAttribute('patternUnits', 'userSpaceOnUse');
        pattern.setAttribute('width', '8');
        pattern.setAttribute('height', '8');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M0,8 L8,0');
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', '1');
        
        pattern.appendChild(path);
        return pattern;
    }

    pointsToPath(points) {
        if (points.length === 0) return '';
        
        let path = `M ${points[0].x} ${points[0].y}`;
        
        for (let i = 1; i < points.length; i++) {
            path += ` L ${points[i].x} ${points[i].y}`;
        }
        
        return path;
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
}
