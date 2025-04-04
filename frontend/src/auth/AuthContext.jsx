import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();
const base_url = import.meta.env.VITE_BASE_URL;

const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedAccessToken = localStorage.getItem("access_token");
        const storedRefreshToken = localStorage.getItem("refresh_token");
        console.log("Initializing auth - Access Token:", storedAccessToken, "Refresh Token:", storedRefreshToken);

        if (storedAccessToken && storedRefreshToken) {
            setAccessToken(storedAccessToken);
            setRefreshToken(storedRefreshToken);
            fetchUser(storedAccessToken);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async (token) => {
        try {
            const res = await fetch(`${base_url}/api/auth/user`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Invalid access token");
            }
            console.log("Fetched user:", data.user);
            setUser(data.user);
            setIsAuthenticated(true);
        } catch (error) {
            console.error("Error fetching user:", error);
            throw error; // Let caller handle refresh
        } finally {
            setLoading(false);
        }
    };

    const refreshAccessToken = async () => {
        if (!refreshToken) {
            console.log("No refresh token available, logging out");
            logout();
            return null;
        }

        try {
            console.log("Refreshing token with:", refreshToken);
            const res = await fetch(`${base_url}/api/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });
            const data = await res.json();
            console.log("Refresh response:", data);

            if (!res.ok) {
                throw new Error(data.message || "Failed to refresh token");
            }

            const newAccessToken = data.access_token;
            localStorage.setItem("access_token", newAccessToken);
            setAccessToken(newAccessToken);
            console.log("Access token refreshed:", newAccessToken);

            await fetchUser(newAccessToken); // Update user state
            return newAccessToken;
        } catch (error) {
            console.error("Refresh token error:", error);
            if (error.message === "Refresh token expired" || error.message === "Invalid refresh token") {
                console.log("Refresh token invalid or expired, logging out");
                logout();
            }
            return null;
        }
    };

    const fetchWithAuth = async (url, options = {}) => {
        if (!accessToken) {
            console.log("No access token, attempting refresh");
            const newToken = await refreshAccessToken();
            if (!newToken) throw new Error("No valid access token available");
        }

        const headers = { ...options.headers, Authorization: `Bearer ${accessToken}` };
        console.log("Fetching:", url, "with token:", accessToken);
        let response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            console.log("Received 401 for:", url, "attempting to refresh token");
            const newToken = await refreshAccessToken();
            if (newToken) {
                headers.Authorization = `Bearer ${newToken}`;
                console.log("Retrying with new token:", newToken);
                response = await fetch(url, { ...options, headers });
            } else {
                throw new Error("Failed to refresh token, user logged out");
            }
        }

        return response;
    };

    const login = (accessToken, refreshToken, userData) => {
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);
        setUser(userData);
        setIsAuthenticated(true);
        console.log("Login - Access Token:", accessToken, "Refresh Token:", refreshToken, "User:", userData);
    };

    const logout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
        setIsAuthenticated(false);
        console.log("Logged out");
    };

    return (
        <AuthContext.Provider
            value={{ isAuthenticated, user, accessToken, refreshToken, login, logout, loading, fetchWithAuth }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;