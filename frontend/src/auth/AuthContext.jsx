import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        console.log("Initializing auth - Token:", token);

        if (token) {
            fetch("http://localhost:5000/api/auth/user", {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then((res) => res.json())
            .then((data) => {
                if (data.user) {
                    console.log("Authenticated user:", data.user);
                    setUser(data.user);
                    setIsAuthenticated(true);
                } else {
                    logout();
                }
            })
            .catch(() => logout())
            .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = (token, userData) => {
        localStorage.setItem("access_token", token);
        setUser(userData);
        setIsAuthenticated(true);
        console.log("Login - Token:", token, "User set:", userData);
    };

    const logout = () => {
        localStorage.removeItem("access_token");
        setUser(null);
        setIsAuthenticated(false);
        console.log("Logged out");
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;