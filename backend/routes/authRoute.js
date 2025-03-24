import Auth from "../controllers/auth.js";
import express from  'express'

const authRouter = express.Router()
const authController = new Auth()

authRouter.post('/api/auth/register', (req, res) => authController.register(req, res));
authRouter.post('/api/auth/login', (req, res) => authController.login(req, res))

export default authRouter
