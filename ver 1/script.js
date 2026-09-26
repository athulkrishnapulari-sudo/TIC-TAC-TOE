
const playerinfo = document.getElementById("playerinfo");
const start = document.querySelector(".start");
const player1 = document.getElementById("player1");
const player2 = document.getElementById("player2");
const gameBoard = document.getElementById("gameBoard");
const cells = Array.from(document.querySelectorAll(".cell"));
const nameXEl = document.getElementById('nameX');
const nameOEl = document.getElementById('nameO');
const scoreXEl = document.getElementById('scoreX');
const scoreOEl = document.getElementById('scoreO');
const resetScoresBtn = document.getElementById('resetScores');
const moveTimerEl = document.getElementById('moveTimer');
const turnLabelEl = document.getElementById('turnLabel');

let scoreX = 0;
let scoreO = 0;

let turn = "X";
let gameActive = false;
const MOVE_TIME = 10; // seconds per move
let timeLeft = MOVE_TIME;
let timerInterval = null;
const winningCombos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
];

// --- Online multiplayer (socket.io) support ---
let socket = null;
let onlineRoom = null;
let onlineEnabled = false;

function enableOnline(serverUrl, roomId) {
    if (onlineEnabled) return;
    try {
        socket = io(serverUrl);
    } catch (e) {
        console.error('Socket connect failed', e);
        return;
    }
    onlineEnabled = true;
    onlineRoom = roomId;

    socket.on('connect', () => console.log('connected to server', socket.id));
    socket.on('game-start', data => {
        showPopup('Online game started');
        // clear and start local UI
        startGameLocalAfterOnline();
    });
    socket.on('opponent-move', ({ index, symbol, turn }) => {
        // apply opponent move to UI
        const cell = cells[index];
        if (cell) {
            cell.textContent = symbol;
            cell.dataset.player = symbol;
        }
        if (turn) {
            turn = turn; // keep local turn consistent
        }
        updateTurnLabel();
    });
    socket.on('win', ({ symbol }) => {
        showPopup(`${symbol} wins!`);
        endGame();
    });
    socket.on('draw', () => { showPopup('Draw!'); endGame(); });
    socket.on('opponent-left', () => { showPopup('Opponent left'); endGame(); });

    socket.emit('join', { roomId: onlineRoom, name: player1.value.trim() || 'Player' });
}

function startGameLocalAfterOnline() {
    // reuse startGame logic but without reading inputs again
    playerinfo.style.display = 'none';
    gameBoard.style.display = 'flex';
    turn = 'X';
    gameActive = true;
    updateTurnLabel();
    startMoveTimer();
    cells.forEach(cell => { cell.textContent = ''; delete cell.dataset.player; cell.removeEventListener('click', onCellClick); cell.addEventListener('click', onlineCellClick); });
}

function onlineCellClick(event) {
    if (!gameActive) return;
    const cell = event.target;
    const idx = Number(cell.dataset.index);
    if (cell.textContent) return;
    // emit move to server. server will broadcast back.
    if (!socket || !onlineRoom) return;
    socket.emit('move', { roomId: onlineRoom, index: idx, symbol: turn });
}


