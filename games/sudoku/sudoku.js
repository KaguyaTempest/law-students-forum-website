const puzzles = {
  easy: [
    [ // Puzzle 1
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ]
  ],
  medium: [
    [ // Puzzle 1
      [0, 2, 0, 6, 0, 8, 0, 0, 0],
      [5, 8, 0, 0, 0, 9, 7, 0, 0],
      [0, 0, 0, 0, 4, 0, 0, 0, 0],
      [3, 7, 0, 0, 0, 0, 5, 0, 0],
      [6, 0, 0, 0, 0, 0, 0, 0, 4],
      [0, 0, 8, 0, 0, 0, 0, 1, 3],
      [0, 0, 0, 0, 2, 0, 0, 0, 0],
      [0, 0, 9, 8, 0, 0, 0, 3, 6],
      [0, 0, 0, 3, 0, 6, 0, 9, 0],
    ]
  ],
  hard: [
    [ // Puzzle 1
      [0, 0, 0, 0, 0, 0, 0, 1, 2],
      [0, 0, 0, 0, 0, 3, 0, 0, 0],
      [0, 0, 1, 0, 8, 0, 0, 0, 0],
      [0, 0, 0, 2, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 7, 0, 0, 0, 0],
      [0, 0, 0, 6, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 3, 0, 9, 0, 0],
      [0, 0, 0, 7, 0, 0, 0, 0, 0],
      [4, 5, 0, 0, 0, 0, 0, 0, 0],
    ]
  ],
  insane: [
    [ // Puzzle 1
      [0, 0, 0, 0, 0, 0, 0, 0, 1],
      [0, 2, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 3, 0, 5, 0, 0, 0],
      [0, 0, 0, 0, 7, 0, 8, 0, 0],
      [0, 0, 6, 0, 0, 0, 2, 0, 0],
      [0, 0, 1, 0, 9, 0, 0, 0, 0],
      [0, 0, 0, 6, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 4, 0],
      [9, 0, 0, 0, 0, 0, 0, 0, 0],
    ]
  ]
};

const legalQuotes = [
  "🔍 'Let justice be done though the heavens fall.' — Roman maxim",
  "⚖️ 'The Constitution is the supreme law of Zimbabwe.' — s2 of the Constitution",
  "📜 'A court of law is not a court of sympathy.' — Gubbay CJ in *Nyamayaro v ZUPCO*",
  "🧠 'Due process is not a privilege. It's a right.'",
  "🏛️ 'A law that is vague is void.' — *Chavunduka v Minister of Home Affairs*",
  "👩🏾‍⚖️ 'Justice delayed is justice denied.' — Lord Coke, echoed in Zim courts"
];

function getRandomQuote() {
  return legalQuotes[Math.floor(Math.random() * legalQuotes.length)];
}

let currentDifficulty = 'easy';
let puzzle = getRandomPuzzle(currentDifficulty);

const gridContainer = document.getElementById('sudoku-grid');

function getRandomPuzzle(difficulty) {
  const options = puzzles[difficulty];
  return options[Math.floor(Math.random() * options.length)];
}

function renderGrid() {
  gridContainer.innerHTML = '';
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.dataset.row = row;
      input.dataset.col = col;

      const value = puzzle[row][col];
      if (value !== 0) {
        input.value = value;
        input.disabled = true;
      }

      input.addEventListener('input', (e) => {
        const val = e.target.value;
        if (!/^[1-9]?$/.test(val)) {
          e.target.value = '';
        }
      });

      gridContainer.appendChild(input);
    }
  }

  gridContainer.style.display = 'grid';
  gridContainer.style.gridTemplateColumns = 'repeat(9, auto)';
  gridContainer.style.gap = '4px';
}

function checkSudoku() {
  const inputs = document.querySelectorAll('#sudoku-grid input');
  const userGrid = Array.from({ length: 9 }, () => Array(9).fill(0));

  inputs.forEach(input => {
    const row = parseInt(input.dataset.row);
    const col = parseInt(input.dataset.col);
    const val = parseInt(input.value) || 0;
    userGrid[row][col] = val;
  });

  const isValid = validateSudoku(userGrid);
  if (isValid) {
    showFact(getRandomQuote());
  } else {
    alert('Something is wrong. Try again.');
  }
}

function validateSudoku(grid) {
  const isValidGroup = group =>
    new Set(group.filter(n => n > 0)).size === group.filter(n => n > 0).length;

  for (let i = 0; i < 9; i++) {
    const row = grid[i];
    const col = grid.map(r => r[i]);
    if (!isValidGroup(row) || !isValidGroup(col)) return false;
  }

  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const square = [];
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          square.push(grid[boxRow * 3 + i][boxCol * 3 + j]);
        }
      }
      if (!isValidGroup(square)) return false;
    }
  }

  return true;
}

function showFact(text) {
  let box = document.getElementById('fact-box');
  if (!box) {
    box = document.createElement('div');
    box.id = 'fact-box';
    document.body.appendChild(box);
  }
  box.textContent = text;
  box.style.display = 'block';
  setTimeout(() => box.style.display = 'none', 8000);
}

function resetGrid() {
  puzzle = getRandomPuzzle(currentDifficulty);
  renderGrid();
}

document.getElementById('check-btn').addEventListener('click', checkSudoku);
document.getElementById('reset-btn').addEventListener('click', resetGrid);
document.getElementById('difficulty').addEventListener('change', (e) => {
  currentDifficulty = e.target.value;
  puzzle = getRandomPuzzle(currentDifficulty);
  renderGrid();
});

renderGrid();
