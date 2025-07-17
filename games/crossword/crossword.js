// crossword.js

// --- Crossword Game Data (from your provided context) ---
// Define grid dimensions (e.g., 15x15)
const GRID_SIZE = 15; // A common size for crosswords

// Batch 1 Clues and Layout
const batch1Layout = [
    { number: 1, word: "plaintiff", row: 0, col: 0, direction: "across" },
    { number: 2, word: "trial", row: 1, col: 4, direction: "down" },
    { number: 3, word: "warrant", row: 2, col: 0, direction: "across" },
    { number: 4, word: "defendant", row: 3, col: 0, direction: "down" },
    { number: 5, word: "plea", row: 4, col: 5, direction: "across" },
    { number: 6, word: "charge", row: 6, col: 1, direction: "across" },
    { number: 7, word: "custody", row: 6, col: 1, direction: "down" }, // Note: Charge and Custody share start cell
    { number: 8, word: "sentence", row: 10, col: 2, direction: "across" },
    { number: 9, word: "clerk", row: 9, col: 6, direction: "down" },
    { number: 10, word: "publicprosecutor", row: 12, col: 0, direction: "across" },
    { number: 11, word: "testimony", row: 7, col: 5, direction: "down" },
    { number: 12, word: "verdict", row: 8, col: 4, direction: "across" },
    { number: 13, word: "prosecution", row: 1, col: 7, direction: "down" },
    { number: 14, word: "summons", row: 3, col: 11, direction: "down" },
    { number: 15, word: "defense", row: 11, col: 5, direction: "across" },
    { number: 16, word: "crossexamine", row: 4, col: 9, direction: "down" },
    { number: 17, word: "tribunal", row: 13, col: 3, direction: "across" },
    { number: 18, word: "adjourn", row: 5, col: 11, direction: "across" },
    { number: 19, word: "affidavit", row: 2, col: 6, direction: "down" },
    { number: 20, word: "incasu", row: 14, col: 9, direction: "across" },
    { number: 21, word: "primafacie", row: 6, col: 13, direction: "down" },
    { number: 22, word: "jsc", row: 0, col: 14, direction: "down" },
    { number: 23, word: "zrp", row: 5, col: 0, direction: "down" },
    { number: 24, word: "cpea", row: 8, col: 12, direction: "down" },
];

const batch1Clues = {
    across: [
        { number: 1, clue: "The party who initiates a civil case" },
        { number: 3, clue: "A written court order, often authorizing arrest or search" },
        { number: 5, clue: "A formal statement of guilt or innocence" },
        { number: 6, clue: "The formal accusation of a crime" },
        { number: 8, clue: "The punishment given after a conviction" },
        { number: 10, clue: "Legal official who brings charges against accused individuals" },
        { number: 12, clue: "Final decision of a jury or judge" },
        { number: 15, clue: "The legal team or argument for the accused" },
        { number: 17, clue: "A type of court or decision-making body" },
        { number: 18, clue: "To suspend court proceedings temporarily" },
        { number: 20, clue: "Latin: “In this case”" },
        { number: 22, clue: "Zimbabwe Republic Police (abbr.)" }, // Mismatch from ZRP to JSC in prev output, will use ZRP as per word
    ],
    down: [
        { number: 2, clue: "A formal examination of evidence in court" },
        { number: 4, clue: "The person accused or sued in court" },
        { number: 7, clue: "State of being detained by legal authority" },
        { number: 9, clue: "Administrative court officer who keeps records" },
        { number: 11, clue: "Statement made by a witness under oath" },
        { number: 13, clue: "The side bringing a criminal case to court" },
        { number: 14, clue: "Legal document calling someone to court" },
        { number: 16, clue: "To question a witness from the opposing side" },
        { number: 19, clue: "A written statement confirmed by oath" },
        { number: 21, clue: "Latin: “At first glance”; presumed true until disproven" },
        { number: 23, clue: "Judicial Service Commission (abbr.)" }, // Mismatch from JSC to ZRP, will use JSC as per word
        { number: 24, clue: "Criminal Procedure and Evidence Act (abbr.)" },
    ]
};

// --- Global Game State ---
let crosswordGrid = []; // 2D array to hold the correct letters for the solution
let crosswordClues = {}; // To store clues for the current batch
let currentLayout = []; // To store word placement data for the current batch
let activeCell = null; // Currently selected input cell
let activeClue = null; // Currently active clue element (for highlighting)

// --- DOM Elements ---
const gridContainer = document.getElementById('crossword-grid');
const acrossCluesList = document.getElementById('across-clues-list');
const downCluesList = document.getElementById('down-clues-list');
const checkBtn = document.getElementById('check-crossword-btn');
const clearBtn = document.getElementById('clear-crossword-btn');

