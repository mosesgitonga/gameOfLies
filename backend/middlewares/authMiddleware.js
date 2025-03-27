import jwt from "jsonwebtoken"

class AuthMiddlewares {
    /**
     * middleware for authorization and stuff for protecting routes.
     * @param {Helper} helpers  - contains methods to perfom minor tasks
     * @param {Engine} engine - methods for crud operations
     */
    constructor() {
        this.helpers = helpers
        this.engine = engine
    }

    async authUser(req, res, next) {
        /**
         * Authorizes user to perform an action.
         * @param {object} req - Request object.
         * @param {object} res - Response object.
         * @param {function} next - Calls the next middleware.
         * @returns {void}
         */
        const authheader = req.header.authorization
        if (!authheader || !authheader.startsWith('Bearer ')) {
            return res.status(401).json({"message": "Token not found or Invalid access token"})
        }
        const token = authheader.split(' ')[1]

        if (!token) {
            return res.status(401).json({"message": "access token not found"})
        }

        try {
            if (!process.env.SECRET_KEY) {
                console.error("missing SECRET_KEY in enviroment variables")
                return res.status(500).json({"message": "Internal Server Error"})
            }
            const decoded = jwt.verify(token, process.env.SECRET_KEY)
            req.userId = decoded.id 
            next()
        } catch (error) {
            if (error.name = 'TokenExpiredError') {
                console.error("Token is expired.")
                return res.status(500).json({"message": "Expired Access Token"})
            } else if (error.name = 'JsonWebTokenError') {
                console.error('invalid access token')
                return res.status(500).json({"message": "Invalid Access Token"})
            }
            return res.status(500).json({"error": "Internal Server Error"})
        }
    }   
}