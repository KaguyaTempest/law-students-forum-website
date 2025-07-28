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

// --- Global Game State Variables ---
let currentDifficulty = 'easy';
let puzzle = getRandomPuzzle(currentDifficulty);
let solution = []; // To store the solution for checking a complete puzzle
let timerInterval;
let seconds = 0;
let selectedCell = null; // To track the currently selected input cell

// --- High Score Variables ---
const HIGH_SCORES_KEY = 'sudokuHighScores';
let highScores = loadHighScores();

// --- DOM Elements ---
const gridContainer = document.getElementById('sudoku-grid');
const difficultySelect = document.getElementById('difficulty');
const checkBtn = document.getElementById('check-btn');
const resetBtn = document.getElementById('reset-btn');
const timerDisplay = document.getElementById('timer-display'); // New
const highScoreList = document.getElementById('high-score-list'); // New

// --- Utility Functions ---
function getRandomQuote() {
    return legalQuotes[Math.floor(Math.random() * legalQuotes.length)];
}

function getRandomPuzzle(difficulty) {
    const options = puzzles[difficulty];
    // For now, always pick the first puzzle for consistency when testing
    // return options[Math.floor(Math.random() * options.length)];
    return options[0];
}

// Function to format time for display (MM:SS)
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

// --- Timer Functions ---
function startTimer() {
    // Clear any existing timer to prevent multiple intervals
    stopTimer();

    if (currentDifficulty === 'insane') {
        seconds = 4 * 60; // 4 minutes for insane difficulty
        timerDisplay.textContent = formatTime(seconds);
        timerInterval = setInterval(() => {
            seconds--;
            timerDisplay.textContent = formatTime(seconds);
            if (seconds <= 0) {
                stopTimer();
                alert("Time's up! You couldn't solve the Insane puzzle.");
                resetGame(); // Reset the game after time runs out
            }
        }, 1000);
    } else {
        seconds = 0; // Reset for count-up timer
        timerDisplay.textContent = formatTime(seconds);
        timerInterval = setInterval(() => {
            seconds++;
            timerDisplay.textContent = formatTime(seconds);
        }, 1000);
    }
}

function stopTimer() {
    clearInterval(timerInterval);
}

function resetTimer() {
    stopTimer();
    seconds = 0;
    timerDisplay.textContent = formatTime(seconds);
}

// --- Sudoku Core Logic (unchanged) ---
function validateSudoku(grid) {
    const isValidGroup = group => {
        const numbers = group.filter(n => n > 0);
        return new Set(numbers).size === numbers.length;
    };

    // Check rows and columns
    for (let i = 0; i < 9; i++) {
        const row = grid[i];
        const col = grid.map(r => r[i]);
        if (!isValidGroup(row) || !isValidGroup(col)) return false;
    }

    // Check 3x3 squares
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

// Function to check if the puzzle is completely filled (no zeros)
function isPuzzleComplete(grid) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (grid[r][c] === 0) {
                return false;
            }
        }
    }
    return true;
}

// --- High Score Functions ---
function loadHighScores() {
    const storedScores = localStorage.getItem(HIGH_SCORES_KEY);
    return storedScores ? JSON.parse(storedScores) : {
        easy: Infinity,
        medium: Infinity,
        hard: Infinity,
        insane: Infinity
    }; // Infinity for no score yet
}

function saveHighScores() {
    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(highScores));
}

function updateHighScore(difficulty, timeInSeconds) {
    // Only update if it's a count-up timer game AND a new best time
    if (difficulty !== 'insane' && timeInSeconds < highScores[difficulty]) {
        highScores[difficulty] = timeInSeconds;
        saveHighScores();
        displayHighScores();
        return true; // Indicates a new high score was set
    } else if (difficulty === 'insane' && timeInSeconds > 0) { // For insane, record if completed, time doesn't matter much as it's pass/fail
        // You might want to track if it was completed at all, or perhaps the remaining time if higher is better.
        // For now, if they just complete it, we can acknowledge. If you want to track remaining time, adjust here.
        // Let's say for insane, we just track if they completed it or not. If we want time, we'd record `seconds` (remaining time)
        // For simplicity now, insane is just "completed" or not.
        return true; // Indicate completion for insane
    }
    return false; // No new high score
}

function displayHighScores() {
    highScoreList.innerHTML = '';
    const difficulties = ['easy', 'medium', 'hard', 'insane'];
    difficulties.forEach(diff => {
        const li = document.createElement('li');
        let scoreText;
        if (highScores[diff] === Infinity) {
            scoreText = 'N/A';
        } else if (diff === 'insane') {
            scoreText = 'Completed!'; // Or 'Time Remaining: ' + formatTime(highScores[diff]) if you track remaining time
        } else {
            scoreText = formatTime(highScores[diff]);
        }
        li.innerHTML = `<strong>${diff.charAt(0).toUpperCase() + diff.slice(1)}:</strong> <span>${scoreText}</span>`;
        highScoreList.appendChild(li);
    });
}

