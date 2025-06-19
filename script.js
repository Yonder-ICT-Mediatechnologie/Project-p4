// API endpoints
const API_BASE_URL = 'api';
const API_ENDPOINTS = {
    AUTH: `${API_BASE_URL}/auth.php`,
    SCORES: `${API_BASE_URL}/scores.php`,
    ACTIVE_PLAYERS: `${API_BASE_URL}/active-players.php`,
    WORDS: `${API_BASE_URL}/words.php`
};

// DOM Elements
const gameBoard = document.getElementById('game-board');
const keyboard = document.getElementById('keyboard');
const messageContainer = document.getElementById('message-container');
const loginForm = document.getElementById('login-form');
const authForm = document.getElementById('auth-form');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const authMessage = document.getElementById('auth-message');
const userSection = document.getElementById('user-section');
const gameContainer = document.getElementById('game-container');
const userInfo = document.getElementById('user-info');
const userDisplay = document.getElementById('user-display');
const logoutBtn = document.getElementById('logout-btn');
const gameResults = document.getElementById('game-results');
const resultMessage = document.getElementById('result-message');
const wordReveal = document.getElementById('word-reveal');
const attemptCount = document.getElementById('attempt-count');
const timeCount = document.getElementById('time-count');
const finalScore = document.getElementById('final-score');
const newGameBtn = document.getElementById('new-game-btn');
const shareResultBtn = document.getElementById('share-result-btn');
const showScoresBtn = document.getElementById('show-scores-btn');
const closeScoresBtn = document.getElementById('close-scores-btn');
const highscoresSection = document.getElementById('highscores');
const scoreList = document.getElementById('score-list');
const notification = document.getElementById('notification');
const scoreTabs = document.querySelectorAll('.score-tab');
const howToPlayBtn = document.getElementById('how-to-play-btn');
const howToPlayModal = document.getElementById('how-to-play-modal');
const closeHowToPlayBtn = document.getElementById('close-how-to-play');
const adminButton = document.getElementById('admin-button');
const adminPanel = document.getElementById('admin-panel');
const closeAdminBtn = document.getElementById('close-admin-btn');
const adminTabs = document.querySelectorAll('.admin-tab');
const themeToggleBtn = document.getElementById('theme-toggle');

// Game state variables
const WORD_LENGTH = 5;
const MAX_GUESSES = 6;
let currentUser = null;
let currentRow = 0;
let currentTile = 0;
let isGameOver = false;
let targetWord = '';
let guessedWords = [];
let gameStartTime = null;
let animationInProgress = false;
let isAdmin = false;
let words = [];

