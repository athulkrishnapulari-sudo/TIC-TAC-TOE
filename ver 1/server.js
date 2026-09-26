const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Serve static client files from the project root so the same host serves UI and socket server
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Very small in-memory rooms state.
const rooms = {};

function checkWinBoard(board, symbol) {
  const combos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return combos.some(c => c.every(i => board[i] === symbol));
}

io.on('connection', socket => {
  socket.on('join', ({ roomId, name }) => {
    if (!roomId) return;
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = { players: [], board: Array(9).fill(null), turn: 'X', names: {} };
    }
    const room = rooms[roomId];
    if (!room.players.includes(socket.id)) room.players.push(socket.id);
    room.names[socket.id] = name || 'Player';

    // assign symbol to players by order
    const symbols = {};
    room.players.forEach((id, idx) => symbols[id] = idx === 0 ? 'X' : 'O');

    io.to(roomId).emit('room-state', { count: room.players.length });
    if (room.players.length === 2) {
      room.board = Array(9).fill(null);
      room.turn = 'X';
      io.to(roomId).emit('game-start', { turn: room.turn });
    }
  });

  socket.on('move', ({ roomId, index, symbol }) => {
    const room = rooms[roomId];
    if (!room) return;
    // validate
    if (room.board[index] !== null) return;
    if (room.turn !== symbol) return;
    // apply
    room.board[index] = symbol;
    // check win/draw
    if (checkWinBoard(room.board, symbol)) {
      io.to(roomId).emit('opponent-move', { index, symbol });
      io.to(roomId).emit('win', { symbol });
      // reset room board for next game
      room.board = Array(9).fill(null);
      return;
    }
    if (room.board.every(v => v !== null)) {
      io.to(roomId).emit('opponent-move', { index, symbol });
      io.to(roomId).emit('draw');
      room.board = Array(9).fill(null);
      return;
    }
    // toggle
    room.turn = room.turn === 'X' ? 'O' : 'X';
    io.to(roomId).emit('opponent-move', { index, symbol, turn: room.turn });
  });

  socket.on('leave-room', ({ roomId }) => {
    socket.leave(roomId);
    const room = rooms[roomId];
    if (room) {
      room.players = room.players.filter(id => id !== socket.id);
      delete room.names[socket.id];
      io.to(roomId).emit('opponent-left');
      if (room.players.length === 0) delete rooms[roomId];
    }
  });

  socket.on('disconnect', () => {
    for (const id in rooms) {
      const room = rooms[id];
      if (room.players.includes(socket.id)) {
        room.players = room.players.filter(pid => pid !== socket.id);
        delete room.names[socket.id];
        io.to(id).emit('opponent-left');
        if (room.players.length === 0) delete rooms[id];
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Socket server listening on', PORT));
