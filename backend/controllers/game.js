import Engine from "../prisma/engine.js";
import User from "./users.js";
import Helper from "../utils/helpers.js";
class Game {
    /**
     *  manages game functionalities like creating games, joining games
     * @param {Engine} engine - handles crud operations
     * @param {User} user - manages user related controls
     * @param {Helper} helper - provide utility methods for varius services. 
     */
    constructor(engine, user, helper) {
        this.engine = engine
        this.user = user
        this.helper = helper
    }

    async createGame(req, res) {
        /**
         * creates a new game session
         * generates a 6 digit unique id for a game and sets the requesting player as first player.
         * @param {object} req - request object
         * @param {string} req.body.userId - ID of the player creating the game.
         * @param {object} res - response object 
         * @returns {Json} returns a json response 
         */
        try {
            const { player1Id } = req.body
            if (!player1Id)  {
                console.error('No user id on req.body')
                return res.status(403).json({"message": "cannot create game without user id"})
            }
            const userId = player1Id
            const id = this.helper.generateUuid()
            const existingPlayerGame = this.engine.getWhere("Game", { player1Id: userId, status: "pending" })
            // const existingPlayerGame = await this.engine.getWhere("Game", {}, [
            //     { player1Id: userId },
            //     // { status: "pending" }
            // ]);
            if (existingPlayerGame == []) {
                return res.status(409).json({ "message": "You have a Pending game, \nIf you must continue == Destroy it first" })
            }
            const data = {
                id: id,
                player1Id: userId
            }
            await this.engine.create('Game', data)
            return res.status(201).json({ "message": "game created successfully" })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ "message": "Internal Server Error" })
        }
    }

    async joinGame(req, res) {
        /**
         * updates the game table with a new player who have joined the game room.
         * @param {req} - Request object
         * @param {res} - Response object
         * @returns {void} A json response 
         */

        try {
            const { gameId, userId } = req.body
            //const userId = req.userId 

            if (!userId) {
                console.warn("no user id in the body")
                return res.status(404).json({ "error": "no user id" })
            }
            const data = {
                player2Id: userId,
                status: "ongoing"
            }
            await this.engine.update("Game", gameId, data)
            return res.status(200).json({ "message": "Player 2 added to the game" })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ "message": "Internal Server Error" })
        }
    }


    async startGame(req, res) {
        const { gameId } = req.params
        if (!gameId) {
            console.warn("game id is missing")
            return res.status(409).json({ "message": "game id is missing" })
        }
        try {
            const data = {
                status: "inProgress"
            }
            await this.engine.update("Game", data, { id: gameId })
            return res.status(200).json({ "message": "game started." })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ "error": "Internal Server Error" })
        }

    }

    async getPendingGames(req, res) {
        try {
            // Fetch all pending games
            const games = await this.engine.all("Game", { where: { status: "pending" } });
    
            // Map games to include challenger details
            const gameDetails = await Promise.all(
                games.map(async (game) => {
                    let challengerUsername = "Unknown";
                    if (game.player1Id) { // Check if player1Id exists
                        const challenger = await this.engine.get("User", "id", game.player1Id);
                        challengerUsername = challenger ? challenger.username : "Unknown";
                    } else {
                        console.warn(`Game ${game.id} has no player1Id`);
                    }
    
                    return {
                        challenger: challengerUsername,
                        id: game.id,
                        status: "pending",
                        created_at: game.created_at
                    };
                })
            );
    
            // Return the enriched game details
            return res.status(200).json(gameDetails);
        } catch (error) {
            console.error("Error in getPendingGames:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
    async getUserGames(req, res) {
        const { userId } = req.params;
        if (!userId) {
            console.error("No user id found in the query params");
            return res.status(400).json({ message: "User ID is required" }); // 400 for bad request
        }
    
        try {
            const games = await this.engine.getWhere("Game", {}, [
                { player1Id: userId },
                { player2Id: userId }
            ]);
    
            if (!Array.isArray(games) || games.length === 0) {
                console.log(`No games found for userId: ${userId}`);
                return res.status(404).json({ message: "No games found" });
            }
    
            const result = await Promise.all(
                games.map(async (game) => {
                    const challenger = await this.engine.get("User", "id", game.player1Id);
                    if (!challenger) {
                        throw new Error(`User not found for player1Id: ${game.player1Id}`);
                    }
                    return {
                        challenger: challenger.username,
                        gameId: game.id,
                        status: game.status
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
}

export default Game