import React, { useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import "./Login.css"

const base_url = import.meta.env.VITE_BASE_URL;

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, fetchWithAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${base_url}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }
      const userResponse = await fetch(`${base_url}/api/auth/user`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const userData = await userResponse.json();
      if (userResponse.ok) {
        login(data.access_token, data.refresh_token, userData.user);
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
    <div className="login-container">
      <h1>Login</h1>
      <form className="login-form" onSubmit={handleLogin}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            required
          />
        </div>
        <button type="submit" className="login-button">Login</button>
      </form>
    </div>
  );
};

export default Login;
