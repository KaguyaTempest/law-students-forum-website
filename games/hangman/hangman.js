import { wordBank } from '/law-students-forum-website/games/hangman/hangman-wordbank.js';

// === Global Game State Variables ===
let selectedWordObj; // Stores the object { word: "...", hint: "...", theme: "..." }
let selectedWord;    // The actual word string
let hint;
let theme;
let mistakeCount = 0;
const maxMistakes = 6;
let guessedLetters = [];
let gameStarted = false; // To track if the game has begun after difficulty selection
let currentDifficulty = '';
let gameTimerInterval;
let timeRemaining = 0; // In seconds
let insaneModeLimbTimer; // Timer specifically for Insane mode automatic limb addition

// === DOM Elements ===
const difficultyScreen = document.getElementById("difficulty-screen");
const gameScreen = document.getElementById("game-screen");
const difficultyButtonsContainer = document.getElementById("difficulty-buttons");
const timerDisplay = document.getElementById("timer");
const taglineElement = document.getElementById("tagline");
const wordDisplay = document.getElementById("word-display");
const letterButtonsContainer = document.getElementById("letter-buttons");
const themeHintContainer = document.getElementById("theme-hint");
const judgeImage = document.getElementById("judge-image"); // Reference to the judge image

// New DOM elements for game over screen
const gameOverScreen = document.getElementById("game-over-screen");
const gameOverMessage = document.getElementById("game-over-message");
const correctWordDisplay = document.getElementById("correct-word-display");
const playAgainBtn = document.getElementById("play-again-btn");

// Theme + Hint elements (dynamically created)
const themeElement = document.createElement("div");
const hintElement = document.createElement("div");

// Hangman drawing element
const drawingContainer = document.getElementById("hangman-drawing");

// Judge Image Paths
const JUDGE_IDLE_IMAGE = "/law-students-forum-website/assets/sprites/judge-idle.png";
const JUDGE_WIN_IMAGE = "/law-students-forum-website/assets/sprites/judge-gavel-slam.png"; // Assuming this is your "win" image
const JUDGE_LOSE_IMAGE = "/law-students-forum-website/assets/sprites/judge-gavel-slam.png"; // Using the same slam for loss for now, or you can specify another if you have one


// === STEP 1: Preload Images (New Feature) ===
function preloadImages(imageUrls) {
    imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}

// === STEP 2: Initialize Difficulty Screen ===
function initDifficultyScreen() {
    difficultyScreen.classList.add('active');
    gameScreen.classList.add('hidden'); // Ensure game screen is hidden initially
    gameOverScreen.classList.add('hidden'); // Ensure game over screen is hidden

    // Set the initial tagline for the difficulty screen
    taglineElement.textContent = "Guess the word before the judge passes sentence!";

    // Append theme and hint elements once
    if (!themeHintContainer.contains(themeElement)) {
        themeElement.classList.add("text-indigo-600");
        hintElement.classList.add("text-red-600");
        themeHintContainer.appendChild(themeElement);
        themeHintContainer.appendChild(hintElement);
    }

    // Reset judge image
    judgeImage.src = JUDGE_IDLE_IMAGE;
}

// === STEP 3: Handle Difficulty Selection ===
function handleDifficultySelection(event) {
    const target = event.target;
    if (target.tagName === 'BUTTON' && target.dataset.difficulty) {
        currentDifficulty = target.dataset.difficulty;
        timeRemaining = parseInt(target.dataset.time); // Get time in seconds

        // Hide difficulty screen, show game screen
        difficultyScreen.classList.remove('active');
        difficultyScreen.classList.add('hidden'); // Ensure it's hidden
        gameScreen.classList.remove('hidden');
        gameScreen.classList.add('active'); // Ensure it's active

        startGame(); // Start the game with selected difficulty
    }
}

// === STEP 4: Start Game (Initialization for a new round) ===
function startGame() {
    gameStarted = true;
    mistakeCount = 0;
    guessedLetters = [];
    judgeImage.src = JUDGE_IDLE_IMAGE; // Ensure judge is idle at start

    // Reset hangman drawing to step-0
    drawingContainer.className = `hangman-figure step-0`;

    // Clear previous theme/hint text
    themeElement.textContent = '';
    hintElement.textContent = '';

    // Select a word based on difficulty
    const words = wordBank[currentDifficulty];
    if (!words || words.length === 0) {
        console.error(`No words found for difficulty: ${currentDifficulty}`);
        alert("No words available for this difficulty. Please try another.");
        window.location.reload(); // Reload to difficulty screen
        return;
    }
    const randomIndex = Math.floor(Math.random() * words.length);
    selectedWordObj = words[randomIndex];
    selectedWord = selectedWordObj.word.toUpperCase();
    hint = selectedWordObj.hint;
    theme = selectedWordObj.theme;

    console.log("🎯 Selected Word:", selectedWord);
    console.log("🧠 Hint:", hint);
    console.log("📚 Theme:", theme);

    taglineElement.textContent = "Guess the word before the judge passes sentence!"; // Reset tagline

    renderWord();
    renderLetterButtons(); // Re-render to enable all buttons
    startTimer();

    // Special logic for Insane mode
    if (currentDifficulty === 'insane') {
        startInsaneModeLimbTimer();
    }
}

