const express = require('express');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable gzip compression
app.use(compression());

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Law Students Forum server is running' });
});

// Serve static assets with long-term caching
app.use('/assets', express.static('assets', {
  maxAge: '30d',
  etag: true,
  immutable: true
}));

app.use('/styles', express.static('styles', {
  maxAge: '30d',
  etag: true,
  immutable: true
}));

app.use('/scripts', express.static('scripts', {
  maxAge: '1d', // Scripts may change more frequently
  etag: true
}));

app.use('/games', express.static('games', {
  maxAge: '7d',
  etag: true
}));

app.use('/audio', express.static('audio', {
  maxAge: '30d',
  etag: true
}));

app.use('/sprites', express.static('sprites', {
  maxAge: '30d',
  etag: true
}));

// Serve pages with no-cache for HTML files
app.use('/pages', express.static('pages', {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Serve root level files selectively (only specific files we want to expose)
const rootFiles = ['index.html', 'splash.html', 'moot.pdf', 'favicon.ico', 'favicon.svg', 'favicon-96x96.png', 'favicon.io.ico', 'site.webmanifest', 'apple-touch-icon.png', 'web-app-manifest-192x192.png', 'web-app-manifest-512x512.png', 'kanyangarara.png', 'madhuku.png', 'mahere.png'];
rootFiles.forEach(filename => {
  app.get(`/${filename}`, (req, res) => {
    if (filename.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    res.sendFile(path.join(__dirname, filename));
  });
});

// Handle client-side routing - only serve index.html for HTML requests without file extensions
app.get('*', (req, res) => {
  if (req.accepts('html') && !req.path.includes('.')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.status(404).send('Not Found');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Law Students Forum server running at http://0.0.0.0:${PORT}`);
  console.log('Ready to serve the Law Students Intellectual Forum website');
});