// --- Core Functions ---

/**
 * Initializes the crossword grid with empty cells and places words.
 * @param {Array} layoutData - Array of word objects {number, word, row, col, direction}
 */
function initializeGrid(layoutData) {
    // 1. Create a blank grid filled with nulls
    crosswordGrid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));

    // 2. Place words into the internal crosswordGrid (solution)
    layoutData.forEach(wordData => {
        const word = wordData.word.toUpperCase();
        let r = wordData.row;
        let c = wordData.col;

        for (let i = 0; i < word.length; i++) {
            crosswordGrid[r][c] = word[i]; // Place the letter
            if (wordData.direction === "across") {
                c++;
            } else { // "down"
                r++;
            }
        }
    });
}

/**
 * Renders the HTML crossword grid based on the internal crosswordGrid.
 */
function renderGrid() {
    gridContainer.innerHTML = ''; // Clear previous grid
    gridContainer.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`; // Set CSS grid columns dynamically

    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cellDiv = document.createElement('div');
            cellDiv.classList.add('crossword-cell');
            cellDiv.dataset.row = r;
            cellDiv.dataset.col = c;

            if (crosswordGrid[r][c] !== null) {
                // This is a playable cell
                cellDiv.classList.add('playable');
                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;
                input.dataset.row = r; // Add data attributes for easy lookup
                input.dataset.col = c;
                input.addEventListener('input', handleInput);
                input.addEventListener('keydown', handleKeyDown);
                input.addEventListener('focus', handleCellFocus); // New event for highlighting on focus
                cellDiv.appendChild(input);

                // Add clue numbers to the top-left of starting cells
                const clueNumbers = currentLayout.filter(w => w.row === r && w.col === c);
                if (clueNumbers.length > 0) {
                    const clueNumberSpan = document.createElement('span');
                    clueNumberSpan.classList.add('clue-number');
                    // Display all numbers if multiple words start here
                    clueNumberSpan.textContent = clueNumbers.map(cn => cn.number).join(', ');
                    cellDiv.appendChild(clueNumberSpan);
                }

            } else {
                // This is an empty (black) cell
                cellDiv.classList.add('empty');
            }
            gridContainer.appendChild(cellDiv);
        }
    }
}

/**
 * Renders the HTML crossword grid based on the internal crosswordGrid.
 */
function renderGrid() {
    gridContainer.innerHTML = ''; // Clear previous grid
    gridContainer.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`; // Set CSS grid columns dynamically

    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cellDiv = document.createElement('div');
            cellDiv.classList.add('crossword-cell');
            cellDiv.dataset.row = r;
            cellDiv.dataset.col = c;

            if (crosswordGrid[r][c] !== null) {
                // This is a playable cell
                cellDiv.classList.add('playable');
                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;
                input.dataset.row = r; // Add data attributes for easy lookup
                input.dataset.col = c;
                input.addEventListener('input', handleInput);
                input.addEventListener('keydown', handleKeyDown);
                input.addEventListener('focus', handleCellFocus); // New event for highlighting on focus
                cellDiv.appendChild(input);

                // Add clue numbers to the top-left of starting cells
                const clueNumbers = currentLayout.filter(w => w.row === r && w.col === c);
                if (clueNumbers.length > 0) {
                    const clueNumberSpan = document.createElement('span');
                    clueNumberSpan.classList.add('clue-number');
                    // Display all numbers if multiple words start here
                    clueNumberSpan.textContent = clueNumbers.map(cn => cn.number).join(', ');
                    cellDiv.appendChild(clueNumberSpan);
                }

            } else {
                // This is an empty (black) cell
                cellDiv.classList.add('empty');
            }
            gridContainer.appendChild(cellDiv);
        }
    }
}

/**
 * Displays the clues in the respective lists.
 * @param {object} clues - Object with 'across' and 'down' arrays of clues.
 */
function renderClues(clues) {
    acrossCluesList.innerHTML = '';
    downCluesList.innerHTML = '';

    clues.across.forEach(clue => {
        const li = document.createElement('li');
        li.dataset.clueNumber = clue.number;
        li.dataset.direction = 'across';
        li.innerHTML = `<strong>${clue.number}.</strong> ${clue.clue}`;
        li.addEventListener('click', handleClueClick);
        acrossCluesList.appendChild(li);
    });

    clues.down.forEach(clue => {
        const li = document.createElement('li');
        li.dataset.clueNumber = clue.number;
        li.dataset.direction = 'down';
        li.innerHTML = `<strong>${clue.number}.</strong> ${clue.clue}`;
        li.addEventListener('click', handleClueClick);
        downCluesList.appendChild(li);
    });
}

