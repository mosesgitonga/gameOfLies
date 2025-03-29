import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext"

const ProtectedRoute = ({children }) => {
    const { isAuthenticated, loading } = useContext(AuthContext)

    if (loading) {
        return <p>Loading...</p>
    }

    if (!isAuthenticated) {
        return <Navigate to='/login' replace/>
    }

    return children 
}

export default ProtectedRoute;