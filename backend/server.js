import express from 'express'
import http from 'http'
import { Server } from "socket.io";
import cors from 'cors'
import authRouter from "./routes/authRoute.js";

const app = express();

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
app.use(cors());

app.use(authRouter)


const rooms = {}
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:5173" } });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
  
    socket.on("joinRoom", (roomId) => {
      if (!rooms[roomId]) {
        rooms[roomId] = { players: [], pieces: {}, currentPlayer: "X", placedPieces: { X: 0, O: 0 }, winner: null };
      }
  
      console.log(rooms[roomId].players.length)
      if (rooms[roomId].players.length >= 2) {
        //console.log('room is full')
        socket.emit("roomFull");
        return;
      }
  
      // assignig  symbol
      const playerSymbol = rooms[roomId].players.length === 0 ? "X" : "O";
      rooms[roomId].players.push({ id: socket.id, symbol: playerSymbol });
  
      socket.join(roomId);
      socket.emit("assignSymbol", playerSymbol)
  
      console.log(`Player ${socket.id} joined room ${roomId} as ${playerSymbol}`);
    });
  
    socket.on("makeMove", ({ pos, player, selectedPiece, roomId }) => {
      const room = rooms[roomId];
      if (!room || room.winner || room.currentPlayer !== player) return; // invalid moves
  
      if (room.placedPieces[player] < 3) {
        // Placing a piece
        if (!room.pieces[pos]) {
          room.pieces[pos] = player;
          room.placedPieces[player] += 1;
        }
      } else {
        // Move a piece
        if (selectedPiece && room.pieces[selectedPiece] === player && !room.pieces[pos]) {
          room.pieces[pos] = player;
          delete room.pieces[selectedPiece];
        }
      }
  
      // Check for a winner
      const winner = checkWinner(room.pieces);
      if (winner) room.winner = winner;
  
      // Switch turn
      room.currentPlayer = room.currentPlayer === "X" ? "O" : "X";
  
      // Broadcast new game state
      io.to(roomId).emit("gameState", {
        roomId,
        pieces: room.pieces,
        currentPlayer: room.currentPlayer,
        winner: room.winner,
        placedPieces: room.placedPieces
      });
  
      console.log(`Move made in room ${roomId}:`, room.pieces);
    });
  
    socket.on("disconnect", () => {
      for (const roomId in rooms) {
        rooms[roomId].players = rooms[roomId].players.filter(player => player.id !== socket.id);
        if (rooms[roomId].players.length === 0) {
          delete rooms[roomId]; 
        }
      }
      console.log("A user disconnected:", socket.id);
    });
  });
  
  function checkWinner(pieces) {
    const winningPatterns = [
      ["A", "B", "C"], ["D", "E", "F"], ["G", "H", "I"], // Rows
      ["A", "D", "G"], ["B", "E", "H"], ["C", "F", "I"], // Columns
      ["A", "E", "I"], ["C", "E", "G"] // Diagonals
    ];
  
    for (let pattern of winningPatterns) {
      const [a, b, c] = pattern;
      if (pieces[a] && pieces[a] === pieces[b] && pieces[a] === pieces[c]) {
        return pieces[a];
      }
    }
    return null;
  }
server.listen(5000, () => console.log("Server running on port 5000"));
