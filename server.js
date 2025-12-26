const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const server = http.createServer((req, res) => {
    // Handle root path
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(PUBLIC_DIR, filePath);

    // Security: prevent directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
            return;
        }

        // Determine content type
        const ext = path.extname(filePath);
        let contentType = 'text/plain';

        switch (ext) {
            case '.html':
                contentType = 'text/html';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.json':
                contentType = 'application/json';
                break;
        }

        // Read and serve file
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Internal server error');
                return;
            }

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Metronome server running at http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${PUBLIC_DIR}`);
    console.log(`\n🎵 Keyboard Controls:`);
    console.log(`   Space: Start/Stop metronome`);
    console.log(`   T (x2): Tap tempo`);
    console.log(`   R + #: Random muting percentage`);
    console.log(`   H: Half tempo`);
    console.log(`   D: Double tempo`);
    console.log(`\nPress Ctrl+C to stop the server`);
});