// --- Grid Rendering and UX ---
function renderGrid() {
    gridContainer.innerHTML = '';
    const inputs = []; // Store inputs to apply highlighting
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
                // Add a class for pre-filled cells if you want to style them differently
                input.classList.add('prefilled');
            } else {
                // Add event listener for input changes to re-check cell content
                input.addEventListener('input', handleInput);
                // Add event listener for clicks to select the cell
                input.addEventListener('click', handleCellClick);
                // Also add an 'keydown' listener to prevent invalid characters and handle arrow keys if desired
                input.addEventListener('keydown', handleKeyDown);
            }
            gridContainer.appendChild(input);
            inputs.push(input); // Add to inputs array
        }
    }

    // After rendering, ensure the grid is initialized with correct classes
    applyGridBorders();
    resetTimer(); // Reset timer on new puzzle render
    startTimer(); // Start timer on new puzzle render
    clearHighlights(); // Clear any previous highlights
    selectedCell = null; // No cell selected initially
}

function applyGridBorders() {
    const cells = gridContainer.querySelectorAll('input');
    cells.forEach((cell, index) => {
        const row = Math.floor(index / 9);
        const col = index % 9;

        // Apply right border for columns 2 and 5 (0-indexed: 2, 5)
        if (col === 2 || col === 5) {
            cell.classList.add('border-right-thick');
        } else {
            cell.classList.remove('border-right-thick'); // Ensure removed if not applicable
        }

        // Apply bottom border for rows 2 and 5 (0-indexed: 2, 5)
        if (row === 2 || row === 5) {
            cell.classList.add('border-bottom-thick');
        } else {
            cell.classList.remove('border-bottom-thick'); // Ensure removed
        }

        // Remove any default borders that might conflict, handled by Sudoku.css
        cell.style.border = '';
    });
}


function handleInput(e) {
    const val = e.target.value;
    if (!/^[1-9]?$/.test(val)) {
        e.target.value = '';
    }
    // Update the internal puzzle representation
    puzzle[parseInt(e.target.dataset.row)][parseInt(e.target.dataset.col)] = parseInt(e.target.value) || 0;
    highlightCells(e.target); // Re-highlight based on new input
}

function handleKeyDown(e) {
    // Only allow numbers 1-9, backspace, delete, and arrow keys
    if (
        !((e.keyCode >= 49 && e.keyCode <= 57) || // Numbers 1-9
          (e.keyCode >= 97 && e.keyCode <= 105) || // Numpad 1-9
          e.keyCode === 8 || // Backspace
          e.keyCode === 46 || // Delete
          e.keyCode >= 37 && e.keyCode <= 40) // Arrow keys
    ) {
        e.preventDefault();
    }

    // Handle arrow key navigation
    const currentInput = e.target;
    let row = parseInt(currentInput.dataset.row);
    let col = parseInt(currentInput.dataset.col);
    let nextInput = null;

    if (e.keyCode === 37) { // Left arrow
        nextInput = document.querySelector(`[data-row="${row}"][data-col="${col - 1}"]`);
    } else if (e.keyCode === 38) { // Up arrow
        nextInput = document.querySelector(`[data-row="${row - 1}"][data-col="${col}"]`);
    } else if (e.keyCode === 39) { // Right arrow
        nextInput = document.querySelector(`[data-row="${row}"][data-col="${col + 1}"]`);
    } else if (e.keyCode === 40) { // Down arrow
        nextInput = document.querySelector(`[data-row="${row + 1}"][data-col="${col}"]`);
    }

    if (nextInput) {
        nextInput.focus();
        e.preventDefault(); // Prevent default scroll behavior
    }
}


function handleCellClick(e) {
    clearHighlights();
    selectedCell = e.target;
    selectedCell.classList.add('selected');
    highlightCells(selectedCell);
}

function clearHighlights() {
    document.querySelectorAll('#sudoku-grid input').forEach(input => {
        input.classList.remove('selected', 'highlighted', 'value-highlighted', 'error-cell');
    });
}

function highlightCells(targetCell) {
    clearHighlights();
    if (!targetCell) return;

    selectedCell = targetCell;
    selectedCell.classList.add('selected');

    const selectedRow = parseInt(targetCell.dataset.row);
    const selectedCol = parseInt(targetCell.dataset.col);
    const selectedValue = parseInt(targetCell.value);

    document.querySelectorAll('#sudoku-grid input').forEach(input => {
        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);

        // Highlight same row, column, and 3x3 box
        if (row === selectedRow || col === selectedCol ||
            (Math.floor(row / 3) === Math.floor(selectedRow / 3) &&
             Math.floor(col / 3) === Math.floor(selectedCol / 3))) {
            input.classList.add('highlighted');
        }

        // Highlight cells with the same value (if a value is entered)
        if (selectedValue > 0 && parseInt(input.value) === selectedValue) {
            input.classList.add('value-highlighted');
        }
    });
}