// Theme toggle functionality
function initializeTheme() {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'light' || (!savedTheme && !prefersDark)) {
        document.body.classList.add('light-theme');
        if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.remove('light-theme');
        if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

function toggleTheme() {
    const isLightMode = document.body.classList.toggle('light-theme');
    
    if (isLightMode) {
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('theme', 'light');
        showNotification('Overgeschakeld naar lichte modus');
    } else {
        themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', 'dark');
        showNotification('Overgeschakeld naar donkere modus');
    }
}

// Load words from API
async function loadWords() {
    try {
        const response = await fetch(API_ENDPOINTS.WORDS, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success && data.words && data.words.length > 0) {
            words = data.words;
            return true;
        }
    } catch (error) {
        // Silent fallback to default words
    }
    
    // Fallback words if API fails
    words = ['tafel', 'stoel', 'wereld', 'huis', 'plaats', 'juist', 'groot', 'klein', 'breed', 'groep'];
    return false;
}

// After the DOM is loaded, attach all necessary event listeners
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize theme
    if (themeToggleBtn) {
        initializeTheme();
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    // Login/register tabs
    loginTab.addEventListener('click', function(e) {
        e.preventDefault();
        showLoginTab();
    });
    
    registerTab.addEventListener('click', function(e) {
        e.preventDefault();
        showRegisterTab();
    });

    // Auth buttons
    loginBtn.addEventListener('click', function(e) {
        e.preventDefault();
        handleLogin();
    });

    registerBtn.addEventListener('click', function(e) {
        e.preventDefault();
        handleRegister();
    });
    
    // Logout button
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });

    // Score tab handlers
    scoreTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const period = this.getAttribute('data-period');
            scoreTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            loadScores(period);
        });
    });

    // Show scores button
    showScoresBtn.addEventListener('click', function(e) {
        e.preventDefault();
        showHighscores();
    });

    closeScoresBtn.addEventListener('click', function(e) {
        e.preventDefault();
        hideHighscores();
    });
    
    // How to play modal
    howToPlayBtn.addEventListener('click', function(e) {
        e.preventDefault();
        showHowToPlayModal();
    });

    closeHowToPlayBtn.addEventListener('click', function(e) {
        e.preventDefault();
        hideHowToPlayModal();
    });

    // Share results button
    shareResultBtn.addEventListener('click', function(e) {
        e.preventDefault();
        shareResult();
    });

    // Admin panel
    if (adminButton) {
        adminButton.addEventListener('click', function(e) {
            e.preventDefault();
            showAdminPanel();
        });
    }

    if (closeAdminBtn) {
        closeAdminBtn.addEventListener('click', function(e) {
            e.preventDefault();
            hideAdminPanel();
        });
    }    // Admin tabs
    adminTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            adminTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Hide all admin content sections
            document.querySelectorAll('.admin-content').forEach(content => {
                content.classList.add('hidden');
            });
            
            if (tabName === 'active-players') {
                document.getElementById('admin-active-players').classList.remove('hidden');
                loadActivePlayers();
            } else if (tabName === 'all-scores') {
                document.getElementById('admin-all-scores').classList.remove('hidden');
                loadAllScores();
            }
        });
    });

    // New game button
    newGameBtn.addEventListener('click', function(e) {
        e.preventDefault();
        startNewGame();
    });

    // Keyboard event listener
    document.addEventListener('keydown', function(e) {
        if (isGameOver || animationInProgress) return;
        
        const key = e.key.toLowerCase();
        
        if (key === 'enter') {
            submitGuess();
        } else if (key === 'backspace') {
            deleteLetter();
        } else if (key.match(/[a-z]/) && key.length === 1) {
            addLetter(key);
        }
    });

    // Check session on load
    checkSession().then(async response => {
        if (response.success) {
            currentUser = response.user.username;
            isAdmin = response.user.is_admin;
            userDisplay.textContent = currentUser;
            
            // Hide login form and show game
            userSection.classList.add('hidden');
            userInfo.classList.remove('hidden');
            gameContainer.classList.remove('hidden');
            
            // Show admin button if applicable
            if (isAdmin) {
                adminButton.classList.remove('hidden');
            }
            
            // Start a new game
            await startNewGame();
        }
    });
});

