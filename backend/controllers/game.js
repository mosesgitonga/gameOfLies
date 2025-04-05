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
            const { player1Id, betAmount } = req.body;
            if (!player1Id || !betAmount || betAmount <= 0) {
                return res.status(400).json({ message: "User ID and valid bet amount are required" });
            }

            const user = await this.engine.get("User", "id", player1Id);
            if (!user || user.balance < betAmount) {
                return res.status(400).json({ message: "Insufficient balance" });
            }

	    const existingActiveGames = await this.engine.getWhere("Game", {
		    player1Id,
	    	status: { in: ["ongoing", "paused"] },
	    });
	    console.log("Existing games: ", existingActiveGames)
            if (existingActiveGames.length > 0) {
                return res.status(409).json({
                    message: "You are already in an ongoing or paused game.",
                    gameId: existingActiveGames[0].id,
                });
            }  

            const existingPendingGame = await this.engine.getWhere("Game", {
                player1Id,
                status: "pending",
            });
            if (existingPendingGame.length > 0) {
                return res.status(409).json({
                    message: "You have a pending game. Destroy it first.",
                    gameId: existingPendingGame[0].id,
                });
            }

            const id = this.helper.generateUuid();
            const initialState = {
                pieces: { A: null, B: null, C: null, D: null, E: null, F: null, G: null, H: null, I: null },
                currentPlayer: "X",
                placedPieces: { X: 0, O: 0 },
            };

            // Deduct bet amount and create game
            const game = await this.engine.create("Game", {
                id,
                player1Id,
                player1Symbol: "X",
                status: "pending",
                state: JSON.stringify(initialState),
                betAmount, // Store fixed bet amount
            });
            await this.engine.update("User", player1Id, { balance: user.balance - betAmount });

            await this.engine.create("Bet", { gameId: id, userId: player1Id, amount: betAmount });

            return res.status(201).json({ message: "Game created successfully", gameId: game.id });
        } catch (error) {
            console.error("Error creating game:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }

    async joinGame(req, res) {
        try {
            const { gameId, userId } = req.body;

            if (!gameId || !userId) {
                return res.status(400).json({ message: "Game ID and user ID are required" });
            }

            const game = await this.engine.get("Game", "id", gameId);
            if (!game) return res.status(404).json({ message: "Game not found" });
            if (game.player2Id) return res.status(400).json({ message: "Game already has two players" });
            if (game.player1Id === userId) return res.status(400).json({ message: "You cannot join your own game" });

            const user = await this.engine.get("User", "id", userId);
            if (user.balance < game.betAmount) {
                return res.status(400).json({ message: "Insufficient balance to join this game" });
            }
	    const existingActiveGames = await this.engine.getWhere("Game", {
                AND: [
                    {
                    OR: [
                        { player1Id: userId },
                        { player2Id: userId },
                    ],
                    },
                    {
                    status: { in: ["ongoing", "paused"] },
                    },
                ],
                });
            if (existingActiveGames.length > 0) {
                return res.status(409).json({
                    message: "You are already in an ongoing or paused game.",
                    gameId: existingActiveGames[0].id,
                });
            }

            // Deduct bet amount and join game
            await this.engine.update("User", userId, { balance: user.balance - game.betAmount });
            await this.engine.create("Bet", { gameId, userId, amount: game.betAmount });
            await this.engine.update("Game", gameId, {
                player2Id: userId,
                player2Symbol: "O",
                status: "ongoing",
            });

            const io = req.app.get("socketio");
            if (io) {
                io.to(gameId).emit("gameReady", { roomId: gameId });
            }

            return res.status(200).json({ message: "Joined game successfully", gameId });
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
                        entryAmount: game.betAmount
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
			                 { status: "ongoing"},
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

    async placeBet(req, res) {
        try {
            const { gameId, userId, amount } = req.body;
            if (!gameId || !userId || !amount || amount <= 0) {
                return res.status(400).json({ message: "Game ID, user ID, and valid amount are required" });
            }

            const game = await this.engine.get("Game", "id", gameId);
            if (!game || game.status !== "pending") {
                return res.status(400).json({ message: "Game not found or not in pending state" });
            }

            const user = await this.engine.get("User", "id", userId);
            if (!user || user.balance < amount) {
                return res.status(400).json({ message: "Insufficient balance" });
            }

            const existingBet = await this.engine.getWhere("Bet", { gameId, userId });
            if (existingBet.length > 0) {
                return res.status(400).json({ message: "You have already placed a bet on this game" });
            }

            await this.engine.update("User", userId, { balance: user.balance - amount });
            const bet = await this.engine.create("Bet", { gameId, userId, amount });

            return res.status(200).json({ message: "Bet placed successfully", bet });
        } catch (error) {
            console.error("Error placing bet:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }

    async userGameHistory(req, res) {
        const { userId } = req.params
    
        if (!userId) {
            console.log("No user id in query params");
            return res.status(400).json({ message: "User id not found" });
        }
    
        try {
            // Fetch finished games where the user was player1 or player2
            const games = await this.engine.all("Game", { 
                where: {
                    status: "finished",
                    OR: [
                        { player1Id: userId },
                        { player2Id: userId }
                    ],
                },
            });
    
            if (!games.length) {
                return res.status(200).json([]); 
            }
    
            const sanitizedArray = await Promise.all(games.map(async (game) => {
                let opponentId = ""
                if (userId === game.player1Id) {
                    opponentId = game.player2Id
                } else if (userId === game.player2Id){
                    opponentId = game.player1Id
                }
                console.log(opponentId)
                const [opponent, user] = await Promise.all([
                    this.engine.get("User", "id", opponentId),
                    this.engine.get("User", "id", userId),
                ]);
                console.log("opponent: ",opponent.id, opponent.username)
                console.log("Current user: ", user.username)
                // Determine the game owner
                let gameOwner = game.player1Id === opponent.id ? opponent : user;
    
                // Determine the winner
                let winner = {}
                if (game.winnerId === user.id) {
                    winner = user
                } else if (game.winnerId === opponent.id) {
                    winner = opponent
                }
    
                return {
                    gameOwner: gameOwner.username,
                    opponent: opponent.username,
                    winner: winner.username,
                    entryFee: game.betAmount,
                    created_at: game.created_at
                };
            }));
    
            return res.status(200).json(sanitizedArray);
        } catch (error) {
            console.error("Error: ", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    async destroyGame(req, res) {
        const { gameId } = req.params;
        const userId = req.userId;
    
        if (!gameId) {
            console.error("Could not find game id in the params");
            return res.status(400).json({ message: "Game id not found" });
        }
    
        try {
            const game = await this.engine.get("Game", "id", gameId);
            if (!game) {
                return res.status(404).json({ message: "Game not found" });
            }
    
            if (game.player1Id !== userId) {
                console.error("Not authorized to delete this game.");
                return res.status(401).json({ message: "Not Authorized" });
            }
    
            if (game.status !== "pending") {
                console.error("Not allowed to delete non-pending games.");
                return res.status(403).json({ message: "Not Allowed" });
            }
    
            // Find and delete all related Bet records
            const bets = await this.engine.getWhere("Bet", { gameId });
            for (const bet of bets) {
                await this.engine.delete("Bet", bet.id);
                console.log(`Deleted Bet ${bet.id} for Game ${gameId}`);
            }
    
            //delete the Game
            await this.engine.delete("Game", gameId);
            return res.status(200).json({ message: "You have destroyed a pending tounament." });
        } catch (error) {
            console.error("Error in destroyGame:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
    
}

export default Game;
