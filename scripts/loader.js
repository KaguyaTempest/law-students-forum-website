/* ── loader.js — splash / loading screen controller ───────── */
const splash     = document.getElementById('splash');
const messageEl  = document.getElementById('splash-message');

if (splash && messageEl) {
  /* Fun one‑liners */
  const messages = [
    
    "Consulting Athena’s scrolls…",
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

  const pickMessage = () =>
    messages[Math.floor(Math.random() * messages.length)];

  /* Rotate every 2.5 s */
  messageEl.textContent = pickMessage();
  const msgInterval = setInterval(() => {
    messageEl.textContent = pickMessage();
  }, 2500);

  /* Timing logic */
  const MIN_VISIBLE = 6000;      // 6 seconds
  let minDone   = false;
  let pageReady = false;

  const tryHide = () => {
    if (minDone && pageReady) {
      clearInterval(msgInterval);
      splash.classList.add('fade-out');
      /* remove from DOM after fade finishes */
      splash.addEventListener('transitionend', () => splash.remove());
    }
  };

  /* start 6 s timer */
  setTimeout(() => { minDone = true; tryHide(); }, MIN_VISIBLE);

  /* wait for full page load */
  window.addEventListener('load', () => { pageReady = true; tryHide(); });

  /* ultimate failsafe after 12 s */
  setTimeout(() => {
    if (document.body.contains(splash)) {
      clearInterval(msgInterval);
      splash.remove();
    }
  }, 12000);
}
