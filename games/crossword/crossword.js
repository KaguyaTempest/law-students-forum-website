// crossword.js

// Firebase Imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

// --- Global Variables for Game State and Firebase ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : '';

let db, auth, userId;
let currentUserData = {};
let isAuthReady = false;

// --- DOM Elements ---
const crosswordGrid = document.getElementById('crossword-grid');
const acrossCluesList = document.querySelector('#across-clues ul');
const downCluesList = document.querySelector('#down-clues ul');
const timerDisplay = document.getElementById('timer');
const xpDisplay = document.getElementById('xp-display');
const checkPuzzleBtn = document.getElementById('check-puzzle-btn');
const useClueBtn = document.getElementById('use-clue-btn');
const gameModal = document.getElementById('game-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCloseBtn = document.getElementById('modal-close-btn');

// --- Game State Variables ---
let currentPuzzle = null;
let boardState = []; // 2D array to store the user's input
let selectedCell = null;
let selectedWord = null;
let timerInterval = null;
let startTime = 0;
let cluesUsed = 0;
const dailyClueLimit = 3;
const xpPenaltyPerClue = 25;
const xpPenaltyForExceedingLimit = 100;

// --- The complete set of puzzles, generated from your word bank ---
const allPuzzles = {
    easy: [
        {
            name: 'Easy Puzzle 1',
            difficulty: 'Easy',
            baseXP: 100,
            parTimeMinutes: 5,
            words: [
                { word: 'VERDICT', clue: 'The decision in a civil or criminal case.', start: [1, 2], direction: 'across' },
                { word: 'TORT', clue: 'A civil wrong that causes a claimant to suffer loss or harm.', start: [3, 2], direction: 'down' },
                { word: 'PLEA', clue: 'A defendant\'s answer to a charge in a criminal case.', start: [3, 6], direction: 'across' },
                { word: 'APPEAL', clue: 'To ask a higher court to review a decision.', start: [6, 4], direction: 'across' },
                { word: 'EVIDENCE', clue: 'Information presented to a court to prove facts.', start: [2, 5], direction: 'down' },
                { word: 'LAW', clue: 'The system of rules that a country or community recognizes.', start: [6, 1], direction: 'down' },
                { word: 'JURY', clue: 'A body of people sworn to give a verdict in a legal case.', start: [4, 0], direction: 'across' }
            ],
            grid: [
                [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                [' ', ' ', 'V', 'E', 'R', 'D', 'I', 'C', 'T'],
                [' ', ' ', ' ', ' ', ' ', 'E', ' ', ' ', ' '],
                ['J', 'U', 'R', 'Y', ' ', ' ', ' ', ' ', ' '],
                [' ', ' ', ' ', ' ', ' ', 'E', ' ', ' ', ' '],
                [' ', ' ', ' ', ' ', 'A', ' ', ' ', ' ', ' '],
                ['L', 'A', 'W', ' ', 'A', 'P', 'P', 'E', 'A', 'L'],
                [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']
            ]
        },
        // Add more easy puzzles here
    ],
    medium: [
        {
            name: 'Medium Puzzle 1',
            difficulty: 'Medium',
            baseXP: 250,
            parTimeMinutes: 8,
            words: [
                { word: 'AFFIDAVIT', clue: 'A written statement confirmed by oath or affirmation.', start: [1, 1], direction: 'across' },
                { word: 'JURISDICTION', clue: 'The official power to make legal decisions and judgments.', start: [1, 1], direction: 'down' },
                { word: 'SUBPOENA', clue: 'A writ ordering a person to attend a court.', start: [3, 3], direction: 'across' },
                { word: 'BREACH', clue: 'An act of breaking a law or agreement.', start: [6, 4], direction: 'down' },
                { word: 'TORTS', clue: 'Plural of a civil wrong.', start: [9, 1], direction: 'across' },
                { word: 'LITIGATION', clue: 'The process of taking legal action.', start: [0, 8], direction: 'down' }
            ],
            grid: [
                [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'L', ' '],
                [' ', 'A', 'F', 'F', 'I', 'D', 'A', 'V', 'I', 'T'],
                [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'T', ' '],
                [' ', ' ', ' ', 'S', 'U', 'B', 'P', 'O', 'E', 'N', 'A'],
                [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'O', ' '],
                [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'N', ' '],
                [' ', 'J', 'U', 'R', 'I', 'S', 'D', 'I', 'C', 'T', 'I', 'O', 'N'],
                [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'I', ' '],
                [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', 'O', ' '],
                [' ', 'T', 'O', 'R', 'T', 'S', ' ', ' ', 'N', ' ']
            ]
        },
        // Add more medium puzzles here
    ],
    hard: [
        {
            name: 'Hard Puzzle 1',
            difficulty: 'Hard',
            baseXP: 500,
            parTimeMinutes: 12,
            words: [
                { word: 'STAREDECISIS', clue: 'The legal principle of determining points in litigation according to precedent.', start: [1, 2], direction: 'across' },
                { word: 'PERINCURIM', clue: 'Through lack of care; a legal precedent that is flawed.', start: [1, 2], direction: 'down' },
                { word: 'HABEASCORPUS', clue: 'A writ requiring a person under arrest to be brought before a judge.', start: [5, 4], direction: 'across' },
                { word: 'OBITERDICTUM', clue: 'A judge\'s expression of opinion on a point of law not essential to the decision.', start: [3, 0], direction: 'across' },
                { word: 'ULTRAVIRES', clue: 'Beyond the legal power or authority of a person or body.', start: [0, 6], direction: 'down' }
            ],
            grid: [
                [' ', ' ', ' ', ' ', ' ', ' ', 'U', ' ', ' '],
                [' ', ' ', 'S', 'T', 'A', 'R', 'E', 'D', 'E', 'C', 'I', 'S', 'I', 'S'],
                [' ', ' ', ' ', ' ', ' ', ' ', 'L', ' ', ' '],
                ['O', 'B', 'I', 'T', 'E', 'R', 'D', 'I', 'C', 'T', 'U', 'M'],
                [' ', ' ', ' ', ' ', ' ', ' ', 'R', ' ', ' '],
                [' ', ' ', ' ', ' ', 'H', 'A', 'B', 'E', 'A', 'S', 'C', 'O', 'R', 'P', 'U', 'S'],
                [' ', ' ', ' ', ' ', ' ', ' ', 'V', ' ', ' '],
                [' ', ' ', ' ', ' ', ' ', ' ', 'I', ' ', ' '],
                [' ', ' ', ' ', ' ', ' ', ' ', 'R', ' ', ' '],
                [' ', ' ', ' ', ' ', ' ', ' ', 'E', ' ', ' '],
                [' ', ' ', ' ', ' ', ' ', ' ', 'S', ' ', ' ']
            ]
        },
        // Add more hard puzzles here
    ],
    insane: [
        {
            name: 'Insane Puzzle 1',
            difficulty: 'Insane',
            baseXP: 1000,
            parTimeMinutes: 15,
            words: [
                { word: 'GWACHIWA', clue: 'A famous Zimbabwean criminal law case.', start: [0, 1], direction: 'across' },
                { word: 'MUDZURU', clue: 'A landmark Zimbabwean constitutional law case.', start: [0, 1], direction: 'down' },
                { word: 'CONSTITUTIONOFZIMBABWE', clue: 'The supreme law of Zimbabwe.', start: [3, 0], direction: 'across' },
                { word: 'KUPESANAKWEMITONGO', clue: 'Shona for "conflict of laws."', start: [4, 6], direction: 'down' },
                { word: 'CHINHENGO', clue: 'A legal case on the doctrine of stare decisis in Zimbabwe.', start: [6, 2], direction: 'across' }
            ],
            grid: [
                [' ', 'G', 'W', 'A', 'C', 'H', 'I', 'W', 'A'],
                [' ', 'M', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                [' ', 'U', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                ['C', 'O', 'N', 'S', 'T', 'I', 'T', 'U', 'T', 'I', 'O', 'N', 'O', 'F', 'Z', 'I', 'M', 'B', 'A', 'B', 'W', 'E'],
                [' ', 'U', ' ', ' ', ' ', 'K', 'U', 'P', 'E', 'S', 'A', 'N', 'A', 'K', 'W', 'E', 'M', 'I', 'T', 'O', 'N', 'G', 'O'],
                [' ', 'R', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                [' ', 'U', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
                [' ', ' ', 'C', 'H', 'I', 'N', 'H', 'E', 'N', 'G', 'O'],
                [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']
            ]
        },
        // Add more insane puzzles here
    ],
    weeklyChallenge: {
        name: 'Weekly Challenge Puzzle',
        difficulty: 'Hard', // Can be any difficulty
        baseXP: 750,
        parTimeMinutes: 10,
        words: [
            // Words for the weekly challenge, will be updated by admin
        ],
        grid: [
            // Grid for the weekly challenge
        ]
    }
};

// --- Firebase Initialization and Authentication ---
const initFirebase = async () => {
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                userId = user.uid;
                await fetchOrCreateUserProfile();
                isAuthReady = true;
                // Once authenticated, load a puzzle
                loadPuzzle('easy'); // Default to loading an easy puzzle
            } else {
                console.log("No user signed in. Attempting anonymous sign-in.");
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(auth, initialAuthToken);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Firebase Auth Error:", error);
                }
            }
        });
    } catch (e) {
        console.error("Firebase initialization failed:", e);
    }
};

const fetchOrCreateUserProfile = async () => {
    if (!userId) return;
    const userDocRef = doc(db, 'artifacts', appId, 'users', userId, 'profile', 'data');
    
    // Listen for real-time updates to the user profile
    onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            currentUserData = docSnap.data();
            updateUIWithUserData();
        } else {
            // User profile doesn't exist, create a new one
            const newProfile = {
                xp: 0,
                cluesUsedToday: 0,
                lastClueDate: new Date().toISOString().split('T')[0] // YYYY-MM-DD
            };
            setDoc(userDocRef, newProfile).catch(console.error);
            currentUserData = newProfile;
            updateUIWithUserData();
        }
    }, (error) => {
        console.error("Error fetching user profile:", error);
    });
};

const updateUIWithUserData = () => {
    if (currentUserData) {
        xpDisplay.textContent = `XP: ${currentUserData.xp || 0}`;
        // You could also update a display for clues used here if you add one
    }
};

// --- Game Logic ---
const loadPuzzle = (difficulty) => {
    let puzzlesToLoad;
    if (difficulty === 'weeklyChallenge') {
        puzzlesToLoad = [allPuzzles.weeklyChallenge];
    } else {
        puzzlesToLoad = allPuzzles[difficulty];
    }
    
    // Select a random puzzle from the specified difficulty
    const puzzle = puzzlesToLoad[Math.floor(Math.random() * puzzlesToLoad.length)];
    currentPuzzle = puzzle;
    renderGrid(puzzle.grid);
    renderClues(puzzle.words);
    resetGameState();
};

const renderGrid = (gridData) => {
    crosswordGrid.innerHTML = '';
    const numRows = gridData.length;
    const numCols = gridData[0].length;
    crosswordGrid.style.gridTemplateColumns = `repeat(${numCols}, 1fr)`;
    
    boardState = Array.from({ length: numRows }, () =>
        Array(numCols).fill('')
    );

    let cellNumber = 1;
    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.dataset.row = row;
            cell.dataset.col = col;

            if (gridData[row][col] === ' ') {
                cell.classList.add('black-cell');
            } else {
                // Check if this is the start of a word
                const isStartOfWord = currentPuzzle.words.some(word =>
                    (word.start[0] === row && word.start[1] === col)
                );
                if (isStartOfWord) {
                    const numberSpan = document.createElement('span');
                    numberSpan.classList.add('number');
                    numberSpan.textContent = cellNumber++;
                    cell.appendChild(numberSpan);
                }

                // Add click listener
                cell.addEventListener('click', () => handleCellClick(row, col));
            }
            crosswordGrid.appendChild(cell);
        }
    }
};

