import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../auth/AuthContext";
import "./GameHistory.css";

const base_url = import.meta.env.VITE_BASE_URL;


function GameHistory() {
    const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext);
    const navigate = useNavigate();

    const [gameHistory, setGameHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState("createdAt"); // Default to "createdAt" now
    const [sortOrder, setSortOrder] = useState("desc");

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated || !user) {
            navigate("/login");
            return;
        }

        const fetchGameHistory = async () => {
            try {
                const token = localStorage.getItem("access_token");
                if (!token) throw new Error("No access token found");

                const response = await fetch(`${base_url}/api/history/games/${user.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                let data;
                if (!response.ok) {
                    try {
                        data = await response.json();
                        throw new Error(`Failed to fetch game history: ${response.status} - ${data.message || "Unknown error"}`);
                    } catch (jsonError) {
                        throw new Error(`Failed to fetch game history: ${response.status} - ${response.statusText}`);
                    }
                }

                data = await response.json();
                console.log("Game history fetched:", data);
                setGameHistory(data);
                setLoading(false);
            } catch (err) {
                console.error("Fetch error:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchGameHistory();
    }, [user, isAuthenticated, authLoading, navigate]);

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("desc");
        }
    };

    const sortedGames = [...gameHistory].sort((a, b) => {
        const order = sortOrder === "asc" ? 1 : -1;
        if (sortBy === "createdAt") {
            return order * (new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sortBy === "entryFee") {
            return order * ((a.entryFee || 0) - (b.entryFee || 0));
        } else if (sortBy === "gameOwner") {
            return order * ((a.gameOwner || "").localeCompare(b.gameOwner || ""));
        } else if (sortBy === "opponent") {
            return order * ((a.opponent || "").localeCompare(b.opponent || ""));
        } else if (sortBy === "winner") {
            return order * ((a.winner || "").localeCompare(b.winner || ""));
        }
        return 0;
    });

    const getOutcome = (game) => {
        if (!game.winner) return "No Winner";
        return game.winner === user.username ? "Won" : "Lost";
    };

    if (loading || authLoading) return <div className="gamehistory-container">Loading...</div>;
    if (!isAuthenticated || !user) return <div className="gamehistory-container">Redirecting to login...</div>;

    return (
        <div className="gamehistory-container">
            <div className="gamehistory-content">
                <h1 className="gamehistory-title">Your Game History</h1>
                {error && <p className="gamehistory-error-message">{error}</p>}

                <div className="gamehistory-controls">
                    <label>Sort by: </label>
                    <button
                        className={`gamehistory-sort-button ${sortBy === "gameOwner" ? "active" : ""}`}
                        onClick={() => handleSort("gameOwner")}
                    >
                        Game Owner {sortBy === "gameOwner" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                    </button>
                    <button
                        className={`gamehistory-sort-button ${sortBy === "opponent" ? "active" : ""}`}
                        onClick={() => handleSort("opponent")}
                    >
                        Opponent {sortBy === "opponent" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                    </button>
                    <button
                        className={`gamehistory-sort-button ${sortBy === "winner" ? "active" : ""}`}
                        onClick={() => handleSort("winner")}
                    >
                        Winner {sortBy === "winner" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                    </button>
                    <button
                        className={`gamehistory-sort-button ${sortBy === "entryFee" ? "active" : ""}`}
                        onClick={() => handleSort("entryFee")}
                    >
                        Entry Fee {sortBy === "entryFee" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                    </button>
                    <button
                        className={`gamehistory-sort-button ${sortBy === "createdAt" ? "active" : ""}`}
                        onClick={() => handleSort("createdAt")}
                    >
                        Date {sortBy === "createdAt" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                    </button>
                </div>

                {gameHistory.length === 0 ? (
                    <p className="gamehistory-empty">No games played yet.</p>
                ) : (
                    <div className="gamehistory-table">
                        <div className="gamehistory-header">
                            <span>Game Owner</span>
                            <span>Opponent</span>
                            <span>Winner</span>
                            <span>Entry Fee</span>
                            <span>Outcome</span>
                            <span>Date</span>
                        </div>
                        {sortedGames.map((game, index) => (
                            <div key={index} className="gamehistory-row">
                                <span>{game.gameOwner || "N/A"}</span>
                                <span>{game.opponent || "None"}</span>
                                <span>{game.winner || "None"}</span>
                                <span>{game.entryFee ? `${game.entryFee.toFixed(1)}` : "N/A"}</span>
                                <span className={`gamehistory-outcome-${getOutcome(game).toLowerCase().replace(" ", "-")}`}>
                                    {getOutcome(game)}
                                </span>
                                <span>{new Date(game.created_at).toLocaleString()}</span>
                                                            
                            </div>
                        ))}
                    </div>
                )}

                <div className="gamehistory-footer">
                    <button className="gamehistory-back-button" onClick={() => navigate("/my-games")}>
                        Back to Games
                    </button>
                </div>
            </div>
        </div>
    );
}

export default GameHistory;