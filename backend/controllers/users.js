import Engine from "../prisma/engine.js";
import Helper from "../utils/helpers.js";

class User {
    constructor() {
        this.engine = new Engine();
        this.helper = new Helper();
    }

    async createRole() {
        try {
            const existingRoles = await this.engine.all("User_roles", {pagination:true, page:1, pageSize:1});

            // First user becomes super admin
            const role_id = this.helper.generateUuid();
            const data = existingRoles.length === 0 
                ? { id: role_id, role_name: "super_admin" } 
                : { id: role_id, role_name: "player" };

            const new_role = await this.engine.create("User_roles", data);

            console.log("Role created:", new_role);
            return new_role;

        } catch (error) {
            console.error("Unable to create role:", error);
            return { "error": "Unable to create role" };
        }
    }
}

export default User;
