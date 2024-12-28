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

// Chat elements
const chatContainer = document.getElementById('chat-container');
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const toggleChatButton = document.getElementById('toggle-chat-button');

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

// Reset and restart functions
function resetGame() {
    ball.style.display = 'none';
    message.textContent = '';
    resetCups();
}

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

// Reset cup positions
function resetCups() {
    cups.forEach((cup, index) => {
        cup.style.transform = 'translateY(0)';
        cup.style.transition = 'all 0.3s ease';
        cup.style.left = `${10 + index * 30}%`;
    });
    ballPosition = Math.floor(Math.random() * 3);
    ball.style.display = 'none';
}

// Show ball under the correct cup


// Shuffle cups
function getRandomIndexes() {
    const indexes = [0, 1, 2];
    const index1 = indexes.splice(Math.floor(Math.random() * indexes.length), 1)[0];
    const index2 = indexes[Math.floor(Math.random() * indexes.length)];
    return [index1, index2];
}

function swapCups(index1, index2) {
    const cup1 = cups[index1];
    const cup2 = cups[index2];

    // Get current positions
    const cup1Left = cup1.style.left;
    const cup2Left = cup2.style.left;

    // Swap the positions
    cup1.style.left = cup2Left;
    cup2.style.left = cup1Left;

    // Correctly update ballPosition if the ball is under one of these cups
    if (ballPosition === index1) {
        ballPosition = index2;
    } else if (ballPosition === index2) {
        ballPosition = index1;
    }
}


async function shuffleCups() {
    const shuffleMoves = 5;
    const delay = 500;
    for (let i = 0; i < shuffleMoves; i++) {
        const [index1, index2] = getRandomIndexes();
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
    showBall(); // Display the ball under the correct cup
    message.textContent = 'Watch carefully where the ball is...';
    gameActive = true;

    await sleep(2000);
    ball.style.display = 'none'; // Hide the ball before shuffling
    message.textContent = 'Watch the cups shuffle!';
    await shuffleCups(); // Perform the shuffle
    message.textContent = 'Pick a cup!';
    enableCupClicks(); // Enable interaction
}


// Enable or disable cup clicks
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

// Handle cup click
function showBall() {
    ball.style.display = 'block';
    const cup = cups[ballPosition];
    const cupRect = cup.getBoundingClientRect();
    const containerRect = cup.parentElement.getBoundingClientRect();

    // Position the ball to align with the selected cup
    const ballLeft = cupRect.left + cupRect.width / 2 - ball.offsetWidth / 2 - containerRect.left;
    const ballTop = cupRect.top + cupRect.height / 2 - ball.offsetHeight / 2 - containerRect.top;

    ball.style.left = `${ballLeft}px`;
    ball.style.top = `${ballTop}px`;

    // Drop ball animation
    ball.style.animation = 'dropIntoCup 0.6s ease-in-out';
}

function handleCupClick(event) {
    if (!gameActive) return;

    const selectedCup = event.currentTarget;
    const selectedIndex = Array.from(cups).indexOf(selectedCup);

    gameActive = false;
    disableCupClicks();

    // Highlight the selected cup and make it "bounce"
    selectedCup.classList.add('clicked');

    // Reveal the ball
    showBall();

    // Check if the player's choice was correct
    setTimeout(() => {
        if (selectedIndex === ballPosition) {
            currentScore++;
            message.textContent = `Correct! Your score: ${currentScore}`;
            updateHighScore();
            setTimeout(() => {
                updatePlayButton('continue');
            }, 1000);
        } else {
            isGameOver = true;
            message.textContent = `Game Over! Final Score: ${currentScore}`;
            updateHighScore();
            setTimeout(() => {
                updatePlayButton('restart');
            }, 1000);
        }

        // Reset cup animations
        cups.forEach(cup => cup.classList.remove('clicked'));
    }, 1000);
}


    // Keep the ball visible after result
    setTimeout(() => {
        cups.forEach(cup => {
            cup.style.transform = 'translateY(0)';
        });
    }, 1000);



// Play button update
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

function playGame() {
    resetGame();
    currentScore = 0;
    isGameOver = false;
    playButton.style.display = 'none';
    startNewRound();
}

// Modal functionality
function openModal() {
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
    startGame();
}

function startGame() {
    playerName = playerNameInput.value.trim() || 'Player';
    message.textContent = `Welcome, ${playerName}! Click Start to play the game.`;
    modal.style.display = 'none';
    updatePlayButton('start');
}

// Offensive words list
const offensiveWords = [
    "sethxakka", "muji", "seth", // Custom offensive words
    "damn", "hell", "idiot", "stupid", // Add English offensive words
    "crap", "fool", "jerk", "moron", "dumb", // Expand as needed
    "ass", "bitch", "shit", "fuck", "bastard" // Include harsher terms
];

// Filter function
function filterOffensiveWords(message) {
    let filteredMessage = message.toLowerCase();

    offensiveWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        filteredMessage = filteredMessage.replace(regex, "*".repeat(word.length));
    });

    return filteredMessage;
}

// Chat Functionality
sendButton.addEventListener('click', sendMessage);

chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const chatMessage = chatInput.value.trim();
    if (chatMessage) {
        // Filter the message for offensive words
        const filteredMessage = filterOffensiveWords(chatMessage);

        const messageData = {
            name: playerName || 'Anonymous',
            message: filteredMessage,
            timestamp: Date.now(),
        };

        // Send message to Firebase
        database.ref('chat').push(messageData);
        chatInput.value = '';
    }
}

database.ref('chat').on('child_added', (snapshot) => {
    const data = snapshot.val();
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<strong>${data.name}:</strong> ${data.message}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
});

// Minimize chat
document.addEventListener('DOMContentLoaded', () => {
    // Get or create necessary elements
    const chatContainer = document.getElementById('chat-container');
    const chatHeader = document.getElementById('chat-header');
    
    // Make sure header has the text and button
    if (!chatHeader.querySelector('span')) {
      const headerText = document.createElement('span');
      headerText.textContent = 'Chat';
      chatHeader.insertBefore(headerText, chatHeader.firstChild);
    }
    
    if (!chatHeader.querySelector('#minimize-btn')) {
      const minimizeBtn = document.createElement('button');
      minimizeBtn.id = 'minimize-btn';
      minimizeBtn.setAttribute('aria-label', 'Minimize chat');
      chatHeader.appendChild(minimizeBtn);
    }
  
    // Toggle minimize function
    function toggleMinimize(event) {
      event.stopPropagation();
      chatContainer.classList.toggle('minimized');
    }
  
    // Add click listeners
    chatHeader.addEventListener('click', toggleMinimize);
  });

//code for prevent DOS Attack//
const MESSAGE_COOLDOWN = 2000; // 5 seconds cooldown
let lastMessageTime = 0;

function sendMessage() {
    const currentTime = Date.now();
    if (currentTime - lastMessageTime < MESSAGE_COOLDOWN) {
        alert("Please wait a few seconds before sending another message.");
        return;
    }

    const chatMessage = chatInput.value.trim();
    if (chatMessage) {
        const filteredMessage = filterOffensiveWords(chatMessage);

        const messageData = {
            name: playerName || 'Anonymous',
            message: filteredMessage,
            timestamp: Date.now(),
        };

        // Send message to Firebase
        database.ref('chat').push(messageData);
        chatInput.value = '';
        lastMessageTime = currentTime;
    }
}

// Initialize game
loadHighScore();
openModal();
