import Engine from "../prisma/engine.js";
import Helper from "../utils/helpers.js";

class User {
    constructor() {
        this.engine = new Engine();
        this.helper = new Helper();
    }

    async createRole() {
        try {
            const existingRoles = await this.engine.all("User_roles", {},true, 1, 1);

            // First user becomes super admin
            const role_id = this.helper.generateUuid();
            const data = existingRoles.length === 0 
                ? { id: role_id, role_name: "super_admin" } 
                : { id: role_id, role_name: "player" };

            const existingRole = await this.engine.get("User_roles", 'role_name', data.role_name)
            if (existingRole) {
                console.warn('role already exists: ', existingRole.id)
                return  existingRole 
            }
            const new_role = await this.engine.create("User_roles", data);

            console.log("Role created:", new_role);
            return new_role;

        } catch (error) {
            console.error("Unable to create role:", error);
            return { "error": "Unable to create role" };
        }
    }

    async getUserProfile(req, res) {
        const userId = req.userId
        if (!userId) {
            console.error("no user id found in the request")
            return res.status(401).json({"message": "Unauthorized: No user found"})
        }

        try {
            const user = await this.engine.get("User", "id", userId)
            if (!user) {
                console.error("User not found")
                return res.status(404).json({"message": "User not found"})
            }
            const secureUserData = { // removes the password, email from the original user object
                id: user.id,
                username: user.username,
                created_at:  user.created_at,
                role_id: user.role_id
            }
            res.status(200).json({user: secureUserData})
        } catch (error) {
            console.error(error)
            return res.status(500).json({"message": "Internal Server Error"})
        }

    }
}

export default User;