// Function to handle sharing game results
function shareResult() {
    const isWin = guessedWords.some(word => word === targetWord);
    const attempts = isWin ? guessedWords.length : 'X';
    const maxAttempts = MAX_GUESSES;
    
    // Create emoji grid based on guesses
    let emojiGrid = '';
    for (let i = 0; i < guessedWords.length; i++) {
        const guess = guessedWords[i];
        const result = checkGuess(guess);
        
        let row = '';
        for (let j = 0; j < result.length; j++) {
            if (result[j] === 'correct') {
                row += '🟩'; // Green square for correct position
            } else if (result[j] === 'present') {
                row += '🟨'; // Yellow square for present but wrong position
            } else {
                row += '⬜'; // White square for absent
            }
        }
        emojiGrid += row + '\\n';
    }
    
    const shareText = `Woordle ${attempts}/${maxAttempts}\\n\\n${emojiGrid}\\nSpeelbaar op: ${window.location.href}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Mijn Woordle Resultaat',
            text: shareText
        });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('Resultaat gekopieerd naar klembord!');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Resultaat gekopieerd naar klembord!');
    }
}

// Load high scores from the server
async function loadScores(period = 'today') {
    try {
        const response = await fetch(`${API_ENDPOINTS.SCORES}?period=${period}`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        displayScores(data.scores || []);
    } catch (error) {
        showNotification('Kon scores niet laden');
    }
}

// Display scores in the highscores section
function displayScores(scores) {
    if (!scoreList) return;
    
    scoreList.innerHTML = '';
    
    if (scores.length === 0) {
        scoreList.innerHTML = '<div class="no-scores">Geen scores gevonden</div>';
        return;
    }
    
    scores.forEach((score, index) => {
        const scoreElement = document.createElement('div');
        scoreElement.className = 'score-item';
        
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
        
        scoreElement.innerHTML = `
            <span class="rank">${medal}</span>
            <span class="username">${score.username}</span>
            <span class="attempts">${score.attempts}/6</span>
            <span class="time">${score.time_taken}s</span>
            <span class="score">${score.score}</span>
        `;
        
        scoreList.appendChild(scoreElement);
    });
}

// Handle user authentication
async function authenticateUser(username, password, isRegistration = false) {
    try {
        const response = await fetch(API_ENDPOINTS.AUTH, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password,
                action: isRegistration ? 'register' : 'login'
            })
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        return { success: false, message: 'Netwerkfout' };
    }
}

// Check if user is logged in
async function checkSession() {
    try {
        const response = await fetch(API_ENDPOINTS.AUTH + '?check_session=1', {
            credentials: 'include'
        });
        const data = await response.json();
        return data;
    } catch (error) {
        return { success: false };
    }
}

// Logout user
async function logout() {
    try {
        const response = await fetch(API_ENDPOINTS.AUTH, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'logout'
            })
        });
        
        const data = await response.json();
        if (data.success) {
            // Reset state
            currentUser = null;
            isAdmin = false;
            
            // Show login form
            userSection.classList.remove('hidden');
            userInfo.classList.add('hidden');
            gameContainer.classList.add('hidden');
            adminButton.classList.add('hidden');
            hideAdminPanel();
            hideHighscores();
            
            showNotification('Uitgelogd');
        }
    } catch (error) {
        showNotification('Fout bij uitloggen');
    }
}

function showLoginTab() {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginBtn.classList.remove('hidden');
    registerBtn.classList.add('hidden');
}

function showRegisterTab() {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerBtn.classList.remove('hidden');
    loginBtn.classList.add('hidden');
}

// Reset game state
function resetGame() {
    currentRow = 0;
    currentTile = 0;
    isGameOver = false;
    targetWord = '';
    guessedWords = [];
    gameStartTime = null;
    animationInProgress = false;
      // Clear game board
    if (gameBoard) {
        gameBoard.innerHTML = '';
    }
    
    // Reset keyboard
    const keys = document.querySelectorAll('.key');
    keys.forEach(key => {
        key.classList.remove('correct', 'present', 'absent');
    });
    
    // Clear any animation classes from tiles
    const allTiles = document.querySelectorAll('.tile');
    allTiles.forEach(tile => {
        tile.classList.remove('tile-flip', 'tile-bounce', 'tile-pop', 'celebrate', 'correct', 'present', 'absent', 'filled');
    });
    
    // Clear any animation classes from rows
    const allRows = document.querySelectorAll('.row');
    allRows.forEach(row => {
        row.classList.remove('shake', 'winning-row');
    });
    
    // Hide results
    if (gameResults) {
        gameResults.classList.add('hidden');
    }
    
    // Clear any messages
    clearMessage();
}

// Start a new game
async function startNewGame() {
    resetGame();
    
    // Load words if not already loaded
    if (words.length === 0) {
        await loadWords();
    }
    
    // Select random target word
    targetWord = words[Math.floor(Math.random() * words.length)].toLowerCase();
    console.log('Target word: ' + targetWord); // For testing
    
    gameStartTime = Date.now();
    
    createGameBoard();
    setupKeyboard();
}

// Create the game board
function createGameBoard() {
    if (!gameBoard) return;
    
    gameBoard.innerHTML = '';
    
    for (let row = 0; row < MAX_GUESSES; row++) {
        const rowElement = document.createElement('div');
        rowElement.classList.add('row');
        
        for (let col = 0; col < WORD_LENGTH; col++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.setAttribute('data-row', row);
            tile.setAttribute('data-col', col);
            rowElement.appendChild(tile);
        }
        
        gameBoard.appendChild(rowElement);
    }
}

// Show highscores
function showHighscores() {
    if (highscoresSection) {
        highscoresSection.classList.remove('hidden');
        loadScores('today');
    }
}

// Hide highscores
function hideHighscores() {
    if (highscoresSection) {
        highscoresSection.classList.add('hidden');
    }
}

// Show how to play modal
function showHowToPlayModal() {
    if (howToPlayModal) {
        howToPlayModal.classList.remove('hidden');
    }
}

// Hide how to play modal
function hideHowToPlayModal() {
    if (howToPlayModal) {
        howToPlayModal.classList.add('hidden');
    }
}

// Admin functions
function showAdminPanel() {
    if (adminPanel) {
        adminPanel.classList.remove('hidden');
        loadActivePlayers();
    }
}

function hideAdminPanel() {
    if (adminPanel) {
        adminPanel.classList.add('hidden');
    }
}

// Handle login
async function handleLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    if (!username || !password) {
        showAuthMessage('Vul alle velden in', 'error');
        return;
    }
    
    const result = await authenticateUser(username, password, false);
    
    if (result.success) {
        currentUser = username;
        isAdmin = result.user.is_admin;
        userDisplay.textContent = username;
        
        // Hide login form and show game
        userSection.classList.add('hidden');
        userInfo.classList.remove('hidden');
        gameContainer.classList.remove('hidden');
        
        // Show admin button if applicable
        if (isAdmin) {
            adminButton.classList.remove('hidden');
        }
        
        clearAuthMessage();
        await startNewGame();
        showNotification(`Welkom, ${username}!`);
    } else {
        showAuthMessage(result.message, 'error');
    }
}

// Handle registration
async function handleRegister() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    if (!username || !password) {
        showAuthMessage('Vul alle velden in', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAuthMessage('Wachtwoord moet minimaal 6 karakters hebben', 'error');
        return;
    }
    
    const result = await authenticateUser(username, password, true);
    
    if (result.success) {
        showAuthMessage('Account aangemaakt! Je kunt nu inloggen.', 'success');
        showLoginTab();
        usernameInput.value = username;
        passwordInput.value = '';
    } else {
        showAuthMessage(result.message, 'error');
    }
}

// Show auth message
function showAuthMessage(message, type = 'info') {
    if (authMessage) {
        authMessage.textContent = message;
        authMessage.className = type;
        authMessage.style.display = 'block';
    }
}

// Clear auth message
function clearAuthMessage() {
    if (authMessage) {
        authMessage.style.display = 'none';
        authMessage.textContent = '';
    }
}

// Submit guess
function submitGuess() {
    if (currentTile !== WORD_LENGTH) {
        showMessage('Niet genoeg letters', 'error');
        return;
    }
    
    const guess = getCurrentGuess().toLowerCase();
    
    if (!isValidWord(guess)) {
        showMessage('Ongeldig woord', 'error');
        shakeRow(currentRow);
        return;
    }
    
    animationInProgress = true;
    guessedWords.push(guess);
    
    const result = checkGuess(guess);
    animateRowReveal(currentRow, result, () => {
        updateKeyboard(guess, result);
        
        if (guess === targetWord) {
            // Win condition
            const timeElapsed = Math.floor((Date.now() - gameStartTime) / 1000);
            endGame(true, timeElapsed);
        } else if (currentRow === MAX_GUESSES - 1) {
            // Lose condition
            endGame(false);
        } else {
            currentRow++;
            currentTile = 0;
            animationInProgress = false;
        }
    });
}

// Get current guess from the row
function getCurrentGuess() {
    let guess = '';
    for (let col = 0; col < WORD_LENGTH; col++) {
        const tile = document.querySelector(`[data-row="${currentRow}"][data-col="${col}"]`);
        if (tile) {
            guess += tile.textContent || '';
        }
    }
    return guess;
}

// Check if word is valid
function isValidWord(word) {
    // First check basic format (5 letters, alphabetic)
    if (word.length !== WORD_LENGTH || !/^[a-z]+$/i.test(word)) {
        return false;
    }
    
    // Then check if word exists in the wordlist
    return words.includes(word.toLowerCase());
}

// Check guess against target word
function checkGuess(guess) {
    const result = [];
    const targetChars = targetWord.split('');
    const guessChars = guess.split('');
    
    // First pass: mark correct positions
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (guessChars[i] === targetChars[i]) {
            result[i] = 'correct';
            targetChars[i] = null; // Mark as used
            guessChars[i] = null; // Mark as used
        }
    }
    
    // Second pass: mark present letters
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (guessChars[i] !== null) {
            const foundIndex = targetChars.indexOf(guessChars[i]);
            if (foundIndex !== -1) {
                result[i] = 'present';
                targetChars[foundIndex] = null; // Mark as used
            } else {
                result[i] = 'absent';
            }
        }
    }
    
    return result;
}

// Add letter to current tile
function addLetter(letter) {
    if (currentTile < WORD_LENGTH && currentRow < MAX_GUESSES) {
        const tile = document.querySelector(`[data-row="${currentRow}"][data-col="${currentTile}"]`);
        if (tile) {
            tile.textContent = letter.toUpperCase();
            tile.classList.add('filled');
            animateTilePop(tile);
            currentTile++;
        }
    }
}

// Delete letter from current tile
function deleteLetter() {
    if (currentTile > 0) {
        currentTile--;
        const tile = document.querySelector(`[data-row="${currentRow}"][data-col="${currentTile}"]`);
        if (tile) {
            tile.textContent = '';
            tile.classList.remove('filled');
        }
    }
}

// Setup keyboard
function setupKeyboard() {
    const keys = document.querySelectorAll('[data-key]');
    keys.forEach(key => {
        key.classList.remove('correct', 'present', 'absent');
        key.addEventListener('click', function() {
            if (animationInProgress || isGameOver) return;
            
            const keyValue = this.getAttribute('data-key');
            
            if (keyValue === 'enter') {
                submitGuess();
            } else if (keyValue === 'backspace') {
                deleteLetter();
            } else {
                addLetter(keyValue);
            }
        });
    });
}

// Update keyboard colors based on guess results
function updateKeyboard(guess, result) {
    for (let i = 0; i < guess.length; i++) {
        const letter = guess[i];
        const status = result[i];
        const key = document.querySelector(`[data-key="${letter}"]`);
        
        if (key) {
            // Only update if the new status is better than current
            if (status === 'correct' || 
                (status === 'present' && !key.classList.contains('correct')) ||
                (status === 'absent' && !key.classList.contains('correct') && !key.classList.contains('present'))) {
                key.classList.remove('correct', 'present', 'absent');
                key.classList.add(status);
            }
        }
    }
}

// Animation functions
function animateTilePop(tile) {
    tile.classList.add('tile-pop');
    setTimeout(() => {
        tile.classList.remove('tile-pop');
    }, 300);
}

function animateRowReveal(row, result, callback) {
    const tiles = document.querySelectorAll(`[data-row="${row}"]`);
    let completed = 0;
    
    tiles.forEach((tile, index) => {
        setTimeout(() => {
            tile.classList.add('tile-flip');
            setTimeout(() => {
                tile.classList.add(result[index]);
                tile.classList.remove('tile-flip');
                completed++;
                
                if (completed === tiles.length) {
                    callback();
                }
            }, 300);
        }, index * 100);
    });
}

function shakeRow(row) {
    const rowElement = document.querySelector(`[data-row="${row}"]`).parentNode;
    rowElement.classList.add('shake');
    setTimeout(() => {
        rowElement.classList.remove('shake');
    }, 500);
}

// End game
function endGame(isWin, timeElapsed = 0) {
    isGameOver = true;
    animationInProgress = false;
      if (isWin) {
        const attempts = guessedWords.length;
        const score = calculateScore(attempts, timeElapsed);
        
        // Add celebration animation to winning row
        const winningRow = currentRow;
        const winningTiles = document.querySelectorAll(`[data-row="${winningRow}"]`);
        winningTiles.forEach((tile, index) => {
            setTimeout(() => {
                tile.classList.add('celebrate');
            }, index * 100);
        });
        
        // Show confetti
        showConfetti();
        
        // Save score
        saveScore(attempts, timeElapsed, score);
        
        // Show results
        showGameResults(true, attempts, timeElapsed, score);
        
        showMessage('Gefeliciteerd! 🎉', 'success');
    } else {
        showGameResults(false);
        showMessage(`Het woord was: ${targetWord.toUpperCase()}`, 'info');
    }
}

// Calculate score
function calculateScore(attempts, timeElapsed) {
    const baseScore = (MAX_GUESSES - attempts + 1) * 100;
    const timeBonus = Math.max(0, 300 - timeElapsed);
    return baseScore + timeBonus;
}

// Save score to server
async function saveScore(attempts, timeElapsed, score) {
    if (!currentUser) {
        console.log('No current user, cannot save score');
        return;
    }
    
    console.log('Saving score:', { attempts, timeElapsed, score, word: targetWord });
    
    try {
        const response = await fetch(API_ENDPOINTS.SCORES, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                attempts: attempts,
                time: timeElapsed,
                score: score,
                word: targetWord
            })
        });
          const data = await response.json();
        if (!data.success) {
            console.error('Failed to save score:', data.message);
            showNotification('Score kon niet worden opgeslagen: ' + data.message);
        } else {
            console.log('Score saved successfully:', data);
            showNotification('Score opgeslagen!');
        }
    } catch (error) {
        console.error('Error saving score:', error);
        showNotification('Fout bij opslaan van score');
    }
}

// Show game results
function showGameResults(isWin, attempts = 0, timeElapsed = 0, score = 0) {
    if (!gameResults) return;
    
    if (resultMessage) {
        resultMessage.textContent = isWin ? 'Gewonnen!' : 'Verloren!';
        resultMessage.className = isWin ? 'win' : 'lose';
    }
    
    if (wordReveal) {
        wordReveal.textContent = targetWord.toUpperCase();
    }
    
    if (isWin) {
        if (attemptCount) attemptCount.textContent = attempts;
        if (timeCount) timeCount.textContent = timeElapsed;
        if (finalScore) finalScore.textContent = score;
    }
    
    gameResults.classList.remove('hidden');
}

// Show message
function showMessage(message, type = 'info') {
    if (messageContainer) {
        messageContainer.textContent = message;
        messageContainer.className = `message ${type}`;
        messageContainer.style.display = 'block';
        
        setTimeout(() => {
            clearMessage();
        }, 3000);
    }
}

// Clear message
function clearMessage() {
    if (messageContainer) {
        messageContainer.style.display = 'none';
        messageContainer.textContent = '';
    }
}

// Show notification
function showNotification(message) {
    if (notification) {
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Load active players (admin function)
async function loadActivePlayers() {
    try {
        const response = await fetch(API_ENDPOINTS.ACTIVE_PLAYERS, {
            credentials: 'include'
        });
        const data = await response.json();
        
        displayActivePlayers(data.players || []);
    } catch (error) {
        showNotification('Kon actieve spelers niet laden');
    }
}

// Display active players
function displayActivePlayers(players) {
    const playersList = document.getElementById('active-players-list');
    if (!playersList) return;
    
    playersList.innerHTML = '';
    
    if (players.length === 0) {
        playersList.innerHTML = '<div class="no-data">Geen actieve spelers</div>';
        return;
    }
    
    // Update count
    const countElement = document.getElementById('active-player-count');
    if (countElement) {
        countElement.textContent = players.length;
    }
    
    players.forEach(player => {
        const playerElement = document.createElement('div');
        playerElement.className = 'admin-item';
        playerElement.innerHTML = `
            <div class="admin-details">
                <strong>${player.username}</strong>
                <span>Laatste activiteit: ${new Date(player.last_activity).toLocaleString()}</span>
            </div>
        `;
        playersList.appendChild(playerElement);
    });
}

// Load all scores (admin function)
async function loadAllScores() {
    try {
        const response = await fetch(`${API_ENDPOINTS.SCORES}?admin=1`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        displayAllScores(data.scores || []);
    } catch (error) {
        showNotification('Kon alle scores niet laden');
    }
}

// Display all scores for admin
function displayAllScores(scores) {
    const allScoresList = document.getElementById('admin-scores-list');
    if (!allScoresList) return;
    
    allScoresList.innerHTML = '';
    
    if (scores.length === 0) {
        allScoresList.innerHTML = '<div class="no-data">Geen scores gevonden</div>';
        return;
    }
    
    scores.forEach(score => {
        const scoreElement = document.createElement('div');
        scoreElement.className = 'admin-item';
        scoreElement.innerHTML = `
            <div class="admin-details">
                <strong>${score.username}</strong>
                <span>Pogingen: ${score.attempts}/6</span>
                <span>Tijd: ${score.time_taken}s</span>
                <span>Score: ${score.score}</span>
                <span>Woord: ${score.word}</span>
                <span>Datum: ${new Date(score.date_played).toLocaleString()}</span>
            </div>
            <button class="delete-btn" onclick="deleteScore(${score.id})">Verwijder</button>
        `;
        allScoresList.appendChild(scoreElement);
    });
}

// Delete score (admin function)
async function deleteScore(scoreId) {
    if (!confirm('Weet je zeker dat je deze score wilt verwijderen?')) {
        return;
    }
    
    try {
        const response = await fetch(API_ENDPOINTS.SCORES, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                score_id: scoreId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Score verwijderd');
            loadAllScores(); // Reload the list
        } else {
            showNotification('Kon score niet verwijderen');
        }
    } catch (error) {
        showNotification('Fout bij verwijderen van score');
    }
}

// Confetti animation
function showConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const confetti = [];
    const colors = ['#6aaa64', '#538d4e', '#b59f3b', '#f5793a'];
    
    // Create confetti pieces
    for (let i = 0; i < 100; i++) {
        confetti.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            vx: Math.random() * 4 - 2,
            vy: Math.random() * 4 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 3 + 2
        });
    }
    
    function animateConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = confetti.length - 1; i >= 0; i--) {
            const c = confetti[i];
            
            c.x += c.vx;
            c.y += c.vy;
            c.vy += 0.1; // gravity
            
            ctx.fillStyle = c.color;
            ctx.fillRect(c.x, c.y, c.size, c.size);
            
            // Remove confetti that's off screen
            if (c.y > canvas.height) {
                confetti.splice(i, 1);
            }
        }
        
        if (confetti.length > 0) {
            requestAnimationFrame(animateConfetti);
        } else {
            canvas.style.display = 'none';
        }
    }
    
    canvas.style.display = 'block';
    animateConfetti();
}

// Window resize handler for confetti canvas
window.addEventListener('resize', () => {
    const canvas = document.getElementById('confetti-canvas');
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});
