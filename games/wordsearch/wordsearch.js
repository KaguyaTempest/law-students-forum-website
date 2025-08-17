// script.js

document.addEventListener('DOMContentLoaded', () => {

    // --- Word Bank Data ---
    const wordBank = [
        // EASY LEVEL
        "Law", "Bail", "Act", "Court", "Judge", "Arrest", "Trial", "Clerk", "Case", "Lawyer",
        // MEDIUM LEVEL
        "Verdict", "Remand", "Justice", "Plea", "Precedent", "Evidence", "Sentence", "Appeal", "Tort", "Equity", "Codify", "Custom",
        // HARD LEVEL
        "Codification", "Constitution", "MensRea", "ActusReus", "IrrebuttablePresumption", "ActOfParliament", "CustomarySuccession", "ReasonableManTest", "MinisterOfJusticeLegalAffairs", "InDubioProReo", "JudicialReview", "SubstantiveJustice",
        // SHONA / NDEBELE WORDS
        "KupesanaKwemitongo", "ZvirevoZvemutemo", "KusungwaNeOrder", "UkwehlulelwaKwahlelewa", "IsinqumoEsingaguqulwa", "UmthethoWamagugu", "GwaroRedare", "TsvakiridzoYenyaya"
    ];

    // Normalize and clean words (remove spaces, convert to uppercase)
    const cleanWords = wordBank.map(word => word.toUpperCase().replace(/\s/g, ''));

    // --- Game Configuration ---
    const GRID_SIZE = 25; // Grid size to accommodate long words
    const gridContainer = document.getElementById('grid-container');
    const wordListContainer = document.getElementById('word-list');
    const messageText = document.getElementById('message-text');
    const newGameBtn = document.getElementById('new-game-btn');
    const resetSelectionBtn = document.getElementById('reset-selection-btn');

    let grid = [];
    let wordsToFind = [];
    let foundWords = new Set();
    let isSelecting = false;
    let startCell = null;
    let currentPath = [];

    // --- Word Placement Logic ---
    /**
     * Generates a new word search grid and places words randomly.
     */
    function placeWords() {
        const shuffledWords = [...cleanWords].sort(() => Math.random() - 0.5);
        grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(''));

        shuffledWords.forEach(word => {
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 100) {
                const row = Math.floor(Math.random() * GRID_SIZE);
                const col = Math.floor(Math.random() * GRID_SIZE);
                const direction = Math.floor(Math.random() * 8); // 8 directions
                
                if (canPlaceWord(word, row, col, direction)) {
                    placeWord(word, row, col, direction);
                    wordsToFind.push(word);
                    placed = true;
                }
                attempts++;
            }
        });

        fillEmptyCells();
    }

    /**
     * Checks if a word can be placed at a specific location and direction.
     * @param {string} word - The word to place.
     * @param {number} row - The starting row.
     * @param {number} col - The starting column.
     * @param {number} direction - The direction index.
     * @returns {boolean} True if the word can be placed, false otherwise.
     */
    function canPlaceWord(word, row, col, direction) {
        const len = word.length;
        let [dx, dy] = getDirectionVector(direction);

        // Check if word fits within grid boundaries
        if (row + dx * (len - 1) < 0 || row + dx * (len - 1) >= GRID_SIZE ||
            col + dy * (len - 1) < 0 || col + dy * (len - 1) >= GRID_SIZE) {
            return false;
        }

        // Check for conflicts with existing letters
        for (let i = 0; i < len; i++) {
            const r = row + i * dx;
            const c = col + i * dy;
            if (grid[r][c] !== '' && grid[r][c] !== word[i]) {
                return false;
            }
        }
        return true;
    }

    /**
     * Places a word into the grid.
     * @param {string} word - The word to place.
     * @param {number} row - The starting row.
     * @param {number} col - The starting column.
     * @param {number} direction - The direction index.
     */
    function placeWord(word, row, col, direction) {
        const [dx, dy] = getDirectionVector(direction);
        for (let i = 0; i < word.length; i++) {
            const r = row + i * dx;
            const c = col + i * dy;
            grid[r][c] = word[i];
        }
    }

    /**
     * Fills any empty cells in the grid with random letters.
     */
    function fillEmptyCells() {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (grid[r][c] === '') {
                    grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
                }
            }
        }
    }

    /**
     * Returns the delta for a given direction index.
     * @param {number} direction - The direction index (0-7).
     * @returns {number[]} The [dx, dy] vector.
     */
    function getDirectionVector(direction) {
        switch (direction) {
            case 0: return [0, 1];   // Right
            case 1: return [0, -1];  // Left
            case 2: return [1, 0];   // Down
            case 3: return [-1, 0];  // Up
            case 4: return [1, 1];   // Down-Right
            case 5: return [1, -1];  // Down-Left
            case 6: return [-1, 1];  // Up-Right
            case 7: return [-1, -1]; // Up-Left
            default: return [0, 0];
        }
    }

    // --- Game Rendering ---
    /**
     * Renders the word search grid to the DOM.
     */
    function renderGrid() {
        gridContainer.innerHTML = '';
        gridContainer.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
        grid.forEach((row, r) => {
            row.forEach((letter, c) => {
                const cell = document.createElement('div');
                cell.classList.add('grid-cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.textContent = letter;
                gridContainer.appendChild(cell);
            });
        });
    }

    /**
     * Renders the list of words to find.
     */
    function renderWordList() {
        wordListContainer.innerHTML = '';
        wordsToFind.forEach(word => {
            const wordItem = document.createElement('div');
            wordItem.classList.add('word-item');
            wordItem.textContent = word;
            wordListContainer.appendChild(wordItem);
        });
    }

    // --- User Interaction Logic ---
    /**
     * Gets all cells in a straight or diagonal line between two points.
     * @param {HTMLElement} start - The starting cell element.
     * @param {HTMLElement} end - The ending cell element.
     * @returns {HTMLElement[]} An array of cells in the path.
     */
    function getCellsInRange(start, end) {
        const path = [];
        const [r1, c1] = [parseInt(start.dataset.row), parseInt(start.dataset.col)];
        const [r2, c2] = [parseInt(end.dataset.row), parseInt(end.dataset.col)];

        const dr = Math.sign(r2 - r1);
        const dc = Math.sign(c2 - c1);

        if (dr === 0 && dc === 0) {
            path.push(start);
            return path;
        }

        if (Math.abs(r2 - r1) !== Math.abs(c2 - c1) && r1 !== r2 && c1 !== c2) {
            return [];
        }

        let r = r1;
        let c = c1;
        while (true) {
            const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (cell) path.push(cell);
            
            if (r === r2 && c === c2) break;
            
            r += dr;
            c += dc;
        }
        return path;
    }

    /**
     * Checks if the currently selected path of letters forms a valid word.
     */
    function checkWord() {
        const selectedWord = currentPath.map(cell => cell.textContent).join('');
        
        // Check if the word is in the list
        const wordIndex = wordsToFind.indexOf(selectedWord);
        if (wordIndex !== -1) {
            markWordAsFound(selectedWord);
            return;
        }

        // Check for reverse word
        const reverseSelectedWord = selectedWord.split('').reverse().join('');
        const reverseWordIndex = wordsToFind.indexOf(reverseSelectedWord);
        if (reverseWordIndex !== -1) {
            markWordAsFound(reverseSelectedWord);
            return;
        }
        
        // If not found, reset selection
        resetSelection();
        messageText.textContent = "That's not a word. Try again!";
    }

    /**
     * Marks a word as found and updates the UI.
     * @param {string} word - The word that was found.
     */
    function markWordAsFound(word) {
        foundWords.add(word);
        
        // Highlight the cells
        currentPath.forEach(cell => {
            cell.classList.remove('selected');
            cell.classList.add('found');
        });
        
        // Strike through the word in the list
        const wordItem = Array.from(wordListContainer.children).find(item => item.textContent === word);
        if (wordItem) {
            wordItem.classList.add('found');
        }

        // Check if all words are found
        if (foundWords.size === wordsToFind.length) {
            messageText.textContent = "Congratulations! You found all the words!";
        } else {
            messageText.textContent = `You found "${word}"! Keep going!`;
        }

        // Reset selection state
        resetSelection();
    }
    
    /**
     * Resets the current selection and UI state.
     */
    function resetSelection() {
        currentPath.forEach(cell => cell.classList.remove('selected'));
        isSelecting = false;
        startCell = null;
        currentPath = [];
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        // Mouse/pointer events
        gridContainer.addEventListener('mousedown', (e) => {
            const target = e.target.closest('.grid-cell');
            if (!target || target.classList.contains('found')) return;
            
            resetSelection();
            isSelecting = true;
            startCell = target;
            target.classList.add('selected');
            currentPath.push(target);
            messageText.textContent = "Drag to select a word...";
        });

        gridContainer.addEventListener('mousemove', (e) => {
            if (!isSelecting) return;

            const target = e.target.closest('.grid-cell');
            if (!target || target === currentPath[currentPath.length - 1]) return;
            
            currentPath.forEach(cell => cell.classList.remove('selected'));
            currentPath = getCellsInRange(startCell, target);
            currentPath.forEach(cell => cell.classList.add('selected'));
        });

        gridContainer.addEventListener('mouseup', () => {
            if (isSelecting && currentPath.length > 1) {
                checkWord();
            } else {
                resetSelection();
            }
        });

        // Touch events for mobile
        gridContainer.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            const cell = target.closest('.grid-cell');
            if (cell) {
                gridContainer.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, target: cell }));
            }
        });

        gridContainer.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            const cell = target.closest('.grid-cell');
            if (cell) {
                gridContainer.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, target: cell }));
            }
        });

        gridContainer.addEventListener('touchend', (e) => {
            e.preventDefault();
            gridContainer.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        });

        // Button event listeners
        newGameBtn.addEventListener('click', startGame);
        resetSelectionBtn.addEventListener('click', () => {
            resetSelection();
            messageText.textContent = "Selection reset.";
        });
    }

    // --- Game Initialization ---
    function startGame() {
        foundWords.clear();
        wordsToFind = [];
        resetSelection();
        messageText.textContent = "Select letters to find a word!";
        placeWords();
        renderGrid();
        renderWordList();
    }

    // Start the game when the page loads
    startGame();
    setupEventListeners();
});
