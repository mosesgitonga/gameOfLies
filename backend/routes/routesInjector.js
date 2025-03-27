import authRouter from "./authRoute.js";
import gameRouter from "./gamesRoute.js";

const routesInjector = (app) => {
    app.use(authRouter)
    app.use(gameRouter)
}

export default routesInjector;