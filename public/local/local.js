const cells = document.querySelectorAll('.box');
const status = document.getElementById('status');
const winLine = document.getElementById('win-line');

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

let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameOver = false;

function getWinningCombination(symbol) {
    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (board[a] === symbol && board[b] === symbol && board[c] === symbol) {
            return combination;
        }
    }
    return null;
}

function clearWinLine() {
    winLine.setAttribute('display', 'none');
}

function drawWinLine(combination) {
    const boardElement = document.querySelector('.board');
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

    winLine.setAttribute('x1', startX);
    winLine.setAttribute('y1', startY);
    winLine.setAttribute('x2', endX);
    winLine.setAttribute('y2', endY);
    winLine.setAttribute('display', 'block');
}

function checkDraw() {
    return !board.includes('');
}

function finishGame(winner, line) {
    gameOver = true;
    drawWinLine(line);
    status.textContent = `Player ${winner} wins!`;
}

cells.forEach((element, index) => {
    element.addEventListener('click', () => {
        if (gameOver || board[index] !== '') {
            return;
        }

        board[index] = currentPlayer;
        element.textContent = currentPlayer;

        const winningLine = getWinningCombination(currentPlayer);

        if (winningLine) {
            finishGame(currentPlayer, winningLine);
            return;
        }

        if (checkDraw()) {
            gameOver = true;
            clearWinLine();
            status.textContent = 'Draw!';
            return;
        }

        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        status.textContent = `Player ${currentPlayer} turn`;
    });
});