// --- Event Handlers ---

function handleInput(event) {
    const input = event.target;
    let value = input.value.toUpperCase();
    if (!/^[A-Z]$/.test(value)) {
        value = ''; // Clear if not a single letter
    }
    input.value = value;

    // Auto-advance to the next cell
    const row = parseInt(input.dataset.row);
    const col = parseInt(input.dataset.col);

    // Get the currently active clue's direction
    if (activeClue) {
        const direction = activeClue.dataset.direction;
        let nextInput = null;

        if (direction === 'across') {
            nextInput = findNextPlayableCell(row, col, 0, 1); // Move right
        } else if (direction === 'down') {
            nextInput = findNextPlayableCell(row, col, 1, 0); // Move down
        }

        if (nextInput) {
            nextInput.focus();
        }
    }
}

function handleKeyDown(event) {
    const input = event.target;
    const row = parseInt(input.dataset.row);
    const col = parseInt(input.dataset.col);
    let nextInput = null;

    // Handle arrow keys for navigation
    if (event.key === 'ArrowRight') {
        nextInput = findNextPlayableCell(row, col, 0, 1);
    } else if (event.key === 'ArrowLeft') {
        nextInput = findNextPlayableCell(row, col, 0, -1);
    } else if (event.key === 'ArrowDown') {
        nextInput = findNextPlayableCell(row, col, 1, 0);
    } else if (event.key === 'ArrowUp') {
        nextInput = findNextPlayableCell(row, col, -1, 0);
    }

    if (nextInput) {
        nextInput.focus();
        event.preventDefault(); // Prevent default browser scroll
    }
}

// Helper to find the next playable cell
function findNextPlayableCell(startRow, startCol, rowInc, colInc) {
    let nextRow = startRow + rowInc;
    let nextCol = startCol + colInc;

    while (nextRow >= 0 && nextRow < GRID_SIZE && nextCol >= 0 && nextCol < GRID_SIZE) {
        const nextCellDiv = document.querySelector(`[data-row="${nextRow}"][data-col="${nextCol}"]`);
        if (nextCellDiv && nextCellDiv.classList.contains('playable')) {
            return nextCellDiv.querySelector('input');
        }
        nextRow += rowInc;
        nextCol += colInc;
    }
    return null;
}


function handleCellFocus(event) {
    activeCell = event.target;
    clearHighlights(); // Clear previous highlights

    // Highlight the focused cell
    activeCell.parentElement.classList.add('selected-cell');

    // Find all words that pass through the active cell
    const intersectingWords = currentLayout.filter(wordData => {
        if (wordData.direction === 'across') {
            return wordData.row === parseInt(activeCell.dataset.row) &&
                   parseInt(activeCell.dataset.col) >= wordData.col &&
                   parseInt(activeCell.dataset.col) < wordData.col + wordData.word.length;
        } else { // 'down'
            return wordData.col === parseInt(activeCell.dataset.col) &&
                   parseInt(activeCell.dataset.row) >= wordData.row &&
                   parseInt(activeCell.dataset.row) < wordData.row + wordData.word.length;
        }
    });

    // Highlight the clue(s) associated with the active cell
    let foundActiveClue = false;
    document.querySelectorAll('.clue-section li').forEach(li => {
        const clueNum = parseInt(li.dataset.clueNumber);
        const direction = li.dataset.direction;

        const isStartingCell = intersectingWords.some(word =>
            word.number === clueNum &&
            word.direction === direction &&
            word.row === parseInt(activeCell.dataset.row) &&
            word.col === parseInt(activeCell.dataset.col)
        );

        const isPartOfWord = intersectingWords.some(word =>
            word.number === clueNum &&
            word.direction === direction
        );

        if (isPartOfWord) {
            li.classList.add('active-clue');
            // If it's a starting cell, make it the primary active clue for auto-advance
            if (isStartingCell) {
                activeClue = li;
                foundActiveClue = true;
            }
        }
    });

    // If no specific starting clue was found for highlighting, default to the first intersecting word's clue
    if (!foundActiveClue && intersectingWords.length > 0) {
        const defaultClueWord = intersectingWords[0];
        const defaultClueElement = document.querySelector(`.clue-section li[data-clue-number="${defaultClueWord.number}"][data-direction="${defaultClueWord.direction}"]`);
        if (defaultClueElement) {
            activeClue = defaultClueElement;
            defaultClueElement.classList.add('active-clue');
        }
    }

    // Highlight cells belonging to the active clue (if one is determined)
    if (activeClue) {
        const activeClueNumber = parseInt(activeClue.dataset.clueNumber);
        const activeClueDirection = activeClue.dataset.direction;

        const wordData = currentLayout.find(w => w.number === activeClueNumber && w.direction === activeClueDirection);

        if (wordData) {
            let r = wordData.row;
            let c = wordData.col;
            for (let i = 0; i < wordData.word.length; i++) {
                const cellToHighlight = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                if (cellToHighlight) {
                    cellToHighlight.classList.add('highlighted-word');
                }
                if (wordData.direction === 'across') {
                    c++;
                } else {
                    r++;
                }
            }
        }
    }
}

