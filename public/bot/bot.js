const cells = document.querySelectorAll(".box");
const status = document.getElementById("status");
const restartButton = document.getElementById("restart");
const winLine = document.getElementById("win-line");

let board = ["", "", "", "", "", "", "", "", ""];

const player = "X";
const bot = "O";

let gameOver = false;
let playerTurn = true;

const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],

    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],

    [0, 4, 8],
    [2, 4, 6]
];


function getWinningCombination(symbol) {
    for (const combination of winningCombinations) {
        const [a, b, c] = combination;

        if (
            board[a] === symbol &&
            board[b] === symbol &&
            board[c] === symbol
        ) {
            return combination;
        }
    }

    return null;
}

function drawWinLine(combination) {
    const boardElement = document.querySelector(".board");
    const startCell = cells[combination[0]];
    const endCell = cells[combination[2]];

    const boardRect = boardElement.getBoundingClientRect();
    const startRect = startCell.getBoundingClientRect();
    const endRect = endCell.getBoundingClientRect();

    let startX = startRect.left - boardRect.left + startRect.width / 2;
    let startY = startRect.top - boardRect.top + startRect.height / 2;
    let endX = endRect.left - boardRect.left + endRect.width / 2;
    let endY = endRect.top - boardRect.top + endRect.height / 2;

    if (Math.abs(startX - endX) < 2) {
        const offset = startX > boardRect.width / 2 ? -8 : 8;
        startX += offset;
        endX += offset;
    }

    if (Math.abs(startY - endY) < 2) {
        const offset = startY > boardRect.height / 2 ? -8 : 8;
        startY += offset;
        endY += offset;
    }

    winLine.setAttribute("x1", startX);
    winLine.setAttribute("y1", startY);
    winLine.setAttribute("x2", endX);
    winLine.setAttribute("y2", endY);
    winLine.setAttribute("display", "block");
}

function clearWinLine() {
    winLine.setAttribute("display", "none");
}

// ==========================
// PLAYER MOVE
// ==========================

cells.forEach((cell, index) => {

    cell.addEventListener("click", () => {

        if (
            board[index] !== "" ||
            gameOver ||
            !playerTurn
        ) {
            return;
        }

        // Player places X
        board[index] = player;
        cell.textContent = player;

        // Check player win
        const playerWin = getWinningCombination(player);

        if (playerWin) {

            gameOver = true;
            drawWinLine(playerWin);
            status.textContent = "You won!";

            return;
        }

        // Check draw
        if (checkDraw()) {

            gameOver = true;
            clearWinLine();
            status.textContent = "Draw!";

            return;
        }

        // Bot's turn
        playerTurn = false;
        status.textContent = "Bot's turn";

        setTimeout(botMove, 500);
    });

});


// ==========================
// BOT MOVE
// ==========================

function botMove() {

    if (gameOver) {
        return;
    }

    let move = findWinningMove(bot);

    // If bot cannot win,
    // block player's winning move
    if (move === -1) {
        move = findWinningMove(player);
    }

    // Take center
    if (move === -1 && board[4] === "") {
        move = 4;
    }

    // Take a corner
    if (move === -1) {

        const corners = [0, 2, 6, 8];

        const availableCorners = corners.filter(
            index => board[index] === ""
        );

        if (availableCorners.length > 0) {

            const randomIndex = Math.floor(
                Math.random() * availableCorners.length
            );

            move = availableCorners[randomIndex];
        }
    }

    // Take any remaining empty cell
    if (move === -1) {

        const emptyCells = [];

        for (let i = 0; i < board.length; i++) {

            if (board[i] === "") {
                emptyCells.push(i);
            }
        }

        if (emptyCells.length > 0) {

            const randomIndex = Math.floor(
                Math.random() * emptyCells.length
            );

            move = emptyCells[randomIndex];
        }
    }

    // No move available
    if (move === -1) {
        return;
    }

    // Place O
    board[move] = bot;
    cells[move].textContent = bot;

    // Check bot win
    const botWin = getWinningCombination(bot);

    if (botWin) {

        gameOver = true;
        drawWinLine(botWin);
        status.textContent = "Bot won!";

        return;
    }

    // Check draw
    if (checkDraw()) {

        gameOver = true;
        clearWinLine();
        status.textContent = "Draw!";

        return;
    }

    // Player's turn
    playerTurn = true;
    status.textContent = "Your turn";
}


// ==========================
// FIND WINNING MOVE
// ==========================

function findWinningMove(symbol) {

    for (const combination of winningCombinations) {

        const [a, b, c] = combination;

        // X X _
        if (
            board[a] === symbol &&
            board[b] === symbol &&
            board[c] === ""
        ) {
            return c;
        }

        // X _ X
        if (
            board[a] === symbol &&
            board[b] === "" &&
            board[c] === symbol
        ) {
            return b;
        }

        // _ X X
        if (
            board[a] === "" &&
            board[b] === symbol &&
            board[c] === symbol
        ) {
            return a;
        }
    }

    return -1;
}


// ==========================
// CHECK WINNER
// ==========================

function checkWinner(symbol) {
    return getWinningCombination(symbol) !== null;
}


// ==========================
// CHECK DRAW
// ==========================

function checkDraw() {

    return !board.includes("");
}


// ==========================
// RESTART
// ==========================

restartButton.addEventListener("click", () => {

    board = ["", "", "", "", "", "", "", "", ""];

    gameOver = false;
    playerTurn = true;

    cells.forEach(cell => {
        cell.textContent = "";
    });

    clearWinLine();
    status.textContent = "Your turn";
});