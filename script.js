// Firebase configuration
const firebaseConfig = {
    apiKey: "",
    authDomain: "avinashcupgames.firebaseapp.com",
    databaseURL: "https://avinashcupgames-default-rtdb.firebaseio.com",
    projectId: "avinashcupgames",
    storageBucket: "avinashcupgames.firebasestorage.app",
    messagingSenderId: "616363874329",
    appId: "1:616363874329:web:f7f67c31c36cccf222f288"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Game elements
const cups = document.querySelectorAll('.cup');
const ball = document.querySelector('.ball');
const playButton = document.getElementById('play-button');
const message = document.querySelector('.message');
const modal = document.getElementById('name-modal');
const playerNameInput = document.getElementById('player-name');
const highestScoreName = document.getElementById('highest-score-name');
const highestScorePoints = document.getElementById('highest-score-points');

// Game state variables
let ballPosition = 0;
let gameActive = false;
let playerName = '';
let currentScore = 0;
let highestScore = { name: '', points: 0 };
let isGameOver = false;

// Utility function for delays
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Load highest score from Firebase when game starts
function loadHighScore() {
    const highScoreRef = database.ref('highScore');
    highScoreRef.once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            highestScore = data;
            updateHighScoreDisplay();
        }
    });
}

// Update high score in Firebase
function updateHighScore() {
    if (currentScore > highestScore.points) {
        highestScore = { name: playerName, points: currentScore };
        database.ref('highScore').set(highestScore);
        updateHighScoreDisplay();
    }
}

function updateHighScoreDisplay() {
    highestScoreName.textContent = `Name: ${highestScore.name}`;
    highestScorePoints.textContent = `Score: ${highestScore.points}`;
}

// Button state management
function updatePlayButton(status) {
    if (status === 'start') {
        playButton.textContent = 'Start Game';
        playButton.onclick = playGame;
    } else if (status === 'continue') {
        playButton.textContent = 'Continue Playing';
        playButton.onclick = continuePlaying;
    } else if (status === 'restart') {
        playButton.textContent = 'Restart Game';
        playButton.onclick = restartGame;
    }
    playButton.style.display = 'block';
}

// Game control functions
function restartGame() {
    currentScore = 0;
    isGameOver = false;
    updatePlayButton('start');
    resetGame();
    playGame();
}

function continuePlaying() {
    isGameOver = false;
    playButton.style.display = 'none';
    startNewRound();
}

function resetGame() {
    ball.style.display = 'none';
    message.textContent = '';
    resetCups();
}
function showBall() {
    ball.style.display = 'block'; // Ensure the ball is visible

    // Calculate the position of the ball
    const cupWidth = cups[0].offsetWidth;
    const containerLeft = cups[0].parentElement.getBoundingClientRect().left;
    const ballLeft = containerLeft + (cupWidth * ballPosition) + (cupWidth - ball.offsetWidth) / 2;

    // Set ball's left position dynamically
    ball.style.left = `${ballLeft}px`;
    
    // Ensure the ball is above the cups
    ball.style.zIndex = '10';
    
    // Make sure the ball is visible
    ball.style.opacity = '1';
}

function resetCups() {
    cups.forEach((cup, index) => {
        cup.style.transform = 'translateY(0)';
        cup.style.transition = 'all 0.3s ease';
        // Reset cup positions to original locations
        cup.style.left = `${10 + index * 30}%`;
    });
    ballPosition = Math.floor(Math.random() * 3);
    ball.style.display = 'none';
}

// Cup swapping and shuffling functions
function getRandomIndexes() {
    const indexes = [0, 1, 2];
    const index1 = indexes.splice(Math.floor(Math.random() * indexes.length), 1)[0];
    const index2 = indexes[Math.floor(Math.random() * indexes.length)];
    return [index1, index2];
}

function swapCups(index1, index2) {
    const cup1 = cups[index1];
    const cup2 = cups[index2];
    
    // Get the current left positions
    const cup1Left = cup1.style.left;
    const cup2Left = cup2.style.left;
    
    // Update cup positions
    cup1.style.left = cup2Left;
    cup2.style.left = cup1Left;
    
    // Update ball position if it's under one of the swapped cups
    if (ballPosition === index1) {
        ballPosition = index2;
    } else if (ballPosition === index2) {
        ballPosition = index1;
    }
}

