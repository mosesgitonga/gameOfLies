import express from 'express'
import User from "../controllers/users.js";
import AuthMiddlewares from "../middlewares/authMiddleware.js";
import Helper from '../utils/helpers.js';
import Engine from '../prisma/engine.js';


const engine = new Engine
const helpers = new Helper
const userRouter = express.Router()


const authMid = new AuthMiddlewares(helpers, engine)
const user = new User()

userRouter.patch('/api/user/deposit', (req, res, next) => authMid.authUser(req, res, next),(req, res) => user.dummyDeposit(req, res))

export default userRouter