// --- Popup notification (replaces alert) ---
function showPopup(message, duration = 2200) {
    // remove existing popup if any
    const existing = document.querySelector('.popup-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';

    const box = document.createElement('div');
    box.className = 'popup-box';
    box.textContent = message;

    const close = document.createElement('button');
    close.className = 'popup-close';
    close.textContent = 'OK';
    close.addEventListener('click', () => overlay.remove());

    box.appendChild(close);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    if (duration > 0) {
        setTimeout(() => {
            if (overlay.parentNode) overlay.remove();
        }, duration);
    }
}


function checkWin(symbol) {
    return winningCombos.some(combo => combo.every(i => cells[i].textContent === symbol));
}

function isDraw() {
    return cells.every(c => c.textContent === "X" || c.textContent === "O");
}

function onCellClick(event) {
    if (!gameActive) return;
    const cell = event.target;
    if (cell.textContent) return;
    cell.textContent = turn;
    // mark for styling
    cell.dataset.player = turn;

    // stop current move timer
    if (timerInterval) clearInterval(timerInterval);

    if (checkWin(turn)) {
        const winnerName = turn === "X" ? (player1.value.trim() || "Player X") : (player2.value.trim() || "Player O");
        // update score
        if (turn === 'X') {
            scoreX += 1;
            scoreXEl.textContent = scoreX;
        } else {
            scoreO += 1;
            scoreOEl.textContent = scoreO;
        }
        // show in-page popup instead of alert
        setTimeout(() => showPopup(`${winnerName} wins!`), 10);
        endGame();
        return;
    }

    if (isDraw()) {
        setTimeout(() => showPopup("Draw!"), 10);
        endGame();
        return;
    }

    turn = turn === "X" ? "O" : "X";
    updateTurnLabel();
    startMoveTimer();
}

function updateTurnLabel() {
    if (!turnLabelEl) return;
    const name = turn === 'X' ? (player1.value.trim() || 'Player X') : (player2.value.trim() || 'Player O');
    turnLabelEl.textContent = `Turn: ${name}`;
}

function startMoveTimer() {
    if (!moveTimerEl) return;
    if (timerInterval) clearInterval(timerInterval);
    timeLeft = MOVE_TIME;
    moveTimerEl.textContent = String(timeLeft) + 's';
    timerInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(timerInterval);
            return;
        }
        timeLeft -= 1;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleTimeUp();
            return;
        }
        moveTimerEl.textContent = String(timeLeft) + 's';
    }, 1000);
}

function handleTimeUp() {
    if (!gameActive) return;
    showPopup("Time's up! Turn skipped.");
    // switch turn without placing a move
    turn = turn === 'X' ? 'O' : 'X';
    updateTurnLabel();
    startMoveTimer();
}

function startGame(e) {
    e.preventDefault();
    const x = player1.value.trim();
    const o = player2.value.trim();
    if (!x || !o) return;

    playerinfo.style.display = "none";
    gameBoard.style.display = "flex";
    // set displayed names on scoreboard
    nameXEl.textContent = x || 'Player X';
    nameOEl.textContent = o || 'Player O';
    turn = "X";
    gameActive = true;

    updateTurnLabel();
    startMoveTimer();

    // clear board and attach listeners
    cells.forEach(cell => {
        cell.textContent = "";
        delete cell.dataset.player;
        cell.removeEventListener('click', onCellClick);
        cell.addEventListener('click', onCellClick);
    });

    // remove existing restart button if present
    const existingRestart = document.querySelector('.restart');
    if (existingRestart) existingRestart.remove();
}

function endGame() {
    gameActive = false;
    if (timerInterval) clearInterval(timerInterval);
    // add restart button
    let restartBtn = document.querySelector('.restart');
    if (!restartBtn) {
        restartBtn = document.createElement('button');
        restartBtn.textContent = 'Restart';
        restartBtn.className = 'restart';
        restartBtn.addEventListener('click', resetGame);
        gameBoard.appendChild(restartBtn);
        restartBtn.classList.add('restart-btn');
    }
}

function resetGame() {
    // clear cells
    cells.forEach(cell => {
        cell.textContent = '';
        delete cell.dataset.player;
    });
    turn = 'X';
    gameActive = true;
    updateTurnLabel();
    startMoveTimer();
    // remove restart button
    const restartBtn = document.querySelector('.restart');
    if (restartBtn) restartBtn.remove();
}

// reset scores to zero
if (resetScoresBtn) {
    resetScoresBtn.addEventListener('click', () => {
        scoreX = 0;
        scoreO = 0;
        scoreXEl.textContent = '0';
        scoreOEl.textContent = '0';
    });
}

start.addEventListener('click', startGame);

// --- online UI bindings ---
const playOnlineBtn = document.getElementById('playOnlineBtn');
const roomIdInput = document.getElementById('roomIdInput');
if (playOnlineBtn) {
    playOnlineBtn.addEventListener('click', () => {
        const room = roomIdInput.value.trim() || Math.random().toString(36).slice(2,8);
        // use localhost by default for local testing; change to deployed server URL when available
        enableOnline(window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin, room);
        showPopup('Connecting to room ' + room);
    });
}