async function shuffleCups() {
    const shuffleMoves = 5;
    const delay = 500;
    const moves = [];

    for (let i = 0; i < shuffleMoves; i++) {
        let index1, index2;
        do {
            [index1, index2] = getRandomIndexes();
        } while (
            moves.length > 0 &&
            moves[moves.length - 1][0] === index1 &&
            moves[moves.length - 1][1] === index2
        );

        moves.push([index1, index2]);
        
        const cup1 = cups[index1];
        const cup2 = cups[index2];
        
        cup1.style.transform = 'translateY(-20px)';
        cup2.style.transform = 'translateY(-20px)';
        
        await sleep(delay / 2);
        swapCups(index1, index2);
        await sleep(delay / 2);
        
        cup1.style.transform = 'translateY(0)';
        cup2.style.transform = 'translateY(0)';
        
        await sleep(delay / 2);
    }
}

async function startNewRound() {
    resetCups();
    showBall();
    message.textContent = 'Watch carefully where the ball is...';
    gameActive = true;

    await sleep(2000);
    
    cups.forEach(cup => {
        cup.style.transform = 'translateY(0)';
    });
    
    await sleep(1000);
    
    ball.style.display = 'none';
    message.textContent = 'Watch the cups shuffle!';
    await shuffleCups();
    message.textContent = 'Pick a cup!';
    enableCupClicks();
}

function enableCupClicks() {
    cups.forEach(cup => {
        cup.addEventListener('click', handleCupClick);
    });
}

function disableCupClicks() {
    cups.forEach(cup => {
        cup.removeEventListener('click', handleCupClick);
    });
}

// Show ball under the correct cup
function showBall() {
    ball.style.display = 'block'; // Ensure the ball is visible

    // Calculate the position of the ball
    const cupWidth = cups[0].offsetWidth;
    const containerLeft = cups[0].parentElement.getBoundingClientRect().left;
    const ballLeft = containerLeft + (cupWidth * ballPosition) + (cupWidth - ball.offsetWidth) / 2;

    // Set ball's left position dynamically
    ball.style.left = `${ballLeft}px`;
}

//handle cup click
function handleCupClick(event) {
    if (!gameActive) return;
    
    const selectedCup = event.currentTarget;
    const selectedIndex = Array.from(cups).indexOf(selectedCup);
    
    gameActive = false;
    disableCupClicks();
    
    // Reveal all cups
    cups.forEach(cup => {
        cup.style.transform = 'translateY(-50px)';
    });

    // Show the ball immediately
    showBall();
    
    // Show the result
    if (selectedIndex === ballPosition) {
        currentScore++;
        message.textContent = `Correct! Your score: ${currentScore}`;
        
        selectedCup.style.transform = 'translateY(-50px) scale(1.1)';
        setTimeout(() => {
            selectedCup.style.transform = 'translateY(-50px)';
        }, 300);
        
        updateHighScore();
        setTimeout(() => {
            updatePlayButton('continue');
        }, 1500);
    } else {
        isGameOver = true;
        message.textContent = `Game Over! Final Score: ${currentScore}`;
        
        selectedCup.style.transform = 'translateY(-50px) rotate(5deg)';
        
        updateHighScore();
        setTimeout(() => {
            updatePlayButton('restart');
        }, 1500);
    }

    // Keep the ball visible
    setTimeout(() => {
        cups.forEach(cup => {
            cup.style.transform = 'translateY(0)';
        });
        // Ensure the ball stays visible above the cups
        ball.style.zIndex = '10';
    }, 2000);
}


// Game initialization functions
function playGame() {
    resetGame();
    currentScore = 0;
    isGameOver = false;
    playButton.style.display = 'none';
    
    cups.forEach(cup => {
        cup.style.transform = 'translateY(-50px)';
    });
    
    startNewRound();
}

function openModal() {
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
    startGame();
}

function startGame() {
    if (playerNameInput.value.trim() !== '') {
        playerName = playerNameInput.value;
        message.textContent = `Welcome, ${playerName}! Click Start to play the game.`;
    } else {
        playerName = 'Player';
    }
    modal.style.display = 'none';
    updatePlayButton('start');
}

// Chat functionality
const chatRef = database.ref('chat');
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');

sendButton.addEventListener('click', () => {
    const message = chatInput.value.trim();
    if (message) {
        chatRef.push({
            name: playerName || 'Anonymous',
            message: message,
            timestamp: Date.now(),
        });
        chatInput.value = '';
    }
});

chatRef.on('child_added', (snapshot) => {
    const data = snapshot.val();
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<strong>${data.name}:</strong> ${data.message}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
});

// Event listeners for chat input
chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendButton.click();
    }
});

// Initialize game
loadHighScore();
openModal();