const renderClues = (words) => {
    acrossCluesList.innerHTML = '';
    downCluesList.innerHTML = '';

    words.forEach(word => {
        const li = document.createElement('li');
        li.textContent = word.clue;
        li.dataset.word = word.word;
        li.addEventListener('click', () => selectWordFromClue(word.word));
        if (word.direction === 'across') {
            acrossCluesList.appendChild(li);
        } else {
            downCluesList.appendChild(li);
        }
    });
};

const resetGameState = () => {
    selectedCell = null;
    selectedWord = null;
    cluesUsed = 0;
    
    // Clear the timer and start a new one
    clearInterval(timerInterval);
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
};

const updateTimer = () => {
    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const handleCellClick = (row, col) => {
    const newSelectedCell = { row, col };
    
    // Find if the clicked cell belongs to an Across or Down word
    let wordDirection = null;
    let wordDetails = null;

    // Check for Across words
    currentPuzzle.words.forEach(word => {
        if (word.direction === 'across' && row === word.start[0] && col >= word.start[1] && col < word.start[1] + word.word.length) {
            wordDirection = 'across';
            wordDetails = word;
        }
    });

    // Check for Down words
    currentPuzzle.words.forEach(word => {
        if (word.direction === 'down' && col === word.start[1] && row >= word.start[0] && row < word.start[0] + word.word.length) {
            wordDirection = 'down';
            wordDetails = word;
        }
    });

    if (wordDetails) {
        selectedWord = wordDetails;
        selectedCell = newSelectedCell;
        highlightWord(wordDetails);
    }
};

const selectWordFromClue = (word) => {
    const wordDetails = currentPuzzle.words.find(w => w.word === word);
    if (wordDetails) {
        selectedWord = wordDetails;
        selectedCell = { row: wordDetails.start[0], col: wordDetails.start[1] };
        highlightWord(wordDetails);
    }
};

const highlightWord = (wordDetails) => {
    // Clear previous highlights
    document.querySelectorAll('.grid-cell').forEach(cell => {
        cell.classList.remove('selected', 'active-word');
    });
    
    // Highlight the selected word and cells
    const { word, start, direction } = wordDetails;
    for (let i = 0; i < word.length; i++) {
        let cell;
        if (direction === 'across') {
            cell = document.querySelector(`[data-row="${start[0]}"][data-col="${start[1] + i}"]`);
        } else {
            cell = document.querySelector(`[data-row="${start[0] + i}"][data-col="${start[1]}"]`);
        }
        if (cell) {
            cell.classList.add('active-word');
        }
    }
};

const handleKeyPress = (e) => {
    if (!selectedCell || !selectedWord) return;

    const key = e.key.toUpperCase();
    if (key.match(/^[A-Z]$/)) {
        // Add letter to the cell
        const cell = document.querySelector(`[data-row="${selectedCell.row}"][data-col="${selectedCell.col}"]`);
        if (cell) {
            cell.textContent = key;
            boardState[selectedCell.row][selectedCell.col] = key;
        }
        
        // Move to the next cell in the word
        let newRow = selectedCell.row;
        let newCol = selectedCell.col;
        if (selectedWord.direction === 'across') {
            newCol++;
            if (newCol >= selectedWord.start[1] + selectedWord.word.length) newCol = selectedCell.col;
        } else {
            newRow++;
            if (newRow >= selectedWord.start[0] + selectedWord.word.length) newRow = selectedCell.row;
        }
        selectedCell = { row: newRow, col: newCol };
        
        // Update highlight for the new cell
        document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('selected'));
        const nextCell = document.querySelector(`[data-row="${selectedCell.row}"][data-col="${selectedCell.col}"]`);
        if (nextCell) {
            nextCell.classList.add('selected');
        }

    } else if (e.key === 'Backspace') {
        // Handle backspace logic
        const cell = document.querySelector(`[data-row="${selectedCell.row}"][data-col="${selectedCell.col}"]`);
        if (cell && cell.textContent !== '') {
            cell.textContent = '';
            boardState[selectedCell.row][selectedCell.col] = '';
        } else {
            // Move backward
            if (selectedWord.direction === 'across') {
                selectedCell.col--;
            } else {
                selectedCell.row--;
            }
            if (selectedCell.row < 0 || selectedCell.col < 0) return;
            const prevCell = document.querySelector(`[data-row="${selectedCell.row}"][data-col="${selectedCell.col}"]`);
            if (prevCell) {
                prevCell.textContent = '';
                boardState[selectedCell.row][selectedCell.col] = '';
            }
        }
    }
};

