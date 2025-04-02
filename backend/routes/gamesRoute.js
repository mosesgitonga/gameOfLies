import Game from "../controllers/game.js";
import express from 'express'
import Helper from "../utils/helpers.js";
import Engine from "../prisma/engine.js";
import User from "../controllers/users.js";

const gameRouter = express.Router()

const helper = new Helper
const engine = new Engine
const user = new User
const game = new Game(engine, user, helper)


gameRouter.post("/api/game", (req, res) => game.createGame(req, res))
gameRouter.patch("/api/game/join", (req, res) => game.joinGame(req, res))
gameRouter.get('/api/games', (req, res) => game.getPendingGames(req, res))
gameRouter.get('/api/user/games/:userId', (req, res) => game.getUserGames(req, res))
gameRouter.get('/api/game/:gameId', (req, res) => game.getGame(req, res))
gameRouter.get('/api/history/games/:userId', (req, res) => game.userGameHistory(req, res))

export default gameRouter