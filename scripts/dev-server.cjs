#!/usr/bin/env node

/**
 * Development server script
 * Simple HTTP server for serving the SWW examples and development files
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || 'localhost';

// MIME types for different file extensions
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
}

function serveFile(res, filePath) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }

        const mimeType = getMimeType(filePath);
        res.writeHead(200, { 
            'Content-Type': mimeType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
        });
        res.end(data);
    });
}

function serveDirectory(res, dirPath, requestPath) {
    fs.readdir(dirPath, (err, files) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal server error');
            return;
        }

        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>SWW Development Server - ${requestPath}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        ul { list-style: none; padding: 0; }
        li { margin: 8px 0; }
        a { text-decoration: none; color: #007bff; }
        a:hover { text-decoration: underline; }
        .icon { margin-right: 8px; }
        .directory { color: #6c757d; }
        .file { color: #007bff; }
    </style>
</head>
<body>
    <h1>Directory: ${requestPath}</h1>
    <ul>
        ${requestPath !== '/' ? '<li><a href="../"><span class="icon">📁</span>../</a></li>' : ''}
        ${files.map(file => {
            const filePath = path.join(dirPath, file);
            const isDirectory = fs.statSync(filePath).isDirectory();
            const icon = isDirectory ? '📁' : '📄';
            const className = isDirectory ? 'directory' : 'file';
            const href = isDirectory ? `${file}/` : file;
            return `<li><a href="${href}" class="${className}"><span class="icon">${icon}</span>${file}${isDirectory ? '/' : ''}</a></li>`;
        }).join('')}
    </ul>
</body>
</html>`;

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    });
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${HOST}:${PORT}`);
    const requestPath = url.pathname;
    
    console.log(`${new Date().toISOString()} ${req.method} ${requestPath}`);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
        });
        res.end();
        return;
    }

    // Resolve file path
    let filePath = path.join(process.cwd(), requestPath.slice(1));
    
    // Handle root path
    if (requestPath === '/') {
        filePath = process.cwd();
    }

    fs.stat(filePath, (err, stats) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }

        if (stats.isDirectory()) {
            // Check for index.html
            const indexPath = path.join(filePath, 'index.html');
            fs.access(indexPath, fs.constants.F_OK, (err) => {
                if (!err) {
                    serveFile(res, indexPath);
                } else {
                    serveDirectory(res, filePath, requestPath);
                }
            });
        } else {
            serveFile(res, filePath);
        }
    });
});

server.listen(PORT, HOST, () => {
    console.log(`🚀 SWW Development Server running at http://${HOST}:${PORT}/`);
    console.log(`📁 Serving files from: ${process.cwd()}`);
    console.log('');
    console.log('Available pages:');
    console.log(`   • Examples: http://${HOST}:${PORT}/examples/`);
    console.log(`   • Demo: http://${HOST}:${PORT}/demo.html`);
    console.log(`   • Basic Example: http://${HOST}:${PORT}/examples/basic.html`);
    console.log('');
    console.log('Press Ctrl+C to stop the server');
});

process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server...');
    server.close(() => {
        console.log('Server stopped');
        process.exit(0);
    });
});
