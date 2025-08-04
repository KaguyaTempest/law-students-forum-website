/* scripts/home.js - Handles homepage-specific functionality like the splash screen and carousel initialization */

// Import the carousel initialization function from the new carousel.js
import { initCarousels } from './carousel.js';

// Fade out the splash screen once all page resources have loaded.
window.addEventListener('load', () => {
    const splashScreen = document.getElementById('splash');
    if (splashScreen) {
        splashScreen.classList.add('hidden');
    }

    // Now that the main content is loaded, we can safely initialize the carousels.
    initCarousels();
});
