// Fun loading messages
const messages = [
  "Consulting Athena's scrolls…",
  "Charging KT Industries credit card…",
  "Stealing cookies (the edible kind)…",
  "Reticulating splines…",
  "Feeding Firebase hamsters…",
  "Brewing legal arguments…",
  "Procrastinating efficiently…",
  "Rating my least‑favourite lecturer…",
  "Rigging the leaderboard…",
  "Tipping the scales of justice...",
  "Whispering to moot‑court judges…",
  "Putting a star…",
  "Inflating XP economy…",
  "Opening portals to BVIRAVIRA…",
  "Debugging AI morality clauses…"
];

let messageIndex = 0;
let minTimePassed = false;
let contentLoaded = false;
let splashTimer;

function rotateMessage() {
  const loadingMessage = document.getElementById('loading-message');
  loadingMessage.style.opacity = 0;
  
  setTimeout(() => {
    messageIndex = (messageIndex + 1) % messages.length;
    loadingMessage.textContent = messages[messageIndex];
    loadingMessage.style.opacity = 1;
  }, 300);
}

function hideSplash() {
  const splashScreen = document.getElementById('splash-screen');
  splashScreen.style.opacity = 0;

  setTimeout(() => {
    splashScreen.style.display = 'none';
    document.body.style.overflow = 'auto'; // <== moved here
  }, 500);
}

// Start the splash screen
function initSplash() {
  const loadingBar = document.getElementById('loading-bar');
  const skipBtn = document.getElementById('skip-btn');
  
  // Make messages change every 2 seconds
  const messageInterval = setInterval(rotateMessage, 2000);
  
  // Loading bar grows for 6 seconds
  let progress = 0;
  const barInterval = setInterval(() => {
    progress += 1;
    loadingBar.style.width = `${progress}%`;
    if (progress >= 100) clearInterval(barInterval);
  }, 60);
  
  // Wait at least 6 seconds
  splashTimer = setTimeout(() => {
    minTimePassed = true;
    if (contentLoaded) hideSplash();
  }, 6000);
  
  // When everything is ready
  window.addEventListener('load', () => {
    contentLoaded = true;
    if (minTimePassed) hideSplash();
  });
  
  // Click to skip if ready
  document.getElementById('splash-screen').addEventListener('click', () => {
    if (contentLoaded) {
      clearInterval(messageInterval);
      clearTimeout(splashTimer);
      hideSplash();
    }
  });
  
  // Skip button works too!
  skipBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    if (contentLoaded) {
      clearInterval(messageInterval);
      clearTimeout(splashTimer);
      hideSplash();
    }
  });
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', initSplash);