function handleClueClick(event) {
    clearHighlights();
    activeClue = event.target.closest('li'); // Use closest to get the li even if strong/span is clicked
    if (!activeClue) return;

    activeClue.classList.add('active-clue');

    const clueNumber = parseInt(activeClue.dataset.clueNumber);
    const direction = activeClue.dataset.direction;

    // Find the word data associated with this clue
    const wordData = currentLayout.find(w => w.number === clueNumber && w.direction === direction);

    if (wordData) {
        // Highlight the entire word in the grid
        let r = wordData.row;
        let c = wordData.col;
        for (let i = 0; i < wordData.word.length; i++) {
            const cellToHighlight = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (cellToHighlight) {
                cellToHighlight.classList.add('highlighted-word');
            }
            if (wordData.direction === 'across') {
                c++;
            } else {
                r++;
            }
        }

        // Focus the first letter of the clicked word
        const firstCellInput = document.querySelector(`input[data-row="${wordData.row}"][data-col="${wordData.col}"]`);
        if (firstCellInput) {
            firstCellInput.focus();
            activeCell = firstCellInput; // Update activeCell to ensure auto-advance works from here
            firstCellInput.parentElement.classList.add('selected-cell'); // Also highlight its parent cell div
        }
    }
}


function clearHighlights() {
    document.querySelectorAll('.crossword-cell').forEach(cell => {
        cell.classList.remove('selected-cell', 'highlighted-word');
    });
    document.querySelectorAll('.clue-section li').forEach(li => {
        li.classList.remove('active-clue');
    });
}

function checkCrossword() {
    let correctCount = 0;
    let totalCells = 0;
    let allCellsFilled = true;

    document.querySelectorAll('.crossword-cell.playable input').forEach(input => {
        const r = parseInt(input.dataset.row);
        const c = parseInt(input.dataset.col);
        const userAnswer = input.value.toUpperCase();
        const correctAnswer = crosswordGrid[r][c];

        if (userAnswer === '') {
            allCellsFilled = false;
        }

        if (userAnswer === correctAnswer) {
            input.classList.remove('incorrect');
            // input.classList.add('correct'); // Optional: Add a 'correct' class
            correctCount++;
        } else {
            input.classList.add('incorrect');
            // input.classList.remove('correct');
        }
        totalCells++;
    });

    if (!allCellsFilled) {
        alert("Please fill in all cells before checking!");
        return;
    }

    if (correctCount === totalCells) {
        alert("Congratulations! You've solved the puzzle!");
    } else {
        alert(`You got ${correctCount} out of ${totalCells} letters correct. Keep trying!`);
    }
}

function clearInputs() {
    document.querySelectorAll('.crossword-cell.playable input').forEach(input => {
        input.value = '';
        input.classList.remove('incorrect', 'correct');
    });
    clearHighlights();
    activeCell = null;
    activeClue = null;
    // Optional: Focus the first playable cell after clearing
    const firstPlayable = document.querySelector('.crossword-cell.playable input');
    if (firstPlayable) {
        firstPlayable.focus();
    }
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Set current puzzle data
    currentLayout = batch1Layout;
    crosswordClues = batch1Clues;

    // Initialize and render the grid
    initializeGrid(currentLayout);
    renderGrid();
    renderClues(crosswordClues);

    // Add event listeners for buttons
    checkBtn.addEventListener('click', checkCrossword);
    clearBtn.addEventListener('click', clearInputs);

    // Global click listener to clear highlights when clicking outside grid/clues
    document.addEventListener('click', (e) => {
        const isClickInsideGrid = gridContainer.contains(e.target);
        const isClickInsideClues = acrossCluesList.contains(e.target) || downCluesList.contains(e.target);
        const isButtonClick = e.target.classList.contains('crossword-btn');

        if (!isClickInsideGrid && !isClickInsideClues && !isButtonClick) {
            clearHighlights();
            activeCell = null;
            activeClue = null;
        }
    });

    // Optional: Focus the first playable cell on load
    const firstPlayable = document.querySelector('.crossword-cell.playable input');
    if (firstPlayable) {
        firstPlayable.focus();
    }
});