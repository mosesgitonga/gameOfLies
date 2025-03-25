import Engine from "../prisma/engine.js";
import User from "./users.js";
import Helper from "../utils/helpers";
class Game {
    constructor(engine, user, helper) {
        this.engine = engine
        this.user = user
        this.helper = helper
    }


}