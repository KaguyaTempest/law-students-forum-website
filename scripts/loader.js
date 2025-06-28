document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splash');
  const message = document.getElementById('splash-message');

  const wittyMessages = [
    "Consulting Athena’s scrolls…",
    "Charging KT Industries credit card…",
    "Reticulating splines…",
    "Putting a star…",
    "Feeding Firebase hamsters…",
    "Procrastinating efficiently…",
    "Brewing legal arguments…",
    "Stealing cookies (the edible kind)…"
  ];

  function rotateMessage() {
    const random = wittyMessages[Math.floor(Math.random() * wittyMessages.length)];
    message.textContent = random;
  }

  rotateMessage(); // Show first message immediately
  const interval = setInterval(rotateMessage, 3500);

  window.addEventListener('load', () => {
    clearInterval(interval);
    splash.classList.add('fade-out');
    splash.addEventListener('transitionend', () => splash.remove());
  });

  // Failsafe: auto-hide after 8 seconds
  setTimeout(() => {
    if (!splash.classList.contains('fade-out')) {
      window.dispatchEvent(new Event('load'));
    }
  }, 8000);
});
