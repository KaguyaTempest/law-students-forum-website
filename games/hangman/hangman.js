import { wordBank } from '/law-students-forum-website/games/hangman/hangman-wordbank.js';

// === Global Game State Variables ===
let selectedWordObj; // Stores the object { word: "...", hint: "...", theme: "..." }
let selectedWord;    // The actual word string
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
const judgeGavel = document.getElementById("gavel");
const wordDisplay = document.getElementById("word-display");
const letterButtonsContainer = document.getElementById("letter-buttons");
const themeHintContainer = document.getElementById("theme-hint");

// Theme + Hint elements (dynamically created)
const themeElement = document.createElement("div");
const hintElement = document.createElement("div");

// Hangman drawing element
const drawingContainer = document.getElementById("hangman-drawing");

// === STEP 1: Initialize Difficulty Screen ===
function initDifficultyScreen() {
    difficultyScreen.classList.add('active');
    gameScreen.classList.add('hidden'); // Ensure game screen is hidden initially

    // Set the initial tagline for the difficulty screen
    taglineElement.textContent = "Guess the word before the judge passes sentence!";

    // Append theme and hint elements once
    if (!themeHintContainer.contains(themeElement)) {
        themeElement.classList.add("text-indigo-600");
        hintElement.classList.add("text-red-600");
        themeHintContainer.appendChild(themeElement);
        themeHintContainer.appendChild(hintElement);
    }
}

// === STEP 2: Handle Difficulty Selection ===
function handleDifficultySelection(event) {
    const target = event.target;
    if (target.tagName === 'BUTTON' && target.dataset.difficulty) {
        currentDifficulty = target.dataset.difficulty;
        timeRemaining = parseInt(target.dataset.time); // Get time in seconds

        // Hide difficulty screen, show game screen
        difficultyScreen.classList.remove('active');
        gameScreen.classList.remove('hidden');
        gameScreen.classList.add('active');

        startGame(); // Start the game with selected difficulty
    }
}

// === STEP 3: Start Game (Initialization for a new round) ===
function startGame() {
    gameStarted = true;
    mistakeCount = 0;
    guessedLetters = [];

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

// === STEP 4: Timer Logic ===
function startTimer() {
    clearInterval(gameTimerInterval); // Clear any existing timer
    updateTimerDisplay(); // Initial display

    gameTimerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            clearInterval(gameTimerInterval);
            clearInterval(insaneModeLimbTimer); // Stop insane mode timer if main timer ends
            endGame(false, "Time's up! The judge has passed sentence.");
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerDisplay.textContent = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// === STEP 5: Insane Mode Specific Logic ===
function startInsaneModeLimbTimer() {
    clearInterval(insaneModeLimbTimer); // Clear any previous insane timer
    insaneModeLimbTimer = setInterval(() => {
        if (mistakeCount < maxMistakes) { // Only add limb if game is not over
            handleWrongGuess(true); // Call wrong guess handler to add a limb
        } else {
            clearInterval(insaneModeLimbTimer); // Stop if all limbs are added
        }
    }, 5000); // 5 seconds per limb if no guess
}

// === STEP 6: Render Word as Blanks ===
function renderWord() {
    wordDisplay.innerHTML = selectedWord
        .split("")
        .map(char => {
            if (char === " ") return " ";
            return guessedLetters.includes(char) ? char : "_";
        })
        .join(" ");
}

// === STEP 7: Create A–Z Buttons ===
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

// === STEP 8: Handle Guesses ===
function handleGuess(letter, button) {
    if (!gameStarted) return; // Prevent guesses before game starts
    if (button) { // Only disable if a button object is passed (i.e., not an automatic limb add)
        button.disabled = true;
        button.classList.add("opacity-50", "cursor-not-allowed");
    }


    // For Insane mode, reset the automatic limb timer on any guess
    if (currentDifficulty === 'insane') {
        clearInterval(insaneModeLimbTimer);
        startInsaneModeLimbTimer(); // Restart the timer
    }

    if (selectedWord.includes(letter)) {
        guessedLetters.push(letter);
        renderWord();

        // Check win condition
        const allRevealed = selectedWord.split("").every(char =>
            char === " " || guessedLetters.includes(char)
        );
        if (allRevealed) {
            endGame(true, "🎉 You won! Justice is served!");
        }
    } else {
        handleWrongGuess(false); // Pass 'false' indicating not an automatic limb add
    }
}

// === STEP 9: Handle Wrong Guess ===
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
        "Guilty! The verdict is in!" // For loss state
    ];
    taglineElement.textContent = taglines[mistakeCount];
    if(mistakeCount >= maxMistakes) { // If this wrong guess leads to loss
        taglineElement.textContent = taglines[taglines.length - 1]; // Set to loss tagline
    }


    if (mistakeCount === 3) {
        themeElement.textContent = `🧩 Theme: ${theme}`;
    }

    if (mistakeCount === maxMistakes - 1) { // 5th mistake
        hintElement.textContent = `💡 Hint: ${hint}`;
    }

    if (mistakeCount >= maxMistakes) {
        endGame(false, "💀 You lost! The judge has passed sentence. The word was: " + selectedWord);
    }
}

// === STEP 10: End Game ===
function endGame(win, message) {
    gameStarted = false; // Stop game
    clearInterval(gameTimerInterval); // Stop main timer
    clearInterval(insaneModeLimbTimer); // Stop insane mode timer

    // Disable all letter buttons
    Array.from(letterButtonsContainer.children).forEach(button => {
        button.disabled = true;
        button.classList.add("opacity-50", "cursor-not-allowed");
    });

    if (!win) {
        judgeImage.src = "/law-students-forum-website/assets/images/judge_slam.png"; // **CHANGED: Change judge sprite on loss**
        judgeGavel.classList.add('slam'); // Trigger gavel slam animation
    }

    setTimeout(() => {
        alert(message);
        judgeGavel.classList.remove('slam'); // Reset gavel for next round
        judgeImage.src = "/law-students-forum-website/assets/images/judge_idle.png"; // **CHANGED: Reset judge sprite for next game**
        window.location.reload(); // Reload to difficulty screen
    }, 1500); // Wait for gavel animation (0.4s) + a little extra before reload
}
// === Event Listeners ===
difficultyButtonsContainer.addEventListener('click', handleDifficultySelection);

// === INIT ===
document.addEventListener('DOMContentLoaded', initDifficultyScreen); // Start with difficulty screen