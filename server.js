const express = require('express');
const serveStatic = require('serve-static');
const path = require('path');

const app = express();
const PORT = 5000;

// Serve static files from the root directory
app.use(serveStatic('.', {
  index: ['index.html'],
  setHeaders: (res) => {
    // Disable caching to ensure updates are visible to users
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Handle client-side routing - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.resolve('./index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Law Students Forum server running at http://0.0.0.0:${PORT}`);
  console.log('Ready to serve the Law Students Intellectual Forum website');
});