import Auth from "../controllers/auth.js";
import AuthMiddlewares from "../middlewares/authMiddleware.js";
import express from  'express'
import Engine from "../prisma/engine.js";
import Helper from "../utils/helpers.js";
import User from "../controllers/users.js";

const authRouter = express.Router()
const engine = new Engine()
const helpers = new Helper()
const authController = new Auth()
const user = new User()
const authMid = new AuthMiddlewares(helpers, engine)

authRouter.post('/api/auth/register', (req, res) => authController.register(req, res));
authRouter.post('/api/auth/login', (req, res) => authController.login(req, res))
authRouter.get('/api/auth/user', (req, res, next) => authMid.authUser(req, res, next), 
                                (req, res) => user.getUserProfile(req, res))

authRouter.post('/api/auth/refresh', (req, res) => authController.refresh_token(req, res))

export default authRouter
