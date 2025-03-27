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
            const {userId} = req.body
            const id = this.helper.generateUuid()
            const existingPlayerGame = this.engine.getWhere("Game", {player1Id: userId, status: "pending"})
            if (existingPlayerGame) {
                return res.status(409).json({"message": "You have a Pending game, \nIf you must continue == Destroy it first"})
            }
            const data = {
                id: id,
                player1Id: userId
            }
            await this.engine.create('Game', data)
            return res.status(201).json({"message": "game created successfully"})
        } catch (error) {
            console.error(error)
            return res.status(500).json({"message": "Internal Server Error"})
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
                return res.status(404).json({"error": "no user id"})
            }
            const data = {
                player2Id: userId,
                status: "ongoing"
            }
            await this.engine.update("Game", gameId, data)
            return res.status(200).json({"message": "Player 2 added to the game"})
        } catch (error) {
            console.error(error)
            return res.status(500).json({"message": "Internal Server Error"})
        }
    }


    async startGame(req, res) {
        const { gameId } = req.params
        if (!gameId) {
            console.warn("game id is missing")
            return res.status(409).json({"message": "game id is missing"})
        }
        try {
            const data = {
                status: "inProgress"
            }
            await this.engine.update("Game", data, {id: gameId})
            return  res.status(200).json({"message": "game started."})
        } catch (error) {
            console.error(error)
            return  res.status(500).json({"error": "Internal Server Error"})
        }

    }

    async getPendingGames(req, res) {
        try {
            const games = await this.engine.getWhere("Game", { status: "pending" });
            
            const gameDetails = await Promise.all(
                games.map(async (game) => {
                    const challenger = await this.engine.get("User", 'id', game.player1Id);
                    
                    return {
                        challenger: challenger.username,
                        gameId: game.id,
                        status: "pending",
                        created_at: game.created_at
                    };
                })
            );
    
            return res.status(200).json(gameDetails);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ "message": "Internal Server Error" });
        }
    }
    
}

export default Game