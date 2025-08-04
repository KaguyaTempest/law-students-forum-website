/* scripts/home.js - Handles homepage-specific functionality like the splash screen */

// Fade out the splash screen once all page resources have loaded.
window.addEventListener('load', () => {
    const splashScreen = document.getElementById('splash');
    if (splashScreen) {
        splashScreen.classList.add('hidden');
    }
});
