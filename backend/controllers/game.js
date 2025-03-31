import Engine from "../prisma/engine.js";
import User from "./users.js";
import Helper from "../utils/helpers.js";

class Game {
    constructor(engine, user, helper) {
        this.engine = engine;
        this.user = user;
        this.helper = helper;
    }

    async createGame(req, res) {
        try {
            const { player1Id } = req.body;
            if (!player1Id) {
                console.error("No user ID on req.body");
                return res.status(403).json({ message: "Cannot create game without user ID" });
            }

            // Check for existing ongoing or paused games
            const existingActiveGames = await this.engine.getWhere("Game", {
                OR: [
                    { player1Id: player1Id },
                    { player2Id: player1Id },
                ],
                status: { in: ["ongoing", "paused"] },
            });

            if (existingActiveGames.length > 0) {
                return res.status(409).json({
                    message: "You are already in an ongoing or paused game. Finish or abandon it first.",
                    gameId: existingActiveGames[0].id,
                });
            }

            // Check for existing pending game (keep this as a separate check if you want)
            const existingPendingGame = await this.engine.getWhere("Game", {
                player1Id: player1Id,
                status: "pending",
            });

            if (existingPendingGame.length > 0) {
                return res.status(409).json({
                    message: "You have a pending game. Destroy it first to create a new one.",
                    gameId: existingPendingGame[0].id,
                });
            }

            const id = this.helper.generateUuid();
            const initialState = {
                pieces: { A: null, B: null, C: null, D: null, E: null, F: null, G: null, H: null, I: null },
                currentPlayer: "X",
                placedPieces: { X: 0, O: 0 },
            };
            const data = {
                id: id,
                player1Id: player1Id,
                player1Symbol: "X",
                status: "pending",
                state: JSON.stringify(initialState),
            };

            const game = await this.engine.create("Game", data);
            return res.status(201).json({ message: "Game created successfully", gameId: game.id });
        } catch (error) {
            console.error("Error creating game:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }

    async joinGame(req, res) {
        try {
            const { gameId, userId } = req.body;

            if (!userId) return res.status(400).json({ error: "No user ID provided" });
            if (!gameId) return res.status(400).json({ error: "No game ID provided" });

            // Check for existing ongoing or paused games
            const existingActiveGames = await this.engine.getWhere("Game", {
                OR: [
                    { player1Id: userId },
                    { player2Id: userId },
                ],
                status: { in: ["ongoing", "paused"] },
            });

            if (existingActiveGames.length > 0) {
                return res.status(409).json({
                    message: "You are already in an ongoing or paused game. Finish or abandon it first.",
                    gameId: existingActiveGames[0].id,
                });
            }

            const game = await this.engine.get("Game", "id", gameId);
            if (!game) return res.status(404).json({ message: "Game not found" });
            if (game.player2Id) return res.status(400).json({ message: "Game already has two players" });
            if (game.player1Id === userId) return res.status(400).json({ message: "You cannot join your own game" });

            const data = {
                player2Id: userId,
                player2Symbol: "O",
                status: "ongoing",
            };

            await this.engine.update("Game", gameId, data);

            const io = req.app.get("socketio");
            if (io) {
                io.to(gameId).emit("gameReady", { roomId: gameId });
                console.log(`Emitted gameReady for game ${gameId}`);
            } else {
                console.error("Socket.IO not initialized");
            }

            return res.status(200).json({ message: "Player 2 added to the game", gameId });
        } catch (error) {
            console.error("Error joining game:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }

    async startGame(req, res) {
        const { gameId } = req.params;
        if (!gameId) return res.status(400).json({ message: "Game ID is missing" });

        try {
            const game = await this.engine.get("Game", "id", gameId);
            if (!game) return res.status(404).json({ message: "Game not found" });
            if (game.status !== "ongoing") {
                return res.status(400).json({ message: "Game must be in 'ongoing' state to start" });
            }

            const data = { status: "inProgress" };
            await this.engine.update("Game", gameId, data);

            const io = req.app.get("socketio");
            if (io) {
                const gameState = JSON.parse(game.state || "{}");
                io.to(gameId).emit("gameState", {
                    roomId: gameId,
                    pieces: gameState.pieces || {},
                    currentPlayer: gameState.currentPlayer || "X",
                    placedPieces: gameState.placedPieces || { X: 0, O: 0 },
                    gameStarted: true,
                    winner: null,
                });
                console.log(`Emitted gameState for game ${gameId} on start`);
            }

            return res.status(200).json({ message: "Game started", gameId });
        } catch (error) {
            console.error("Error starting game:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }

    async getPendingGames(req, res) {
        try {
            const games = await this.engine.all("Game", { where: { status: "pending" } });

            const gameDetails = await Promise.all(
                games.map(async (game) => {
                    const challenger = await this.engine.get("User", "id", game.player1Id);
                    return {
                        challenger: challenger ? challenger.username : "Unknown",
                        id: game.id,
                        status: "pending",
                        created_at: game.created_at,
                    };
                })
            );

            return res.status(200).json(gameDetails);
        } catch (error) {
            console.error("Error in getPendingGames:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }

    async getUserGames(req, res) {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ message: "User ID is required" });

        try {
            const games = await this.engine.getWhere("Game", {
                AND: [
                    {
                        OR: [
                            { player1Id: userId },
                            { player2Id: userId },
                        ],
                    },
                    {
                        OR: [
                            { status: "pending" },
                            { status: "paused" },
                        ],
                    },
                ],
            });

            if (!games.length) return res.status(200).json([]);

            const result = await Promise.all(
                games.map(async (game) => {
                    const challenger = await this.engine.get("User", "id", game.player1Id);
                    let opponent = null;
                    if (game.player2Id) {
                        opponent = await this.engine.get("User", "id", game.player2Id);
                    }
                    return {
                        challenger: challenger ? challenger.username : "Unknown",
                        opponent: opponent ? opponent.username : "Waiting for opponent",
                        gameId: game.id,
                        status: game.status,
                        player1Symbol: game.player1Symbol,
                        player2Symbol: game.player2Symbol,
                        winnerId: game.winnerId,
                    };
                })
            );

            console.log(`Games found for userId: ${userId}`, result);
            return res.status(200).json(result);
        } catch (error) {
            console.error("Error fetching user games:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }

    async getGame(req, res) {
        const { gameId } = req.params;
        try {
            const game = await this.engine.get("Game", "id", gameId);
            if (!game) {
                console.warn(`Game ${gameId} not found`);
                return res.status(404).json({ message: "Game not found" });
            }

            let gameState;
            try {
                gameState = game.state ? JSON.parse(game.state) : {};
            } catch (parseError) {
                console.error(`Invalid JSON in game state for game ${gameId}:`, game.state, parseError);
                gameState = {};
            }

            const responseGame = {
                ...game,
                state: {
                    pieces: gameState.pieces || {
                        A: null, B: null, C: null, D: null, E: null,
                        F: null, G: null, H: null, I: null,
                    },
                    currentPlayer: gameState.currentPlayer || "X",
                    placedPieces: gameState.placedPieces || { X: 0, O: 0 },
                },
            };
            console.log(`Game ${gameId} fetched:`, responseGame);
            return res.status(200).json(responseGame);
        } catch (error) {
            console.error("Error fetching game:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
}

export default Game;