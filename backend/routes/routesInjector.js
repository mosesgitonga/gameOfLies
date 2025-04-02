import authRouter from "./authRoute.js";
import gameRouter from "./gamesRoute.js";
import userRouter from "./userRoute.js";

const routesInjector = (app) => {
    app.use(authRouter)
    app.use(gameRouter)
    app.use(userRouter)
}

export default routesInjector;