// Function to find a solution (simple backtracking, needed for complete puzzle check)
function solveSudoku(board) {
    const N = 9;

    function findEmpty(board) {
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                if (board[r][c] === 0) {
                    return [r, c];
                }
            }
        }
        return null;
    }

    function isValid(board, num, pos) {
        const [row, col] = pos;

        // Check row
        for (let c = 0; c < N; c++) {
            if (board[row][c] === num && col !== c) {
                return false;
            }
        }

        // Check column
        for (let r = 0; r < N; r++) {
            if (board[r][col] === num && row !== r) {
                return false;
            }
        }

        // Check 3x3 box
        const boxRow = Math.floor(row / 3);
        const boxCol = Math.floor(col / 3);
        for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
            for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
                if (board[r][c] === num && r !== row && c !== col) {
                    return false;
                }
            }
        }
        return true;
    }

    const emptyPos = findEmpty(board);
    if (!emptyPos) {
        return true; // Puzzle solved
    }

    const [row, col] = emptyPos;
    for (let num = 1; num <= N; num++) {
        if (isValid(board, num, [row, col])) {
            board[row][col] = num;
            if (solveSudoku(board)) {
                return true;
            }
            board[row][col] = 0; // Backtrack
        }
    }
    return false; // No solution
}


// --- Game Flow Functions ---
function checkSudoku() {
    const inputs = document.querySelectorAll('#sudoku-grid input');
    const userGrid = Array.from({ length: 9 }, () => Array(9).fill(0));

    let allFilled = true;
    inputs.forEach(input => {
        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);
        const val = parseInt(input.value) || 0;
        userGrid[row][col] = val;
        if (val === 0) {
            allFilled = false;
        }
    });

    if (!allFilled) {
        alert('Please fill in all cells before checking!');
        return;
    }

    const isValid = validateSudoku(userGrid);

    if (isValid) {
        stopTimer(); // Stop the timer on successful completion
        // Check if the user's solution matches the 'known' correct solution
        // (You'd ideally solve the initial puzzle to get this `solution` array)
        // For now, if validateSudoku passes on a complete grid, we assume win.
        // A more robust check would involve solving the original `puzzle` to get its unique `solution`
        // and comparing `userGrid` against that `solution`.
        // Let's assume for simplicity `validateSudoku` is sufficient for a win state if complete.

        showFact(`🎉 Puzzle Complete! ${getRandomQuote()}`);

        if (currentDifficulty === 'insane') {
            alert(`Congratulations! You completed the Insane puzzle with ${formatTime(seconds)} remaining!`);
            // You might record a "completion" for insane, or remaining time if higher is better.
        } else {
            const isNewHighScore = updateHighScore(currentDifficulty, seconds);
            if (isNewHighScore) {
                alert(`Congratulations! You completed the puzzle in ${formatTime(seconds)}! NEW HIGH SCORE!`);
            } else {
                alert(`Congratulations! You completed the puzzle in ${formatTime(seconds)}!`);
            }
        }
        // Small delay before resetting
        setTimeout(resetGame, 5000); // Give user time to read success message/quote
    } else {
        alert('Something is wrong. Keep trying!');
        // Optional: Highlight incorrect cells here for immediate feedback
        // This requires an isValid (grid, showErrors=true) or separate error check
    }
}

function resetGame() {
    resetTimer();
    currentDifficulty = difficultySelect.value; // Get current difficulty from selector
    puzzle = getRandomPuzzle(currentDifficulty); // Get a new puzzle
    renderGrid(); // Render the new puzzle
    clearHighlights(); // Clear any existing highlights
    selectedCell = null; // Deselect cell
    displayHighScores(); // Re-display high scores
    // Hide the fact box if it's visible
    document.getElementById('fact-box').style.display = 'none';
}


// --- Event Listeners ---
checkBtn.addEventListener('click', checkSudoku);
resetBtn.addEventListener('click', resetGame);
difficultySelect.addEventListener('change', resetGame); // Reset game when difficulty changes

// Add a global click listener to clear highlights when clicking outside the grid
document.addEventListener('click', (e) => {
    if (!gridContainer.contains(e.target) && !e.target.classList.contains('sudoku-btn')) {
        clearHighlights();
        selectedCell = null;
    }
});


// --- Initial Game Setup ---
document.addEventListener('DOMContentLoaded', () => {
    // Initial render of the grid
    renderGrid();
    // Display high scores on load
    displayHighScores();
});