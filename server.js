const express = require('express');
const path = require('path');

const app = express();
const PORT = 5000;

// Disable caching to ensure updates are visible to users
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Law Students Forum server is running' });
});

// Serve static files from the root directory
app.use(express.static('.'));

// Handle all other routes by serving index.html (for client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Law Students Forum server running at http://0.0.0.0:${PORT}`);
  console.log('Ready to serve the Law Students Intellectual Forum website');
});