const handleCheckPuzzle = () => {
    let allCorrect = true;
    
    // Clear previous feedback classes
    document.querySelectorAll('.grid-cell').forEach(cell => {
        cell.classList.remove('incorrect-dark', 'correct-dark', 'correct-light', 'incorrect-light');
    });

    currentPuzzle.words.forEach(wordData => {
        let wordIsCorrect = true;
        for (let i = 0; i < wordData.word.length; i++) {
            let row, col;
            if (wordData.direction === 'across') {
                row = wordData.start[0];
                col = wordData.start[1] + i;
            } else {
                row = wordData.start[0] + i;
                col = wordData.start[1];
            }

            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            const enteredLetter = boardState[row][col];
            const correctLetter = wordData.word[i];

            if (enteredLetter !== correctLetter) {
                wordIsCorrect = false;
                cell.classList.add('incorrect-dark');
            } else {
                cell.classList.add('correct-dark');
            }
        }
        if (!wordIsCorrect) {
            allCorrect = false;
        }
    });

    if (allCorrect) {
        handleWin();
    }
};

const handleUseClue = async () => {
    if (!selectedWord) {
        showModal('Select a word first!', 'You need to select a word on the grid before you can get a clue.');
        return;
    }

    if (!isAuthReady) {
        showModal('User not authenticated', 'Please wait for authentication to complete before using a clue.');
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const userDocRef = doc(db, 'artifacts', appId, 'users', userId, 'profile', 'data');
    
    // Reset daily clue count if it's a new day
    if (currentUserData.lastClueDate !== today) {
        await updateDoc(userDocRef, { cluesUsedToday: 0, lastClueDate: today });
        currentUserData.cluesUsedToday = 0;
    }

    const currentCluesUsed = currentUserData.cluesUsedToday || 0;
    const currentXP = currentUserData.xp || 0;

    if (currentCluesUsed >= dailyClueLimit) {
        if (currentXP < xpPenaltyForExceedingLimit) {
             showModal('Not enough XP!', 'You do not have enough XP to use another clue today.');
             return;
        }

        // Deduct from profile XP
        const newXP = currentXP - xpPenaltyForExceedingLimit;
        await updateDoc(userDocRef, { xp: newXP, cluesUsedToday: currentCluesUsed + 1 });
        showModal('XP Deducted!', `You've used all your daily clues. An XP penalty of ${xpPenaltyForExceedingLimit} has been deducted from your profile.`);
    } else {
        // Use a daily clue
        const newXP = currentXP - xpPenaltyPerClue;
        await updateDoc(userDocRef, { xp: newXP, cluesUsedToday: currentCluesUsed + 1 });
        showModal('Clue Used!', `An XP penalty of ${xpPenaltyPerClue} has been deducted for using a clue. You have ${dailyClueLimit - (currentCluesUsed + 1)} clues remaining today.`);
    }

    // Fill in a random letter of the selected word
    const word = selectedWord.word;
    const startRow = selectedWord.start[0];
    const startCol = selectedWord.start[1];
    let emptyCells = [];
    for (let i = 0; i < word.length; i++) {
        let row, col;
        if (selectedWord.direction === 'across') {
            row = startRow;
            col = startCol + i;
        } else {
            row = startRow + i;
            col = startCol;
        }
        if (boardState[row][col] === '') {
            emptyCells.push({ row, col, letter: word[i] });
        }
    }

    if (emptyCells.length > 0) {
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const cell = document.querySelector(`[data-row="${randomCell.row}"][data-col="${randomCell.col}"]`);
        if (cell) {
            cell.textContent = randomCell.letter;
            boardState[randomCell.row][randomCell.col] = randomCell.letter;
        }
    }
};

const handleWin = async () => {
    clearInterval(timerInterval);
    const finishTimeSeconds = (Date.now() - startTime) / 1000;
    
    // Calculate XP
    const parTimeSeconds = currentPuzzle.parTimeMinutes * 60;
    let bonusXP = 0;
    if (finishTimeSeconds <= parTimeSeconds) {
        const timeRatio = finishTimeSeconds / parTimeSeconds;
        if (timeRatio <= 0.75) {
            bonusXP = currentPuzzle.baseXP * 0.5; // Insane speed
        } else if (timeRatio <= 0.9) {
            bonusXP = currentPuzzle.baseXP * 0.25; // Very Fast speed
        } else {
            bonusXP = currentPuzzle.baseXP * 0.1; // Fast speed
        }
    }
    
    const totalXP = currentPuzzle.baseXP + bonusXP;
    
    if (isAuthReady) {
        const userDocRef = doc(db, 'artifacts', appId, 'users', userId, 'profile', 'data');
        const currentXP = currentUserData.xp || 0;
        await updateDoc(userDocRef, { xp: currentXP + totalXP }).catch(console.error);
    }
    
    showModal('Puzzle Solved!', `You completed the puzzle in ${timerDisplay.textContent}! You earned ${totalXP} XP.`);
};


// --- Modal Functions ---
const showModal = (title, message) => {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    gameModal.classList.remove('hidden');
};

const hideModal = () => {
    gameModal.classList.add('hidden');
};

// --- Event Listeners and Initial Load ---
document.addEventListener('keydown', handleKeyPress);
checkPuzzleBtn.addEventListener('click', handleCheckPuzzle);
useClueBtn.addEventListener('click', handleUseClue);
modalCloseBtn.addEventListener('click', hideModal);

window.onload = () => {
    initFirebase();
};
