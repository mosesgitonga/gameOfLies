import Engine from "../prisma/engine.js";
import bcrypt from 'bcrypt';
import Helper from "../utils/helpers.js";
import User from "./users.js";

class Auth {
    constructor() {
        this.engine = new Engine();
        this.helper = new Helper();
        this.user = new User() 
    }

    async register(req, res) {
        try {
            const { email, username, password } = req.body;
    
            const existingUser = await this.engine.get('User', 'email', email);
            if (existingUser) {
                return res.status(409).json({ "message": "Email already exists" });
            }
            
            const existingUsername = await this.engine.get('User', 'username', username)
            if (existingUsername) {
                return res.status(409).json({"message": "Username already exists"})
            }
    
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
    
            const userId = this.helper.generateUuid();
            const newData = {
                id: userId,
                email,
                username,
                password: hashedPassword
            };
    
            await this.engine.create('User', newData);
            
            // asign role to user
            const role = await this.user.createRole();
            if (!role || !role.id) {
                console.error("Failed to assign role to user");
                return res.status(500).json({ "error": "Role assignment failed" });
            }
    
            await this.engine.update("User", userId, { role_id: role.id });
    
            return res.status(201).json({ "message": "User registered successfully" });
    
        } catch (error) {
            console.error(error);
            return res.status(500).json({ "error": "Internal Server Error" });
        }
    }
    

    async login(req, res) {
        try {
            const { email, password } = req.body;

            const existingUser = await this.engine.get('User', 'email', email);
            if (!existingUser) {
                return res.status(403).json({ "message": "Invalid email or password" });
            }

            const passwordMatch = await bcrypt.compare(password, existingUser.password);
            if (!passwordMatch) {
                return res.status(403).json({ "message": "Invalid email or password" });
            }

            const payload = { id: existingUser.id, email, roleId: existingUser.role_id };
            const access_token =  this.helper.generateAccessToken(payload);
            const refresh_token = await this.helper.generateRefreshToken(payload);

            return res.status(200).json({ access_token, refresh_token });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ "error": "Internal Server Error" });
        }
    }
}

export default Auth;
