import React, { useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { login, fetchWithAuth } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation(); // To access query params

    const handleLogin = async (e) => {
        console.log("handle login...");
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Login failed");
                return;
            }

            const userResponse = await fetch("http://localhost:5000/api/auth/user", {
                headers: { Authorization: `Bearer ${data.access_token}` },
            });
            const userData = await userResponse.json();

            if (userResponse.ok) {
                console.log("Login response:", userData.user); // Debug response
                login(data.access_token,data.refresh_token, userData.user); // Set token and user in context

                // Get redirect URL from query params, default to "/"
                const searchParams = new URLSearchParams(location.search);
                const redirectUrl = searchParams.get("redirect") || "/";
                navigate(redirectUrl);
            } else {
                alert("Failed to fetch user data");
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("An error occurred during login");
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="yourname@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default Login;