import Engine from "../prisma/engine.js";

const engine = new Engine();
const rooms = {};

function setupSocket(io) {
    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id);

        socket.on("joinRoom", async ({ roomId, userId }) => {
            console.log("joinRoom received:", { roomId, userId });

            if (!userId || typeof roomId !== "string") {
                socket.emit("roomError", "Invalid room ID or user ID.");
                return;
            }

            const game = await engine.get("Game", "id", roomId);
            if (!game) {
                socket.emit("roomError", "Game not found.");
                return;
            }

            // Check if user is a player; don’t update DB here
            const isPlayer = game.player1Id === userId || game.player2Id === userId;
            if (!isPlayer) {
                // socket.emit("roomError", "You are not a player in this game yet.");
                return;
            }

            let gameState;
            try {
                gameState = game.state ? JSON.parse(game.state) : {
                    pieces: { A: null, B: null, C: null, D: null, E: null, F: null, G: null, H: null, I: null },
                    currentPlayer: game.player1Symbol || "X",
                    placedPieces: { X: 0, O: 0 },
                };
            } catch (error) {
                console.error(`Invalid JSON in game.state for room ${roomId}:`, game.state, error);
                gameState = {
                    pieces: { A: null, B: null, C: null, D: null, E: null, F: null, G: null, H: null, I: null },
                    currentPlayer: game.player1Symbol || "X",
                    placedPieces: { X: 0, O: 0 },
                };
                await engine.update("Game", roomId, { state: JSON.stringify(gameState) });
                console.log(`Reset corrupted state for game ${roomId}`);
            }

            if (!rooms[roomId] || game.status === "pending" || game.status === "finished") {
                rooms[roomId] = {
                    players: {},
                    pieces: gameState.pieces,
                    currentPlayer: gameState.currentPlayer,
                    placedPieces: gameState.placedPieces,
                    winner: game.winnerId ? (game.winnerId === game.player1Id ? "X" : "O") : null,
                    gameStarted: game.status === "ongoing" || game.status === "inProgress",
                };
            }

            const room = rooms[roomId];

            if (Object.keys(room.players).length >= 2 && !room.players[userId]) {
                socket.emit("roomError", "Room is full.");
                return;
            }

            const playerSymbol = userId === game.player1Id ? game.player1Symbol : game.player2Symbol;
            let wasDisconnected = false;
            if (room.players[userId]) {
                wasDisconnected = room.players[userId].disconnected;
                room.players[userId] = { symbol: playerSymbol, socketId: socket.id };
                delete room.players[userId].disconnected;
            } else {
                room.players[userId] = { symbol: playerSymbol, socketId: socket.id };
            }

            socket.join(roomId);
            console.log("Emitting assignSymbol to", userId, "with symbol", playerSymbol);
            socket.emit("assignSymbol", { userId, symbol: playerSymbol });

            console.log(`Room ${roomId} status:`, { playerCount: Object.keys(room.players).length, gameStarted: room.gameStarted, dbStatus: game.status });

            if (Object.keys(room.players).length === 2 && !room.gameStarted) {
                room.gameStarted = true;
                // Only update status to "inProgress" if not already set; DB update happens elsewhere
                if (game.status !== "inProgress") {
                    await engine.update("Game", roomId, { status: "inProgress" });
                }
                io.to(roomId).emit("gameReady", { roomId });
                console.log(`Game started in room ${roomId} - emitted gameReady`);
                if (wasDisconnected) {
                    io.to(roomId).emit("gameResumed", { roomId });
                    console.log(`Player ${userId} reconnected - game resumed in room ${roomId}`);
                }
            }

            io.to(roomId).emit("gameState", {
                roomId,
                pieces: room.pieces,
                currentPlayer: room.currentPlayer,
                winner: room.winner,
                placedPieces: room.placedPieces,
                gameStarted: room.gameStarted,
            });

            console.log(`Player ${userId} joined room ${roomId} as ${playerSymbol}`);
        });

        socket.on("makeMove", async ({ pos, player, selectedPiece, roomId, userId }) => {
            const room = rooms[roomId];
            if (!room || !room.gameStarted || room.winner || room.currentPlayer !== player) {
                socket.emit("roomError", "Game not started, over, or not your turn.");
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
            } else if (selectedPiece && room.pieces[selectedPiece] === player && !room.pieces[pos]) {
                room.pieces[pos] = player;
                delete room.pieces[selectedPiece];
            } else {
                socket.emit("roomError", "Invalid move.");
                return;
            }

            const winner = checkWinner(room.pieces);
            if (winner) {
                room.winner = winner;
            }

            room.currentPlayer = room.currentPlayer === "X" ? "O" : "X";

            await engine.update("Game", roomId, {
                state: JSON.stringify({
                    pieces: room.pieces,
                    currentPlayer: room.currentPlayer,
                    placedPieces: room.placedPieces,
                }),
                status: room.winner ? "finished" : "inProgress",
                ...(room.winner && { winnerId: Object.keys(room.players).find(uid => room.players[uid].symbol === room.winner) }),
            });

            io.to(roomId).emit("gameState", {
                roomId,
                pieces: room.pieces,
                currentPlayer: room.currentPlayer,
                winner: room.winner,
                placedPieces: room.placedPieces,
                gameStarted: room.gameStarted,
            });

            console.log(`Move made by ${userId} in room ${roomId}:`, room.pieces);
        });

        socket.on("disconnect", async () => {
            console.log("A user disconnected:", socket.id);
            for (const roomId in rooms) {
                const room = rooms[roomId];
                let disconnectedUserId = null;
                for (const userId in room.players) {
                    if (room.players[userId].socketId === socket.id) {
                        disconnectedUserId = userId;
                        room.players[userId].disconnected = true;
                        console.log(`Player ${userId} disconnected from room ${roomId}`);
                    }
                }

                if (disconnectedUserId && room.gameStarted && !room.winner) {
                    room.gameStarted = false;
                    await engine.update("Game", roomId, {
                        status: "paused",
                        state: JSON.stringify({
                            pieces: room.pieces,
                            currentPlayer: room.currentPlayer,
                            placedPieces: room.placedPieces,
                        }),
                    });
                    io.to(roomId).emit("roomError", "Opponent disconnected. Game paused, waiting for reconnection...");
                    io.to(roomId).emit("gameState", { ...room, gameStarted: false });
                }

                if (Object.values(room.players).every(p => p.disconnected)) {
                    delete rooms[roomId];
                    console.log(`Room ${roomId} cleared: all players disconnected`);
                }
            }
        });
    });
}

function checkWinner(pieces) {
    const winningPatterns = [
        ["A", "B", "C"], ["D", "E", "F"], ["G", "H", "I"],
        ["A", "D", "G"], ["B", "E", "H"], ["C", "F", "I"],
        ["A", "E", "I"], ["C", "E", "G"],
    ];

    for (let pattern of winningPatterns) {
        const [a, b, c] = pattern;
        if (pieces[a] && pieces[a] === pieces[b] && pieces[a] === pieces[c]) {
            return pieces[a];
        }
    }
    return null;
}

export default setupSocket;