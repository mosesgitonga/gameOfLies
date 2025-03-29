import express from 'express';
import http from 'http';
import { Server } from "socket.io";
import cors from 'cors';
import routesInjector from './routes/routesInjector.js';
import authRouter from "./routes/authRoute.js";

const app = express();

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
app.use(cors());

routesInjector(app);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:5173" } });

const rooms = {};

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("joinRoom", ({ roomId, userId }) => {
        console.log("joinRoom received:", { roomId, userId });

        if (!userId) {
            socket.emit("roomError", "User ID is required to join a room.");
            return;
        }

        if (typeof roomId !== "string") {
            socket.emit("roomError", "Invalid room ID.");
            return;
        }

        if (!rooms[roomId]) {
            rooms[roomId] = { 
                players: {}, 
                pieces: {}, 
                currentPlayer: "X", 
                placedPieces: { X: 0, O: 0 }, 
                winner: null,
                gameStarted: false // Track if game has started
            };
        }

        const room = rooms[roomId];

        if (Object.keys(room.players).length >= 2 && !room.players[userId]) {
            socket.emit("roomError", "Room is full.");
            return;
        }

        if (!room.players[userId]) {
            const playerSymbol = Object.keys(room.players).length === 0 ? "X" : "O";
            room.players[userId] = { symbol: playerSymbol, socketId: socket.id };
        } else {
            room.players[userId].socketId = socket.id;
        }

        const playerSymbol = room.players[userId].symbol;

        socket.join(roomId);
        socket.emit("assignSymbol", { userId, symbol: playerSymbol });

        // Check if both players are present
        const playerCount = Object.keys(room.players).length;
        if (playerCount === 2 && !room.gameStarted) {
            room.gameStarted = true;
            io.to(roomId).emit("gameReady", { roomId });
            console.log(`Game started in room ${roomId}`);
        }

        io.to(roomId).emit("gameState", {
            roomId,
            pieces: room.pieces,
            currentPlayer: room.currentPlayer,
            winner: room.winner,
            placedPieces: room.placedPieces,
            gameStarted: room.gameStarted
        });

        console.log(`Player ${userId} joined room ${roomId} as ${playerSymbol} with socket ${socket.id}`);
    });

    socket.on("makeMove", ({ pos, player, selectedPiece, roomId, userId }) => {
        const room = rooms[roomId];
        if (!room || !room.gameStarted || room.winner || room.currentPlayer !== player) {
            socket.emit("roomError", "Game not started or invalid move.");
            return;
        }

        if (!room.players[userId] || room.players[userId].symbol !== player) {
            socket.emit("roomError", "Unauthorized move attempt.");
            return;
        }

        if (room.placedPieces[player] < 3) {
            if (!room.pieces[pos]) {
                room.pieces[pos] = player;
                room.placedPieces[player] += 1;
            }
        } else {
            if (selectedPiece && room.pieces[selectedPiece] === player && !room.pieces[pos]) {
                room.pieces[pos] = player;
                delete room.pieces[selectedPiece];
            }
        }

        const winner = checkWinner(room.pieces);
        if (winner) room.winner = winner;

        room.currentPlayer = room.currentPlayer === "X" ? "O" : "X";

        io.to(roomId).emit("gameState", {
            roomId,
            pieces: room.pieces,
            currentPlayer: room.currentPlayer,
            winner: room.winner,
            placedPieces: room.placedPieces,
            gameStarted: room.gameStarted
        });

        console.log(`Move made by ${userId} in room ${roomId}:`, room.pieces);
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected:", socket.id);
        for (const roomId in rooms) {
            const room = rooms[roomId];
            for (const userId in room.players) {
                if (room.players[userId].socketId === socket.id) {
                    console.log(`Player ${userId} disconnected from room ${roomId}`);
                    // Optionally reset game if a player leaves before it ends
                    if (room.gameStarted && !room.winner) {
                        room.gameStarted = false;
                        io.to(roomId).emit("gameState", { ...room, gameStarted: false });
                        io.to(roomId).emit("roomError", "Opponent disconnected. Game paused.");
                    }
                }
            }
            if (Object.keys(room.players).length === 0) {
                delete rooms[roomId];
            }
        }
    });
});

function checkWinner(pieces) {
    const winningPatterns = [
        ["A", "B", "C"], ["D", "E", "F"], ["G", "H", "I"],
        ["A", "D", "G"], ["B", "E", "H"], ["C", "F", "I"],
        ["A", "E", "I"], ["C", "E", "G"]
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