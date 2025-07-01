// Script: quiz-arena.js

// 1. Handle Game Card Clicks
const gameCards = document.querySelectorAll('.game-card');
gameCards.forEach(card => {
  const playBtn = card.querySelector('.play-btn');
  playBtn.addEventListener('click', () => {
    const gameType = card.dataset.game;
    openGameModal(gameType);
  });
});

// 2. Open Game Modal with Game Interface
function openGameModal(gameType) {
  const modal = document.getElementById('game-modal');
  const modalContent = modal.querySelector('.modal-content');
  modal.classList.remove('hidden');  // Make the modal visible
 
  // Clear previous game UI if any
  modalContent.innerHTML = '';
 
  // Inject the selected game's interface dynamically (this is a simple example, you can expand based on the game type)
  switch(gameType) {
    case 'crossword':
      modalContent.innerHTML = '<h3>Welcome to the Lawyer\'s Crossword!</h3><p>Game will load here...</p>';
      break;
    case 'sudoku':
      modalContent.innerHTML = '<h3>Welcome to Legal Sudoku!</h3><p>Game will load here...</p>';
      break;
    case 'trivia':
      modalContent.innerHTML = '<h3>Welcome to Lawyer\'s Trivia!</h3><p>Game will load here...</p>';
      break;
    case 'word-search':
      modalContent.innerHTML = '<h3>Welcome to the Legal Word Search!</h3><p>Game will load here...</p>';
      break;
    case 'case-match':
      modalContent.innerHTML = '<h3>Welcome to Case Match!</h3><p>Game will load here...</p>';
      break;
    case 'battleship':
      modalContent.innerHTML = '<h3>Welcome to Battleship!</h3><p>Game will load here...</p>';
      break;
    default:
      modalContent.innerHTML = '<p>Error: Unknown game type.</p>';
  }
}

// 3. Close the Game Modal
const modalCloseButton = document.querySelector('.modal-close');
modalCloseButton.addEventListener('click', () => {
  const modal = document.getElementById('game-modal');
  modal.classList.add('hidden');  // Hide the modal
});

// 4. Handle Leaderboard Filters
const leaderboardTabs = document.querySelectorAll('.tab-btn');
leaderboardTabs.forEach(tab => {
  tab.addEventListener('click', (e) => {
    // Remove active class from all tabs
    leaderboardTabs.forEach(t => t.classList.remove('active'));
    // Add active class to the clicked tab
    tab.classList.add('active');

    // Filter leaderboard data based on selected tab
    const period = e.target.dataset.period;
    filterLeaderboard(period);
  });
});

// 5. Filter the Leader