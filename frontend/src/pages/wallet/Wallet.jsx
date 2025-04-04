import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../auth/AuthContext.jsx"
import "./Wallet.css";

const base_url = import.meta.env.VITE_BASE_URL;


const Wallet = () => {
    const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext);
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);
    const [depositAmount, setDepositAmount] = useState(0);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated || !user) {
            navigate("/login?redirect=/wallet");
            return;
        }

        const fetchBalance = async () => {
            try {
                const token = localStorage.getItem("access_token");
                const response = await fetch(`${base_url}/api/auth/user`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) throw new Error("Failed to fetch balance");
                const userData = await response.json();
                console.log(userData.user.balance)
                setBalance(userData.user.balance);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchBalance();
    }, [user, isAuthenticated, authLoading, navigate]);

    const handleDeposit = async () => {
        if (depositAmount <= 0) {
            setError("Please enter a valid deposit amount");
            return;
        }

        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(`${base_url}/api/user/deposit`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userId: user.id, amount: parseFloat(depositAmount) }),
            });

            if (response.ok) {
                const data = await response.json();
                let newBalance = data
                setBalance(data.newBalance);
                setDepositAmount(0);
                setSuccess("Deposit successful!");
                setError(null);
            } else {
                const errorData = await response.json();
                setError(errorData.message);
                setSuccess(null);
            }
        } catch (err) {
            setError("An error occurred during deposit");
            setSuccess(null);
        }
    };

    if (authLoading) return <div>Loading...</div>;
    if (!isAuthenticated || !user) return <div>Redirecting to login...</div>;

    return (
        <div className="wallet-container">
            <div className="wallet">
                <h2> <strong></strong>Your Wallet</h2>
                <p>Hello <strong>{user.username}</strong></p>
                <div className="wallet-balance">
                    <p>Current Balance: <strong>KES {balance.toFixed(2)}</strong></p>
                </div>
                <div className="wallet-deposit">
                    <h3>Deposit Dummy Amount</h3>
                    <input
                        type="number"
                        step="0.01"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                        min="0.01"
                        placeholder="Enter deposit amount"
                    />
                    <button onClick={handleDeposit}>Deposit</button>
                </div>
                {success && <p className="wallet-success">{success}</p>}
                {error && <p className="wallet-error">{error}</p>}
                <div className="wallet-actions">
                    <button onClick={() => navigate("/")}>Back to Home</button>
                </div>
                <div className="wallet-history">
                    <h3>Transaction History</h3>
                    <p>(Coming soon...)</p>
                </div>
            </div>
        </div>
    );
};

export default Wallet;