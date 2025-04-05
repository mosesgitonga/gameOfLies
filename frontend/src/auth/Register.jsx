import React, { useState, useContext } from "react";
import { AuthContext } from "../auth/AuthContext"; 
import { useNavigate } from "react-router-dom";
import "./Register.css";

const Register = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Basic validation
        if (!username || !email || !password) {
            setError("Please fill in all fields");
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError("Please enter a valid email address");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed");
            }

            console.log("Register response:", data);

            if (data.access_token && data.refresh_token && data.user) {
                login(data.access_token, data.refresh_token, data.user);
                setSuccess("Registration successful! Redirecting...");
                setTimeout(() => navigate("/"), 2000); // Redirect to home after 2s
            } else {
                setSuccess("Registration successful! Please log in.");
                setTimeout(() => navigate("/login"), 2000);
            }
        } catch (err) {
            console.error("Registration error:", err);
            setError(err.message);
        }
    };

    return (
        <div className="register-container">
            <h1>Create Your Account</h1>
            <form className="register-form" onSubmit={handleRegister}>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@example.com"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                    />
                </div>
                <button type="submit" className="register-button">
                    Register
                </button>
            </form>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
            <p className="login-link">
                Already have an account?{" "}
                <span onClick={() => navigate("/login")}>Log in here</span>
            </p>
        </div>
    );
};

export default Register;