// === STEP 5: Timer Logic ===
function startTimer() {
    clearInterval(gameTimerInterval); // Clear any existing timer
    updateTimerDisplay(); // Initial display

    gameTimerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            clearInterval(gameTimerInterval);
            clearInterval(insaneModeLimbTimer); // Stop insane mode timer if main timer ends
            endGame(false, "Time's up! The judge has passed sentence.", selectedWord);
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerDisplay.textContent = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// === STEP 6: Insane Mode Specific Logic ===
function startInsaneModeLimbTimer() {
    clearInterval(insaneModeLimbTimer); // Clear any previous insane timer
    insaneModeLimbTimer = setInterval(() => {
        if (mistakeCount < maxMistakes) { // Only add limb if game is not over
            handleWrongGuess(true); // Call wrong guess handler to add a limb (isAutomatic = true)
        } else {
            clearInterval(insaneModeLimbTimer); // Stop if all limbs are added
        }
    }, 5000); // 5 seconds per limb if no guess
}

// === STEP 7: Render Word as Blanks ===
function renderWord() {
    wordDisplay.innerHTML = selectedWord
        .split("")
        .map(char => {
            if (char === " ") return "&nbsp;"; // Use non-breaking space for actual spaces
            return guessedLetters.includes(char) ? char : "_";
        })
        .join(" ");
}

// === STEP 8: Create A–Z Buttons ===
function renderLetterButtons() {
    letterButtonsContainer.innerHTML = ''; // Clear previous buttons
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    alphabet.split("").forEach(letter => {
        const button = document.createElement("button");
        button.textContent = letter;
        // Check if letter has already been guessed to disable it immediately
        if (guessedLetters.includes(letter)) {
            button.disabled = true;
            button.classList.add("opacity-50", "cursor-not-allowed"); // Apply disabled styling
        }
        button.addEventListener("click", () => handleGuess(letter, button));
        letterButtonsContainer.appendChild(button);
    });
}

// === STEP 9: Handle Guesses ===
function handleGuess(letter, button) {
    if (!gameStarted) return; // Prevent guesses before game starts
    if (guessedLetters.includes(letter)) return; // Prevent guessing the same letter twice

    if (button) { // Only disable if a button object is passed (i.e., not an automatic limb add)
        button.disabled = true;
        button.classList.add("opacity-50", "cursor-not-allowed");
    }

    guessedLetters.push(letter); // Add to guessed letters immediately

    // For Insane mode, reset the automatic limb timer on any guess
    if (currentDifficulty === 'insane') {
        clearInterval(insaneModeLimbTimer);
        startInsaneModeLimbTimer(); // Restart the timer
    }

    if (selectedWord.includes(letter)) {
        renderWord();

        // Check win condition
        const allRevealed = selectedWord.split("").every(char =>
            char === " " || guessedLetters.includes(char)
        );
        if (allRevealed) {
            endGame(true, "🎉 You won! Justice is served!", selectedWord);
        }
    } else {
        handleWrongGuess(false); // Pass 'false' indicating not an automatic limb add
    }
}

// === STEP 10: Handle Wrong Guess ===
// `isAutomatic` parameter added for Insane mode
function handleWrongGuess(isAutomatic) {
    if (mistakeCount >= maxMistakes) return; // Prevent adding more limbs if already lost

    mistakeCount++;
    drawingContainer.className = `hangman-figure step-${mistakeCount}`; // Update visual

    // Update tagline based on mistake count
    const taglines = [
        "Guess the word before the judge passes sentence!",
        "The gavel is poised!",
        "The court awaits your answer!",
        "Justice hangs in the balance!",
        "One more mistake, and it's curtains!",
        "All rise for sentencing...",
        "Guilty! The verdict is in!" // For loss state (mistakeCount = 6)
    ];
    taglineElement.textContent = taglines[mistakeCount];

    if (mistakeCount === 3) {
        themeElement.textContent = `🧩 Theme: ${theme}`;
    }

    if (mistakeCount === maxMistakes - 1) { // 5th mistake (one before final)
        hintElement.textContent = `💡 Hint: ${hint}`;
    }

    if (mistakeCount >= maxMistakes) {
        endGame(false, "💀 You lost! The judge has passed sentence.", selectedWord);
    }
}

// === STEP 11: End Game (Modified for new screen and judge images) ===
function endGame(win, message, word) {
    gameStarted = false; // Stop game
    clearInterval(gameTimerInterval); // Stop main timer
    clearInterval(insaneModeLimbTimer); // Stop insane mode timer

    // Hide game screen, show game over screen
    gameScreen.classList.remove('active');
    gameScreen.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    gameOverScreen.classList.add('active');

    gameOverMessage.textContent = message;
    correctWordDisplay.innerHTML = `The word was: <span style="color: var(--primary-color);">${word}</span>`;

    // Change judge image based on win/loss
    if (win) {
        judgeImage.src = JUDGE_WIN_IMAGE;
    } else {
        judgeImage.src = JUDGE_LOSE_IMAGE;
    }

    // Disable all letter buttons
    Array.from(letterButtonsContainer.children).forEach(button => {
        button.disabled = true;
        button.classList.add("opacity-50", "cursor-not-allowed");
    });
}

// === STEP 12: Play Again Function (New Feature) ===
function playAgain() {
    gameOverScreen.classList.remove('active');
    gameOverScreen.classList.add('hidden');
    initDifficultyScreen(); // Return to difficulty selection
}

// === Event Listeners ===
difficultyButtonsContainer.addEventListener('click', handleDifficultySelection);
playAgainBtn.addEventListener('click', playAgain); // Event listener for the new button

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
    // Preload judge images for smooth transitions
    preloadImages([JUDGE_IDLE_IMAGE, JUDGE_WIN_IMAGE, JUDGE_LOSE_IMAGE]);
    initDifficultyScreen(); // Start with difficulty screen
});