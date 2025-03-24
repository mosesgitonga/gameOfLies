import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken';

dotenv.config()

class Helper {
    generateUuid() {
        return uuidv4()
    }

    generateAccessToken(payload) {
        const expiresIn = '8h'
        return jwt.sign(payload, process.env.SECRET_KEY, { expiresIn })
    }

    async generateRefreshToken(payload) {
        const expiresIn = '8d'
        return jwt.sign(payload, process.env.REFRESH_SECRET, { expiresIn })

    }

    verifyRefreshToken(refreshToken) {
        try {
            return jwt.verify(refreshToken, process.env.REFRESH_SECRET);
        } catch (error) {
            console.error("Invalid Refresh Token:", error.message);
            return null;
        }
    }
}

export default Helper 